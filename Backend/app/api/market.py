"""
Market demand API endpoints
"""
import logging
from typing import List, Dict, Any, Optional
from functools import lru_cache
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc, func
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import get_db
from app.models.skill_market import SkillMarketData

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Cache market data for 1 hour
CACHE_DURATION = timedelta(hours=1)
last_cache_time: Optional[datetime] = None
cached_data: Dict[str, int] = {}


@router.get("/demand", response_model=Dict[str, int])
async def get_market_demand(
    skills: Optional[str] = Query(None, description="Comma-separated list of skill names (optional - returns all if not specified)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, int]:
    """
    Get market demand scores as a flat dictionary

    If 'skills' parameter is provided, returns only those skills.
    If not provided, returns all skills with demand scores.

    Returns a mapping of skill name -> demand score
    """

    try:
        # Check if specific skills requested
        if skills:
            # Parse skill names
            skill_names = [s.strip() for s in skills.split(',') if s.strip()]
            if not skill_names:
                return {}

            # Fetch data from database for specific skills
            result = await db.execute(
                select(SkillMarketData.skill_name, SkillMarketData.demand_score)
                .where(SkillMarketData.skill_name.in_(skill_names))
            )
            skills_data = result.fetchall()

            # Convert to dictionary
            market_data = {skill_name: demand_score for skill_name, demand_score in skills_data}

            logger.info(f"📊 Fetched demand scores for {len(market_data)} out of {len(skill_names)} requested skills")
            return market_data

        else:
            # Return all skills with caching
            global last_cache_time, cached_data

            # Check if we have valid cached data
            now = datetime.now()
            if last_cache_time and (now - last_cache_time) < CACHE_DURATION and cached_data:
                logger.info("📊 Returning cached market demand data")
                return cached_data

            # Fetch fresh data from database
            result = await db.execute(
                select(SkillMarketData.skill_name, SkillMarketData.demand_score)
            )
            skills_data = result.fetchall()

            if not skills_data:
                logger.warning("⚠️ skill_market_data table is empty. Returning empty demand dictionary.")
                cached_data = {}
                last_cache_time = now
                return {}

            # Convert to dictionary
            market_data = {skill_name: demand_score for skill_name, demand_score in skills_data}

            # Cache the data
            cached_data = market_data
            last_cache_time = now

            logger.info(f"📊 Fetched {len(market_data)} skills from database")
            return market_data

    except SQLAlchemyError as e:
        logger.exception("❌ Database error fetching market demand")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.exception("❌ Unexpected error fetching market demand")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/skills", response_model=Dict[str, Any])
async def get_detailed_market_data(
    category: Optional[str] = Query(None, description="Filter by skill category"),
    trend: Optional[str] = Query(None, description="Filter by trend (up, stable, down)"),
    sort_by: str = Query("demand_score", description="Sort field (demand_score, skill_name, category)"),
    order: str = Query("desc", description="Sort order (asc, desc)"),
    page: int = Query(1, gt=0, description="Page number (starts from 1)"),
    limit: Optional[int] = Query(None, description="Number of results per page (default: all)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get detailed market data with filtering, sorting, and pagination

    Supports filtering by category and/or trend, with optional pagination and sorting.
    """

    try:
        # Validate query parameters
        if trend and trend not in ["up", "stable", "down"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid trend value. Must be one of: up, stable, down"
            )

        if sort_by not in ["demand_score", "skill_name", "category"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid sort_by value. Must be one of: demand_score, skill_name, category"
            )

        if order not in ["asc", "desc"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid order value. Must be one of: asc, desc"
            )

        # Build query - select all columns needed without casting
        query = select(
            SkillMarketData.skill_name,
            SkillMarketData.category,
            SkillMarketData.demand_score,
            SkillMarketData.trend,
            SkillMarketData.last_updated
        )

        # Apply filters
        filters_applied = {}
        if category:
            query = query.where(SkillMarketData.category == category)
            filters_applied["category"] = category
        if trend:
            query = query.where(SkillMarketData.trend == trend)
            filters_applied["trend"] = trend

        # Apply sorting
        sort_column = {
            "demand_score": SkillMarketData.demand_score,
            "skill_name": SkillMarketData.skill_name,
            "category": SkillMarketData.category
        }[sort_by]

        if order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Get total count - create a separate count query without subquery
        count_query = select(func.count(SkillMarketData.id))
        
        # Apply same filters to count query
        if category:
            count_query = count_query.where(SkillMarketData.category == category)
        if trend:
            count_query = count_query.where(SkillMarketData.trend == trend)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        if limit is not None:
            offset = (page - 1) * limit
            query = query.offset(offset).limit(limit)

        # Execute query
        result = await db.execute(query)
        skills_data = result.fetchall()

        # Format response data
        skills = []
        for row in skills_data:
            last_updated = row[4]
            # Convert date to ISO format string
            last_updated_str = last_updated.isoformat() if hasattr(last_updated, 'isoformat') else str(last_updated)
            
            skills.append({
                "name": row[0],
                "category": row[1],
                "demand_score": row[2],
                "trend": row[3],
                "last_updated": last_updated_str
            })

        # Determine if pagination was applied
        paginated = limit is not None
        if paginated:
            filters_applied["page"] = page
            filters_applied["limit"] = limit

        response_data = {
            "skills": skills,
            "total": total,
            "filters_applied": filters_applied
        }

        if paginated:
            total_pages = (total + limit - 1) // limit if limit > 0 else 1
            response_data.update({
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            })

        logger.info(f"📊 Returned {len(skills)} skills with filters: {filters_applied}")
        return response_data

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.exception(f"❌ Database error fetching detailed market data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred while fetching detailed market data: {str(e)}"
        )
    except Exception as e:
        logger.exception(f"❌ Unexpected error fetching detailed market data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error occurred while fetching detailed market data: {str(e)}"
        )


@router.get("/job-postings")
async def get_job_postings(
    skill: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get job posting statistics for skills and roles
    
    Query parameters:
    - skill: Get market data for a specific skill
    - role: Filter results by role (optional)
    
    Returns job posting count, growth trend, salary range, and top companies
    """
    try:
        if skill:
            # Get market data for specific skill
            result = await db.execute(
                select(SkillMarketData).where(
                    SkillMarketData.skill_name == skill
                )
            )
            skill_data = result.scalars().first()
            
            if not skill_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Skill '{skill}' not found"
                )
            
            # Estimate job postings based on demand
            job_count = int(skill_data.demand_score * 50)
            
            # Calculate growth trend
            growth_trend = "+15%" if skill_data.trend == "up" else "-5%" if skill_data.trend == "down" else "0%"
            
            # Estimate salary range based on demand (in lakhs)
            min_salary = skill_data.demand_score * 15000 / 100000
            max_salary = skill_data.demand_score * 30000 / 100000
            
            logger.info(f"📊 Job postings retrieved for skill: {skill}")
            
            return {
                "skill_name": skill,
                "job_postings_count": job_count,
                "growth_trend": growth_trend,
                "avg_salary_range": f"₹{min_salary:.0f}-{max_salary:.0f} LPA",
                "top_companies": ["Google", "Amazon", "Microsoft", "Flipkart", "Swiggy"],
                "category": skill_data.category,
                "demand_score": skill_data.demand_score
            }
        else:
            # Return top skills by job postings
            result = await db.execute(
                select(SkillMarketData).order_by(
                    desc(SkillMarketData.demand_score)
                ).limit(20)
            )
            top_skills = result.scalars().all()
            
            results = []
            for skill_data in top_skills:
                results.append({
                    "skill_name": skill_data.skill_name,
                    "job_postings_count": int(skill_data.demand_score * 50),
                    "demand_score": skill_data.demand_score,
                    "category": skill_data.category
                })
            
            logger.info(f"📊 Top {len(results)} skills by job postings retrieved")
            
            return {"skills": results}
            
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.exception(f"❌ Database error fetching job postings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.exception(f"❌ Job postings error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/salary-impact")
async def calculate_salary_impact(
    skill: str = Query(..., description="Skill to evaluate"),
    current_skills: Optional[str] = Query(None, description="Comma-separated list of current skills"),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate salary impact of learning a new skill
    
    Query parameters:
    - skill: Target skill to learn (required)
    - current_skills: Comma-separated list of current skills (optional)
    
    Returns salary projections, increase amount, and confidence level
    """
    try:
        # Get market data for target skill
        result = await db.execute(
            select(SkillMarketData).where(
                SkillMarketData.skill_name == skill
            )
        )
        skill_data = result.scalars().first()
        
        if not skill_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill '{skill}' not found"
            )
        
        # Calculate base salary from current skills
        base_salary = 12.0  # Default base in lakhs
        
        if current_skills:
            current_skill_list = [s.strip() for s in current_skills.split(',')]
            current_demand_scores = []
            
            # Query all current skills at once
            result = await db.execute(
                select(SkillMarketData.demand_score).where(
                    SkillMarketData.skill_name.in_(current_skill_list)
                )
            )
            demand_scores = result.scalars().all()
            
            if demand_scores:
                avg_current_demand = sum(demand_scores) / len(demand_scores)
                base_salary = (avg_current_demand / 100) * 25  # Scale to 12-25 LPA range
        
        # Calculate salary with new skill
        skill_value = (skill_data.demand_score / 100) * 8  # ₹0-8L additional
        with_skill_salary = base_salary + skill_value
        
        # Calculate increase
        increase = with_skill_salary - base_salary
        percent = (increase / base_salary) * 100 if base_salary > 0 else 0
        
        # Confidence based on data quality
        confidence = "High" if skill_data.demand_score > 80 else "Medium" if skill_data.demand_score > 60 else "Low"
        
        logger.info(f"📊 Salary impact calculated for skill: {skill}, increase: ₹{increase:.1f}L")
        
        return {
            "skill_name": skill,
            "base_salary": f"₹{base_salary:.1f}L",
            "with_skill_salary": f"₹{with_skill_salary:.1f}L",
            "salary_increase": f"₹{increase:.1f}L",
            "increase_percentage": round(percent, 1),
            "confidence": confidence,
            "market_demand": skill_data.demand_score
        }
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.exception(f"❌ Database error calculating salary impact: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.exception(f"❌ Salary impact error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Health check for market endpoints
@router.get("/health")
async def market_health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check for market data endpoints
    """
    try:
        # Check database connection and count
        result = await db.execute(select(func.count()).select_from(SkillMarketData))
        count = result.scalar() or 0

        return {
            "status": "healthy",
            "database_connected": True,
            "skills_count": count,
            "cache_enabled": True,
            "cache_duration_hours": CACHE_DURATION.total_seconds() / 3600,
            "last_cache_time": last_cache_time.isoformat() if last_cache_time else None
        }
    except Exception as e:
        logger.error(f"Market health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

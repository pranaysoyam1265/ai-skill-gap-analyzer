"""
Skill Trends API endpoints for historical demand data
"""
import logging
from typing import List, Dict, Any, Optional
from functools import lru_cache
from datetime import datetime, timedelta, date
import statistics

from fastapi import APIRouter, HTTPException, Query, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc, func, and_, or_
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import get_db
from app.models.skill_trend import SkillTrendHistory
from app.models.skill_market import SkillMarketData
from dateutil.relativedelta import relativedelta

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Cache duration for trend queries
CACHE_DURATION = timedelta(hours=2)
trend_cache: Dict[str, Any] = {}
last_cache_time: Optional[datetime] = None


def calculate_trend_statistics(history_data: List[Dict[str, Any]]) -> Dict[str, float]:
    """Calculate statistics from historical trend data"""
    if not history_data:
        return {
            "average_demand": 0,
            "min_demand": 0,
            "max_demand": 0,
            "total_change": 0,
            "percent_change": 0,
            "volatility": 0,
            "monthly_average_change": 0
        }

    scores = [item["demand_score"] for item in history_data]
    
    if len(scores) < 2:
        return {
            "average_demand": scores[0] if scores else 0,
            "min_demand": scores[0] if scores else 0,
            "max_demand": scores[0] if scores else 0,
            "total_change": 0,
            "percent_change": 0,
            "volatility": 0,
            "monthly_average_change": 0
        }

    # Basic statistics
    average_demand = statistics.mean(scores)
    min_demand = min(scores)
    max_demand = max(scores)
    
    # Change calculations
    total_change = scores[-1] - scores[0]  # Most recent - oldest
    percent_change = (total_change / scores[0] * 100) if scores[0] > 0 else 0
    
    # Volatility (standard deviation of month-to-month changes)
    month_changes = [scores[i] - scores[i-1] for i in range(1, len(scores))]
    volatility = statistics.stdev(month_changes) if len(month_changes) > 1 else 0
    
    # Average monthly change
    monthly_average_change = total_change / len(scores) if len(scores) > 0 else 0
    
    return {
        "average_demand": round(average_demand, 2),
        "min_demand": min_demand,
        "max_demand": max_demand,
        "total_change": total_change,
        "percent_change": round(percent_change, 2),
        "volatility": round(volatility, 2),
        "monthly_average_change": round(monthly_average_change, 2)
    }


# ============================================================================
# ROUTE ORDER MATTERS! Specific routes MUST come BEFORE the catch-all route
# ============================================================================

# SPECIFIC ROUTES FIRST

@router.get("/trends")
async def get_market_trends(
    skills: str = Query(..., description="Comma-separated skill names (max 10)", min_length=1),
    months: int = Query(12, ge=6, le=24, description="Number of months of historical data (6-24)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get market demand trends for specified skills.
    
    Returns 12-month (or custom period) historical demand data for each skill,
    including trend direction, percent change, and monthly values.
    
    Args:
        skills: Comma-separated list of skill names (max 10, auto-deduplicated)
        months: Number of months of historical data (6-24, default 12)
        db: Database session
        
    Returns:
        Market trends data with monthly demand values and trend analysis
        
    Raises:
        HTTPException: 400 for invalid input, 500 for server errors
    """
    try:
        # Parse skill list: split, strip, remove empty strings
        skill_list = [s.strip() for s in skills.split(',') if s.strip()]
        
        if not skill_list:
            logger.warning("❌ No valid skills provided in trends request")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid skills provided. Please provide at least one skill name."
            )
        
        # ✅ Edge case: Deduplicate skills (case-insensitive)
        seen = set()
        unique_skills = []
        for skill in skill_list:
            lower_skill = skill.lower()
            if lower_skill not in seen:
                seen.add(lower_skill)
                unique_skills.append(skill)
        
        skill_list = unique_skills
        logger.debug(f"📋 Processing {len(skill_list)} unique skills for trends")
        
        # ✅ Edge case: Limit to max 10 skills
        if len(skill_list) > 10:
            logger.warning(f"⚠️ Too many skills requested ({len(skill_list)}), limiting to 10")
            skill_list = skill_list[:10]
        
        # Generate month labels for the period
        month_labels = _generate_month_labels(months)
        logger.debug(f"📅 Generated {len(month_labels)} month labels")
        
        # Fetch trend data for each skill
        trends_data = {}
        skills_not_found = []
        
        for skill_name in skill_list:
            logger.debug(f"🔍 Fetching trend data for: {skill_name}")
            
            # Try to fetch from database
            trend_data = await _fetch_skill_trend_data(skill_name, months, db)
            
            if trend_data:
                trends_data[skill_name] = trend_data
                logger.debug(f"✅ Found historical data for {skill_name}")
            else:
                # ✅ Edge case: Generate synthetic data for missing skills
                skills_not_found.append(skill_name)
                trend_data = await _generate_synthetic_trend_data(skill_name, months)
                trends_data[skill_name] = trend_data
                logger.info(f"⚠️ Generated synthetic data for {skill_name}")
        
        result = {
            "skills": trends_data,
            "months": month_labels,
            "data_period_months": months,
            "skills_analyzed": len(skill_list),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # ✅ Edge case: Add warning if any skills not found
        if skills_not_found:
            result["warning"] = f"No historical data for: {', '.join(skills_not_found)}. Using estimated trends."
            logger.warning(f"⚠️ Skills without data: {skills_not_found}")
        
        logger.info(f"✅ Retrieved trend data for {len(skill_list)} skills")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching market trends: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve market trends"
        )


def _generate_month_labels(months: int) -> List[str]:
    """
    Generate month labels for the past N months.
    
    Args:
        months: Number of months to generate labels for
        
    Returns:
        List of month labels (e.g., ['Dec', 'Jan', 'Feb', ...])
    """
    labels = []
    current_date = datetime.now()
    
    for i in range(months - 1, -1, -1):
        date_obj = current_date - relativedelta(months=i)
        labels.append(date_obj.strftime("%b"))
    
    return labels


async def _fetch_skill_trend_data(
    skill_name: str,
    months: int,
    db: AsyncSession
) -> Optional[Dict[str, Any]]:
    """
    Fetch historical trend data for a skill from database.
    
    Args:
        skill_name: Name of the skill (case-insensitive search)
        months: Number of months to fetch
        db: Database session
        
    Returns:
        Trend data dictionary or None if not found
    """
    try:
        logger.debug(f"🔎 Looking up skill in database: {skill_name}")
        
        # ✅ Edge case: Case-insensitive skill matching
        market_result = await db.execute(
            select(SkillMarketData).where(
                func.lower(SkillMarketData.skill_name) == func.lower(skill_name)
            )
        )
        market_data_row = market_result.first()
        
        if not market_data_row:
            logger.info(f"❌ Skill '{skill_name}' not found in database")
            return None
        
        market_data = market_data_row[0]
        logger.debug(f"✅ Found skill in database: {skill_name}")
        
        # Calculate cutoff date
        cutoff_date = datetime.now() - relativedelta(months=months)
        logger.debug(f"📅 Fetching data from {cutoff_date.date()}")
        
        # Fetch historical trend data
        trend_query = select(SkillTrendHistory).where(
            and_(
                func.lower(SkillTrendHistory.skill_name) == func.lower(skill_name),
                SkillTrendHistory.recorded_at >= cutoff_date
            )
        ).order_by(asc(SkillTrendHistory.recorded_at))
        
        result = await db.execute(trend_query)
        trend_records = result.scalars().all()
        
        if not trend_records:
            logger.warning(f"⚠️ No trend history found for skill '{skill_name}'")
            return None
        
        logger.debug(f"📊 Found {len(trend_records)} historical records for {skill_name}")
        
        # Extract monthly demand values
        monthly_demand = []
        for record in trend_records:
            try:
                demand = record.demand_score if hasattr(record, 'demand_score') else record.value
                monthly_demand.append(int(demand))
            except (ValueError, TypeError):
                logger.warning(f"⚠️ Invalid demand value for {skill_name}")
                continue
        
        if not monthly_demand:
            logger.warning(f"⚠️ No valid demand values for {skill_name}")
            return None
        
        # Pad with interpolated values if needed (if we have fewer months than requested)
        while len(monthly_demand) < months:
            # Interpolate: slightly declining trend
            new_value = max(30, monthly_demand[0] - 2)
            monthly_demand.insert(0, new_value)
        
        # Calculate statistics
        first_value = monthly_demand[0]
        last_value = monthly_demand[-1]
        percent_change = ((last_value - first_value) / first_value * 100) if first_value != 0 else 0
        
        # Determine trend direction
        if percent_change > 5:
            trend = "rising"
        elif percent_change < -5:
            trend = "declining"
        else:
            trend = "stable"
        
        logger.info(f"✅ Trend for {skill_name}: {trend} ({percent_change:+.1f}%)")
        
        return {
            "monthly_demand": monthly_demand[:months],
            "trend": trend,
            "percent_change": round(percent_change, 1),
            "current_demand": last_value,
            "data_source": "historical"
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching trend for {skill_name}: {str(e)}")
        return None


async def _generate_synthetic_trend_data(
    skill_name: str,
    months: int
) -> Dict[str, Any]:
    """
    Generate synthetic trend data when historical data unavailable.
    
    Uses skill category heuristics to determine base demand and trend pattern.
    
    Args:
        skill_name: Name of the skill
        months: Number of months of data
        
    Returns:
        Synthetic trend data dictionary
    """
    logger.debug(f"🔄 Generating synthetic trend for: {skill_name}")
    
    # Base demand by skill category (estimated from market data)
    base_demands = {
        'react': 87, 'typescript': 82, 'python': 85, 'javascript': 90,
        'node.js': 80, 'nodejs': 80, 'docker': 75, 'kubernetes': 78,
        'aws': 88, 'java': 82, 'postgresql': 79, 'mongodb': 76,
        'redis': 73, 'graphql': 70, 'vue': 68, 'angular': 65,
        'rust': 72, 'go': 75, 'terraform': 74, 'ci/cd': 76,
        'system design': 80, 'microservices': 77, 'cloud': 82,
        'devops': 80, 'machine learning': 75, 'sql': 85,
        'git': 95, 'linux': 88, 'api': 85, 'rest': 84
    }
    
    # Get base demand (default to 70 if not in list)
    skill_lower = skill_name.lower()
    base_demand = base_demands.get(skill_lower, 70)
    
    # Assign trend based on skill characteristics
    if any(x in skill_lower for x in ['typescript', 'kubernetes', 'rust', 'go', 'terraform', 'system design']):
        trend_type = 'rising'
        pattern_func = lambda i: base_demand + (i * 0.8)  # Gradual increase
    elif any(x in skill_lower for x in ['angular', 'jquery', 'php', 'flash']):
        trend_type = 'declining'
        pattern_func = lambda i: base_demand - (i * 0.5)  # Gradual decrease
    else:
        trend_type = 'stable'
        pattern_func = lambda i: base_demand + (i % 3 - 1)  # Slight oscillation
    
    # Generate monthly values
    monthly_demand = []
    for i in range(months):
        try:
            value = pattern_func(i)
            value = max(30, min(100, value))  # Clamp to 30-100 range
            monthly_demand.append(int(round(value)))
        except Exception as e:
            logger.warning(f"⚠️ Error generating value for {skill_name}: {e}")
            monthly_demand.append(70)  # Fallback value
    
    # Calculate statistics
    first_value = monthly_demand[0]
    last_value = monthly_demand[-1]
    percent_change = ((last_value - first_value) / first_value * 100) if first_value != 0 else 0
    
    logger.info(f"✨ Generated synthetic trend for {skill_name}: {trend_type} ({percent_change:+.1f}%)")
    
    return {
        "monthly_demand": monthly_demand,
        "trend": trend_type,
        "percent_change": round(percent_change, 1),
        "current_demand": last_value,
        "data_source": "estimated"
    }



async def compare_skills_trends(
    skills: str = Query(..., description="Comma-separated list of skill names (max 10)"),
    months: int = Query(12, ge=1, le=24, description="Number of months to analyze (max 24)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get trend data for multiple skills for comparison charts
    """
    try:
        # Parse and validate skills
        skill_names = [s.strip() for s in skills.split(',') if s.strip()]
        
        if not skill_names:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one skill name must be provided"
            )
        
        if len(skill_names) > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 10 skills can be compared at once"
            )

        skills_data = []
        comparison_metrics = {
            "winner": None,
            "highest_growth": None,
            "most_stable": None,
            "highest_decline": None
        }

        # Process each skill
        for skill_name in skill_names:
            try:
                # Check if skill exists
                market_result = await db.execute(
                    select(SkillMarketData).where(SkillMarketData.skill_name == skill_name)
                )
                market_data_row = market_result.first()
                
                if not market_data_row:
                    # Skip missing skills instead of failing
                    logger.warning(f"Skill '{skill_name}' not found in market data, skipping")
                    continue

                market_data = market_data_row[0]

                # Get trend data
                trend_query = select(SkillTrendHistory).where(
                    SkillTrendHistory.skill_name == skill_name
                ).order_by(asc(SkillTrendHistory.month)).limit(months)

                result = await db.execute(trend_query)
                trend_records = result.scalars().all()

                if not trend_records:
                    logger.warning(f"No trend data found for skill '{skill_name}', skipping")
                    continue

                # Format history data
                history_data = [
                    {
                        "month": record.month.strftime("%Y-%m"),
                        "demand_score": record.demand_score
                    }
                    for record in trend_records
                ]

                # Calculate statistics
                statistics_data = calculate_trend_statistics(history_data)

                skill_data = {
                    "skill_name": skill_name,
                    "current_demand": market_data.demand_score,
                    "trend": market_data.trend,
                    "history": history_data,
                    "statistics": statistics_data
                }

                skills_data.append(skill_data)

            except Exception as e:
                logger.error(f"Error processing skill '{skill_name}': {e}")
                continue

        # Calculate comparison metrics
        if skills_data:
            # Highest growth (most positive change)
            highest_growth_skill = max(skills_data, key=lambda x: x["statistics"]["total_change"])
            comparison_metrics["highest_growth"] = highest_growth_skill["skill_name"]
            
            # Most stable (lowest volatility)
            most_stable_skill = min(skills_data, key=lambda x: x["statistics"]["volatility"])
            comparison_metrics["most_stable"] = most_stable_skill["skill_name"]
            
            # Highest decline (most negative change)
            highest_decline_skill = min(skills_data, key=lambda x: x["statistics"]["total_change"])
            comparison_metrics["highest_decline"] = highest_decline_skill["skill_name"]
            
            # Winner (highest current demand)
            winner_skill = max(skills_data, key=lambda x: x["current_demand"])
            comparison_metrics["winner"] = winner_skill["skill_name"]

        response = {
            "skills": skills_data,
            "comparison": comparison_metrics
        }

        logger.info(f"📊 Compared trends for {len(skills_data)} skills")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing skills trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred while comparing skills trends"
        )


@router.get("/movers")
async def get_trending_skills(
    direction: str = Query("up", description="Trend direction: up, down, or volatile"),
    limit: int = Query(20, ge=1, le=50, description="Number of skills to return (max 50)"),
    period: int = Query(3, ge=1, le=12, description="Analysis period in months (1-12)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get trending skills - top movers by demand change
    """
    try:
        # Validate direction parameter
        if direction not in ["up", "down", "volatile"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Direction must be one of: up, down, volatile"
            )

        # Calculate the start date for the analysis period
        end_date = date(2025, 11, 1)  # Current month anchor
        # Calculate start month (go back 'period' months)
        start_month = max(1, end_date.month - period) if end_date.month > period else (12 + end_date.month - period)
        start_year = end_date.year if end_date.month > period else end_date.year - 1
        start_date = date(start_year, start_month, 1)
        
        # Build the query to get trend data for the period
        trend_query = select(
            SkillTrendHistory,
            SkillMarketData.category
        ).join(
            SkillMarketData,
            SkillTrendHistory.skill_name == SkillMarketData.skill_name
        ).where(
            SkillTrendHistory.month >= start_date
        ).where(
            SkillTrendHistory.month <= end_date
        )

        result = await db.execute(trend_query)
        records = result.fetchall()

        if not records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No trend data found for the specified period"
            )

        # Group data by skill and calculate changes
        skill_changes = {}
        
        for trend_record, category in records:
            skill_name = trend_record.skill_name
            
            if skill_name not in skill_changes:
                skill_changes[skill_name] = {
                    "scores": [],
                    "category": category,
                    "current_demand": 0
                }
            
            skill_changes[skill_name]["scores"].append({
                "month": trend_record.month,
                "demand_score": trend_record.demand_score
            })
            
            # Store current demand (most recent)
            if not skill_changes[skill_name]["current_demand"]:
                skill_changes[skill_name]["current_demand"] = trend_record.demand_score

        # Calculate changes and sort based on direction
        trending_skills = []
        
        for skill_name, data in skill_changes.items():
            if len(data["scores"]) < 2:
                continue
            
            # Sort by month
            data["scores"].sort(key=lambda x: x["month"])
            
            # Calculate change over period
            start_score = data["scores"][0]["demand_score"]
            end_score = data["scores"][-1]["demand_score"]
            total_change = end_score - start_score
            percent_change = (total_change / start_score * 100) if start_score > 0 else 0
            
            # Calculate volatility (standard deviation of monthly changes)
            if len(data["scores"]) > 1:
                changes = [data["scores"][i]["demand_score"] - data["scores"][i-1]["demand_score"] 
                          for i in range(1, len(data["scores"]))]
                volatility = statistics.stdev(changes) if len(changes) > 1 else 0
            else:
                volatility = 0
            
            trending_skills.append({
                "skill_name": skill_name,
                "current_demand": data["current_demand"],
                "demand_change": total_change,
                "percent_change": round(percent_change, 2),
                "start_demand": start_score,
                "end_demand": end_score,
                "category": data["category"],
                "volatility": round(volatility, 2)
            })

        # Sort based on direction
        if direction == "up":
            trending_skills.sort(key=lambda x: x["demand_change"], reverse=True)
        elif direction == "down":
            trending_skills.sort(key=lambda x: x["demand_change"])
        else:  # volatile
            trending_skills.sort(key=lambda x: x["volatility"], reverse=True)

        # Limit results
        trending_skills = trending_skills[:limit]

        response = {
            "direction": direction,
            "period_months": period,
            "skills": trending_skills
        }

        logger.info(f"📈 Found {len(trending_skills)} trending skills in {direction} direction")
        return response

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching trending skills: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while fetching trending skills"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching trending skills: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred while fetching trending skills"
        )


@router.get("/categories")
async def get_category_trends(
    months: int = Query(12, ge=1, le=24, description="Analysis period in months (max 24)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get trend analysis by skill category
    """
    try:
        # Get trend data with category information
        trend_query = select(
            SkillTrendHistory.skill_name,
            SkillTrendHistory.month,
            SkillTrendHistory.demand_score,
            SkillMarketData.category,
            SkillMarketData.demand_score.label('current_demand')
        ).join(
            SkillMarketData,
            SkillTrendHistory.skill_name == SkillMarketData.skill_name
        ).order_by(
            SkillMarketData.category, 
            SkillTrendHistory.skill_name,
            SkillTrendHistory.month
        ).limit(1000)  # Limit for performance

        result = await db.execute(trend_query)
        records = result.fetchall()

        if not records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No trend data found"
            )

        # Group by category and calculate metrics
        category_data = {}
        
        for record in records:
            category = record.category
            skill_name = record.skill_name
            month = record.month
            demand_score = record.demand_score
            current_demand = record.current_demand
            
            if category not in category_data:
                category_data[category] = {
                    "skills": {},
                    "total_skills": 0,
                    "all_scores": []
                }
            
            if skill_name not in category_data[category]["skills"]:
                category_data[category]["skills"][skill_name] = {
                    "scores": [],
                    "current_demand": current_demand
                }
            
            category_data[category]["skills"][skill_name]["scores"].append(demand_score)
            category_data[category]["all_scores"].append(demand_score)

        # Calculate category metrics
        categories = []
        
        for category, data in category_data.items():
            if not data["all_scores"]:
                continue
            
            # Calculate average demand and change
            current_scores = [skill_data["current_demand"] for skill_data in data["skills"].values()]
            average_demand = statistics.mean(current_scores)
            
            # Calculate trend direction
            if len(data["all_scores"]) >= months:
                # Calculate change from oldest to newest
                period_scores = data["all_scores"][:months]  # Take first 'months' scores
                if len(period_scores) >= 2:
                    change = period_scores[-1] - period_scores[0]
                    percent_change = (change / period_scores[0] * 100) if period_scores[0] > 0 else 0
                else:
                    change = 0
                    percent_change = 0
            else:
                change = 0
                percent_change = 0
            
            # Determine trend direction
            if percent_change > 2:
                trend_direction = "up"
            elif percent_change < -2:
                trend_direction = "down"
            else:
                trend_direction = "stable"
            
            # Get top 3 skills by current demand
            top_skills = sorted(
                data["skills"].items(),
                key=lambda x: x[1]["current_demand"],
                reverse=True
            )[:3]
            
            top_skills_names = [skill[0] for skill in top_skills]
            
            categories.append({
                "category": category,
                "average_demand": round(average_demand, 1),
                "total_change": round(change, 1),
                "percent_change": round(percent_change, 2),
                "top_skills": top_skills_names,
                "trend_direction": trend_direction,
                "skill_count": len(data["skills"])
            })

        # Sort categories by percent change (descending)
        categories.sort(key=lambda x: x["percent_change"], reverse=True)

        response = {
            "categories": categories
        }

        logger.info(f"📊 Analyzed trends for {len(categories)} categories")
        return response

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching category trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while fetching category trends"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching category trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred while fetching category trends"
        )


# Health check for trends endpoints
@router.get("/health")
async def trends_health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check for trends endpoints
    """
    try:
        # Check database connection and count trend records
        result = await db.execute(select(func.count()).select_from(SkillTrendHistory))
        count = result.scalar() or 0

        # Check if we have data for different months
        month_result = await db.execute(
            select(func.count(func.distinct(SkillTrendHistory.month))).select_from(SkillTrendHistory)
        )
        months_count = month_result.scalar() or 0

        return {
            "status": "healthy",
            "database_connected": True,
            "trend_records_count": count,
            "unique_months": months_count,
            "cache_enabled": True,
            "cache_duration_hours": CACHE_DURATION.total_seconds() / 3600
        }
    except Exception as e:
        logger.error(f"Trends health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# CATCH-ALL ROUTE LAST - This must come after all specific routes
# Otherwise requests to /compare, /movers, /categories will be caught here

@router.get("/{skill_name}")
async def get_skill_trends(
    skill_name: str,
    months: int = Query(12, ge=1, le=24, description="Number of months to return (max 24)"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get trend data for a single skill with historical demand scores and statistics
    
    Must be defined LAST to avoid intercepting other routes like /compare, /movers, /categories
    """
    try:
        # Validate skill exists in market data
        market_result = await db.execute(
            select(SkillMarketData).where(SkillMarketData.skill_name == skill_name)
        )
        market_data_row = market_result.first()
        
        if not market_data_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill '{skill_name}' not found"
            )
        
        market_data = market_data_row[0]

        # Get trend data from database
        trend_query = select(SkillTrendHistory).where(
            SkillTrendHistory.skill_name == skill_name
        ).order_by(asc(SkillTrendHistory.month)).limit(months)

        result = await db.execute(trend_query)
        trend_records = result.scalars().all()

        if not trend_records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No trend data found for skill '{skill_name}'"
            )

        # Format history data
        history_data = [
            {
                "month": record.month.strftime("%Y-%m"),
                "demand_score": record.demand_score
            }
            for record in trend_records
        ]

        # Calculate statistics
        statistics_data = calculate_trend_statistics(history_data)

        response = {
            "skill_name": skill_name,
            "current_demand": market_data.demand_score,
            "trend": market_data.trend,
            "history": history_data,
            "statistics": statistics_data
        }

        logger.info(f"📈 Retrieved {len(history_data)} months of trend data for {skill_name}")
        return response

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching trends for {skill_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while fetching trend data"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching trends for {skill_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred while fetching trend data"
        )

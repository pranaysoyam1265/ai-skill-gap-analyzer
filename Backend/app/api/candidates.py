"""
Candidate management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import logging

from app.core.database import get_db
from app.schemas.candidate import (
    CandidateResponse,
    CandidateDetailResponse,
    DashboardResponse,
    GapAnalysisSummary,
    MarketTrendsSummary,
    ProficiencyDistribution
)
from app.schemas.skill import CandidateSkillResponse
from app.models.candidate import Candidate
from app.models.skill import CandidateSkill, Skill
from app.services.market_data import get_market_data_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.get(
    "/{candidate_id}",
    response_model=CandidateDetailResponse,
    summary="Get candidate details",
    description="Get candidate information with basic skills summary"
)
async def get_candidate(
    candidate_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get candidate details by ID
    
    Returns:
    - Basic candidate info
    - Skills grouped by category
    - Detailed skill list with proficiency
    """
    logger.info(f"🔍 Fetching candidate: ID={candidate_id}")
    
    # Fetch candidate with skills
    result = await db.execute(
        select(Candidate)
        .where(Candidate.id == candidate_id)
        .options(selectinload(Candidate.candidate_skills).selectinload(CandidateSkill.skill))
    )
    candidate = result.scalar_one_or_none()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found"
        )
    
    # Build skills data
    by_category = {}
    detailed_skills = []
    
    for candidate_skill in candidate.candidate_skills:
        skill = candidate_skill.skill
        
        # Group by category
        if skill.category not in by_category:
            by_category[skill.category] = []
        by_category[skill.category].append(skill.name)
        
        # Detailed skill info
        proficiency_str = "Expert" if candidate_skill.proficiency >= 4.5 else \
                         "Advanced" if candidate_skill.proficiency >= 3.5 else \
                         "Intermediate" if candidate_skill.proficiency >= 2.5 else "Beginner"
        
        detailed_skills.append({
            "id": skill.id,
            "name": skill.name,
            "category": skill.category,
            "proficiency": proficiency_str,
            "years": candidate_skill.years_of_experience
        })
    
    return CandidateDetailResponse(
        id=candidate.id,
        name=candidate.name,
        email=candidate.email,
        phone=candidate.phone,
        location=candidate.location,
        summary=candidate.summary,
        skills={
            "total": len(detailed_skills),
            "by_category": by_category,
            "detailed": detailed_skills
        }
    )


@router.get(
    "/{candidate_id}/dashboard",
    response_model=DashboardResponse,
    summary="Get dashboard data",
    description="Get complete dashboard data with skills, gap analysis, and market trends"
)
async def get_dashboard(
    candidate_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete dashboard data for candidate
    
    This is the main endpoint for the Dashboard page
    
    Returns:
    - All skills with market data, trends, job roles
    - Gap analysis summary
    - Market trends summary
    - Proficiency distribution
    """
    logger.info(f"📊 Fetching dashboard data: candidate_id={candidate_id}")
    
    # Fetch candidate with skills
    result = await db.execute(
        select(Candidate)
        .where(Candidate.id == candidate_id)
        .options(selectinload(Candidate.candidate_skills).selectinload(CandidateSkill.skill))
    )
    candidate = result.scalar_one_or_none()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found"
        )
    
    # Get market data service
    market_service = get_market_data_service()
    
    # Build enriched skills list
    skills_list = []
    proficiency_counts = {"beginner": 0, "intermediate": 0, "advanced": 0, "expert": 0}
    trend_counts = {"up": 0, "stable": 0, "down": 0}
    total_proficiency = 0.0
    skills_below_market = 0
    
    for candidate_skill in candidate.candidate_skills:
        skill = candidate_skill.skill
        proficiency = float(candidate_skill.proficiency) if candidate_skill.proficiency else 0.0
        
        # Get market data
        market_demand = market_service.get_market_demand(skill.name)
        trend = market_service.get_trend(skill.name)
        trend_percentage = market_service.get_trend_percentage(skill.name)
        job_roles = market_service.get_job_roles(skill.name)
        job_levels = market_service.get_job_levels(proficiency)
        recommendation = market_service.generate_recommendation(skill.name, proficiency, market_demand)
        
        # Build skill response
        skill_response = CandidateSkillResponse(
            id=skill.id,
            name=skill.name,
            category=skill.category,
            proficiency=proficiency,
            confidence=float(candidate_skill.confidence) if candidate_skill.confidence else None,
            years_of_experience=candidate_skill.years_of_experience,
            extraction_method=candidate_skill.extraction_method,
            market_demand=market_demand,
            trend=trend,
            trend_percentage=trend_percentage,
            job_roles=job_roles,
            job_levels=job_levels,
            recommendation=recommendation
        )
        skills_list.append(skill_response)
        
        # Update counts
        total_proficiency += proficiency
        
        if proficiency >= 4.5:
            proficiency_counts["expert"] += 1
        elif proficiency >= 3.5:
            proficiency_counts["advanced"] += 1
        elif proficiency >= 2.5:
            proficiency_counts["intermediate"] += 1
        else:
            proficiency_counts["beginner"] += 1
        
        if trend == "up":
            trend_counts["up"] += 1
        elif trend == "down":
            trend_counts["down"] += 1
        else:
            trend_counts["stable"] += 1
        
        # Check if below market expectation (simplified heuristic)
        if market_demand > 80 and proficiency < 3.5:
            skills_below_market += 1
    
    # Calculate gap analysis
    total_skills = len(skills_list)
    avg_proficiency = total_proficiency / total_skills if total_skills > 0 else 0.0
    
    # Find top gaps (skills with high demand but low proficiency)
    top_gaps = []
    for skill_resp in skills_list:
        if skill_resp.market_demand and skill_resp.proficiency:
            gap = skill_resp.market_demand / 20 - skill_resp.proficiency  # Normalize demand to 0-5 scale
            if gap > 1.0:
                top_gaps.append({
                    "skill": skill_resp.name,
                    "gap": round(gap, 2),
                    "priority": "high" if gap > 2.0 else "medium"
                })
    
    top_gaps = sorted(top_gaps, key=lambda x: x['gap'], reverse=True)[:5]
    
    # Market alignment percentage (0-100)
    market_alignment = max(0, min(100, int((avg_proficiency / 5.0) * 100)))
    
    # Generate insights
    gap_insights = []
    if skills_below_market > 0:
        gap_insights.append(f"{skills_below_market} high-demand skills need improvement")
    if avg_proficiency >= 3.5:
        gap_insights.append("Strong overall proficiency across skills")
    if top_gaps:
        gap_insights.append(f"Focus on {top_gaps[0]['skill']} - {top_gaps[0]['gap']} point gap")
    
    # Market trends insights
    trend_insights = []
    if trend_counts["up"] > total_skills * 0.6:
        trend_insights.append("Portfolio aligned with growing market trends")
    trend_insights.append(f"{trend_counts['up']} skills trending upward")
    if total_skills > 15:
        trend_insights.append("Strong skill diversity for market coverage")
    
    # Find fastest growing
    fastest_growing = max(
        skills_list,
        key=lambda s: s.trend_percentage if s.trend_percentage else 0
    ) if skills_list else None
    
    # Build response
    return DashboardResponse(
        candidate_id=candidate.id,
        name=candidate.name,
        skills=skills_list,
        gap_analysis=GapAnalysisSummary(
            average_proficiency=round(avg_proficiency, 2),
            skills_below_market=skills_below_market,
            improvement_priority=top_gaps[0]['skill'] if top_gaps else None,
            market_alignment_percentage=market_alignment,
            top_gaps=top_gaps,
            insights=gap_insights
        ),
        market_trends=MarketTrendsSummary(
            trending_up=trend_counts["up"],
            stable=trend_counts["stable"],
            declining=trend_counts["down"],
            coverage_percentage=min(100, int((total_skills / 30) * 100)),
            fastest_growing=fastest_growing.name if fastest_growing else None,
            insights=trend_insights
        ),
        proficiency_distribution=ProficiencyDistribution(**proficiency_counts)
    )

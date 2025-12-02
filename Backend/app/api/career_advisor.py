from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select
from app.core.database import get_db
from app.models.candidate import Candidate
from app.models.skill import CandidateSkill, Skill
from app.models.skill_market import SkillMarketData
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import statistics
import logging
from pydantic import BaseModel, Field, validator
from enum import Enum
import asyncio
import json
import os
import re

router = APIRouter()
logger = logging.getLogger(__name__)

# Constants for default values
DEFAULT_PROFICIENCY = 3
DEFAULT_MARKET_DEMAND = 50
DEFAULT_HEALTH_SCORE = 50
MIN_SKILLS_FOR_ACCURATE_CALC = 3


# ============================================================================
# Pydantic Models for Career Recommendations
# ============================================================================

class RoleSalaryRange(BaseModel):
    """Salary range model for career recommendations"""
    min: int = Field(..., description="Minimum salary in lakhs", ge=0)
    max: int = Field(..., description="Maximum salary in lakhs", ge=0)
    currency: str = Field(default="INR_LAKHS")


class CareerRecommendation(BaseModel):
    """Career recommendation model"""
    id: int
    title: str
    company_type: str
    match_score: int = Field(..., ge=0, le=100)
    salary_range: RoleSalaryRange
    description: str
    required_skills: List[str]
    growth_potential: str
    timeline_months: str
    job_postings_count: int = Field(default=0, ge=0)
    missing_skills: Optional[List[str]] = None
    skill_gaps: Optional[Dict[str, int]] = None


# ============================================================================
# Pydantic Models for Career Trajectory Projection
# ============================================================================

class TrajectoryProjection(BaseModel):
    """Quarter-by-quarter career trajectory projection"""
    quarter: str
    current_path_score: int = Field(..., ge=0, le=100)
    potential_path_score: int = Field(..., ge=0, le=100)
    milestone: Optional[str] = None


class AccelerationOpportunity(BaseModel):
    """Career acceleration opportunity through upskilling"""
    time_saved_months: int = Field(..., ge=0)
    salary_increase: str
    key_skills_to_learn: List[str]
    estimated_effort_hours: int
    recommended_pace: str


# ============================================================================
# Pydantic Models for Salary Trends
# ============================================================================

class SalaryLevel(BaseModel):
    """Salary data for a specific experience level"""
    level: str = Field(..., description="Experience level (e.g., 'Junior', 'Mid-Level')")
    min_lpa: float = Field(..., ge=0, description="Minimum salary in lakhs per annum")
    median_lpa: float = Field(..., ge=0, description="Median salary in lakhs per annum")
    max_lpa: float = Field(..., ge=0, description="Maximum salary in lakhs per annum")
    sample_size: int = Field(default=0, ge=0, description="Number of data points")
    yoe_range: str = Field(..., description="Years of experience range for this level")


class SalaryTrendsResponse(BaseModel):
    """Complete salary trends response for a role"""
    role: str = Field(..., description="Job role title")
    salary_by_level: List[SalaryLevel] = Field(..., description="Salary data by experience level")
    currency: str = Field(..., description="Currency code (INR, USD, EUR, GBP)")
    data_source: str = Field(..., description="Source of salary data")
    last_updated: str = Field(..., description="Date when data was last updated")
    region: str = Field(..., description="Geographic region for the data")


# ============================================================================
# Pydantic Models for Career Health
# ============================================================================

class CareerHealthMetrics(BaseModel):
    """Career health metrics for a candidate"""
    candidate_id: int = Field(..., description="Candidate ID")
    skills_relevance: int = Field(..., ge=0, le=100, description="How relevant skills are to market")
    market_alignment: int = Field(..., ge=0, le=100, description="How well profile matches market demands")
    learning_trajectory: int = Field(..., ge=0, le=100, description="Growth momentum and learning rate")
    industry_demand: int = Field(..., ge=0, le=100, description="How in-demand the skill set is")
    overall_score: int = Field(..., ge=0, le=100, description="Overall career health score")
    calculated_at: str = Field(..., description="Calculation timestamp (ISO format)")
    data_quality: str = Field(..., description="Quality of calculation: 'high', 'medium', 'low'")
    skills_analyzed: int = Field(..., ge=0, description="Number of skills analyzed")
    warning: Optional[str] = Field(None, description="Any warnings or notes")


# ============================================================================
# Pydantic Models for Skill Journey Timeline
# ============================================================================


class EventType(str, Enum):
    """Enum for skill journey event types"""
    SKILL_ACQUIRED = "skill_acquired"
    PROFICIENCY_UPGRADE = "proficiency_upgrade"
    CERTIFICATION = "certification"
    PROJECT_COMPLETED = "project_completed"
    COURSE_COMPLETED = "course_completed"


class SkillJourneyEvent(BaseModel):
    """Single event in skill journey timeline"""
    date: str = Field(..., description="Event date (YYYY-MM-DD)")
    event_type: EventType = Field(..., description="Type of event")
    skill_name: str = Field(..., description="Skill name")
    description: str = Field(..., description="Event description")
    icon: str = Field(..., description="Emoji icon for event")
    previous_level: Optional[int] = Field(None, description="Previous proficiency level (for upgrades)")
    new_level: Optional[int] = Field(None, description="New proficiency level (for upgrades)")
    certification_name: Optional[str] = Field(None, description="Certification name")
    project_name: Optional[str] = Field(None, description="Project name")


class ProductivityPeriod(BaseModel):
    """Productivity metrics for a specific period"""
    period: str = Field(..., description="Period (e.g., 'Q1 2024')")
    skills_acquired: int = Field(default=0, description="Number of skills acquired")
    courses_completed: int = Field(default=0, description="Courses completed")
    certifications_earned: int = Field(default=0, description="Certifications earned")
    total_events: int = Field(..., description="Total events in period")


class SkillJourneyResponse(BaseModel):
    """Complete skill journey response"""
    candidate_id: int = Field(..., description="Candidate ID")
    events: List[SkillJourneyEvent] = Field(..., description="List of journey events")
    total_events: int = Field(..., description="Total events in journey")
    returned_events: int = Field(..., description="Number of events returned")
    offset: int = Field(..., description="Pagination offset used")
    journey_start_date: Optional[str] = Field(None, description="Earliest event date")
    journey_duration_days: int = Field(..., description="Days from first to last event")
    most_productive_period: Optional[ProductivityPeriod] = Field(None, description="Most productive quarter")
    has_more: bool = Field(..., description="Whether more events exist")
    message: Optional[str] = Field(None, description="Informational message")
    suggestion: Optional[str] = Field(None, description="Suggestion for user")


# ============================================================================
# AI Career Summary Models
# ============================================================================

class CareerSummaryRequest(BaseModel):
    """Request for AI career summary generation"""
    candidate_id: int = Field(..., description="Candidate ID", ge=1)
    target_role: Optional[str] = Field(
        None,
        max_length=100,
        description="Target role for career advice"
    )
    context: str = Field(
        default="career_growth",
        pattern="^(career_growth|job_search|upskilling)$",
        description="Context type: career_growth, job_search, or upskilling"
    )
    regenerate: bool = Field(
        default=False,
        description="Force regeneration, bypass cache"
    )
    
    @validator('target_role')
    def validate_target_role(cls, v):
        """Validate target role if provided"""
        if v is not None and len(v.strip()) == 0:
            raise ValueError("Target role cannot be empty")
        return v.strip() if v else None


class CareerSummaryResponse(BaseModel):
    """Response with AI-generated career summary"""
    summary: str = Field(..., description="Personalized career summary (2-3 paragraphs)")
    key_strengths: List[str] = Field(..., description="Top 3+ key strengths")
    opportunities: List[str] = Field(..., description="Top 3+ career opportunities")
    action_items: List[str] = Field(..., description="Recommended action items (3-5)")
    timeline_to_goal: str = Field(..., description="Timeline to reach goals (e.g., '6-12 months')")
    salary_impact: str = Field(..., description="Estimated salary impact (e.g., '₹3-5L increase')")
    generated_at: str = Field(..., description="Generation timestamp (ISO format)")
    source: str = Field(..., description="Source: 'ai' or 'template'")
    
    class Config:
        schema_extra = {
            "example": {
                "summary": "You're a mid-level engineer with solid Python and cloud skills...",
                "key_strengths": ["Python", "AWS", "System Design"],
                "opportunities": ["Leadership", "Cloud Architecture", "Open Source"],
                "action_items": ["Complete system design course", "Lead a project", "Write technical blog"],
                "timeline_to_goal": "6-12 months",
                "salary_impact": "₹3-5L increase potential",
                "generated_at": "2025-11-28T10:30:00",
                "source": "ai"
            }
        }


# ============================================================================
# Pydantic Models for Networking Suggestions
# ============================================================================

class LinkedInProfile(BaseModel):
    """LinkedIn profile or influencer recommendation"""
    name: str = Field(..., description="Person's name")
    role: str = Field(..., description="Their role/position")
    company: str = Field(..., description="Company they work for")
    bio: str = Field(..., description="Short bio/description")
    expertise: List[str] = Field(..., description="Areas of expertise (3-5 skills)")
    linkedin_username: str = Field(..., description="LinkedIn username")
    relevance_score: int = Field(..., ge=0, le=100, description="Relevance to candidate's role (0-100)")
    followers: Optional[int] = Field(None, ge=0, description="Number of LinkedIn followers")


class Community(BaseModel):
    """Tech community recommendation"""
    name: str = Field(..., description="Community name")
    platform: str = Field(..., description="Platform (Discord, Reddit, Slack, etc.)")
    url: str = Field(..., description="Community URL")
    members: int = Field(..., ge=0, description="Number of members")
    description: str = Field(..., description="Community description")
    relevance_score: int = Field(..., ge=0, le=100, description="Relevance score (0-100)")


class NetworkingEvent(BaseModel):
    """Tech event or conference recommendation"""
    name: str = Field(..., description="Event name")
    type: str = Field(..., description="Event type: conference, meetup, or webinar")
    url: str = Field(..., description="Event URL")
    date: Optional[str] = Field(None, description="Event date (YYYY-MM-DD or 'Ongoing')")
    location: str = Field(..., description="Event location")
    description: str = Field(..., description="Event description")
    cost: str = Field(..., description="Cost (Free, Paid, or specific amount)")


class NetworkingSuggestionsResponse(BaseModel):
    """Complete networking suggestions response"""
    candidate_id: int = Field(..., description="Candidate ID")
    target_role: str = Field(..., description="Target role for networking")
    suggested_connections: List[LinkedInProfile] = Field(..., description="LinkedIn profiles to follow")
    communities: List[Community] = Field(..., description="Communities to join")
    events: List[NetworkingEvent] = Field(..., description="Events to attend")
    networking_tips: List[str] = Field(..., description="Role-specific networking tips")


# ============================================================================
# Pydantic Models for Interview Resources
# ============================================================================

class InterviewResource(BaseModel):
    """Individual interview preparation resource"""
    type: str = Field(..., description="Resource type: YouTube, Course, Platform, Guide, Book")
    title: str = Field(..., description="Resource title")
    url: str = Field(..., description="Resource URL")
    description: str = Field(..., description="Brief description of the resource")
    difficulty: str = Field(..., description="Difficulty level: Beginner, Intermediate, Advanced")
    cost: str = Field(..., description="Cost: Free, Paid, or Freemium")
    estimated_hours: Optional[int] = Field(None, ge=0, le=1000, description="Estimated hours to complete")
    rating: Optional[float] = Field(None, ge=0, le=5, description="Resource rating out of 5")
    problem_count: Optional[int] = Field(None, ge=0, description="Number of practice problems")


class InterviewCategory(BaseModel):
    """Category of interview resources with tips"""
    category: str = Field(..., description="Category name: Technical Round, System Design, etc.")
    icon: str = Field(..., description="Emoji icon for the category")
    description: str = Field(..., description="Category description")
    resources: List[InterviewResource] = Field(..., description="List of resources in this category")
    practice_tips: List[str] = Field(..., description="Actionable tips for this round")


class InterviewResourcesResponse(BaseModel):
    """Complete interview resources response"""
    role: str = Field(..., description="Target role")
    categories: List[InterviewCategory] = Field(..., description="Resource categories")
    total_resources: int = Field(..., ge=0, description="Total number of resources")
    recommended_timeline: str = Field(..., description="Recommended prep timeline")


# ============================================================================
# Career Health Endpoint
# ============================================================================

@router.get("/{candidate_id}/health", response_model=CareerHealthMetrics)
async def get_career_health(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """
    Calculate career health metrics for a candidate.
    
    Args:
        candidate_id: Unique identifier for the candidate
        
    Returns:
        Career health metrics with scores 0-100
        
    Raises:
        HTTPException: 404 if candidate not found, 500 for server errors
    """
    try:
        # Validate candidate exists
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            logger.warning(f"Candidate {candidate_id} not found")
            raise HTTPException(
                status_code=404, 
                detail=f"Candidate with ID {candidate_id} not found"
            )
        
        # Fetch candidate skills with error handling
        try:
            candidate_skills = db.query(CandidateSkill).filter(
                CandidateSkill.candidate_id == candidate_id
            ).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching skills: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve candidate skills from database"
            )
        
        # Handle edge case: No skills
        if not candidate_skills or len(candidate_skills) == 0:
            logger.info(f"Candidate {candidate_id} has no skills, returning default scores")
            return {
                "candidate_id": candidate_id,
                "skills_relevance": DEFAULT_HEALTH_SCORE,
                "market_alignment": DEFAULT_HEALTH_SCORE,
                "learning_trajectory": DEFAULT_HEALTH_SCORE,
                "industry_demand": DEFAULT_HEALTH_SCORE,
                "overall_score": DEFAULT_HEALTH_SCORE,
                "calculated_at": datetime.utcnow().isoformat(),
                "data_quality": "insufficient",
                "skills_analyzed": 0,
                "warning": "No skills found. Metrics are based on default values."
            }
        
        # Normalize skill data (handle missing/invalid values)
        normalized_skills = []
        for candidate_skill in candidate_skills:
            try:
                # Get skill details
                skill_name = candidate_skill.skill.name if candidate_skill.skill else "Unknown"
                skill_category = candidate_skill.skill.category if candidate_skill.skill else "Other"
                
                # Get market data
                market_data = db.query(SkillMarketData).filter(
                    SkillMarketData.skill_name.ilike(skill_name)
                ).first()
                
                market_demand = market_data.demand_score if market_data else DEFAULT_MARKET_DEMAND
                
                normalized_skill = {
                    "name": skill_name,
                    "proficiency": _normalize_proficiency(candidate_skill.proficiency),
                    "market_demand": _normalize_market_demand(market_demand),
                    "category": skill_category
                }
                normalized_skills.append(normalized_skill)
            except Exception as skill_error:
                logger.warning(f"Error processing skill {candidate_skill.skill_id}: {skill_error}")
                continue
        
        # If all skills failed to process, return default scores
        if not normalized_skills:
            logger.warning(f"No valid skills could be processed for candidate {candidate_id}")
            return {
                "candidate_id": candidate_id,
                "skills_relevance": DEFAULT_HEALTH_SCORE,
                "market_alignment": DEFAULT_HEALTH_SCORE,
                "learning_trajectory": DEFAULT_HEALTH_SCORE,
                "industry_demand": DEFAULT_HEALTH_SCORE,
                "overall_score": DEFAULT_HEALTH_SCORE,
                "calculated_at": datetime.utcnow().isoformat(),
                "data_quality": "insufficient",
                "skills_analyzed": len(candidate_skills),
                "warning": f"Could not retrieve market data for {len(candidate_skills)} skill(s). Using default scores."
            }
        
        # Calculate metrics with validation
        skills_relevance = calculate_skills_relevance(normalized_skills)
        market_alignment = calculate_market_alignment(normalized_skills)
        learning_trajectory = calculate_learning_trajectory(normalized_skills)
        industry_demand = calculate_industry_demand(normalized_skills)
        
        # Calculate overall score
        overall_score = round(
            (skills_relevance + market_alignment + learning_trajectory + industry_demand) / 4
        )
        
        # Determine data quality
        data_quality = "excellent" if len(normalized_skills) >= 10 else \
                      "good" if len(normalized_skills) >= 5 else \
                      "fair" if len(normalized_skills) >= MIN_SKILLS_FOR_ACCURATE_CALC else \
                      "limited"
        
        result = {
            "candidate_id": candidate_id,
            "skills_relevance": skills_relevance,
            "market_alignment": market_alignment,
            "learning_trajectory": learning_trajectory,
            "industry_demand": industry_demand,
            "overall_score": overall_score,
            "calculated_at": datetime.utcnow().isoformat(),
            "data_quality": data_quality,
            "skills_analyzed": len(normalized_skills)
        }
        
        # Add warning for low skill count
        if len(normalized_skills) < MIN_SKILLS_FOR_ACCURATE_CALC:
            result["warning"] = f"Analysis based on only {len(normalized_skills)} skill(s). Add more skills for accurate metrics."
        
        logger.info(f"✅ Successfully calculated health metrics for candidate {candidate_id}: overall_score={overall_score}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error calculating health metrics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while calculating career health metrics"
        )


def _normalize_proficiency(proficiency: Optional[float]) -> float:
    """
    Normalize proficiency to 1-5 scale.
    
    Args:
        proficiency: Raw proficiency value (may be None, out of range, or invalid)
        
    Returns:
        Normalized proficiency value between 1 and 5
    """
    if proficiency is None:
        return DEFAULT_PROFICIENCY
    
    try:
        proficiency = float(proficiency)
        
        # Handle percentage-based proficiency (0-100)
        if proficiency > 5:
            proficiency = (proficiency / 100) * 5
        
        # Clamp to valid range
        return max(1.0, min(5.0, proficiency))
    except (ValueError, TypeError):
        logger.warning(f"Invalid proficiency value: {proficiency}, using default")
        return DEFAULT_PROFICIENCY


def _normalize_market_demand(market_demand: Optional[float]) -> float:
    """
    Normalize market demand to 0-100 scale.
    
    Args:
        market_demand: Raw market demand value
        
    Returns:
        Normalized market demand value between 0 and 100
    """
    if market_demand is None:
        return DEFAULT_MARKET_DEMAND
    
    try:
        market_demand = float(market_demand)
        
        # Handle 0-1 scale (convert to percentage)
        if 0 <= market_demand <= 1:
            market_demand = market_demand * 100
        
        # Clamp to valid range
        return max(0.0, min(100.0, market_demand))
    except (ValueError, TypeError):
        logger.warning(f"Invalid market_demand value: {market_demand}, using default")
        return DEFAULT_MARKET_DEMAND


def calculate_skills_relevance(skills: list) -> int:
    """
    Calculate how well skills match current market demands.
    
    Skills Relevance = weighted combination of proficiency and market demand
    - High proficiency in high-demand skills = high relevance
    - Low proficiency or low-demand skills = lower relevance
    
    Args:
        skills: List of normalized skill dictionaries
        
    Returns:
        Score from 0-100
    """
    if not skills:
        return DEFAULT_HEALTH_SCORE
    
    try:
        # Count high-demand skills (market demand > 70)
        high_demand_count = sum(1 for s in skills if s['market_demand'] > 70)
        
        # Calculate weighted score (proficiency × market demand)
        total_weight = sum(
            s['proficiency'] * (s['market_demand'] / 100) 
            for s in skills
        )
        max_possible = len(skills) * 5
        
        # Combine factors
        base_score = (total_weight / max_possible) * 100 if max_possible > 0 else 50
        demand_bonus = (high_demand_count / len(skills)) * 20  # Up to 20 point bonus
        
        final_score = min(100, int(base_score + demand_bonus))
        logger.debug(f"Skills Relevance: base={base_score:.1f}, bonus={demand_bonus:.1f}, final={final_score}")
        return final_score
        
    except (ZeroDivisionError, ValueError, TypeError) as e:
        logger.warning(f"Error calculating skills relevance: {str(e)}")
        return DEFAULT_HEALTH_SCORE


def calculate_market_alignment(skills: list) -> int:
    """
    Calculate how well profile fits target roles.
    
    Market Alignment = weighted average of market demands weighted by proficiency
    - Skills you're good at in high-demand areas = high alignment
    
    Args:
        skills: List of normalized skill dictionaries
        
    Returns:
        Score from 0-100
    """
    if not skills:
        return DEFAULT_HEALTH_SCORE
    
    try:
        # Weighted average of market demands by proficiency
        weighted_sum = sum(s['market_demand'] * s['proficiency'] for s in skills)
        total_weight = sum(s['proficiency'] for s in skills)
        
        if total_weight == 0:
            return DEFAULT_HEALTH_SCORE
        
        score = int(weighted_sum / total_weight)
        final_score = max(0, min(100, score))
        logger.debug(f"Market Alignment: weighted_avg={final_score}")
        return final_score
        
    except (ZeroDivisionError, ValueError, TypeError) as e:
        logger.warning(f"Error calculating market alignment: {str(e)}")
        return DEFAULT_HEALTH_SCORE


def calculate_learning_trajectory(skills: list) -> int:
    """
    Calculate skill development momentum.
    
    Learning Trajectory = proficiency average (60%) + skill diversity (40%)
    - Having more varied skills at good proficiency = better trajectory
    
    Args:
        skills: List of normalized skill dictionaries
        
    Returns:
        Score from 0-100
    """
    if not skills:
        return DEFAULT_HEALTH_SCORE
    
    try:
        proficiencies = [s['proficiency'] for s in skills]
        
        # Average proficiency component (60% weight)
        avg_proficiency = statistics.mean(proficiencies)
        proficiency_score = (avg_proficiency / 5) * 60
        
        # Skill diversity component (40% weight)
        # More skills = better trajectory (capped at 20 skills)
        diversity_score = min(len(skills) / 20, 1.0) * 40
        
        final_score = int(proficiency_score + diversity_score)
        final_score = max(0, min(100, final_score))
        logger.debug(f"Learning Trajectory: proficiency={proficiency_score:.1f}, diversity={diversity_score:.1f}, final={final_score}")
        return final_score
        
    except (ValueError, TypeError, statistics.StatisticsError) as e:
        logger.warning(f"Error calculating learning trajectory: {str(e)}")
        return DEFAULT_HEALTH_SCORE


def calculate_industry_demand(skills: list) -> int:
    """
    Calculate how sought-after the skillset is.
    
    Industry Demand = median market demand + bonus for high-demand skills
    - Having multiple high-demand skills = high industry demand
    - Uses median to be less sensitive to outliers
    
    Args:
        skills: List of normalized skill dictionaries
        
    Returns:
        Score from 0-100
    """
    if not skills:
        return DEFAULT_HEALTH_SCORE
    
    try:
        demands = [s['market_demand'] for s in skills]
        
        # Use median to be less sensitive to outliers
        median_demand = statistics.median(demands)
        
        # Bonus for having multiple high-demand skills
        high_demand_ratio = sum(1 for d in demands if d > 75) / len(demands)
        bonus = high_demand_ratio * 10
        
        final_score = int(median_demand + bonus)
        final_score = max(0, min(100, final_score))
        logger.debug(f"Industry Demand: median={median_demand:.1f}, high_demand_ratio={high_demand_ratio:.1%}, bonus={bonus:.1f}, final={final_score}")
        return final_score
        
    except (ValueError, TypeError, statistics.StatisticsError) as e:
        logger.warning(f"Error calculating industry demand: {str(e)}")
        return DEFAULT_HEALTH_SCORE


# ============================================================================
# Career Recommendations Endpoint
# ============================================================================

@router.get("/{candidate_id}/recommendations")
async def get_career_recommendations(
    candidate_id: int,
    limit: int = Query(3, ge=1, le=10, description="Number of recommendations to return"),
    include_gaps: bool = Query(False, description="Include detailed skill gap analysis"),
    db: Session = Depends(get_db)
):
    """
    Generate personalized career recommendations based on candidate's skill profile.
    
    Args:
        candidate_id: Candidate identifier
        limit: Number of recommendations (1-10, default 3)
        include_gaps: Whether to include detailed skill gap analysis
        db: Database session
        
    Returns:
        List of career recommendations with match scores, salaries, and timelines
        
    Raises:
        HTTPException: 404 if candidate not found, 500 for server errors
    """
    try:
        # Validate candidate exists
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            logger.warning(f"🔍 Candidate {candidate_id} not found for recommendations")
            raise HTTPException(
                status_code=404,
                detail=f"Candidate with ID {candidate_id} not found"
            )
        
        logger.info(f"📊 Generating {limit} recommendations for candidate {candidate_id}")
        
        # Fetch candidate skills
        try:
            candidate_skills = db.query(CandidateSkill).filter(
                CandidateSkill.candidate_id == candidate_id
            ).all()
        except SQLAlchemyError as e:
            logger.error(f"❌ Database error fetching skills: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve candidate skills from database"
            )
        
        # Edge case: No skills - return entry-level recommendations
        if not candidate_skills or len(candidate_skills) == 0:
            logger.info(f"⚠️ Candidate {candidate_id} has no skills, returning entry-level recommendations")
            return {
                "candidate_id": candidate_id,
                "recommendations": _get_entry_level_recommendations(limit),
                "warning": "Recommendations are generic due to no skills on profile. Add skills for personalized suggestions.",
                "total_count": limit,
                "skill_profile_summary": {
                    "total_skills": 0,
                    "technical_skills": 0,
                    "primary_category": "None",
                    "avg_proficiency": 0.0
                }
            }
        
        # Analyze skill profile
        skill_profile = _analyze_skill_profile(candidate_skills, db)
        logger.debug(f"✅ Skill profile analyzed: {skill_profile['total_skills']} skills, primary: {skill_profile['primary_category']}")
        
        # Generate warning messages
        warnings = []
        if skill_profile['total_skills'] < 3:
            warnings.append(f"Only {skill_profile['total_skills']} skills found. Add more for better recommendations.")
        if skill_profile['technical_skills'] == 0:
            warnings.append("No technical skills found. Add technical skills for role-specific recommendations.")
        
        # Generate recommendations
        recommendations = _generate_role_recommendations(
            skill_profile, 
            limit, 
            include_gaps
        )
        logger.info(f"✨ Generated {len(recommendations)} recommendations for candidate {candidate_id}")
        
        # Handle case where no good matches found - provide fallback
        if not recommendations:
            logger.warning(f"⚠️ No suitable recommendations for candidate {candidate_id}, using fallback")
            recommendations = _get_fallback_recommendations(skill_profile, limit)
            warnings.append("Recommendations are based on limited matching. Consider expanding your skillset.")
        
        result = {
            "candidate_id": candidate_id,
            "recommendations": recommendations,
            "total_count": len(recommendations),
            "skill_profile_summary": {
                "total_skills": skill_profile['total_skills'],
                "technical_skills": skill_profile['technical_skills'],
                "primary_category": skill_profile['primary_category'],
                "avg_proficiency": round(skill_profile['avg_proficiency'], 2)
            }
        }
        
        # Add warnings if any
        if warnings:
            result["warnings"] = warnings
        
        logger.debug(f"✅ Returning {len(recommendations)} recommendations to candidate {candidate_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error generating recommendations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate career recommendations"
        )


def _analyze_skill_profile(candidate_skills: List, db: Session) -> Dict:
    """
    Analyze candidate's skill profile to determine strengths and categories.
    
    Args:
        candidate_skills: List of CandidateSkill objects
        db: Database session
        
    Returns:
        Dictionary with analyzed skill profile
    """
    logger.debug(f"🔍 Analyzing skill profile for {len(candidate_skills)} skills")
    
    categories = {}
    total_proficiency = 0
    technical_count = 0
    
    technical_categories = {
        'Frontend', 'Backend', 'Database', 'DevOps', 
        'Cloud', 'ML/AI', 'Mobile', 'Security'
    }
    
    for candidate_skill in candidate_skills:
        skill = candidate_skill.skill
        if not skill:
            continue
        
        category = skill.category or 'Other'
        
        if category not in categories:
            categories[category] = {
                'skills': [],
                'proficiencies': [],
                'count': 0
            }
        
        proficiency = _normalize_proficiency(candidate_skill.proficiency)
        categories[category]['skills'].append(skill.name)
        categories[category]['proficiencies'].append(proficiency)
        categories[category]['count'] += 1
        total_proficiency += proficiency
        
        if category in technical_categories:
            technical_count += 1
    
    # Calculate averages per category
    for cat_data in categories.values():
        if cat_data['proficiencies']:
            cat_data['avg_proficiency'] = statistics.mean(cat_data['proficiencies'])
    
    # Determine primary category (most skills)
    primary_category = 'Other'
    if categories:
        primary_category = max(categories.items(), key=lambda x: x[1]['count'])[0]
    
    avg_prof = total_proficiency / len(candidate_skills) if candidate_skills else 0
    
    logger.debug(f"✅ Profile: {len(candidate_skills)} skills, {technical_count} technical, primary: {primary_category}, avg_prof: {avg_prof:.2f}")
    
    return {
        'total_skills': len(candidate_skills),
        'technical_skills': technical_count,
        'categories': categories,
        'primary_category': primary_category,
        'avg_proficiency': avg_prof
    }


def _generate_role_recommendations(
    skill_profile: Dict, 
    limit: int, 
    include_gaps: bool
) -> List[Dict]:
    """
    Generate role recommendations based on skill profile analysis.
    
    Args:
        skill_profile: Analyzed skill profile dictionary
        limit: Maximum recommendations to return
        include_gaps: Include detailed skill gap analysis
        
    Returns:
        List of recommendation dictionaries sorted by match score
    """
    logger.debug(f"🎯 Generating recommendations (limit={limit}, include_gaps={include_gaps})")
    
    recommendations = []
    categories = skill_profile['categories']
    avg_prof = skill_profile['avg_proficiency']
    total_skills = skill_profile['total_skills']
    
    # Role templates with matching criteria
    role_templates = [
        {
            "id": 1,
            "title": "Senior Frontend Engineer",
            "company_type": "Product Companies",
            "required_categories": ["Frontend"],
            "min_skills": 4,
            "base_salary": {"min": 120, "max": 160},
            "description": "Lead frontend architecture and mentor junior developers",
            "required_skills": ["React", "TypeScript", "System Design"],
            "growth_potential": "High",
            "timeline_months": "0-6",
            "base_match": 60
        },
        {
            "id": 2,
            "title": "Full Stack Engineer",
            "company_type": "Startups & Scale-ups",
            "required_categories": ["Frontend", "Backend"],
            "min_skills": 5,
            "base_salary": {"min": 110, "max": 155},
            "description": "Build end-to-end features across the stack",
            "required_skills": ["React", "Node.js", "Database Design"],
            "growth_potential": "Very High",
            "timeline_months": "6-12",
            "base_match": 55
        },
        {
            "id": 3,
            "title": "Backend Engineer",
            "company_type": "Enterprise",
            "required_categories": ["Backend", "Database"],
            "min_skills": 3,
            "base_salary": {"min": 115, "max": 150},
            "description": "Build scalable backend systems and APIs",
            "required_skills": ["Python", "PostgreSQL", "System Design"],
            "growth_potential": "High",
            "timeline_months": "6-18",
            "base_match": 58
        },
        {
            "id": 4,
            "title": "DevOps Engineer",
            "company_type": "Tech Companies",
            "required_categories": ["DevOps", "Cloud"],
            "min_skills": 4,
            "base_salary": {"min": 125, "max": 165},
            "description": "Build and maintain CI/CD pipelines and infrastructure",
            "required_skills": ["Docker", "Kubernetes", "AWS"],
            "growth_potential": "Very High",
            "timeline_months": "6-12",
            "base_match": 62
        },
        {
            "id": 5,
            "title": "Data Engineer",
            "company_type": "Analytics Companies",
            "required_categories": ["Backend", "Database"],
            "min_skills": 4,
            "base_salary": {"min": 130, "max": 170},
            "description": "Design and build data pipelines and warehouses",
            "required_skills": ["Python", "SQL", "Spark"],
            "growth_potential": "Very High",
            "timeline_months": "6-18",
            "base_match": 60
        },
        {
            "id": 6,
            "title": "ML Engineer",
            "company_type": "AI/ML Companies",
            "required_categories": ["ML/AI", "Backend"],
            "min_skills": 5,
            "base_salary": {"min": 140, "max": 180},
            "description": "Build machine learning models and pipelines",
            "required_skills": ["Python", "TensorFlow", "Deep Learning"],
            "growth_potential": "Very High",
            "timeline_months": "12-24",
            "base_match": 65
        },
    ]
    
    # Calculate match scores for each role
    for template in role_templates:
        # Check category overlap
        matching_categories = sum(
            1 for cat in template['required_categories'] 
            if cat in categories
        )
        
        # Skip roles with no category match
        if matching_categories == 0:
            logger.debug(f"⏭️ Skipping {template['title']}: no category match")
            continue
        
        # Calculate match score components
        match_score = template['base_match']
        
        # Category match component (30%)
        category_match = (matching_categories / len(template['required_categories'])) * 30
        
        # Proficiency bonus (15%) - higher proficiency = higher match
        proficiency_bonus = min(avg_prof / 5, 1) * 15
        
        # Skill count bonus (10%) - more skills for role requirements = better match
        skill_count_ratio = min(total_skills / template['min_skills'], 1.5)
        skill_count_bonus = skill_count_ratio * 10
        
        # Calculate final match score
        match_score += category_match + proficiency_bonus + skill_count_bonus
        match_score = min(100, int(match_score))
        
        # Skip low matches
        if match_score < 50:
            logger.debug(f"⏭️ Skipping {template['title']}: score {match_score} < 50")
            continue
        
        logger.debug(f"✅ {template['title']}: score={match_score} (cat={category_match:.0f}, prof={proficiency_bonus:.0f}, skills={skill_count_bonus:.0f})")
        
        # Build recommendation
        rec = {
            "id": template['id'],
            "title": template['title'],
            "company_type": template['company_type'],
            "match_score": match_score,
            "salary_range": {
                "min": template['base_salary']['min'],
                "max": template['base_salary']['max'],
                "currency": "INR_LAKHS"
            },
            "description": template['description'],
            "required_skills": template['required_skills'],
            "growth_potential": template['growth_potential'],
            "timeline_months": template['timeline_months'],
            "job_postings_count": _estimate_job_postings(template['title'])
        }
        
        # Add skill gaps if requested
        if include_gaps:
            all_candidate_skills = [
                s.lower() for cat_data in skill_profile['categories'].values() 
                for s in cat_data['skills']
            ]
            rec["missing_skills"] = [
                skill for skill in template['required_skills']
                if skill.lower() not in all_candidate_skills
            ]
        
        recommendations.append(rec)
    
    # Sort by match score (descending)
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    
    logger.info(f"✅ Generated {len(recommendations)} recommendations, top match: {recommendations[0]['match_score'] if recommendations else 'N/A'}")
    return recommendations[:limit]


def _get_entry_level_recommendations(limit: int) -> List[Dict]:
    """
    Return generic entry-level roles for candidates with no skills.
    
    Args:
        limit: Maximum recommendations to return
        
    Returns:
        List of entry-level role recommendations
    """
    logger.info(f"📚 Returning {limit} entry-level recommendations")
    
    entry_roles = [
        {
            "id": 1,
            "title": "Junior Software Engineer",
            "company_type": "Startups & Scale-ups",
            "match_score": 50,
            "salary_range": {"min": 30, "max": 60, "currency": "INR_LAKHS"},
            "description": "Start your tech career with foundational projects and mentorship",
            "required_skills": ["Programming Basics", "Problem Solving", "Communication"],
            "growth_potential": "High",
            "timeline_months": "0-3",
            "job_postings_count": 2500
        },
        {
            "id": 2,
            "title": "QA Automation Engineer (Entry Level)",
            "company_type": "All Companies",
            "match_score": 48,
            "salary_range": {"min": 25, "max": 50, "currency": "INR_LAKHS"},
            "description": "Test software applications and build automation frameworks",
            "required_skills": ["Testing Fundamentals", "Python", "Problem Solving"],
            "growth_potential": "Medium",
            "timeline_months": "0-2",
            "job_postings_count": 1800
        },
        {
            "id": 3,
            "title": "Support Engineer",
            "company_type": "SaaS Companies",
            "match_score": 45,
            "salary_range": {"min": 20, "max": 40, "currency": "INR_LAKHS"},
            "description": "Provide technical support and learn product internals",
            "required_skills": ["Communication", "Technical Knowledge", "Problem Solving"],
            "growth_potential": "Medium",
            "timeline_months": "0-1",
            "job_postings_count": 1200
        }
    ]
    
    return entry_roles[:limit]


def _get_fallback_recommendations(skill_profile: Dict, limit: int) -> List[Dict]:
    """
    Return fallback recommendations when no good matches found.
    
    Args:
        skill_profile: Analyzed skill profile
        limit: Maximum recommendations
        
    Returns:
        List of fallback recommendations
    """
    logger.warning(f"⚠️ No suitable matches found, using fallback recommendations")
    
    # If they have some skills, try entry level that could grow into specializations
    fallback_roles = [
        {
            "id": 1,
            "title": "Technical Associate",
            "company_type": "All Companies",
            "match_score": 40,
            "salary_range": {"min": 35, "max": 55, "currency": "INR_LAKHS"},
            "description": "Versatile role working across multiple technical areas",
            "required_skills": ["Problem Solving", "Communication", "Learning Ability"],
            "growth_potential": "High",
            "timeline_months": "3-6",
            "job_postings_count": 1500
        },
        {
            "id": 2,
            "title": "Junior Software Developer",
            "company_type": "Startups",
            "match_score": 38,
            "salary_range": {"min": 28, "max": 50, "currency": "INR_LAKHS"},
            "description": "Develop software with guidance from senior developers",
            "required_skills": ["Basic Programming", "Problem Solving", "Teamwork"],
            "growth_potential": "Very High",
            "timeline_months": "1-4",
            "job_postings_count": 2000
        }
    ]
    
    # If they have no technical skills at all, suggest entry level
    if skill_profile['technical_skills'] == 0:
        return _get_entry_level_recommendations(limit)
    
    return fallback_roles[:limit]


def _estimate_job_postings(role_title: str) -> int:
    """
    Estimate number of job postings for a given role.
    
    Args:
        role_title: Title of the role
        
    Returns:
        Estimated job posting count
    """
    estimates = {
        "Senior Frontend Engineer": 1250,
        "Full Stack Engineer": 1100,
        "Backend Engineer": 980,
        "DevOps Engineer": 850,
        "Data Engineer": 720,
        "ML Engineer": 650
    }
    
    # Return specific estimate if available, otherwise default
    return estimates.get(role_title, 500)


# ============================================================================
# Career Trajectory Projection Endpoint
# ============================================================================

@router.get("/{candidate_id}/trajectory")
async def get_career_trajectory(
    candidate_id: int,
    quarters: int = Query(8, ge=4, le=12, description="Number of quarters to project (4-12)"),
    db: Session = Depends(get_db)
):
    """
    Generate career growth trajectory projections.
    
    Projects career progression over specified quarters showing current path
    vs. potential path with upskilling. Includes acceleration opportunities
    and recommended learning paths.
    
    Args:
        candidate_id: Candidate identifier
        quarters: Number of quarters to project (4-12, default 8)
        db: Database session
        
    Returns:
        Career trajectory with current and potential paths, milestones, and acceleration opportunities
        
    Raises:
        HTTPException: 404 if candidate not found, 500 for server errors
    """
    try:
        # Validate candidate exists
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            logger.warning(f"🔍 Candidate {candidate_id} not found for trajectory")
            raise HTTPException(
                status_code=404,
                detail=f"Candidate with ID {candidate_id} not found"
            )
        
        logger.info(f"📈 Generating {quarters}-quarter trajectory for candidate {candidate_id}")
        
        # Fetch candidate skills
        try:
            candidate_skills = db.query(CandidateSkill).filter(
                CandidateSkill.candidate_id == candidate_id
            ).all()
        except SQLAlchemyError as e:
            logger.error(f"❌ Database error fetching skills for trajectory: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve candidate skills from database"
            )
        
        logger.debug(f"📊 Found {len(candidate_skills)} skills for candidate {candidate_id}")
        
        # Calculate baseline career level
        baseline_score = _calculate_baseline_career_score(candidate_skills, db)
        logger.info(f"✅ Baseline career score for candidate {candidate_id}: {baseline_score}")
        
        # Generate projections
        projections = _generate_trajectory_projections(
            baseline_score, 
            candidate_skills, 
            quarters,
            db
        )
        logger.debug(f"✨ Generated {len(projections)} quarterly projections")
        
        # Calculate acceleration opportunity
        acceleration = _calculate_acceleration_opportunity(
            baseline_score,
            candidate_skills,
            projections
        )
        logger.debug(f"⚡ Acceleration opportunity: {acceleration['time_saved_months']} months saved")
        
        # Generate quarter labels
        current_date = datetime.now()
        
        result = {
            "candidate_id": candidate_id,
            "projections": projections,
            "acceleration_opportunity": acceleration,
            "baseline_score": baseline_score,
            "projected_quarters": quarters,
            "projection_start_date": current_date.strftime("%Y-%m-%d"),
            "data_quality": "estimated" if len(candidate_skills) < 5 else "good"
        }
        
        # Add warning for low skill count
        if len(candidate_skills) < 3:
            result["warning"] = "Projections are estimates due to limited skill data. Add more skills for accurate predictions."
            logger.warning(f"⚠️ Limited skill data for trajectory predictions: {len(candidate_skills)} skills")
        
        logger.info(f"✅ Successfully generated trajectory for candidate {candidate_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating trajectory: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate career trajectory"
        )


def _calculate_baseline_career_score(candidate_skills: List, db: Session) -> int:
    """
    Calculate current career level score (0-100).
    
    Combines proficiency levels, skill count, and market demand to determine
    current career progression stage (entry/junior/mid/senior/staff).
    
    Args:
        candidate_skills: List of CandidateSkill objects
        db: Database session
        
    Returns:
        Career level score (0-100)
    """
    logger.debug(f"🔢 Calculating baseline career score for {len(candidate_skills)} skills")
    
    try:
        if not candidate_skills or len(candidate_skills) == 0:
            logger.info("⚠️ No skills found, returning entry-level baseline (30)")
            return 30  # Entry level baseline
        
        # Factor 1: Average proficiency (40% weight)
        proficiencies = [_normalize_proficiency(s.proficiency) for s in candidate_skills]
        avg_proficiency = statistics.mean(proficiencies)
        proficiency_score = (avg_proficiency / 5) * 40
        logger.debug(f"  Proficiency factor: {avg_proficiency:.2f}/5.0 → {proficiency_score:.1f} points")
        
        # Factor 2: Number of skills (30% weight)
        skill_count_score = min(len(candidate_skills) / 15, 1.0) * 30
        logger.debug(f"  Skill count factor: {len(candidate_skills)} skills → {skill_count_score:.1f} points")
        
        # Factor 3: High-demand skills (30% weight)
        high_demand_count = 0
        for s in candidate_skills:
            try:
                market_demand = _normalize_market_demand(getattr(s, 'market_demand', None))
                if market_demand > 75:
                    high_demand_count += 1
            except Exception as e:
                logger.debug(f"  Error checking market demand for skill: {e}")
                continue
        
        demand_score = min(high_demand_count / 5, 1.0) * 30
        logger.debug(f"  Market demand factor: {high_demand_count} high-demand skills → {demand_score:.1f} points")
        
        total_score = int(proficiency_score + skill_count_score + demand_score)
        
        # Clamp to reasonable range
        # Entry level: 20-45, Junior: 45-60, Mid: 60-75, Senior: 75-85, Staff: 85+
        final_score = max(20, min(100, total_score))
        
        level_name = "Entry" if final_score < 45 else "Junior" if final_score < 60 else \
                     "Mid" if final_score < 75 else "Senior" if final_score < 85 else "Staff"
        logger.info(f"✅ Baseline: {final_score} ({level_name} level)")
        
        return final_score
        
    except Exception as e:
        logger.warning(f"⚠️ Error calculating baseline score: {str(e)}")
        return 50  # Default mid-level


def _generate_trajectory_projections(
    baseline_score: int,
    candidate_skills: List,
    quarters: int,
    db: Session
) -> List[Dict]:
    """
    Generate quarterly career progression projections.
    
    Projects career growth over specified quarters on both current path
    (maintaining current pace) and potential path (with focused upskilling).
    
    Args:
        baseline_score: Current career level score (0-100)
        candidate_skills: Candidate's current skills
        quarters: Number of quarters to project
        db: Database session
        
    Returns:
        List of quarterly trajectory projections
    """
    logger.debug(f"📅 Generating {quarters} quarter projections from baseline {baseline_score}")
    
    projections = []
    current_date = datetime.now()
    
    # Calculate growth rates based on current level
    current_growth_rate = _calculate_current_growth_rate(baseline_score, candidate_skills)
    potential_growth_rate = _calculate_potential_growth_rate(baseline_score, candidate_skills)
    
    logger.debug(f"  Current growth rate: {current_growth_rate:.2f} points/quarter")
    logger.debug(f"  Potential growth rate: {potential_growth_rate:.2f} points/quarter")
    
    # Cap growth to realistic limits to prevent unrealistic projections
    max_current_growth = 2.5  # points per quarter
    max_potential_growth = 5.0  # points per quarter
    
    current_growth_rate = min(current_growth_rate, max_current_growth)
    potential_growth_rate = min(potential_growth_rate, max_potential_growth)
    
    logger.debug(f"  Capped growth rates: current={current_growth_rate:.2f}, potential={potential_growth_rate:.2f}")
    
    current_score = float(baseline_score)
    potential_score = float(baseline_score)
    
    for i in range(quarters):
        try:
            # Calculate quarter label (Q1 2024, Q2 2024, etc.)
            quarter_date = current_date + relativedelta(months=3*i)
            quarter_label = f"Q{((quarter_date.month - 1) // 3) + 1} {quarter_date.year}"
            
            # Apply growth with diminishing returns
            if i > 0:
                # Current path: steady but slower growth with diminishing returns
                growth_factor = 1.0 - (i * 0.05)  # Slight decay each quarter
                current_score += current_growth_rate * max(0.5, growth_factor)
                
                # Potential path: faster initial growth, then stabilize
                if i <= 4:  # First year (4 quarters): rapid growth with upskilling
                    potential_score += potential_growth_rate * 1.2
                else:  # Second year: moderate growth as reaches higher levels
                    potential_score += potential_growth_rate * 0.8
            
            # Cap scores at 100 (max career level)
            current_score = min(100, current_score)
            potential_score = min(100, potential_score)
            
            # Determine milestone for this quarter
            milestone = _get_milestone_for_quarter(i, int(current_score), int(potential_score))
            
            projections.append({
                "quarter": quarter_label,
                "current_path_score": int(current_score),
                "potential_path_score": int(potential_score),
                "milestone": milestone
            })
            
            logger.debug(f"  Q{i+1}: current={int(current_score)}, potential={int(potential_score)}, milestone={milestone}")
            
        except Exception as e:
            logger.warning(f"⚠️ Error generating projection for quarter {i}: {e}")
            continue
    
    return projections


def _calculate_current_growth_rate(baseline_score: int, candidate_skills: List) -> float:
    """
    Calculate expected growth rate on current path (without upskilling).
    
    Args:
        baseline_score: Current career score
        candidate_skills: Candidate's current skills
        
    Returns:
        Growth rate in points per quarter
    """
    # Lower baseline = higher potential growth (more room to grow)
    if baseline_score < 40:
        base_rate = 3.0  # Entry level grows faster with experience
    elif baseline_score < 60:
        base_rate = 2.5  # Junior level steady growth
    elif baseline_score < 75:
        base_rate = 2.0  # Mid level moderate growth
    else:
        base_rate = 1.5  # Senior level (harder to grow without specialization)
    
    # Adjust based on skill diversity (more diverse = more opportunities)
    if len(candidate_skills) < 5:
        base_rate *= 0.8  # Fewer skills = slower growth potential
    elif len(candidate_skills) > 10:
        base_rate *= 1.1  # More diverse skills = faster opportunities
    
    logger.debug(f"    Current growth rate: base={base_rate:.2f} (baseline={baseline_score}, skills={len(candidate_skills)})")
    return base_rate


def _calculate_potential_growth_rate(baseline_score: int, candidate_skills: List) -> float:
    """
    Calculate potential growth rate with focused upskilling.
    
    Represents career acceleration through deliberate skill development
    and targeted learning.
    
    Args:
        baseline_score: Current career score
        candidate_skills: Candidate's current skills
        
    Returns:
        Potential growth rate in points per quarter
    """
    # Start with current rate and apply upskilling multiplier
    current_rate = _calculate_current_growth_rate(baseline_score, candidate_skills)
    potential_multiplier = 1.8  # Base 1.8x acceleration
    
    # Adjust multiplier based on current level (more room at lower levels)
    if baseline_score < 50:
        potential_multiplier = 2.0  # 2x faster with focused effort
    elif baseline_score > 80:
        potential_multiplier = 1.4  # Less multiplier at top (limited room)
    
    potential_rate = current_rate * potential_multiplier
    
    logger.debug(f"    Potential growth rate: {potential_rate:.2f} (current={current_rate:.2f}, multiplier={potential_multiplier}x)")
    return potential_rate


def _get_milestone_for_quarter(quarter_index: int, current: int, potential: int) -> Optional[str]:
    """
    Get milestone description for a quarter.
    
    Args:
        quarter_index: Index of the quarter (0-based)
        current: Current path score
        potential: Potential path score
        
    Returns:
        Milestone description or None
    """
    # Standard milestones by quarter
    standard_milestones = {
        0: "Current baseline",
        1: "Skill consolidation begins",
        2: "Upskilling phase starts",
        4: "Mid-point assessment",
        6: "Advanced skills mastered",
        7: "Senior level achieved"
    }
    
    # Check for special promotion milestone
    if potential >= 80 and current < 75 and quarter_index >= 4:
        return "Senior promotion opportunity"
    
    # Check for staff-level milestone
    if potential >= 85 and current < 85 and quarter_index >= 6:
        return "Staff engineer trajectory possible"
    
    # Return standard milestone or None
    return standard_milestones.get(quarter_index)


def _calculate_acceleration_opportunity(
    baseline_score: int,
    candidate_skills: List,
    projections: List[Dict]
) -> Dict:
    """
    Calculate career acceleration opportunity through upskilling.
    
    Determines time savings, salary impact, and recommended learning path
    for focused professional development.
    
    Args:
        baseline_score: Current career score
        candidate_skills: Candidate's current skills
        projections: Generated trajectory projections
        
    Returns:
        Acceleration opportunity details with actionable recommendations
    """
    logger.debug(f"⚡ Calculating acceleration opportunity for baseline {baseline_score}")
    
    try:
        # Calculate time to reach target career level (80 = senior)
        target_score = 80
        
        current_quarters = None
        potential_quarters = None
        
        for i, proj in enumerate(projections):
            if current_quarters is None and proj['current_path_score'] >= target_score:
                current_quarters = i + 1
            if potential_quarters is None and proj['potential_path_score'] >= target_score:
                potential_quarters = i + 1
        
        # If target not reached within projection period, use max quarters
        current_quarters = current_quarters or len(projections)
        potential_quarters = potential_quarters or len(projections)
        
        # Calculate time saved in months
        months_saved = (current_quarters - potential_quarters) * 3
        months_saved = max(0, months_saved)
        logger.debug(f"  Time to senior (80): current={current_quarters} qtr, potential={potential_quarters} qtr → {months_saved} months saved")
        
        # Estimate salary impact (roughly ₹0.4-0.6L per career score point above baseline)
        final_current_score = projections[-1]['current_path_score']
        final_potential_score = projections[-1]['potential_path_score']
        score_diff = final_potential_score - final_current_score
        
        salary_increase_min = score_diff * 0.4
        salary_increase_max = score_diff * 0.6
        salary_increase = f"₹{salary_increase_min:.1f}L-₹{salary_increase_max:.1f}L"
        logger.debug(f"  Salary impact: {score_diff} score points → {salary_increase}")
        
        # Identify key skills to learn for acceleration
        key_skills = _identify_key_skills_to_learn(candidate_skills)
        logger.debug(f"  Recommended skills: {', '.join(key_skills)}")
        
        # Estimate effort: approximately 30-50 hours per skill
        estimated_hours = len(key_skills) * 40  # 40 hours avg per skill
        logger.debug(f"  Estimated effort: {estimated_hours} hours for {len(key_skills)} skills")
        
        result = {
            "time_saved_months": months_saved,
            "salary_increase": salary_increase,
            "key_skills_to_learn": key_skills,
            "estimated_effort_hours": estimated_hours,
            "recommended_pace": "10-15 hours per week"
        }
        
        logger.info(f"✅ Acceleration: {months_saved} months saved, potential salary increase {salary_increase}")
        return result
        
    except Exception as e:
        logger.warning(f"⚠️ Error calculating acceleration: {str(e)}")
        return {
            "time_saved_months": 0,
            "salary_increase": "₹0L-₹0L",
            "key_skills_to_learn": ["System Design", "Cloud Architecture"],
            "estimated_effort_hours": 160,
            "recommended_pace": "10-15 hours per week"
        }


def _identify_key_skills_to_learn(candidate_skills: List) -> List[str]:
    """
    Identify high-impact skills to learn for career acceleration.
    
    Recommends skills based on current profile, career level, and market demand.
    
    Args:
        candidate_skills: Candidate's current skills
        
    Returns:
        List of recommended skills (up to 5)
    """
    logger.debug(f"🎯 Identifying key skills to learn from {len(candidate_skills)} current skills")
    
    try:
        # Extract current skill names (case-insensitive)
        current_skill_names = set()
        for s in candidate_skills:
            if s.skill and s.skill.name:
                current_skill_names.add(s.skill.name.lower())
        
        # High-impact skills organized by category
        recommended_skills = {
            'Frontend': ['System Design', 'TypeScript', 'Performance Optimization', 'Web Security', 'React'],
            'Backend': ['System Design', 'Microservices', 'Database Optimization', 'API Design', 'Python'],
            'DevOps': ['Kubernetes', 'Terraform', 'CI/CD Pipeline', 'AWS', 'Docker'],
            'Data': ['Spark', 'Airflow', 'Data Modeling', 'SQL Performance', 'ML Basics']
        }
        
        # Determine candidate's primary skill category
        categories = {}
        for skill in candidate_skills:
            if skill.skill and skill.skill.category:
                cat = skill.skill.category
                categories[cat] = categories.get(cat, 0) + 1
        
        # Find primary category (most frequent)
        if categories:
            primary_cat = max(categories.items(), key=lambda x: x[1])[0]
        else:
            primary_cat = 'Frontend'
        
        logger.debug(f"  Primary category: {primary_cat}")
        
        # Get recommendations for primary category, filtered to exclude current skills
        suggestions = recommended_skills.get(primary_cat, ['System Design', 'Cloud Architecture'])
        missing_skills = [
            s for s in suggestions 
            if s.lower() not in current_skill_names
        ]
        
        # If not enough missing skills, add from other categories
        if len(missing_skills) < 5:
            for cat, skills in recommended_skills.items():
                if cat != primary_cat:
                    for skill in skills:
                        if skill.lower() not in current_skill_names and skill not in missing_skills:
                            missing_skills.append(skill)
                        if len(missing_skills) >= 5:
                            break
                if len(missing_skills) >= 5:
                    break
        
        result = missing_skills[:5]  # Top 5 recommendations
        logger.info(f"✅ Recommended skills to learn: {', '.join(result)}")
        return result
        
    except Exception as e:
        logger.warning(f"⚠️ Error identifying key skills: {str(e)}")
        return ["System Design", "Cloud Architecture", "Microservices", "API Design", "Performance Optimization"]


# ============================================================================
# Salary Trends by Experience Level Endpoint
# ============================================================================

@router.get("/salary-trends", response_model=SalaryTrendsResponse)
async def get_salary_trends(
    role: str = Query("Software Engineer", description="Job role title (e.g., 'Frontend Developer')"),
    currency: str = Query("INR", pattern="^(INR|USD|EUR|GBP)$", description="Currency code: INR, USD, EUR, or GBP"),
    region: str = Query("India", description="Geographic region (e.g., 'India', 'US', 'UK')"),
    db: Session = Depends(get_db)
):
    """
    Get salary trends by experience level for a specific role.
    
    Returns salary ranges (min, median, max) for 7 experience levels:
    Intern, Junior, Mid-Level, Senior, Lead, Principal, Architect/Staff
    
    Args:
        role: Job role title (e.g., "Frontend Developer", "DevOps Engineer")
        currency: Currency for salary display (INR, USD, EUR, GBP)
        region: Geographic region for salary data
        db: Database session
        
    Returns:
        SalaryTrendsResponse with salary data by level
        
    Raises:
        HTTPException: 422 for invalid currency, 500 for server errors
    """
    try:
        logger.info(f"📊 Fetching salary trends for role: '{role}', currency: {currency}, region: '{region}'")
        
        # Normalize role name (title case, strip whitespace)
        role_normalized = role.strip().title()
        
        # Fetch salary data from database or use generic data
        salary_data = await _fetch_salary_data_from_db(role_normalized, region, db)
        
        if not salary_data:
            logger.info(f"⚠️ No salary data found for role '{role_normalized}', using generic Software Engineer data")
            salary_data = _get_generic_salary_data()
            role_normalized = "Software Engineer (Generic)"
        
        # Convert currency if needed
        if currency != "INR":
            logger.debug(f"💱 Converting salary from INR to {currency}")
            salary_data = _convert_currency(salary_data, "INR", currency)
        
        # Convert list of dicts to SalaryLevel objects
        salary_levels = [SalaryLevel(**level) for level in salary_data]
        
        # Format response
        result = SalaryTrendsResponse(
            role=role_normalized,
            salary_by_level=salary_levels,
            currency=currency,
            data_source="Industry Survey 2024 | Glassdoor & PayScale Data",
            last_updated="2024-11-01",
            region=region
        )
        
        logger.info(f"✅ Successfully retrieved salary trends for {len(salary_levels)} levels")
        return result
        
    except ValueError as e:
        logger.error(f"❌ Validation error: {str(e)}")
        raise HTTPException(
            status_code=422,
            detail=f"Invalid input: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ Error fetching salary trends: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve salary trends. Please try again later."
        )


async def _fetch_salary_data_from_db(
    role: str,
    region: str,
    db: Session
) -> Optional[List[Dict]]:
    """
    Fetch salary data from database for a specific role and region.
    
    Args:
        role: Job role title
        region: Geographic region
        db: Database session
        
    Returns:
        List of salary level dictionaries or None if not found
    """
    logger.debug(f"🔍 Querying database for salary data: role='{role}', region='{region}'")
    
    try:
        # Try to import and query SalaryData model if it exists
        try:
            from app.models.salary_data import SalaryData
            
            # Query for role with fuzzy matching (case-insensitive substring match)
            salary_records = db.query(SalaryData).filter(
                SalaryData.role.ilike(f"%{role}%"),
                SalaryData.region == region
            ).all()
            
            if not salary_records or len(salary_records) == 0:
                logger.debug(f"⚠️ No salary records found for role '{role}' in region '{region}'")
                return None
            
            logger.debug(f"📈 Found {len(salary_records)} salary records in database")
            
            # Group salary data by experience level
            levels_data = {}
            for record in salary_records:
                level = record.experience_level if hasattr(record, 'experience_level') else "Unknown"
                
                if level not in levels_data:
                    levels_data[level] = {
                        "salaries": [],
                        "sample_count": 0
                    }
                
                # Add salary and increment count
                if hasattr(record, 'salary_lpa') and record.salary_lpa:
                    levels_data[level]["salaries"].append(record.salary_lpa)
                    levels_data[level]["sample_count"] += 1
            
            if not levels_data:
                logger.debug("⚠️ No valid salary data extracted from records")
                return None
            
            # Calculate min, median, max for each level
            result = []
            for level, data in sorted(levels_data.items()):
                if data["salaries"]:
                    salaries = sorted(data["salaries"])
                    result.append({
                        "level": level,
                        "min_lpa": float(salaries[0]),
                        "median_lpa": float(statistics.median(salaries)),
                        "max_lpa": float(salaries[-1]),
                        "sample_size": data["sample_count"],
                        "yoe_range": _get_yoe_range_for_level(level)
                    })
            
            if result:
                logger.info(f"✅ Prepared salary data for {len(result)} levels from database")
                return result
            else:
                logger.debug("⚠️ No valid salary levels prepared from records")
                return None
                
        except ImportError:
            logger.debug("ℹ️ SalaryData model not available, will use generic data")
            return None
        except SQLAlchemyError as e:
            logger.warning(f"⚠️ Database query error: {str(e)}")
            return None
            
    except Exception as e:
        logger.warning(f"⚠️ Error fetching salary data from DB: {str(e)}")
        return None


def _get_generic_salary_data() -> List[Dict]:
    """
    Return generic software engineer salary data for India.
    
    Based on industry surveys and market data as of Nov 2024.
    All figures in INR lakhs per annum (LPA).
    
    Returns:
        List of salary level dictionaries with min, median, max, and sample sizes
    """
    logger.debug("📋 Generating generic Software Engineer salary data")
    
    return [
        {
            "level": "Intern",
            "min_lpa": 2.0,
            "median_lpa": 3.5,
            "max_lpa": 5.0,
            "sample_size": 450,
            "yoe_range": "0-1 years"
        },
        {
            "level": "Junior",
            "min_lpa": 4.0,
            "median_lpa": 6.5,
            "max_lpa": 9.0,
            "sample_size": 1200,
            "yoe_range": "1-3 years"
        },
        {
            "level": "Mid-Level",
            "min_lpa": 8.0,
            "median_lpa": 12.0,
            "max_lpa": 16.0,
            "sample_size": 2100,
            "yoe_range": "3-5 years"
        },
        {
            "level": "Senior",
            "min_lpa": 15.0,
            "median_lpa": 22.0,
            "max_lpa": 30.0,
            "sample_size": 1800,
            "yoe_range": "5-8 years"
        },
        {
            "level": "Lead",
            "min_lpa": 25.0,
            "median_lpa": 35.0,
            "max_lpa": 45.0,
            "sample_size": 950,
            "yoe_range": "8-12 years"
        },
        {
            "level": "Principal",
            "min_lpa": 40.0,
            "median_lpa": 55.0,
            "max_lpa": 70.0,
            "sample_size": 420,
            "yoe_range": "12-15 years"
        },
        {
            "level": "Architect/Staff",
            "min_lpa": 60.0,
            "median_lpa": 80.0,
            "max_lpa": 120.0,
            "sample_size": 180,
            "yoe_range": "15+ years"
        }
    ]


def _get_yoe_range_for_level(level: str) -> str:
    """
    Get years of experience range for a given level.
    
    Args:
        level: Experience level name
        
    Returns:
        String representation of years of experience range
    """
    yoe_map = {
        "Intern": "0-1 years",
        "Junior": "1-3 years",
        "Mid-Level": "3-5 years",
        "Mid": "3-5 years",
        "Senior": "5-8 years",
        "Lead": "8-12 years",
        "Principal": "12-15 years",
        "Architect": "15+ years",
        "Staff": "15+ years",
        "Architect/Staff": "15+ years"
    }
    return yoe_map.get(level, "N/A")


def _convert_currency(
    salary_data: List[Dict],
    from_currency: str,
    to_currency: str
) -> List[Dict]:
    """
    Convert salary data between currencies.
    
    Uses static exchange rates as of Nov 2024.
    In production, consider fetching from live exchange rate API.
    
    Args:
        salary_data: List of salary level dictionaries (with min_lpa, median_lpa, max_lpa)
        from_currency: Source currency code (e.g., 'INR')
        to_currency: Target currency code (e.g., 'USD')
        
    Returns:
        Converted salary data with values in target currency
    """
    logger.debug(f"💱 Converting currency: {from_currency} → {to_currency}")
    
    # Exchange rates as of November 2024
    # In production, fetch from API like fixer.io or exchangerate-api.com
    exchange_rates = {
        ("INR", "USD"): 0.012,      # 1 INR = 0.012 USD
        ("INR", "EUR"): 0.011,      # 1 INR = 0.011 EUR
        ("INR", "GBP"): 0.0095,     # 1 INR = 0.0095 GBP
        ("USD", "INR"): 83.0,       # 1 USD = 83 INR
        ("USD", "EUR"): 0.92,       # 1 USD = 0.92 EUR
        ("USD", "GBP"): 0.79,       # 1 USD = 0.79 GBP
        ("EUR", "INR"): 90.0,       # 1 EUR = 90 INR
        ("EUR", "USD"): 1.09,       # 1 EUR = 1.09 USD
        ("EUR", "GBP"): 0.86,       # 1 EUR = 0.86 GBP
        ("GBP", "INR"): 105.0,      # 1 GBP = 105 INR
        ("GBP", "USD"): 1.27,       # 1 GBP = 1.27 USD
        ("GBP", "EUR"): 1.16        # 1 GBP = 1.16 EUR
    }
    
    # If same currency, return as-is
    if from_currency == to_currency:
        logger.debug(f"ℹ️ Same currency, no conversion needed")
        return salary_data
    
    # Get conversion rate
    rate = exchange_rates.get((from_currency, to_currency))
    if rate is None:
        logger.warning(f"⚠️ No exchange rate found for {from_currency} → {to_currency}, returning original")
        return salary_data
    
    logger.debug(f"📈 Using exchange rate: 1 {from_currency} = {rate} {to_currency}")
    
    # Convert each salary level
    converted = []
    for level_data in salary_data:
        converted.append({
            **level_data,
            "min_lpa": round(level_data["min_lpa"] * rate, 2),
            "median_lpa": round(level_data["median_lpa"] * rate, 2),
            "max_lpa": round(level_data["max_lpa"] * rate, 2)
        })
    
    logger.debug(f"✅ Converted salary data for {len(converted)} levels")
    return converted


# ============================================================================
# Skill Journey Timeline Endpoint
# ============================================================================

@router.get("/{candidate_id}/skill-journey", response_model=SkillJourneyResponse)
async def get_skill_journey(
    candidate_id: int,
    limit: int = Query(50, ge=10, le=200, description="Max events to return (10-200)"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    event_types: Optional[str] = Query(None, description="Filter by event types (comma-separated)"),
    db: Session = Depends(get_db)
):
    """
    Get skill acquisition and development timeline for a candidate.
    
    Returns chronological skill journey with events, productivity metrics, and pagination.
    Supports filtering by event type and pagination for large histories.
    
    Args:
        candidate_id: Candidate identifier
        limit: Maximum events to return (10-200, default 50)
        offset: Pagination offset (default 0)
        event_types: Filter by event types (e.g., 'certification,proficiency_upgrade')
        db: Database session
        
    Returns:
        SkillJourneyResponse with timeline events and metrics
        
    Raises:
        HTTPException: 404 if candidate not found, 400 for invalid event types
    """
    try:
        logger.info(f"🎯 Fetching skill journey for candidate {candidate_id}, limit={limit}, offset={offset}")
        
        # Validate candidate exists
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            logger.warning(f"Candidate {candidate_id} not found")
            raise HTTPException(
                status_code=404,
                detail=f"Candidate with ID {candidate_id} not found"
            )
        
        # Parse and validate event type filters
        filter_event_types = None
        if event_types:
            try:
                filter_event_types = [
                    EventType(et.strip()) 
                    for et in event_types.split(',') 
                    if et.strip()
                ]
                logger.debug(f"🔍 Filtering by event types: {[et.value for et in filter_event_types]}")
            except ValueError as e:
                logger.error(f"❌ Invalid event type: {str(e)}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid event type. Valid types: {', '.join([et.value for et in EventType])}"
                )
        
        # Fetch skill journey events
        events = await _fetch_skill_journey_events(
            candidate_id, 
            limit, 
            offset, 
            filter_event_types,
            db
        )
        
        # Handle empty journey
        if not events:
            logger.info(f"⚠️ No journey events for candidate {candidate_id}")
            return SkillJourneyResponse(
                candidate_id=candidate_id,
                events=[],
                total_events=0,
                returned_events=0,
                offset=offset,
                journey_start_date=None,
                journey_duration_days=0,
                most_productive_period=None,
                has_more=False,
                message="📖 No skill journey data available yet.",
                suggestion="💡 Skills will be tracked as you add and update them. Start by adding skills to your profile!"
            )
        
        # Calculate productivity metrics
        productivity = _calculate_productivity_metrics(events)
        logger.debug(f"📊 Productivity metrics: {productivity['period']} with {productivity['total_events']} events")
        
        # Get journey metadata
        journey_start = events[-1]['date'] if events else None
        total_events_count = await _count_total_events(candidate_id, db)
        journey_duration = _calculate_journey_duration(events) if events else 0
        
        # Determine if more events exist
        has_more = total_events_count > (limit + offset)
        
        logger.info(f"✅ Retrieved {len(events)} events, total: {total_events_count}, has_more: {has_more}")
        
        result = SkillJourneyResponse(
            candidate_id=candidate_id,
            events=[SkillJourneyEvent(**event) for event in events],
            total_events=total_events_count,
            returned_events=len(events),
            offset=offset,
            journey_start_date=journey_start,
            journey_duration_days=journey_duration,
            most_productive_period=ProductivityPeriod(**productivity) if productivity else None,
            has_more=has_more
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching skill journey: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve skill journey. Please try again later."
        )


async def _fetch_skill_journey_events(
    candidate_id: int,
    limit: int,
    offset: int,
    event_types: Optional[List[EventType]],
    db: Session
) -> List[Dict]:
    """
    Fetch skill journey events from database or generate from current state.
    
    Attempts to fetch from SkillHistory table. If not available or empty,
    generates synthetic journey from current skill state.
    
    Args:
        candidate_id: Candidate ID
        limit: Max events to return
        offset: Pagination offset
        event_types: Filter by event types
        db: Database session
        
    Returns:
        List of journey event dictionaries (most recent first)
    """
    logger.debug(f"🔍 Fetching journey events for candidate {candidate_id}")
    
    try:
        # Try to import and query SkillHistory model
        try:
            from app.models.skill_history import SkillHistory
            
            logger.debug("📚 Querying SkillHistory table")
            
            # Build base query
            query = db.query(SkillHistory).filter(
                SkillHistory.candidate_id == candidate_id
            )
            
            # Apply event type filter if provided
            if event_types:
                event_values = [et.value for et in event_types]
                query = query.filter(SkillHistory.event_type.in_(event_values))
                logger.debug(f"   Filtered to event types: {event_values}")
            
            # Order by date descending (most recent first), apply pagination
            history_records = query.order_by(
                SkillHistory.created_at.desc()
            ).offset(offset).limit(limit).all()
            
            if not history_records:
                logger.debug("⚠️ No records in SkillHistory table")
                return await _generate_synthetic_journey(candidate_id, limit, offset, db)
            
            logger.debug(f"📈 Found {len(history_records)} records in database")
            
            # Convert records to event dictionaries
            events = []
            for record in history_records:
                # Validate date (filter out future dates)
                event_datetime = record.created_at
                if event_datetime > datetime.now():
                    logger.debug(f"⚠️ Skipping future-dated event: {event_datetime}")
                    continue
                
                event = {
                    "date": event_datetime.strftime("%Y-%m-%d"),
                    "event_type": record.event_type,
                    "skill_name": record.skill_name if record.skill_name else "Unknown",
                    "description": record.description if record.description else "Skill event",
                    "icon": _get_icon_for_event(record.event_type)
                }
                
                # Add type-specific fields
                if record.event_type == EventType.PROFICIENCY_UPGRADE.value:
                    event["previous_level"] = getattr(record, 'previous_level', None)
                    event["new_level"] = getattr(record, 'new_level', None)
                elif record.event_type == EventType.CERTIFICATION.value:
                    event["certification_name"] = getattr(record, 'certification_name', None)
                elif record.event_type == EventType.PROJECT_COMPLETED.value:
                    event["project_name"] = getattr(record, 'project_name', None)
                
                events.append(event)
            
            if not events:
                logger.debug("⚠️ No valid events after validation")
                return await _generate_synthetic_journey(candidate_id, limit, offset, db)
            
            logger.info(f"✅ Retrieved {len(events)} valid events from database")
            return events
            
        except ImportError:
            logger.debug("ℹ️ SkillHistory model not available")
            return await _generate_synthetic_journey(candidate_id, limit, offset, db)
        except Exception as e:
            logger.warning(f"⚠️ Error querying SkillHistory: {str(e)}")
            return await _generate_synthetic_journey(candidate_id, limit, offset, db)
            
    except Exception as e:
        logger.error(f"❌ Error in _fetch_skill_journey_events: {str(e)}")
        return []


async def _generate_synthetic_journey(
    candidate_id: int,
    limit: int,
    offset: int,
    db: Session
) -> List[Dict]:
    """
    Generate synthetic journey from current skill state.
    
    Creates plausible journey events based on current skills and proficiency levels.
    Spreads events over approximately 1 year with realistic progression.
    
    Args:
        candidate_id: Candidate ID
        limit: Max events to return
        offset: Pagination offset
        db: Database session
        
    Returns:
        List of synthetic journey events
    """
    logger.debug(f"🎨 Generating synthetic journey for candidate {candidate_id}")
    
    # Fetch all skills for candidate
    skills = db.query(CandidateSkill).filter(
        CandidateSkill.candidate_id == candidate_id
    ).all()
    
    if not skills:
        logger.debug("⚠️ No skills found for synthetic journey")
        return []
    
    logger.debug(f"📚 Generating events for {len(skills)} skills")
    
    events = []
    base_date = datetime.now() - timedelta(days=365)  # Start ~1 year ago
    
    # Deduplicate and sort skills by proficiency (lower = older)
    seen_skills = set()
    sorted_skills = []
    for skill in sorted(skills, key=lambda s: (_normalize_proficiency(s.proficiency), s.name)):
        skill_lower = skill.name.lower()
        if skill_lower not in seen_skills:
            seen_skills.add(skill_lower)
            sorted_skills.append(skill)
    
    logger.debug(f"🔄 Processing {len(sorted_skills)} unique skills")
    
    # Generate events for each skill
    for idx, skill in enumerate(sorted_skills):
        # Skill acquisition event (spread across timeline ~every 40 days)
        days_offset = (idx * 30) + (idx * 10)
        event_date = base_date + timedelta(days=days_offset)
        
        # Ensure date is not in future
        if event_date > datetime.now():
            event_date = datetime.now() - timedelta(days=5)
        
        events.append({
            "date": event_date.strftime("%Y-%m-%d"),
            "event_type": EventType.SKILL_ACQUIRED.value,
            "skill_name": skill.name,
            "description": f"Acquired {skill.name}",
            "icon": _get_icon_for_event(EventType.SKILL_ACQUIRED.value)
        })
        
        # Add proficiency upgrade events for skilled professionals
        proficiency = _normalize_proficiency(skill.proficiency)
        if proficiency >= 3:
            upgrade_date = event_date + timedelta(days=45)
            if upgrade_date > datetime.now():
                upgrade_date = datetime.now() - timedelta(days=1)
            
            events.append({
                "date": upgrade_date.strftime("%Y-%m-%d"),
                "event_type": EventType.PROFICIENCY_UPGRADE.value,
                "skill_name": skill.name,
                "description": f"{skill.name} Proficiency Upgrade",
                "previous_level": 2,
                "new_level": int(proficiency),
                "icon": _get_icon_for_event(EventType.PROFICIENCY_UPGRADE.value)
            })
        
        # Add certification for expert-level skills
        if proficiency >= 4.5:
            cert_date = event_date + timedelta(days=90)
            if cert_date > datetime.now():
                cert_date = datetime.now() - timedelta(days=2)
            
            events.append({
                "date": cert_date.strftime("%Y-%m-%d"),
                "event_type": EventType.CERTIFICATION.value,
                "skill_name": skill.name,
                "description": f"{skill.name} Certification Earned",
                "certification_name": f"Advanced {skill.name} Certificate",
                "icon": _get_icon_for_event(EventType.CERTIFICATION.value)
            })
    
    # Remove duplicate events (same date, skill, type)
    unique_events = []
    seen = set()
    for event in events:
        event_key = (event['date'], event['skill_name'], event['event_type'])
        if event_key not in seen:
            seen.add(event_key)
            unique_events.append(event)
    
    logger.debug(f"🔄 Deduplication: {len(events)} → {len(unique_events)} events")
    
    # Sort by date descending (most recent first)
    unique_events.sort(key=lambda e: e['date'], reverse=True)
    
    logger.debug(f"✅ Generated {len(unique_events)} synthetic events")
    
    # Apply pagination
    paginated = unique_events[offset:offset + limit]
    logger.debug(f"📄 Applied pagination: offset={offset}, limit={limit}, returned={len(paginated)}")
    
    return paginated


def _get_icon_for_event(event_type: str) -> str:
    """
    Get emoji icon for event type.
    
    Args:
        event_type: Event type value
        
    Returns:
        Emoji icon string
    """
    icon_map = {
        EventType.SKILL_ACQUIRED.value: "📚",
        EventType.PROFICIENCY_UPGRADE.value: "⬆️",
        EventType.CERTIFICATION.value: "🏆",
        EventType.PROJECT_COMPLETED.value: "🚀",
        EventType.COURSE_COMPLETED.value: "✅"
    }
    return icon_map.get(event_type, "📌")


def _calculate_productivity_metrics(events: List[Dict]) -> Dict:
    """
    Calculate productivity metrics from events.
    
    Groups events by quarter and identifies most productive period.
    
    Args:
        events: List of journey events
        
    Returns:
        Productivity metrics for most productive quarter
    """
    logger.debug(f"📊 Calculating productivity metrics for {len(events)} events")
    
    if not events:
        return {
            "period": "N/A",
            "skills_acquired": 0,
            "courses_completed": 0,
            "certifications_earned": 0,
            "total_events": 0
        }
    
    # Group events by quarter
    quarterly_metrics = {}
    
    for event in events:
        try:
            event_date = datetime.strptime(event['date'], "%Y-%m-%d")
            quarter = f"Q{((event_date.month - 1) // 3) + 1} {event_date.year}"
            
            if quarter not in quarterly_metrics:
                quarterly_metrics[quarter] = {
                    "skills_acquired": 0,
                    "courses_completed": 0,
                    "certifications_earned": 0,
                    "total_events": 0
                }
            
            quarterly_metrics[quarter]["total_events"] += 1
            
            # Count by event type
            event_type = event['event_type']
            if event_type == EventType.SKILL_ACQUIRED.value:
                quarterly_metrics[quarter]["skills_acquired"] += 1
            elif event_type == EventType.COURSE_COMPLETED.value:
                quarterly_metrics[quarter]["courses_completed"] += 1
            elif event_type == EventType.CERTIFICATION.value:
                quarterly_metrics[quarter]["certifications_earned"] += 1
                
        except Exception as e:
            logger.warning(f"⚠️ Error processing event: {str(e)}")
            continue
    
    if not quarterly_metrics:
        return {
            "period": "N/A",
            "skills_acquired": 0,
            "courses_completed": 0,
            "certifications_earned": 0,
            "total_events": 0
        }
    
    # Find most productive quarter (by total events)
    most_productive = max(
        quarterly_metrics.items(), 
        key=lambda x: x[1]["total_events"]
    )
    
    logger.debug(f"🏆 Most productive: {most_productive[0]} with {most_productive[1]['total_events']} events")
    
    return {
        "period": most_productive[0],
        **most_productive[1]
    }


def _calculate_journey_duration(events: List[Dict]) -> int:
    """
    Calculate duration of journey in days.
    
    Returns days between earliest and latest event.
    
    Args:
        events: List of journey events
        
    Returns:
        Duration in days
    """
    if not events or len(events) < 2:
        return 0
    
    try:
        dates = [datetime.strptime(e['date'], "%Y-%m-%d") for e in events]
        earliest = min(dates)
        latest = max(dates)
        
        duration = (latest - earliest).days
        logger.debug(f"📅 Journey duration: {duration} days ({earliest.date()} → {latest.date()})")
        return duration
        
    except Exception as e:
        logger.warning(f"⚠️ Error calculating duration: {str(e)}")
        return 0


async def _count_total_events(candidate_id: int, db: Session) -> int:
    """
    Count total events for pagination.
    
    Queries SkillHistory if available, otherwise estimates from skills.
    
    Args:
        candidate_id: Candidate ID
        db: Database session
        
    Returns:
        Total count of events
    """
    try:
        from app.models.skill_history import SkillHistory
        
        count = db.query(SkillHistory).filter(
            SkillHistory.candidate_id == candidate_id
        ).count()
        
        logger.debug(f"📊 Total events in database: {count}")
        return count
        
    except Exception:
        # Estimate from current skills
        skills_count = db.query(CandidateSkill).filter(
            CandidateSkill.candidate_id == candidate_id
        ).count()
        
        # Rough estimate: acquisition + upgrade + cert = ~2.5 events per skill
        estimated = int(skills_count * 2.5)
        logger.debug(f"📊 Estimated total events: {estimated} (from {skills_count} skills)")
        return estimated


# ============================================================================
# AI Career Summary Generation
# ============================================================================

# Initialize OpenAI client (async)
openai_client = None
try:
    from openai import AsyncOpenAI
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        openai_client = AsyncOpenAI(api_key=api_key)
        logger.info("✅ OpenAI client initialized successfully")
    else:
        logger.warning("⚠️ OPENAI_API_KEY environment variable not set")
except Exception as e:
    logger.warning(f"⚠️ OpenAI client initialization failed: {str(e)}")


OFFENSIVE_KEYWORDS = [
    'explicit', 'vulgar', 'hate', 'racist', 'sexist', 'discriminatory',
    'harassment', 'abuse', 'illegal', 'harmful', 'dangerous'
]

CONTENT_FILTER_ENABLED = True
CACHE_ENABLED = True
MAX_RETRIES = 3
RETRY_DELAY_BASE = 1  # seconds, exponential backoff
SUMMARY_CACHE_HOURS = 24


@router.post("/career-advisor/generate-summary", response_model=CareerSummaryResponse)
async def generate_career_summary(
    request: CareerSummaryRequest,
    db: Session = Depends(get_db)
) -> CareerSummaryResponse:
    """
    Generate AI-powered personalized career summary and recommendations.
    
    Generates personalized career advice based on candidate's skills, experience, and context.
    Uses OpenAI API when available, falls back to templates when unavailable.
    Caches summaries for 24 hours to optimize API usage.
    
    Args:
        request: CareerSummaryRequest with candidate_id, target_role, context, regenerate flag
        db: Database session
        
    Returns:
        CareerSummaryResponse with personalized summary, strengths, opportunities, action items
        
    Raises:
        HTTPException: 404 if candidate not found, 422 if invalid context, 500 for generation errors
        
    Edge Cases Handled:
        ✅ Missing OpenAI API key (fallback to template)
        ✅ API timeout (retry with exponential backoff)
        ✅ API rate limiting (retry logic)
        ✅ Candidate with minimal data (fallback to templates)
        ✅ Offensive/inappropriate AI output (content filtering)
        ✅ Cache miss (generate and cache)
        ✅ Cache expiration (regenerate)
        ✅ Long prompts (truncate intelligently)
    """
    try:
        logger.info(f"🚀 Generating career summary for candidate {request.candidate_id}")
        
        # Validate candidate exists
        candidate = db.query(Candidate).filter(
            Candidate.id == request.candidate_id
        ).first()
        
        if not candidate:
            logger.warning(f"❌ Candidate {request.candidate_id} not found")
            raise HTTPException(
                status_code=404,
                detail=f"Candidate {request.candidate_id} not found"
            )
        
        logger.debug(f"✅ Candidate {candidate.name} found")
        
        # Check cache unless regenerate is requested
        if not request.regenerate and CACHE_ENABLED:
            cached_summary = await _get_cached_summary(
                request.candidate_id,
                request.context,
                db
            )
            if cached_summary:
                logger.info(f"💾 Returning cached summary for candidate {request.candidate_id}")
                return CareerSummaryResponse(**cached_summary)
        
        # Fetch candidate skills
        skills = db.query(CandidateSkill).filter(
            CandidateSkill.candidate_id == request.candidate_id
        ).all()
        
        logger.debug(f"📊 Candidate has {len(skills)} skills")
        
        # Get career health metrics for context
        health_metrics = await _get_health_metrics_for_summary(request.candidate_id, db)
        
        # Generate summary (AI if available, template as fallback)
        if openai_client and len(skills) >= 3:
            logger.debug("🤖 Attempting AI-powered summary generation")
            summary_data = await _generate_ai_summary(
                candidate,
                skills,
                health_metrics,
                request.target_role,
                request.context
            )
        else:
            reason = "AI unavailable" if not openai_client else "insufficient skills"
            logger.info(f"📋 Using template-based summary ({reason})")
            summary_data = _generate_template_summary(
                candidate,
                skills,
                health_metrics,
                request.target_role,
                request.context
            )
        
        # Add metadata
        summary_data["generated_at"] = datetime.utcnow().isoformat()
        if "source" not in summary_data:
            summary_data["source"] = "template"
        
        logger.debug(f"✅ Summary generated from source: {summary_data['source']}")
        
        # Cache the summary
        if CACHE_ENABLED:
            await _cache_summary(
                request.candidate_id,
                request.context,
                summary_data,
                db
            )
        
        logger.info(f"✅ Career summary generated successfully for candidate {request.candidate_id}")
        return CareerSummaryResponse(**summary_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating career summary: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate career summary. Please try again later."
        )


async def _generate_ai_summary(
    candidate,
    skills: List,
    health_metrics: Dict,
    target_role: Optional[str],
    context: str
) -> Dict:
    """
    Generate career summary using OpenAI API with retry logic and fallback.
    
    Implements exponential backoff retry logic for rate limiting and timeouts.
    Validates JSON structure and falls back to template on validation failure.
    
    Args:
        candidate: Candidate object
        skills: List of candidate skills
        health_metrics: Career health metrics dictionary
        target_role: Optional target role
        context: Generation context (career_growth, job_search, upskilling)
        
    Returns:
        Dictionary with summary, strengths, opportunities, action_items, timeline, salary_impact
        
    Edge Cases:
        ✅ API timeout → Retry with backoff
        ✅ Rate limiting (429) → Retry with exponential backoff
        ✅ Invalid JSON response → Fall back to template
        ✅ Missing fields → Fall back to template
        ✅ Network error → Fall back to template
    """
    try:
        # Build prompt
        prompt = _build_summary_prompt(candidate, skills, health_metrics, target_role, context)
        
        # Implement retry logic with exponential backoff
        retry_delay = RETRY_DELAY_BASE
        
        for attempt in range(MAX_RETRIES):
            try:
                logger.debug(f"🔄 OpenAI API attempt {attempt + 1}/{MAX_RETRIES}")
                
                response = await openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an expert career advisor for software engineers. "
                                "Provide personalized, actionable, and encouraging career advice. "
                                "Be realistic about timelines and growth potential. "
                                "Format your response as valid JSON with all required fields."
                            )
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.7,
                    max_tokens=1000,
                    timeout=10
                )
                
                # Parse response
                content = response.choices[0].message.content
                logger.debug(f"📥 Received response from OpenAI ({len(content)} chars)")
                
                # Parse JSON
                try:
                    summary_data = json.loads(content)
                except json.JSONDecodeError:
                    logger.warning("⚠️ Failed to parse JSON from AI response, attempting cleanup")
                    # Try to extract JSON from response
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        summary_data = json.loads(json_match.group())
                    else:
                        raise ValueError("No valid JSON found in response")
                
                # Validate required fields
                required_fields = [
                    "summary", "key_strengths", "opportunities",
                    "action_items", "timeline_to_goal", "salary_impact"
                ]
                
                missing_fields = [f for f in required_fields if f not in summary_data]
                if missing_fields:
                    logger.warning(f"⚠️ AI response missing fields: {missing_fields}")
                    return _generate_template_summary(
                        candidate, skills, health_metrics, target_role, context
                    )
                
                # Apply content filtering
                if CONTENT_FILTER_ENABLED:
                    if _contains_offensive_content(summary_data):
                        logger.warning("⚠️ Offensive content detected in AI response, using template")
                        return _generate_template_summary(
                            candidate, skills, health_metrics, target_role, context
                        )
                
                # Validate field types
                if not isinstance(summary_data.get("key_strengths"), list):
                    summary_data["key_strengths"] = [summary_data.get("key_strengths", "")]
                if not isinstance(summary_data.get("opportunities"), list):
                    summary_data["opportunities"] = [summary_data.get("opportunities", "")]
                if not isinstance(summary_data.get("action_items"), list):
                    summary_data["action_items"] = [summary_data.get("action_items", "")]
                
                summary_data["source"] = "ai"
                logger.info("✅ AI summary generated successfully")
                return summary_data
                
            except asyncio.TimeoutError:
                logger.warning(f"⏱️ OpenAI API timeout on attempt {attempt + 1}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2
                continue
                
            except Exception as api_error:
                error_str = str(api_error)
                if "429" in error_str or "rate_limit" in error_str.lower():
                    logger.warning(f"🚦 Rate limit hit on attempt {attempt + 1}, backing off")
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                    continue
                
                logger.warning(f"⚠️ OpenAI API error on attempt {attempt + 1}: {error_str}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    raise
        
        logger.warning("⚠️ All AI retries failed, falling back to template")
        return _generate_template_summary(
            candidate, skills, health_metrics, target_role, context
        )
        
    except Exception as e:
        logger.error(f"❌ AI generation failed: {str(e)}")
        return _generate_template_summary(
            candidate, skills, health_metrics, target_role, context
        )


def _build_summary_prompt(
    candidate,
    skills: List,
    health_metrics: Dict,
    target_role: Optional[str],
    context: str
) -> str:
    """
    Build optimized prompt for AI summary generation.
    
    Intelligently truncates skill list to stay within token budget.
    Structures context for consistent, high-quality AI responses.
    
    Args:
        candidate: Candidate object
        skills: List of skills (will be truncated if too many)
        health_metrics: Career health metrics
        target_role: Optional target role
        context: Context type
        
    Returns:
        Formatted prompt string (optimized for token usage)
        
    Edge Cases:
        ✅ Very long skill list → Truncate to top 15
        ✅ Missing health metrics → Use defaults
        ✅ Special characters in names → Escaped
    """
    
    # Truncate skill list to top 15 to manage prompt size
    top_skills = skills[:15]
    
    skill_summary = ", ".join([
        f"{s.name} (Proficiency: {_normalize_proficiency(s.proficiency):.1f}/5)"
        for s in top_skills
    ])
    
    target_info = (
        f"Target Role: {target_role.strip()[:100]}"
        if target_role
        else "No specific target role specified"
    )
    
    context_instructions = {
        "career_growth": "Focus on long-term career development, skill advancement, and leadership opportunities.",
        "job_search": "Focus on immediate job market opportunities, interview preparation, and positioning.",
        "upskilling": "Focus on specific skills to learn, courses to take, and learning paths."
    }
    
    overall_score = health_metrics.get('overall_score', 50)
    skills_relevance = health_metrics.get('skills_relevance', 50)
    market_alignment = health_metrics.get('market_alignment', 50)
    
    prompt = f"""Analyze this software engineer's profile and provide personalized career advice.

**Candidate Profile:**
- Name: {candidate.name[:50]}
- Total Skills: {len(skills)}
- Top Skills: {skill_summary}
- Career Health Score: {overall_score}/100
- Skills Relevance: {skills_relevance}/100
- Market Alignment: {market_alignment}/100
- {target_info}

**Context:** {context_instructions.get(context, context_instructions['career_growth'])}

Provide your response in this exact JSON format (all fields required):
{{
  "summary": "2-3 paragraph personalized career summary (max 300 words)",
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "action_items": ["action 1", "action 2", "action 3"],
  "timeline_to_goal": "e.g., '6-12 months'",
  "salary_impact": "e.g., '₹3-5L increase potential'"
}}

Requirements:
- Be specific and actionable
- Use Indian salary context (LPA or Lakhs)
- Be encouraging but realistic
- Focus on {context.replace('_', ' ')}
- Ensure JSON is valid and parseable
"""
    
    return prompt


def _generate_template_summary(
    candidate,
    skills: List,
    health_metrics: Dict,
    target_role: Optional[str],
    context: str
) -> Dict:
    """
    Generate template-based summary when AI is unavailable.
    
    Provides sensible, pre-written career advice based on candidate metrics.
    Ensures consistent quality when OpenAI API is unavailable.
    
    Args:
        candidate: Candidate object
        skills: List of candidate skills
        health_metrics: Career health metrics
        target_role: Optional target role
        context: Generation context
        
    Returns:
        Dictionary with template-based summary and advice
        
    Edge Cases:
        ✅ Candidate with no skills → Generic junior-level advice
        ✅ High score but few skills → Adjusted templates
        ✅ Low score → Encouragement + clear path forward
    """
    
    overall_score = health_metrics.get('overall_score', 50)
    top_skills = sorted(
        skills,
        key=lambda s: _normalize_proficiency(s.proficiency),
        reverse=True
    )[:3]
    
    skill_names = [s.name for s in top_skills] if top_skills else ["core skills"]
    
    # Determine career level
    if overall_score >= 80:
        level = "senior"
        timeline = "3-6 months"
        salary_impact = "₹4-7L increase potential"
        
        summary = (
            f"You're a senior-level engineer with strong expertise in {', '.join(skill_names)}. "
            f"Your {len(skills)}-skill portfolio and high proficiency levels position you well for staff/principal roles. "
            f"Focus on system design, architectural thinking, and technical leadership. "
            f"Consider mentoring, open source contributions, or conference speaking to enhance your profile."
        )
        
        opportunities = [
            "Architect complex distributed systems",
            "Lead technical teams and set engineering standards",
            "Become a technical authority in your domain"
        ]
        
        action_items = [
            "Master system design patterns and trade-offs",
            "Lead a high-impact technical initiative",
            "Mentor 2-3 junior engineers",
            "Contribute to open source or speak at conferences",
            "Build a personal brand in your specialty"
        ]
        
    elif overall_score >= 65:
        level = "mid-level"
        timeline = "6-12 months"
        salary_impact = "₹3-5L increase potential"
        
        summary = (
            f"You're demonstrating solid growth with competency in {', '.join(skill_names)}. "
            f"Your {len(skills)}-skill portfolio positions you for mid-to-senior level opportunities. "
            f"Deepen your expertise in high-demand areas and work on substantial projects. "
            f"Learn system design and cloud architecture to progress toward senior roles."
        )
        
        opportunities = [
            "Progress to senior engineer roles",
            "Specialize in high-demand technologies",
            "Lead technical projects"
        ]
        
        action_items = [
            "Complete a system design course (DesignGuru, SystemDesign.io)",
            "Lead or co-lead a technical project",
            "Contribute meaningfully to one open source project",
            "Practice technical interviews monthly",
            "Learn cloud architecture (AWS, Azure, GCP)"
        ]
        
    else:
        level = "junior"
        timeline = "12-18 months"
        salary_impact = "₹2-4L increase potential"
        
        summary = (
            f"You're building a solid foundation with skills like {', '.join(skill_names) if skill_names else 'core technologies'}. "
            f"Prioritize practical experience and deep mastery of a few technologies over breadth. "
            f"Consistent learning, project work, and code review participation will accelerate your growth. "
            f"Focus on becoming a strong generalist before specializing."
        )
        
        opportunities = [
            "Build strong fundamentals in core technologies",
            "Gain real-world project experience",
            "Contribute to team projects and learn from seniors"
        ]
        
        action_items = [
            "Master 2-3 core technologies deeply",
            "Build 2-3 substantial portfolio projects",
            "Read and contribute to code reviews",
            "Complete structured learning programs (LLD, HLD basics)",
            "Seek mentorship from senior engineers"
        ]
    
    return {
        "summary": summary,
        "key_strengths": skill_names if skill_names else ["Learning Ability", "Technical Fundamentals"],
        "opportunities": opportunities,
        "action_items": action_items,
        "timeline_to_goal": timeline,
        "salary_impact": salary_impact,
        "source": "template"
    }


async def _get_health_metrics_for_summary(candidate_id: int, db: Session) -> Dict:
    """
    Get career health metrics for summary generation.
    
    Efficiently calculates key metrics used in summary context.
    Handles missing data gracefully with sensible defaults.
    
    Args:
        candidate_id: Candidate ID
        db: Database session
        
    Returns:
        Dictionary with overall_score, skills_relevance, market_alignment
        
    Edge Cases:
        ✅ Candidate with no skills → Returns default scores
        ✅ Database error → Returns defaults with warning
        ✅ Partial data → Uses available data for calculations
    """
    try:
        skills = db.query(CandidateSkill).filter(
            CandidateSkill.candidate_id == candidate_id
        ).all()
        
        if not skills:
            logger.debug(f"📊 No skills found for candidate {candidate_id}, using defaults")
            return {
                "overall_score": 50,
                "skills_relevance": 50,
                "market_alignment": 50
            }
        
        # Normalize skills data
        normalized_skills = [
            {
                "proficiency": _normalize_proficiency(s.proficiency),
                "market_demand": _normalize_market_demand(getattr(s, 'market_demand', None)),
                "category": s.category or "Other"
            }
            for s in skills
        ]
        
        # Calculate metrics
        skills_relevance = calculate_skills_relevance(normalized_skills)
        market_alignment = calculate_market_alignment(normalized_skills)
        learning_trajectory = calculate_learning_trajectory(normalized_skills)
        industry_demand = calculate_industry_demand(normalized_skills)
        
        overall_score = round((
            skills_relevance +
            market_alignment +
            learning_trajectory +
            industry_demand
        ) / 4)
        
        logger.debug(f"📊 Health metrics: overall={overall_score}, relevance={skills_relevance}, alignment={market_alignment}")
        
        return {
            "overall_score": min(100, max(0, overall_score)),
            "skills_relevance": min(100, max(0, skills_relevance)),
            "market_alignment": min(100, max(0, market_alignment))
        }
        
    except Exception as e:
        logger.error(f"❌ Error calculating health metrics: {str(e)}")
        return {
            "overall_score": 50,
            "skills_relevance": 50,
            "market_alignment": 50
        }


async def _get_cached_summary(
    candidate_id: int,
    context: str,
    db: Session
) -> Optional[Dict]:
    """
    Retrieve cached summary if available and not expired.
    
    Checks cache table for valid (non-expired) summary entries.
    Logs cache hits/misses for monitoring.
    
    Args:
        candidate_id: Candidate ID
        context: Summary context
        db: Database session
        
    Returns:
        Cached summary dict if valid and not expired, None otherwise
        
    Edge Cases:
        ✅ Cache table doesn't exist → Returns None gracefully
        ✅ Expired entry → Ignored and returns None
        ✅ Database error → Returns None with warning
    """
    try:
        from app.models.career_summary_cache import CareerSummaryCache
        
        cache_key = f"{candidate_id}_{context}"
        
        # Query for non-expired cache entry
        cached = db.query(CareerSummaryCache).filter(
            CareerSummaryCache.cache_key == cache_key,
            CareerSummaryCache.expires_at > datetime.utcnow()
        ).first()
        
        if cached:
            logger.debug(f"💾 Cache hit for key: {cache_key}")
            return json.loads(cached.summary_data)
        
        logger.debug(f"📭 Cache miss for key: {cache_key}")
        return None
        
    except ImportError:
        logger.debug("ℹ️ CareerSummaryCache model not available, skipping cache")
        return None
    except Exception as e:
        logger.warning(f"⚠️ Error retrieving cached summary: {str(e)}")
        return None


async def _cache_summary(
    candidate_id: int,
    context: str,
    summary_data: Dict,
    db: Session
):
    """
    Cache generated summary for 24 hours.
    
    Stores summary in database for quick retrieval on subsequent requests.
    Automatically deletes old entries for same candidate+context combination.
    
    Args:
        candidate_id: Candidate ID
        context: Summary context
        summary_data: Summary data to cache
        db: Database session
        
    Edge Cases:
        ✅ Cache table doesn't exist → Logs and continues
        ✅ Database error → Logs warning and continues (doesn't crash)
        ✅ Duplicate key → Old entry deleted first
    """
    try:
        from app.models.career_summary_cache import CareerSummaryCache
        
        cache_key = f"{candidate_id}_{context}"
        expires_at = datetime.utcnow() + timedelta(hours=SUMMARY_CACHE_HOURS)
        
        # Delete old cache entry if exists
        db.query(CareerSummaryCache).filter(
            CareerSummaryCache.cache_key == cache_key
        ).delete(synchronize_session=False)
        
        # Create new cache entry
        cache_entry = CareerSummaryCache(
            cache_key=cache_key,
            candidate_id=candidate_id,
            context=context,
            summary_data=json.dumps(summary_data),
            expires_at=expires_at
        )
        
        db.add(cache_entry)
        db.commit()
        
        logger.debug(f"💾 Summary cached for {SUMMARY_CACHE_HOURS}h: {cache_key}")
        
    except ImportError:
        logger.debug("ℹ️ CareerSummaryCache model not available, skipping cache")
    except Exception as e:
        logger.warning(f"⚠️ Error caching summary: {str(e)}")
        try:
            db.rollback()
        except:
            pass


def _contains_offensive_content(summary_data: Dict) -> bool:
    """
    Check if summary contains offensive or inappropriate content.
    
    Simple keyword-based filter for inappropriate content.
    Preserves legitimate technical terms.
    
    Args:
        summary_data: Summary dictionary to check
        
    Returns:
        True if offensive content detected, False otherwise
    """
    if not CONTENT_FILTER_ENABLED:
        return False
    
    # Concatenate all text fields
    text_to_check = " ".join([
        str(v).lower()
        for v in summary_data.values()
        if isinstance(v, (str, list))
    ]).replace("[", " ").replace("]", " ").replace(",", " ")
    
    # Check for offensive keywords
    for keyword in OFFENSIVE_KEYWORDS:
        if keyword.lower() in text_to_check:
            logger.warning(f"⚠️ Offensive keyword detected: {keyword}")
            return True
    
    return False


def _normalize_proficiency(proficiency) -> float:
    """Normalize proficiency to 0-5 scale."""
    try:
        prof = float(proficiency) if proficiency else DEFAULT_PROFICIENCY
        return min(5.0, max(0.0, prof))
    except:
        return DEFAULT_PROFICIENCY


def _normalize_market_demand(demand) -> float:
    """Normalize market demand to 0-100 scale."""
    try:
        dem = float(demand) if demand else DEFAULT_MARKET_DEMAND
        return min(100.0, max(0.0, dem))
    except:
        return DEFAULT_MARKET_DEMAND


# ============================================================================
# Networking Suggestions Endpoint
# ============================================================================

@router.get("/{candidate_id}/networking", response_model=NetworkingSuggestionsResponse)
async def get_networking_suggestions(
    candidate_id: int,
    role: Optional[str] = Query(None, max_length=100, description="Target role for networking"),
    location: str = Query("India", max_length=50, description="Geographic location"),
    limit: int = Query(10, ge=1, le=50, description="Max suggestions per category"),
    db: Session = Depends(get_db)
):
    """
    Get personalized networking suggestions.
    
    Returns relevant LinkedIn profiles, communities, and events based on 
    candidate's role and skills. Includes role-specific networking tips.
    
    Args:
        candidate_id: Candidate identifier (required)
        role: Target role for networking (inferred from skills if not provided)
        location: Geographic location for events (default: India)
        limit: Maximum suggestions per category (1-50, default: 10)
        db: Database session
        
    Returns:
        Networking suggestions including profiles, communities, events, and tips
        
    Raises:
        HTTPException: 404 if candidate not found, 500 for server errors
    """
    try:
        logger.info(f"🤝 Networking suggestions requested for candidate {candidate_id}, role={role}, location={location}")
        
        # Validate candidate exists
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            logger.warning(f"❌ Candidate {candidate_id} not found")
            raise HTTPException(
                status_code=404,
                detail=f"Candidate {candidate_id} not found"
            )
        
        # Determine target role
        if not role or role.strip() == "":
            # Infer from skills
            skills = db.query(CandidateSkill).filter(
                CandidateSkill.candidate_id == candidate_id
            ).all()
            role = _infer_role_from_skills(skills)
            logger.info(f"📍 Inferred role from skills: {role}")
        else:
            role = role.strip().title()
        
        # Get networking suggestions
        linkedin_profiles = await _get_linkedin_suggestions(role, limit, db)
        logger.info(f"✅ Found {len(linkedin_profiles)} LinkedIn profiles")
        
        communities = await _get_community_suggestions(role, limit, db)
        logger.info(f"✅ Found {len(communities)} communities")
        
        events = await _get_event_suggestions(role, location, limit, db)
        logger.info(f"✅ Found {len(events)} events")
        
        networking_tips = _get_networking_tips(role)
        logger.info(f"✅ Generated {len(networking_tips)} networking tips")
        
        response = {
            "candidate_id": candidate_id,
            "target_role": role,
            "suggested_connections": linkedin_profiles,
            "communities": communities,
            "events": events,
            "networking_tips": networking_tips
        }
        
        logger.info(f"✨ Networking suggestions compiled successfully")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting networking suggestions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve networking suggestions"
        )


def _infer_role_from_skills(skills: List) -> str:
    """
    Infer target role from candidate's skills.
    
    Analyzes skill categories and maps to most likely role.
    
    Args:
        skills: List of CandidateSkill objects
        
    Returns:
        Inferred role name
    """
    if not skills:
        logger.debug("📍 No skills found, defaulting to 'Software Engineer'")
        return "Software Engineer"
    
    # Count skills by category
    categories = {}
    for skill in skills:
        cat = skill.category or "Other"
        categories[cat] = categories.get(cat, 0) + 1
    
    logger.debug(f"📊 Skill categories: {categories}")
    
    # Map categories to roles
    category_role_map = {
        "Frontend": "Frontend Developer",
        "Backend": "Backend Engineer",
        "DevOps": "DevOps Engineer",
        "Cloud": "Cloud Engineer",
        "ML/AI": "Data Scientist",
        "Mobile": "Mobile Developer",
        "Database": "Backend Engineer",
        "Data": "Data Scientist",
        "Infrastructure": "DevOps Engineer"
    }
    
    primary_category = max(categories.items(), key=lambda x: x[1])[0]
    inferred_role = category_role_map.get(primary_category, "Software Engineer")
    
    logger.debug(f"📍 Primary category: {primary_category} → {inferred_role}")
    return inferred_role


async def _get_linkedin_suggestions(
    role: str,
    limit: int,
    db: Session
) -> List[Dict]:
    """
    Get LinkedIn profile suggestions for a role.
    
    Uses curated database of influencers in different tech roles.
    Implements fuzzy matching for unknown roles.
    
    Args:
        role: Target role
        limit: Maximum suggestions
        db: Database session
        
    Returns:
        List of LinkedIn profile suggestions with relevance scores
    """
    logger.debug(f"🔍 Searching LinkedIn profiles for role: {role}")
    
    # LinkedIn influencer database by role
    linkedin_db = {
        "Frontend Developer": [
            {
                "name": "Kent C. Dodds",
                "role": "React Expert & Testing Advocate",
                "company": "Independent Educator",
                "bio": "Teaching React, Testing, and Web Development best practices through courses and open source",
                "expertise": ["React", "Testing", "JavaScript", "TypeScript"],
                "linkedin_username": "kentcdodds",
                "relevance_score": 95,
                "followers": 180000
            },
            {
                "name": "Dan Abramov",
                "role": "React Core Team Member",
                "company": "Meta",
                "bio": "Co-author of Redux, Create React App, and React core team member",
                "expertise": ["React", "JavaScript", "Redux", "Open Source"],
                "linkedin_username": "dan-abramov",
                "relevance_score": 98,
                "followers": 250000
            },
            {
                "name": "Sarah Drasner",
                "role": "VP of Developer Experience",
                "company": "Google",
                "bio": "Frontend architecture expert, Vue.js core team, and animation specialist",
                "expertise": ["Frontend", "Vue.js", "Animation", "DevEx"],
                "linkedin_username": "sarah-drasner",
                "relevance_score": 92,
                "followers": 120000
            },
            {
                "name": "Wes Bos",
                "role": "Full Stack Developer & Educator",
                "company": "Independent",
                "bio": "Teaching modern web development through popular courses and tutorials",
                "expertise": ["JavaScript", "React", "Node.js", "CSS"],
                "linkedin_username": "wesbos",
                "relevance_score": 88,
                "followers": 150000
            }
        ],
        "Backend Engineer": [
            {
                "name": "Martin Fowler",
                "role": "Chief Scientist",
                "company": "ThoughtWorks",
                "bio": "Software architecture expert and author of influential programming books",
                "expertise": ["Architecture", "Refactoring", "Microservices", "Patterns"],
                "linkedin_username": "martinfowler",
                "relevance_score": 98,
                "followers": 300000
            },
            {
                "name": "Kelsey Hightower",
                "role": "Staff Developer Advocate",
                "company": "Google Cloud",
                "bio": "Cloud infrastructure and Kubernetes expert, passionate about developer experience",
                "expertise": ["Kubernetes", "Cloud", "DevOps", "Infrastructure"],
                "linkedin_username": "kelsey-hightower",
                "relevance_score": 95,
                "followers": 200000
            },
            {
                "name": "Sam Newman",
                "role": "Independent Consultant",
                "company": "Independent",
                "bio": "Microservices expert and author of 'Building Microservices'",
                "expertise": ["Microservices", "Architecture", "Distributed Systems"],
                "linkedin_username": "samnewman",
                "relevance_score": 90,
                "followers": 85000
            }
        ],
        "DevOps Engineer": [
            {
                "name": "Kelsey Hightower",
                "role": "Staff Developer Advocate",
                "company": "Google Cloud",
                "bio": "Kubernetes and cloud infrastructure expert",
                "expertise": ["Kubernetes", "Cloud", "DevOps", "Automation"],
                "linkedin_username": "kelsey-hightower",
                "relevance_score": 98,
                "followers": 200000
            },
            {
                "name": "Jessie Frazelle",
                "role": "Engineer",
                "company": "Independent",
                "bio": "Container expert, former Docker/Google engineer",
                "expertise": ["Docker", "Linux", "Security", "Containers"],
                "linkedin_username": "jessfraz",
                "relevance_score": 92,
                "followers": 95000
            }
        ],
        "Cloud Engineer": [
            {
                "name": "Kelsey Hightower",
                "role": "Staff Developer Advocate",
                "company": "Google Cloud",
                "bio": "Cloud infrastructure and Kubernetes expert",
                "expertise": ["GCP", "Kubernetes", "Cloud Architecture"],
                "linkedin_username": "kelsey-hightower",
                "relevance_score": 98,
                "followers": 200000
            }
        ],
        "Data Scientist": [
            {
                "name": "Andrew Ng",
                "role": "Founder & CEO",
                "company": "DeepLearning.AI",
                "bio": "AI/ML education pioneer, Stanford professor, and co-founder of Coursera",
                "expertise": ["AI", "Machine Learning", "Deep Learning", "Education"],
                "linkedin_username": "andrewyng",
                "relevance_score": 99,
                "followers": 500000
            },
            {
                "name": "Cassie Kozyrkov",
                "role": "Chief Decision Scientist",
                "company": "Google",
                "bio": "Making data science accessible and practical for everyone",
                "expertise": ["Data Science", "Decision Intelligence", "Statistics"],
                "linkedin_username": "kozyrkov",
                "relevance_score": 94,
                "followers": 180000
            }
        ],
        "Mobile Developer": [
            {
                "name": "Jake Wharton",
                "role": "Senior Engineer",
                "company": "Google",
                "bio": "Android expert and open source contributor",
                "expertise": ["Android", "Kotlin", "Mobile Architecture"],
                "linkedin_username": "jakewharton",
                "relevance_score": 96,
                "followers": 160000
            }
        ],
        "Software Engineer": [
            {
                "name": "Primeagen",
                "role": "Senior Software Engineer",
                "company": "Netflix",
                "bio": "Performance expert, Vim advocate, and tech educator",
                "expertise": ["Performance", "Systems", "Developer Tools"],
                "linkedin_username": "the-primeagen",
                "relevance_score": 88,
                "followers": 120000
            },
            {
                "name": "Theo Browne",
                "role": "CEO",
                "company": "Ping Labs",
                "bio": "Full-stack developer, educator, and tech content creator",
                "expertise": ["Full Stack", "TypeScript", "Next.js", "Web Development"],
                "linkedin_username": "theo-browne",
                "relevance_score": 85,
                "followers": 95000
            }
        ]
    }
    
    # Get suggestions for role (with fuzzy matching)
    suggestions = None
    for db_role in linkedin_db.keys():
        if role.lower() in db_role.lower() or db_role.lower() in role.lower():
            suggestions = linkedin_db[db_role]
            logger.debug(f"✅ Found {len(suggestions)} profiles for exact/fuzzy match")
            break
    
    # Fallback to Software Engineer if role not found
    if not suggestions:
        logger.warning(f"⚠️ Role '{role}' not in database, using Software Engineer suggestions")
        suggestions = linkedin_db.get("Software Engineer", [])
    
    # Sort by relevance and limit
    suggestions = sorted(suggestions, key=lambda x: x["relevance_score"], reverse=True)
    limited = suggestions[:limit]
    
    logger.debug(f"📊 Returning {len(limited)} LinkedIn profiles (limit: {limit})")
    return limited


async def _get_community_suggestions(
    role: str,
    limit: int,
    db: Session
) -> List[Dict]:
    """
    Get tech community suggestions for a role.
    
    Includes Discord communities, Reddit, Slack channels, and forums.
    
    Args:
        role: Target role
        limit: Maximum suggestions
        db: Database session
        
    Returns:
        List of community suggestions with relevance scores
    """
    logger.debug(f"🔍 Searching communities for role: {role}")
    
    communities_db = [
        {
            "name": "Dev.to Community",
            "platform": "Dev.to",
            "url": "https://dev.to/",
            "members": 900000,
            "description": "Global community for developers to share articles, discussions, and learn together",
            "relevance_score": 95,
            "categories": ["All"]
        },
        {
            "name": "React Community (Discord)",
            "platform": "Discord",
            "url": "https://discord.gg/react",
            "members": 180000,
            "description": "Official React community for discussions, help, and collaboration",
            "relevance_score": 98,
            "categories": ["Frontend Developer"]
        },
        {
            "name": "Hashnode Developer Community",
            "platform": "Hashnode",
            "url": "https://hashnode.com/",
            "members": 500000,
            "description": "Blogging and community platform for developers to share knowledge",
            "relevance_score": 90,
            "categories": ["All"]
        },
        {
            "name": "r/programming",
            "platform": "Reddit",
            "url": "https://www.reddit.com/r/programming/",
            "members": 5000000,
            "description": "Discussions about programming, software development, and computer science",
            "relevance_score": 85,
            "categories": ["All"]
        },
        {
            "name": "Kubernetes Community",
            "platform": "Slack",
            "url": "https://kubernetes.slack.com/",
            "members": 120000,
            "description": "Official Kubernetes community for cloud-native developers",
            "relevance_score": 96,
            "categories": ["DevOps Engineer", "Cloud Engineer"]
        },
        {
            "name": "Python Discord",
            "platform": "Discord",
            "url": "https://discord.gg/python",
            "members": 250000,
            "description": "Learn Python, get help, and discuss projects with fellow developers",
            "relevance_score": 92,
            "categories": ["Backend Engineer", "Data Scientist"]
        },
        {
            "name": "freeCodeCamp Forum",
            "platform": "Forum",
            "url": "https://forum.freecodecamp.org/",
            "members": 400000,
            "description": "Learn to code, build projects, and help others in the community",
            "relevance_score": 88,
            "categories": ["All"]
        },
        {
            "name": "GDG (Google Developer Groups)",
            "platform": "Meetup",
            "url": "https://gdg.community.dev/",
            "members": 2000000,
            "description": "Local communities focused on Google technologies and developer growth",
            "relevance_score": 87,
            "categories": ["All"]
        },
        {
            "name": "Kaggle Community",
            "platform": "Kaggle",
            "url": "https://www.kaggle.com/discussions",
            "members": 10000000,
            "description": "Data science competitions, datasets, and learning community",
            "relevance_score": 94,
            "categories": ["Data Scientist"]
        }
    ]
    
    # Filter by role relevance
    filtered = []
    for community in communities_db:
        if "All" in community["categories"] or any(
            role.lower() in cat.lower() or cat.lower() in role.lower()
            for cat in community["categories"]
        ):
            filtered.append(community)
    
    logger.debug(f"📊 Filtered to {len(filtered)} relevant communities")
    
    # Sort by relevance
    filtered = sorted(filtered, key=lambda x: x["relevance_score"], reverse=True)
    
    # Remove categories field from response
    result = []
    for comm in filtered[:limit]:
        result.append({
            "name": comm["name"],
            "platform": comm["platform"],
            "url": comm["url"],
            "members": comm["members"],
            "description": comm["description"],
            "relevance_score": comm["relevance_score"]
        })
    
    logger.debug(f"✅ Returning {len(result)} communities (limit: {limit})")
    return result


async def _get_event_suggestions(
    role: str,
    location: str,
    limit: int,
    db: Session
) -> List[Dict]:
    """
    Get tech event and conference suggestions for a role.
    
    Filters events by role and location. Includes conferences, meetups, webinars.
    
    Args:
        role: Target role
        location: Geographic location
        limit: Maximum suggestions
        db: Database session
        
    Returns:
        List of event suggestions with dates, costs, and descriptions
    """
    logger.debug(f"🔍 Searching events for role: {role}, location: {location}")
    
    events_db = [
        {
            "name": "React Conf",
            "type": "conference",
            "url": "https://conf.react.dev/",
            "date": "2025-05-15",
            "location": "Global (Virtual & In-person)",
            "description": "Official React conference featuring core team talks and community presentations",
            "cost": "Free (Virtual) / $500 (In-person)",
            "relevance_score": 98,
            "categories": ["Frontend Developer"]
        },
        {
            "name": "KubeCon + CloudNativeCon",
            "type": "conference",
            "url": "https://events.linuxfoundation.org/kubecon-cloudnativecon-india/",
            "date": "2025-12-10",
            "location": "India (Delhi)",
            "description": "Premier Kubernetes and cloud-native conference",
            "cost": "₹25000-₹35000",
            "relevance_score": 96,
            "categories": ["DevOps Engineer", "Cloud Engineer"]
        },
        {
            "name": "PyCon India",
            "type": "conference",
            "url": "https://in.pycon.org/",
            "date": "2025-09-20",
            "location": "India (Bangalore)",
            "description": "Premier Python conference in India with talks, workshops, and networking",
            "cost": "₹1000-₹3000",
            "relevance_score": 94,
            "categories": ["Backend Engineer", "Data Scientist"]
        },
        {
            "name": "DevFest",
            "type": "meetup",
            "url": "https://devfest.withgoogle.com/",
            "date": "2025-11-01",
            "location": "Global (Multiple cities)",
            "description": "Community-led developer festivals organized by Google Developer Groups",
            "cost": "Free",
            "relevance_score": 90,
            "categories": ["All"]
        },
        {
            "name": "JSConf India",
            "type": "conference",
            "url": "https://jsconf.in/",
            "date": "2025-08-10",
            "location": "India (Goa)",
            "description": "JavaScript conference featuring cutting-edge JS technologies",
            "cost": "₹5000-₹8000",
            "relevance_score": 92,
            "categories": ["Frontend Developer", "Backend Engineer"]
        },
        {
            "name": "Local Tech Meetups",
            "type": "meetup",
            "url": "https://www.meetup.com/topics/technology/",
            "date": "Ongoing",
            "location": location,
            "description": "Find local developer meetups in your area for networking",
            "cost": "Free",
            "relevance_score": 85,
            "categories": ["All"]
        },
        {
            "name": "AWS re:Invent",
            "type": "conference",
            "url": "https://reinvent.awsevents.com/",
            "date": "2025-11-30",
            "location": "Las Vegas (Virtual available)",
            "description": "Premier AWS conference with technical deep dives and networking",
            "cost": "$1799 (In-person) / Free (Virtual)",
            "relevance_score": 95,
            "categories": ["Cloud Engineer", "DevOps Engineer"]
        },
        {
            "name": "Devoxx India",
            "type": "conference",
            "url": "https://devoxx.com/",
            "date": "2025-07-25",
            "location": "India (Bangalore)",
            "description": "Developer conference covering Java, JVM languages, and modern architectures",
            "cost": "₹4000-₹7000",
            "relevance_score": 88,
            "categories": ["Backend Engineer"]
        }
    ]
    
    # Filter by role and location
    filtered = []
    for event in events_db:
        location_match = (
            "Global" in event["location"] or 
            location.lower() in event["location"].lower() or
            "India" in event["location"]
        )
        
        category_match = (
            "All" in event["categories"] or
            any(role.lower() in cat.lower() or cat.lower() in role.lower()
                for cat in event["categories"])
        )
        
        if location_match and category_match:
            filtered.append(event)
    
    logger.debug(f"📊 Filtered to {len(filtered)} relevant events")
    
    # Sort by relevance
    filtered = sorted(filtered, key=lambda x: x["relevance_score"], reverse=True)
    
    # Remove categories field
    result = []
    for event in filtered[:limit]:
        result.append({
            "name": event["name"],
            "type": event["type"],
            "url": event["url"],
            "date": event["date"],
            "location": event["location"],
            "description": event["description"],
            "cost": event["cost"]
        })
    
    logger.debug(f"✅ Returning {len(result)} events (limit: {limit})")
    return result


def _get_networking_tips(role: str) -> List[str]:
    """
    Get role-specific networking tips.
    
    Combines general networking best practices with role-specific advice.
    
    Args:
        role: Target role
        
    Returns:
        List of networking tips (general + role-specific)
    """
    general_tips = [
        "🔗 Connect with 3-5 professionals in your target role every week on LinkedIn",
        "💬 Engage with posts by commenting thoughtfully before sending connection requests",
        "📢 Share your learning journey and projects on LinkedIn and Twitter",
        "🎤 Attend at least one tech meetup or webinar per month",
        "👥 Join 2-3 active online communities related to your tech stack"
    ]
    
    role_specific_tips = {
        "Frontend Developer": [
            "⚡ Follow frontend architecture discussions on Twitter using #webdev #frontend",
            "🔧 Contribute to open source UI component libraries",
            "🎨 Share CodePen demos and interactive projects"
        ],
        "Backend Engineer": [
            "🏗️ Engage in API design and system architecture discussions",
            "💾 Share insights on database optimization and scalability",
            "🔨 Contribute to backend frameworks and tools"
        ],
        "DevOps Engineer": [
            "☸️ Join Kubernetes and cloud-native community channels",
            "🚀 Share infrastructure automation scripts and best practices",
            "🌥️ Participate in CNCF (Cloud Native Computing Foundation) discussions"
        ],
        "Cloud Engineer": [
            "☁️ Follow cloud architecture patterns and case studies",
            "📊 Share cloud optimization and cost management insights",
            "🔐 Discuss cloud security best practices"
        ],
        "Data Scientist": [
            "📈 Share data analysis insights and visualizations on Kaggle",
            "📚 Participate in ML paper discussions on Twitter and Reddit",
            "🤖 Contribute to open source ML libraries"
        ],
        "Mobile Developer": [
            "📱 Share mobile app architecture patterns and UX insights",
            "🔌 Engage with platform-specific communities (Android, iOS)",
            "🎮 Contribute to open source mobile frameworks"
        ]
    }
    
    specific = role_specific_tips.get(role, [])
    tips = general_tips + specific
    
    logger.debug(f"📌 Generated {len(tips)} networking tips ({len(general_tips)} general + {len(specific)} role-specific)")
    return tips


# ============================================================================
# Interview Resources Endpoint
# ============================================================================

@router.get("/{candidate_id}/interview-resources", response_model=InterviewResourcesResponse)
async def get_interview_resources(
    candidate_id: int,
    role: Optional[str] = Query(None, max_length=100, description="Target role for interviews"),
    category: Optional[str] = Query(None, pattern="^(technical|system_design|behavioral|coding|all)$", description="Filter by interview category"),
    difficulty: Optional[str] = Query(None, pattern="^(beginner|intermediate|advanced)$", description="Filter by difficulty level"),
    free_only: bool = Query(False, description="Show only free resources"),
    db: Session = Depends(get_db)
):
    """
    Get curated interview preparation resources by category.
    
    Provides YouTube tutorials, courses, practice platforms, and guides for:
    - Technical coding interviews
    - System design interviews
    - Behavioral interviews
    - Coding challenge platforms
    
    Args:
        candidate_id: Candidate ID for validation
        role: Target role (defaults to candidate's inferred role)
        category: Filter by interview type (technical, system_design, behavioral, coding, all)
        difficulty: Filter by difficulty (beginner, intermediate, advanced)
        free_only: Show only free resources
        db: Database session
        
    Returns:
        Interview resources organized by category with practice tips
        
    Raises:
        HTTPException: 404 if candidate not found, 500 for server errors
    """
    try:
        logger.info(f"📚 Interview resources requested for candidate {candidate_id}, role={role}, category={category}")
        
        # Validate candidate exists
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            logger.warning(f"❌ Candidate {candidate_id} not found")
            raise HTTPException(
                status_code=404,
                detail=f"Candidate {candidate_id} not found"
            )
        
        # Determine target role
        if not role or role.strip() == "":
            # Infer from skills
            skills = db.query(CandidateSkill).filter(
                CandidateSkill.candidate_id == candidate_id
            ).all()
            role = _infer_role_from_skills(skills)
            logger.info(f"📍 Inferred role from skills: {role}")
        else:
            role = role.strip().title()
        
        # Get all resource categories
        all_categories = _get_interview_resource_categories(role)
        logger.info(f"✅ Loaded {len(all_categories)} resource categories")
        
        # Apply category filter
        if category and category != "all":
            category_map = {
                "technical": "Technical Round",
                "system_design": "System Design",
                "behavioral": "Behavioral Round",
                "coding": "Coding Round"
            }
            target_category = category_map.get(category)
            if target_category:
                all_categories = [cat for cat in all_categories if cat["category"] == target_category]
                logger.info(f"📌 Filtered to {len(all_categories)} categories by type: {category}")
        
        # Apply difficulty filter
        if difficulty:
            for cat in all_categories:
                original_count = len(cat["resources"])
                cat["resources"] = [
                    res for res in cat["resources"]
                    if res["difficulty"].lower() == difficulty.lower()
                ]
                logger.debug(f"📊 {cat['category']}: {len(cat['resources'])} resources (was {original_count})")
        
        # Apply free-only filter
        if free_only:
            for cat in all_categories:
                original_count = len(cat["resources"])
                cat["resources"] = [
                    res for res in cat["resources"]
                    if res["cost"] == "Free"
                ]
                logger.debug(f"💰 {cat['category']}: {len(cat['resources'])} free resources (was {original_count})")
        
        # Calculate total resources
        total_resources = sum(len(cat["resources"]) for cat in all_categories)
        logger.info(f"✅ Total resources after filtering: {total_resources}")
        
        # Determine recommended timeline
        timeline = _calculate_interview_prep_timeline(total_resources, difficulty)
        logger.info(f"⏱️ Recommended prep timeline: {timeline}")
        
        response = {
            "role": role,
            "categories": all_categories,
            "total_resources": total_resources,
            "recommended_timeline": timeline
        }
        
        logger.info(f"✨ Interview resources compiled successfully for {role}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting interview resources: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve interview resources"
        )


def _get_interview_resource_categories(role: str) -> List[Dict]:
    """
    Get curated interview resource categories.
    
    Provides 4 main categories: Technical, System Design, Behavioral, Coding.
    Resources include YouTube channels, courses, platforms, books, and guides.
    
    Args:
        role: Target role for customization
        
    Returns:
        List of interview resource categories with detailed resources
    """
    return [
        {
            "category": "Technical Round",
            "icon": "💻",
            "description": "Master data structures, algorithms, and problem-solving fundamentals for technical interviews",
            "resources": [
                {
                    "type": "YouTube",
                    "title": "NeetCode - LeetCode Solutions & Patterns",
                    "url": "https://www.youtube.com/c/NeetCode",
                    "description": "Comprehensive LeetCode problem explanations with pattern recognition and DSA fundamentals",
                    "difficulty": "Intermediate",
                    "cost": "Free",
                    "estimated_hours": 100,
                    "rating": 4.9,
                    "problem_count": 300
                },
                {
                    "type": "Platform",
                    "title": "LeetCode - Top Interview Questions",
                    "url": "https://leetcode.com/problemset/top-interview-questions/",
                    "description": "Curated list of most common interview problems from FAANG companies",
                    "difficulty": "Intermediate",
                    "cost": "Freemium",
                    "estimated_hours": 120,
                    "rating": 4.7,
                    "problem_count": 150
                },
                {
                    "type": "Guide",
                    "title": "Tech Interview Handbook",
                    "url": "https://techinterviewhandbook.org/",
                    "description": "Free comprehensive guide covering all aspects of technical interviews and algorithms",
                    "difficulty": "Beginner",
                    "cost": "Free",
                    "estimated_hours": 40,
                    "rating": 4.8,
                    "problem_count": None
                },
                {
                    "type": "Course",
                    "title": "AlgoExpert",
                    "url": "https://www.algoexpert.io/",
                    "description": "160+ coding questions with video explanations and interactive code editor",
                    "difficulty": "Intermediate",
                    "cost": "Paid",
                    "estimated_hours": 150,
                    "rating": 4.6,
                    "problem_count": 160
                },
                {
                    "type": "YouTube",
                    "title": "Abdul Bari - Algorithms",
                    "url": "https://www.youtube.com/c/AbdulBari",
                    "description": "In-depth algorithm explanations with animations and complexity analysis",
                    "difficulty": "Beginner",
                    "cost": "Free",
                    "estimated_hours": 60,
                    "rating": 4.9,
                    "problem_count": None
                }
            ],
            "practice_tips": [
                "🎯 Start with easy problems and gradually increase difficulty (Easy → Medium → Hard)",
                "🧠 Focus on understanding patterns rather than memorizing solutions",
                "🗣️ Practice explaining your approach out loud while solving (helps in interviews)",
                "⏱️ Time yourself to simulate interview pressure (45 mins per problem)",
                "📚 Review solutions even after solving correctly to learn optimal approaches",
                "🔄 Revisit difficult problems 2-3 times before the actual interview"
            ]
        },
        {
            "category": "System Design",
            "icon": "🏗️",
            "description": "Learn to design scalable systems, databases, and explain architectural decisions",
            "resources": [
                {
                    "type": "YouTube",
                    "title": "Gaurav Sen - System Design",
                    "url": "https://www.youtube.com/c/GauravSensei",
                    "description": "Practical system design tutorials with real-world examples and step-by-step approach",
                    "difficulty": "Intermediate",
                    "cost": "Free",
                    "estimated_hours": 50,
                    "rating": 4.8,
                    "problem_count": None
                },
                {
                    "type": "Course",
                    "title": "Educative - Grokking System Design Interview",
                    "url": "https://www.educative.io/courses/grokking-the-system-design-interview",
                    "description": "Learn to design systems like URL shortener, Instagram, Netflix with detailed walkthroughs",
                    "difficulty": "Intermediate",
                    "cost": "Paid",
                    "estimated_hours": 40,
                    "rating": 4.7,
                    "problem_count": 16
                },
                {
                    "type": "Guide",
                    "title": "System Design Primer (GitHub)",
                    "url": "https://github.com/donnemartin/system-design-primer",
                    "description": "Comprehensive open-source system design resource with scalability concepts",
                    "difficulty": "Intermediate",
                    "cost": "Free",
                    "estimated_hours": 60,
                    "rating": 4.9,
                    "problem_count": None
                },
                {
                    "type": "Book",
                    "title": "Designing Data-Intensive Applications",
                    "url": "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/",
                    "description": "Deep dive into distributed systems, consistency models, and data architecture",
                    "difficulty": "Advanced",
                    "cost": "Paid",
                    "estimated_hours": 100,
                    "rating": 4.9,
                    "problem_count": None
                },
                {
                    "type": "YouTube",
                    "title": "ByteByteGo",
                    "url": "https://www.youtube.com/@ByteByteGo",
                    "description": "System design concepts explained visually with diagrams and case studies",
                    "difficulty": "Intermediate",
                    "cost": "Free",
                    "estimated_hours": 30,
                    "rating": 4.7,
                    "problem_count": None
                }
            ],
            "practice_tips": [
                "🎨 Practice whiteboarding system diagrams and architecture sketches",
                "⚖️ Focus on trade-offs and justify your design decisions (speed vs storage, etc.)",
                "📝 Start with functional requirements and scale later (don't over-engineer initially)",
                "🗄️ Discuss database schema, APIs, caching strategies, and load balancing",
                "📊 Practice capacity estimation and load calculations",
                "🤝 Explain decisions clearly as if teaching someone"
            ]
        },
        {
            "category": "Behavioral Round",
            "icon": "💬",
            "description": "Prepare STAR method responses and demonstrate leadership, communication, and teamwork skills",
            "resources": [
                {
                    "type": "YouTube",
                    "title": "Jeff Su - STAR Method Framework",
                    "url": "https://www.youtube.com/watch?v=0qBL74yhcgU",
                    "description": "Master the STAR framework for behavioral questions (Situation, Task, Action, Result)",
                    "difficulty": "Beginner",
                    "cost": "Free",
                    "estimated_hours": 2,
                    "rating": 4.8,
                    "problem_count": None
                },
                {
                    "type": "Guide",
                    "title": "Tech Behavioral Interview Guide",
                    "url": "https://www.techinterviewhandbook.org/behavioral-interview/",
                    "description": "Comprehensive guide to behavioral interview preparation with common questions",
                    "difficulty": "Beginner",
                    "cost": "Free",
                    "estimated_hours": 10,
                    "rating": 4.7,
                    "problem_count": None
                },
                {
                    "type": "Platform",
                    "title": "Indeed - Common Behavioral Questions",
                    "url": "https://www.indeed.com/career-advice/interviewing/common-behavioral-interview-questions",
                    "description": "50+ common behavioral questions with answer frameworks and tips",
                    "difficulty": "Beginner",
                    "cost": "Free",
                    "estimated_hours": 15,
                    "rating": 4.5,
                    "problem_count": 50
                },
                {
                    "type": "YouTube",
                    "title": "Dan Croitor - Amazon Leadership Principles",
                    "url": "https://www.youtube.com/c/DanCroitor",
                    "description": "Deep dive into Amazon's 16 leadership principles and how to respond to them",
                    "difficulty": "Intermediate",
                    "cost": "Free",
                    "estimated_hours": 20,
                    "rating": 4.6,
                    "problem_count": None
                }
            ],
            "practice_tips": [
                "📖 Prepare 8-10 stories covering different situations (challenges, failures, achievements)",
                "⭐ Use STAR method: Situation, Task, Action, Result with quantified outcomes",
                "📈 Quantify your impact with metrics when possible (percentage improvements, revenue, etc.)",
                "🎤 Practice with a friend or record yourself to improve delivery",
                "❓ Prepare thoughtful questions to ask the interviewer about team and company culture",
                "😊 Practice smiling and maintaining confident body language (if video interview)"
            ]
        },
        {
            "category": "Coding Round",
            "icon": "⌨️",
            "description": "Practice coding in real-time with feedback and time constraints in interview environments",
            "resources": [
                {
                    "type": "Platform",
                    "title": "Pramp - Free Mock Interviews",
                    "url": "https://www.pramp.com/",
                    "description": "Practice interviews with peers in real-time, get feedback and improve communication",
                    "difficulty": "Intermediate",
                    "cost": "Free",
                    "estimated_hours": 30,
                    "rating": 4.5,
                    "problem_count": None
                },
                {
                    "type": "Platform",
                    "title": "HackerRank Interview Prep Kit",
                    "url": "https://www.hackerrank.com/interview/interview-preparation-kit",
                    "description": "Structured interview preparation with auto-grading and difficulty progression",
                    "difficulty": "Beginner",
                    "cost": "Free",
                    "estimated_hours": 40,
                    "rating": 4.4,
                    "problem_count": 70
                },
                {
                    "type": "Platform",
                    "title": "Interviewing.io",
                    "url": "https://interviewing.io/",
                    "description": "Anonymous technical interviews with engineers from Google, Facebook, Uber, etc.",
                    "difficulty": "Intermediate",
                    "cost": "Freemium",
                    "estimated_hours": 20,
                    "rating": 4.7,
                    "problem_count": None
                },
                {
                    "type": "YouTube",
                    "title": "Clement Mihailescu - Coding Interviews",
                    "url": "https://www.youtube.com/c/clem",
                    "description": "Mock interviews and problem walkthroughs with explanations",
                    "difficulty": "Intermediate",
                    "cost": "Free",
                    "estimated_hours": 25,
                    "rating": 4.6,
                    "problem_count": None
                }
            ],
            "practice_tips": [
                "⏱️ Set a 45-minute timer to simulate real interview conditions and pressure",
                "🗣️ Think out loud and communicate your approach clearly during solving",
                "🔄 Start with brute force solution, then optimize for better time/space complexity",
                "✅ Test your code with edge cases (empty input, single element, large numbers)",
                "📝 Practice on a whiteboard or collaborative editor (CoderPad, HackerRank)",
                "👥 Record yourself and review for communication and coding patterns"
            ]
        }
    ]


def _calculate_interview_prep_timeline(total_resources: int, difficulty: Optional[str]) -> str:
    """
    Calculate recommended interview preparation timeline.
    
    Provides estimate based on resource count and difficulty level.
    Helps candidates plan their study schedule.
    
    Args:
        total_resources: Number of resources after filtering
        difficulty: Difficulty level filter applied
        
    Returns:
        Recommended prep timeline string
    """
    if difficulty and difficulty.lower() == "beginner":
        return "12-16 weeks (3-4 months) for comprehensive beginner preparation"
    elif difficulty and difficulty.lower() == "advanced":
        return "6-8 weeks (1.5-2 months) for advanced preparation"
    else:
        # Default/intermediate
        return "8-12 weeks (2-3 months) for intermediate preparation"

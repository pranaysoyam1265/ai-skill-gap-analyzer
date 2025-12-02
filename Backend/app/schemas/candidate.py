"""
Pydantic schemas for Candidate-related API requests/responses
"""
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.schemas.skill import CandidateSkillResponse


class CandidateBase(BaseModel):
    """Base schema for Candidate"""
    name: str = Field(..., min_length=1, max_length=255, description="Full name")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=255)
    summary: Optional[str] = Field(None, description="Professional summary")


class CandidateCreate(CandidateBase):
    """Schema for creating a candidate"""
    user_id: UUID = Field(..., description="Supabase user ID")


class CandidateUpdate(BaseModel):
    """Schema for updating a candidate"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None


class CandidateInDB(CandidateBase):
    """Schema for Candidate as stored in database"""
    id: int
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CandidateResponse(BaseModel):
    """Basic candidate response"""
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    
    class Config:
        from_attributes = True


class CandidateDetailResponse(CandidateResponse):
    """Detailed candidate response with skills"""
    skills: Dict[str, Any] = Field(
        default_factory=lambda: {
            "total": 0,
            "by_category": {},
            "detailed": []
        }
    )
    
    class Config:
        from_attributes = True


class GapAnalysisSummary(BaseModel):
    """Gap analysis summary for dashboard"""
    average_proficiency: float = 0.0
    skills_below_market: int = 0
    improvement_priority: Optional[str] = None
    market_alignment_percentage: int = 0
    top_gaps: List[Dict[str, Any]] = []
    insights: List[str] = []


class MarketTrendsSummary(BaseModel):
    """Market trends summary for dashboard"""
    trending_up: int = 0
    stable: int = 0
    declining: int = 0
    coverage_percentage: int = 0
    fastest_growing: Optional[str] = None
    insights: List[str] = []


class ProficiencyDistribution(BaseModel):
    """Proficiency distribution for dashboard"""
    beginner: int = 0
    intermediate: int = 0
    advanced: int = 0
    expert: int = 0


class DashboardResponse(BaseModel):
    """Complete dashboard API response"""
    candidate_id: int
    name: str
    skills: List[CandidateSkillResponse] = []
    gap_analysis: GapAnalysisSummary
    market_trends: MarketTrendsSummary
    proficiency_distribution: ProficiencyDistribution
    
    class Config:
        from_attributes = True

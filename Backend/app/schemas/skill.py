"""
Pydantic schemas for Skill-related API requests/responses
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


class SkillBase(BaseModel):
    """Base schema for Skill"""
    name: str = Field(..., min_length=1, max_length=255, description="Skill name")
    category: str = Field(..., min_length=1, max_length=100, description="Skill category")
    description: Optional[str] = Field(None, description="Skill description")
    aliases: Optional[List[str]] = Field(None, description="Alternative names for this skill")


class SkillCreate(SkillBase):
    """Schema for creating a new skill"""
    pass


class SkillUpdate(BaseModel):
    """Schema for updating a skill"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    aliases: Optional[List[str]] = None


class SkillInDB(SkillBase):
    """Schema for Skill as stored in database"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True  # Allows ORM model conversion


class SkillResponse(BaseModel):
    """Schema for Skill API response"""
    id: int
    name: str
    category: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class CandidateSkillBase(BaseModel):
    """Base schema for CandidateSkill relationship"""
    skill_id: int
    proficiency: Optional[float] = Field(None, ge=0, le=5, description="Proficiency level 0-5")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Extraction confidence 0-1")
    years_of_experience: Optional[int] = Field(None, ge=0, description="Years of experience")
    last_used: Optional[date] = None
    extraction_method: Optional[str] = Field(None, max_length=50)


class CandidateSkillCreate(CandidateSkillBase):
    """Schema for creating candidate skill"""
    pass


class CandidateSkillResponse(BaseModel):
    """Schema for CandidateSkill API response (with skill details)"""
    id: int
    name: str
    category: str
    proficiency: Optional[float] = None
    confidence: Optional[float] = None
    years_of_experience: Optional[int] = None
    last_used: Optional[str] = None
    extraction_method: Optional[str] = None
    market_demand: Optional[int] = None
    trend: Optional[str] = None
    trend_percentage: Optional[float] = None
    job_roles: List[str] = []
    job_levels: List[str] = []
    recommendation: Optional[str] = None
    
    class Config:
        from_attributes = True


class SkillMarketDataResponse(BaseModel):
    """Schema for skill market data"""
    name: str
    demand_score: Optional[int] = Field(None, ge=0, le=100)
    trend: Optional[str] = None
    trend_percentage: Optional[float] = None
    last_updated: str
    
    class Config:
        from_attributes = True


class SkillSearchRequest(BaseModel):
    """Schema for skill search request"""
    query: str = Field(..., min_length=1, description="Search query")
    limit: int = Field(20, ge=1, le=100, description="Max results")


class SkillSearchResponse(BaseModel):
    """Schema for skill search response"""
    success: bool = True
    query: str
    count: int
    skills: List[SkillResponse]

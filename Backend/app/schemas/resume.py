"""
Pydantic schemas for Resume upload and analysis
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime


class SkillExtractionResult(BaseModel):
    """Individual skill extraction result"""
    id: int
    name: str
    category: str
    proficiency: float = Field(..., ge=0, le=5)
    confidence: float = Field(..., ge=0, le=1)
    years_of_experience: Optional[int] = None
    extraction_method: str


class SkillsAnalysisResult(BaseModel):
    """Complete skills analysis result"""
    total: int = 0
    all_skills: List[str] = []
    detailed: List[SkillExtractionResult] = []
    categorized: Dict[str, List[str]] = {}
    extraction_methods: Optional[str] = None


class SkillGapsResult(BaseModel):
    """Skill gaps analysis result"""
    coverage: float = Field(..., ge=0, le=100, description="Coverage percentage")
    missing_count: int = 0
    priority_gaps: List[str] = []
    gaps_by_category: Optional[Dict[str, int]] = None


class CourseRecommendation(BaseModel):
    """Course recommendation"""
    id: int
    title: str
    platform: str
    url: str
    rating: Optional[float] = None
    level: Optional[str] = None
    description: Optional[str] = None


class ProcessingMetadata(BaseModel):
    """Resume processing metadata"""
    file_char_count: int
    file_word_count: Optional[int] = None
    processing_time_ms: int
    method: Optional[str] = "NER + Dictionary"
    text_extracted: Optional[int] = None
    file_format: Optional[str] = None
    upload_id: Optional[str] = None


class ResumeAnalysisResponse(BaseModel):
    """Complete resume analysis API response"""
    success: bool = True
    candidate_id: int
    resume_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    skills: SkillsAnalysisResult
    skill_gaps: SkillGapsResult
    recommendations: List[CourseRecommendation] = []
    metadata: ProcessingMetadata
    
    class Config:
        from_attributes = True


class ResumeUploadRequest(BaseModel):
    """Request schema for resume upload (not used with file upload)"""
    pass


class ResumeProcessingError(BaseModel):
    """Error response for resume processing"""
    success: bool = False
    error: str
    detail: Optional[str] = None
    code: str = "PROCESSING_ERROR"

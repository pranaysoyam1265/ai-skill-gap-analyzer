"""
Candidate database model
Represents a user's resume/profile
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Candidate(Base):
    """
    Candidate model - represents a person whose resume was analyzed
    """
    __tablename__ = "candidates"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign Key to Supabase auth.users (using UUID)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Basic Info
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    candidate_skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Candidate(id={self.id}, name='{self.name}', email='{self.email}')>"

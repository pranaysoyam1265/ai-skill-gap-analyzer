"""
Skill database models
Represents skills, market data, and candidate-skill relationships
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, DECIMAL, ARRAY, Date, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Skill(Base):
    """
    Master skill table - contains all known skills
    """
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    aliases = Column(ARRAY(String), nullable=True)  # Alternative names
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    candidate_skills = relationship("CandidateSkill", back_populates="skill")
    
    def __repr__(self):
        return f"<Skill(id={self.id}, name='{self.name}', category='{self.category}')>"


class CandidateSkill(Base):
    """
    Junction table linking candidates to skills with metadata
    """
    __tablename__ = "candidate_skills"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    
    # Skill Metadata
    proficiency = Column(DECIMAL(3, 2), nullable=True)  # 0.00 to 5.00
    confidence = Column(DECIMAL(3, 2), nullable=True)  # 0.00 to 1.00
    years_of_experience = Column(Integer, nullable=True)
    last_used = Column(Date, nullable=True)
    extraction_method = Column(String(50), nullable=True)  # "NER", "Dictionary", "Gemini"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    candidate = relationship("Candidate", back_populates="candidate_skills")
    skill = relationship("Skill", back_populates="candidate_skills")
    
    # Indexes
    __table_args__ = (
        Index('idx_candidate_skill_unique', 'candidate_id', 'skill_id', unique=True),
        Index('idx_candidate_skills_candidate', 'candidate_id'),
        Index('idx_candidate_skills_skill', 'skill_id'),
    )
    
    def __repr__(self):
        return f"<CandidateSkill(candidate_id={self.candidate_id}, skill_id={self.skill_id}, proficiency={self.proficiency})>"

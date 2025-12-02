"""
Skill History Model

Tracks skill acquisition and development events for candidates.
Records various event types: acquisitions, proficiency upgrades, certifications, projects.

This model enables the Skill Journey Timeline feature which shows candidates
a chronological view of their skill development journey.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class EventTypeEnum(str, enum.Enum):
    """Enum for skill journey event types"""
    skill_acquired = "skill_acquired"
    proficiency_upgrade = "proficiency_upgrade"
    certification = "certification"
    project_completed = "project_completed"
    course_completed = "course_completed"


class SkillHistory(Base):
    """
    Track skill-related events for a candidate's journey.
    
    This table records important milestones in a candidate's skill development:
    - When they acquire a new skill
    - When they upgrade their proficiency level
    - When they earn certifications
    - When they complete projects or courses
    
    Attributes:
        id: Primary key
        candidate_id: Reference to candidate
        skill_name: Name of the skill
        event_type: Type of event (enum)
        description: Human-readable event description
        previous_level: Previous proficiency level (for upgrades)
        new_level: New proficiency level (for upgrades)
        certification_name: Name of certification earned
        project_name: Name of project completed
        created_at: When the event occurred/was recorded
        metadata_json: Additional flexible data (JSON)
    """
    __tablename__ = "skill_history"
    
    # Primary and foreign keys
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer, 
        ForeignKey("candidates.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    
    # Core event data
    skill_name = Column(String(200), nullable=False, index=True)
    event_type = Column(
        SQLEnum(EventTypeEnum), 
        nullable=False, 
        index=True
    )
    description = Column(Text, nullable=True)
    
    # For proficiency upgrade events
    previous_level = Column(Integer, nullable=True)
    new_level = Column(Integer, nullable=True)
    
    # For certification events
    certification_name = Column(String(200), nullable=True)
    
    # For project completion events
    project_name = Column(String(200), nullable=True)
    
    # Timestamps
    created_at = Column(
        DateTime, 
        default=func.now(), 
        nullable=False,
        index=True
    )
    
    # Flexible metadata for future extensions
    metadata_json = Column(Text, nullable=True)
    
    def __repr__(self) -> str:
        return (
            f"<SkillHistory(id={self.id}, candidate_id={self.candidate_id}, "
            f"skill_name='{self.skill_name}', event_type={self.event_type.value}, "
            f"created_at={self.created_at})>"
        )

"""
Career Summary Cache Model

Stores cached AI-generated career summaries to reduce API calls and improve performance.
Cache entries expire after 24 hours.

Database Table: career_summary_cache
- id: Primary key
- cache_key: Unique key combining candidate_id and context
- candidate_id: Reference to candidate
- context: Generation context (career_growth, job_search, upskilling)
- summary_data: JSON-serialized summary data
- expires_at: Cache expiration timestamp
- created_at: Cache creation timestamp
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Index
from app.core.database import Base
from datetime import datetime


class CareerSummaryCache(Base):
    """
    Cache model for storing generated career summaries.
    
    Stores AI-generated career summaries with 24-hour expiration.
    Uses candidate_id + context as cache key for quick lookups.
    
    Attributes:
        id (int): Primary key
        cache_key (str): Unique identifier (candidate_id_context)
        candidate_id (int): Associated candidate ID
        context (str): Summary context (career_growth, job_search, upskilling)
        summary_data (str): JSON-serialized summary response
        expires_at (datetime): Cache expiration time (24h after creation)
        created_at (datetime): Cache creation timestamp
    """
    
    __tablename__ = "career_summary_cache"
    
    id = Column(Integer, primary_key=True, index=True, doc="Primary key")
    cache_key = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
        doc="Unique cache key (candidate_id_context)"
    )
    candidate_id = Column(
        Integer,
        index=True,
        nullable=False,
        doc="Reference to candidate"
    )
    context = Column(
        String(50),
        nullable=False,
        doc="Summary context (career_growth, job_search, upskilling)"
    )
    summary_data = Column(
        Text,
        nullable=False,
        doc="JSON-serialized CareerSummaryResponse"
    )
    expires_at = Column(
        DateTime,
        index=True,
        nullable=False,
        doc="Cache expiration timestamp (24h after creation)"
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        doc="Cache creation timestamp"
    )
    
    __table_args__ = (
        Index('idx_candidate_context', 'candidate_id', 'context'),
        Index('idx_cache_expiry', 'expires_at'),
    )
    
    def __repr__(self):
        """String representation"""
        return (
            f"<CareerSummaryCache(candidate_id={self.candidate_id}, "
            f"context={self.context}, expires_at={self.expires_at})>"
        )

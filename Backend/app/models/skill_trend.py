"""
Skill Trend History model for storing time-series demand data
"""
from sqlalchemy import Column, Integer, String, DateTime, Date, Index, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class SkillTrendHistory(Base):
    """
    Historical trend data for skills - stores time-series demand scores
    """
    __tablename__ = "skill_trend_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    skill_name = Column(String(200), ForeignKey("skill_market_data.skill_name"), nullable=False, index=True)
    month = Column(Date, nullable=False, index=True)
    
    # Core trend data
    demand_score = Column(Integer, nullable=False)  # 0-100
    
    # Optional metadata fields
    job_postings_count = Column(Integer, nullable=True)
    search_volume = Column(Integer, nullable=True)
    github_stars_delta = Column(Integer, nullable=True)
    
    # Tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to SkillMarketData
    skill_market = relationship("SkillMarketData", back_populates="trend_history")

    # Composite unique constraint to prevent duplicates
    __table_args__ = (
        UniqueConstraint('skill_name', 'month', name='uq_skill_trend_skill_month'),
        Index('idx_skill_trend_skill_name', 'skill_name'),
        Index('idx_skill_trend_month', 'month'),
        Index('idx_skill_trend_skill_month', 'skill_name', 'month'),
        Index('idx_skill_trend_demand_score', 'demand_score'),
    )

    def __repr__(self):
        return f"<SkillTrendHistory(skill_name='{self.skill_name}', month='{self.month}', demand={self.demand_score})>"

    @staticmethod
    def validate_demand_score(score: int) -> bool:
        """Validate demand score is between 0 and 100"""
        return 0 <= score <= 100

    @staticmethod
    def validate_month_format(month: str) -> bool:
        """Validate month is in YYYY-MM-01 format"""
        try:
            from datetime import datetime
            parsed = datetime.strptime(month, "%Y-%m-%d")
            return parsed.day == 1
        except ValueError:
            return False

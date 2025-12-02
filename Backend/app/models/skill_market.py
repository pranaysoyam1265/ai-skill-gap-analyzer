"""
Market demand model for skills
"""
from sqlalchemy import Column, Integer, String, DateTime, Enum, Date, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class SkillMarketData(Base):
    """
    Market data for skills - demand, trends, job postings
    """
    __tablename__ = "skill_market_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    skill_name = Column(String(200), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)

    # Market Metrics
    demand_score = Column(Integer, nullable=False)  # 0-100
    trend = Column(Enum("up", "stable", "down", name="trend_enum"), nullable=False)

    # Data Tracking
    last_updated = Column(Date, nullable=False, default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to trend history
    trend_history = relationship("SkillTrendHistory", back_populates="skill_market")

    # Indexes for fast querying
    __table_args__ = (
        Index('idx_skill_market_skill_name', 'skill_name'),
        Index('idx_skill_market_category', 'category'),
        Index('idx_skill_market_demand_score', 'demand_score'),
    )

    def __repr__(self):
        return f"<SkillMarketData(skill_name='{self.skill_name}', demand={self.demand_score}, trend='{self.trend}')>"

    @staticmethod
    def validate_demand_score(score: int) -> bool:
        """Validate demand score is between 0 and 100"""
        return 0 <= score <= 100

    @staticmethod
    def validate_trend(trend: str) -> bool:
        """Validate trend is one of the allowed values"""
        return trend in ["up", "stable", "down"]

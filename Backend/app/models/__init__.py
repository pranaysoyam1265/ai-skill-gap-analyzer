"""
Import all models here for Alembic
"""
from app.models.candidate import Candidate
from app.models.skill import Skill, CandidateSkill
from app.models.skill_market import SkillMarketData
from app.models.skill_trend import SkillTrendHistory

__all__ = ["Candidate", "Skill", "CandidateSkill", "SkillMarketData", "SkillTrendHistory"]

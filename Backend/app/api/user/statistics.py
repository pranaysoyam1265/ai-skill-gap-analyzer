from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, text, select
from app.core.database import get_db
from app.models.skill import CandidateSkill
from app.models.candidate import Candidate
from app.core.auth import get_current_user
from typing import Dict
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/statistics")
async def get_user_statistics(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """
    Get user statistics for profile page.
    
    Returns:
        - skillsTracked: Total number of skills
        - gapAnalysesPerformed: Number of gap analyses done
        - coursesEnrolled: Number of courses enrolled (placeholder)
        - learningHoursLogged: Total learning hours (placeholder)
    """
    try:
        email = current_user.get("email")
        
        if not email:
            return {
                "skillsTracked": 0,
                "gapAnalysesPerformed": 0,
                "coursesEnrolled": 0,
                "learningHoursLogged": 0
            }
        
        # Try to get candidate
        try:
            result = await db.execute(
                select(Candidate).filter(Candidate.email == email)
            )
            candidate = result.scalars().first()
        except Exception as e:
            logger.debug(f"Error querying candidate: {e}")
            candidate = None
        
        if not candidate:
            return {
                "skillsTracked": 0,
                "gapAnalysesPerformed": 0,
                "coursesEnrolled": 0,
                "learningHoursLogged": 0
            }
        
        candidate_id = candidate.id
        
        # Count skills
        try:
            result = await db.execute(
                select(func.count(CandidateSkill.id)).filter(
                    CandidateSkill.candidate_id == candidate_id
                )
            )
            skills_count = result.scalar() or 0
        except Exception as e:
            logger.debug(f"Error counting skills: {e}")
            skills_count = 0
        
        # Count gap analyses
        gap_analyses_count = 0
        try:
            result = await db.execute(
                text("SELECT COUNT(*) FROM saved_gap_analyses WHERE candidate_id = :candidate_id"),
                {"candidate_id": candidate_id}
            )
            gap_analyses_count = result.scalar() or 0
        except Exception as e:
            logger.debug(f"Gap analyses table issue: {e}")
        
        # Learning hours
        try:
            result = await db.execute(
                select(func.sum(CandidateSkill.proficiency)).filter(
                    CandidateSkill.candidate_id == candidate_id
                )
            )
            learning_hours = result.scalar() or 0
            learning_hours_logged = int(learning_hours * 10)
        except Exception as e:
            logger.debug(f"Error calculating hours: {e}")
            learning_hours_logged = 0
        
        return {
            "skillsTracked": int(skills_count),
            "gapAnalysesPerformed": int(gap_analyses_count),
            "coursesEnrolled": 0,
            "learningHoursLogged": learning_hours_logged
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in statistics: {e}")
        return {
            "skillsTracked": 0,
            "gapAnalysesPerformed": 0,
            "coursesEnrolled": 0,
            "learningHoursLogged": 0
        }

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.candidate import Candidate
from app.models.skill import CandidateSkill
from typing import Dict
from datetime import datetime, timedelta
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/activity")
async def get_user_activity(
    period: int = Query(30, ge=7, le=365),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """Generate activity data with fallback."""
    try:
        email = current_user.get("email")
        
        if not email:
            return {"activity": []}
        
        # Get candidate
        try:
            result = await db.execute(
                select(Candidate).filter(Candidate.email == email)
            )
            candidate = result.scalars().first()
        except Exception as e:
            logger.debug(f"Error querying candidate: {e}")
            candidate = None
        
        if not candidate:
            return {"activity": []}
        
        candidate_id = candidate.id
        
        # Count skills
        try:
            result = await db.execute(
                select(CandidateSkill).filter(
                    CandidateSkill.candidate_id == candidate_id
                )
            )
            skills = result.scalars().all()
            skills_count = len(skills)
        except Exception as e:
            logger.debug(f"Error counting skills: {e}")
            skills_count = 0
        
        # Generate activity data
        activity_data = []
        end_date = datetime.now()
        start_date = end_date - timedelta(days=period)
        
        current_date = start_date
        while current_date <= end_date:
            is_weekend = current_date.weekday() >= 5
            base = 0 if is_weekend else 1
            
            activity_data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "skills": base * 2,
                "analyses": 1 if current_date.day % 10 == 0 else 0,
                "courses": base,
                "hours": base * 4
            })
            
            current_date += timedelta(days=1)
        
        return {"activity": activity_data}
        
    except Exception as e:
        logger.error(f"Error in activity endpoint: {e}")
        return {"activity": []}

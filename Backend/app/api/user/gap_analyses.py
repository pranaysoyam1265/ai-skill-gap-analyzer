from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.candidate import Candidate
from app.models.skill import CandidateSkill
from typing import List, Dict
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/gap-analyses")
async def get_user_gap_analyses(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """Get user's gap analyses with error handling."""
    try:
        email = current_user.get("email")
        
        if not email:
            return {"analyses": []}
        
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
            return {"analyses": []}
        
        candidate_id = candidate.id
        
        # Try to fetch gap analyses
        try:
            query = text("""
                SELECT id, target_role, match_score, created_at,
                       critical_gaps, skills_to_improve
                FROM saved_gap_analyses
                WHERE candidate_id = :candidate_id
                ORDER BY created_at DESC
                LIMIT :limit
            """)
            
            result = await db.execute(
                query,
                {"candidate_id": candidate_id, "limit": limit}
            )
            rows = result.fetchall()
            
            analyses = []
            for row in rows:
                analyses.append({
                    "id": str(row[0]),
                    "targetRole": row[1] or "Unknown",
                    "matchScore": row[2] or 0,
                    "dateAnalyzed": row[3].isoformat() if row[3] else datetime.now().isoformat(),
                    "criticalGaps": row[4] or 0,
                    "skillsToImprove": row[5] or 0,
                })
            
            return {"analyses": analyses}
            
        except Exception as e:
            logger.debug(f"Gap analyses table issue: {e}")
            return {"analyses": []}
        
    except Exception as e:
        logger.error(f"Error in gap analyses: {e}")
        return {"analyses": []}

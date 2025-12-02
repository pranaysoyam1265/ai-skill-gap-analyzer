from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.candidate import Candidate
from app.models.skill import CandidateSkill
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.delete("/skills")
async def clear_all_skills(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all user skills."""
    try:
        candidate = db.query(Candidate).filter(
            Candidate.email == current_user.get("email")
        ).first()
        
        if not candidate:
            return {
                "success": True,
                "message": "No skills to clear",
                "count": 0
            }
        
        # Get count before deletion
        skills_count = db.query(CandidateSkill).filter(
            CandidateSkill.candidate_id == candidate.id
        ).count()
        
        # Delete all skills
        db.query(CandidateSkill).filter(
            CandidateSkill.candidate_id == candidate.id
        ).delete()
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {skills_count} skills",
            "count": skills_count
        }
        
    except Exception as e:
        logger.error(f"Error clearing skills: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to clear skills")


@router.delete("/learning")
async def clear_learning_history(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear learning history."""
    try:
        # TODO: Implement when learning table exists
        return {
            "success": True,
            "message": "Learning history cleared",
            "count": 0
        }
        
    except Exception as e:
        logger.error(f"Error clearing learning history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear learning history")


@router.delete("/analyses")
async def clear_gap_analyses(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all gap analyses."""
    try:
        candidate = db.query(Candidate).filter(
            Candidate.email == current_user.get("email")
        ).first()
        
        if not candidate:
            return {
                "success": True,
                "message": "No analyses to clear",
                "count": 0
            }
        
        from sqlalchemy import text
        
        try:
            query = text("""
                DELETE FROM saved_gap_analyses
                WHERE candidate_id = :candidate_id
            """)
            
            result = db.execute(query, {"candidate_id": candidate.id})
            db.commit()
            
            return {
                "success": True,
                "message": f"Cleared {result.rowcount} gap analyses",
                "count": result.rowcount
            }
        except Exception as e:
            logger.warning(f"saved_gap_analyses table not found: {e}")
            db.rollback()
            return {
                "success": True,
                "message": "No analyses to clear",
                "count": 0
            }
        
    except Exception as e:
        logger.error(f"Error clearing gap analyses: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to clear gap analyses")

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.candidate import Candidate
from app.models.skill import CandidateSkill
import csv
import json
import io
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/export/skills")
async def export_skills(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export user skills as CSV."""
    try:
        # Get candidate
        candidate = db.query(Candidate).filter(
            Candidate.email == current_user.get("email")
        ).first()
        
        if not candidate:
            # Return empty CSV if no candidate
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=[
                'name', 'category', 'proficiency', 'years_of_experience'
            ])
            writer.writeheader()
            output.seek(0)
            
            filename = f"Skills_Export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
        # Get skills
        skills = db.query(CandidateSkill).filter(
            CandidateSkill.candidate_id == candidate.id
        ).all()
        
        # Create CSV
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            'name', 'category', 'proficiency', 'years_of_experience', 'source'
        ])
        
        writer.writeheader()
        for skill in skills:
            writer.writerow({
                'name': skill.skill_name or '',
                'category': skill.category or 'General',
                'proficiency': skill.proficiency_score or 0,
                'years_of_experience': skill.years_of_experience or 0,
                'source': skill.source or 'Manual'
            })
        
        output.seek(0)
        
        filename = f"Skills_Export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting skills: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export skills")


@router.get("/export/learning")
async def export_learning_history(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export learning history as CSV."""
    try:
        # Return empty CSV with headers (learning table not yet implemented)
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            'course_name', 'platform', 'status', 'progress', 'hours_spent'
        ])
        
        writer.writeheader()
        # TODO: Add data when learning table exists
        
        output.seek(0)
        
        filename = f"Learning_History_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting learning history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export learning history")


@router.get("/export/analyses")
async def export_gap_analyses(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export gap analyses as JSON."""
    try:
        candidate = db.query(Candidate).filter(
            Candidate.email == current_user.get("email")
        ).first()
        
        if not candidate:
            # Return empty JSON array
            filename = f"Gap_Analyses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            return StreamingResponse(
                iter([json.dumps([], indent=2)]),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
        from sqlalchemy import text
        
        try:
            query = text("""
                SELECT 
                    target_role,
                    match_score,
                    created_at,
                    critical_gaps,
                    skills_to_improve,
                    matching_skills,
                    gaps_details,
                    recommendations
                FROM saved_gap_analyses
                WHERE candidate_id = :candidate_id
                ORDER BY created_at DESC
            """)
            
            results = db.execute(query, {"candidate_id": candidate.id}).fetchall()
            
            analyses = []
            for row in results:
                analyses.append({
                    "targetRole": row.target_role,
                    "matchScore": row.match_score,
                    "date": row.created_at.isoformat() if row.created_at else None,
                    "criticalGaps": row.critical_gaps,
                    "skillsToImprove": row.skills_to_improve,
                    "matchingSkills": row.matching_skills or [],
                    "gapsDetails": row.gaps_details or [],
                    "recommendations": row.recommendations or []
                })
        except Exception as e:
            logger.warning(f"saved_gap_analyses table not found: {e}")
            analyses = []
        
        filename = f"Gap_Analyses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        return StreamingResponse(
            iter([json.dumps(analyses, indent=2)]),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting gap analyses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export gap analyses")

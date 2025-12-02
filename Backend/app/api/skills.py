from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from typing import List, Dict, Optional
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/trends")
async def get_market_trends(
    skills: str = Query(..., description="Comma-separated skill names"),
    months: int = Query(12, ge=6, le=24, description="Number of months"),
    db: Session = Depends(get_db)
):
    """
    Get market demand trends for specified skills.
    
    Args:
        skills: Comma-separated list of skill names
        months: Number of months of historical data
        
    Returns:
        Historical market demand data for each skill
    """
    try:
        # Parse skill list
        skill_list = [s.strip() for s in skills.split(',') if s.strip()]
        
        if not skill_list:
            raise HTTPException(
                status_code=400,
                detail="No valid skills provided"
            )
        
        # Limit to 10 skills
        skill_list = skill_list[:10]
        
        # Generate month labels
        month_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        # Generate synthetic trend data for each skill
        trends_data = {}
        
        for skill_name in skill_list:
            # Base demand by skill (you can make this dynamic later)
            base_demands = {
                'react': 87, 'typescript': 82, 'python': 85, 'javascript': 90,
                'node': 80, 'docker': 75, 'kubernetes': 78, 'aws': 88,
                'java': 82, 'postgresql': 79, 'mongodb': 76, 'redis': 73,
                'graphql': 70, 'vue': 68, 'angular': 65, 'nextjs': 84,
                'express': 77, 'fastapi': 75, 'django': 78, 'flask': 72
            }
            
            skill_lower = skill_name.lower()
            base_demand = base_demands.get(skill_lower, 70)
            
            # Determine trend pattern
            if any(x in skill_lower for x in ['typescript', 'kubernetes', 'rust', 'go', 'nextjs']):
                trend_type = 'rising'
                monthly_demand = [base_demand + (i * 0.8) for i in range(months)]
            elif any(x in skill_lower for x in ['angular', 'jquery', 'php']):
                trend_type = 'declining'
                monthly_demand = [base_demand - (i * 0.5) for i in range(months)]
            else:
                trend_type = 'stable'
                monthly_demand = [base_demand + (i % 3 - 1) for i in range(months)]
            
            # Clamp values
            monthly_demand = [max(30, min(100, round(val))) for val in monthly_demand]
            
            # Calculate statistics
            first_value = monthly_demand[0]
            last_value = monthly_demand[-1]
            percent_change = ((last_value - first_value) / first_value * 100) if first_value != 0 else 0
            
            trends_data[skill_name] = {
                "monthly_demand": monthly_demand,
                "trend": trend_type,
                "percent_change": round(percent_change, 1),
                "current_demand": last_value,
                "data_source": "estimated"
            }
        
        return {
            "skills": trends_data,
            "months": month_labels[:months],
            "data_period_months": months,
            "skills_analyzed": len(skill_list),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching market trends: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve market trends"
        )

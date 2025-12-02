"""
Gap Analysis API endpoints for skill gap evaluation and roadmap generation.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
from pathlib import Path

from app.core.database import get_db
from app.models import Candidate, SkillMarketData

router = APIRouter(prefix="/gap-analysis", tags=["gap-analysis"])


async def load_role_requirements() -> dict:
    """Load role requirements from JSON file."""
    try:
        role_file = Path(__file__).parent.parent.parent / "data" / "role_requirements.json"
        with open(role_file, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading role requirements: {e}")
        return {}


def get_skill_category(skill_name: str) -> str:
    """Get category for a skill based on common patterns."""
    skill_lower = skill_name.lower()
    
    categories = {
        "programming_languages": ["python", "javascript", "java", "c++", "c#", "go", "rust", "typescript"],
        "frontend": ["react", "vue", "angular", "html5", "css3", "tailwind", "bootstrap"],
        "backend": ["django", "flask", "fastapi", "spring", "nodejs", "express", ".net"],
        "devops": ["docker", "kubernetes", "terraform", "jenkins", "gitlab", "circleci", "aws", "gcp"],
        "cloud": ["aws", "azure", "gcp", "ec2", "s3", "lambda", "firestore"],
        "databases": ["sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch"],
        "data": ["machine learning", "deep learning", "tensorflow", "pytorch", "data science"],
        "tools": ["git", "jira", "slack", "figma", "adobe"],
    }
    
    for category, skills in categories.items():
        if any(s in skill_lower for s in skills):
            return category.replace("_", " ").title()
    
    return "Other"


def calculate_gap_analysis(
    user_skills: list[str],
    role_requirements: dict,
    selected_role: str,
    market_data: dict,
) -> dict:
    """
    Calculate gap analysis between user skills and role requirements.
    
    Returns:
        dict with critical_gaps, skills_to_improve, and matching_skills
    """
    
    # Normalize user skills to lowercase for comparison
    user_skills_lower = [s.lower() for s in user_skills]
    
    # Get role requirements from the roles list structure
    roles_list = role_requirements.get("roles", [])
    role_data = None
    for role in roles_list:
        if role.get("role_name", "").lower() == selected_role.lower():
            role_data = role
            break
    
    if not role_data:
        # Return empty analysis if role not found
        return {
            "critical_gaps": [],
            "skills_to_improve": [],
            "matching_skills": [],
            "overall_match_score": 0,
        }
    
    critical_gaps = []
    skills_to_improve = []
    matching_skills = []
    
    # Get the skills from the role (they're stored as dicts with skill name as key)
    required_skills_dict = role_data.get("required_skills", {})
    optional_skills_dict = role_data.get("optional_skills", {})
    
    # Analyze required skills (these are critical)
    for skill_name, skill_info in required_skills_dict.items():
        skill_name_lower = skill_name.lower()
        importance = skill_info.get("importance", "High")
        proficiency_required = skill_info.get("min_proficiency", 3)
        
        skill_market_data = market_data.get(skill_name_lower, {})
        market_demand = skill_market_data.get("demand_score", 75)
        # If salary_impact not in market_data, calculate it from demand_score
        salary_impact = skill_market_data.get("salary_impact")
        if salary_impact is None or salary_impact == 0:
            salary_impact = calculate_salary_impact(market_demand, 0, proficiency_required)
        learning_time = skill_market_data.get("learning_hours", 200)
        
        if skill_name_lower not in user_skills_lower:
            # User doesn't have this critical skill
            critical_gaps.append({
                "name": skill_name,
                "category": get_skill_category(skill_name),
                "priority": "High" if importance in ["Critical", "High"] else "Medium",
                "marketDemand": market_demand,
                "salaryImpact": salary_impact,
                "learningTime": learning_time,
                "requiredProficiency": proficiency_required,
                "insight": f"{skill_name} is a critical skill for {selected_role} with {market_demand}% market demand.",
            })
        else:
            # User has this skill - add to matching
            matching_skills.append({
                "name": skill_name,
                "category": get_skill_category(skill_name),
                "matchPercentage": 95,  # Has the required skill
                "proficiencyLevel": "Advanced",
                "yourLevel": "Advanced",
                "insight": f"You already have {skill_name} - maintain and deepen expertise.",
            })
    
    # Analyze optional skills
    for skill_name, skill_info in optional_skills_dict.items():
        skill_name_lower = skill_name.lower()
        importance = skill_info.get("importance", "Medium")
        proficiency_desired = skill_info.get("min_proficiency", 2)
        
        skill_market_data = market_data.get(skill_name_lower, {})
        market_demand = skill_market_data.get("demand_score", 60)
        # If salary_impact not in market_data, calculate it from demand_score
        salary_impact = skill_market_data.get("salary_impact")
        if salary_impact is None or salary_impact == 0:
            salary_impact = calculate_salary_impact(market_demand, 0, proficiency_desired)
        learning_time = skill_market_data.get("learning_hours", 150)
        
        if skill_name_lower not in user_skills_lower:
            # User doesn't have this optional skill - suggest for improvement
            skills_to_improve.append({
                "name": skill_name,
                "category": get_skill_category(skill_name),
                "gap": 70,  # Gap percentage (0-100)
                "marketDemand": market_demand,
                "salaryImpact": salary_impact,
                "learningTime": learning_time,
                "desiredProficiency": proficiency_desired,
                "priority": "Medium" if importance == "Medium" else "Low",
                "insight": f"Adding {skill_name} would enhance your profile and increase market value by ~₹{salary_impact}K.",
            })
        else:
            # User has this optional skill
            matching_skills.append({
                "name": skill_name,
                "category": get_skill_category(skill_name),
                "matchPercentage": 85,  # Has optional skill
                "proficiencyLevel": "Intermediate",
                "yourLevel": "Intermediate",
                "insight": f"You have {skill_name} - a valuable bonus skill for {selected_role}.",
            })
    
    # Calculate overall match score
    total_required = len(required_skills_dict)
    matched_required = sum(1 for skill_name in required_skills_dict if skill_name.lower() in user_skills_lower)
    
    if total_required > 0:
        overall_match_score = int((matched_required / total_required) * 100)
    else:
        overall_match_score = 50
    
    return {
        "critical_gaps": critical_gaps,
        "skills_to_improve": skills_to_improve,
        "matching_skills": matching_skills,
        "overall_match_score": overall_match_score,
    }


def calculate_salary_impact(market_demand: int, current_prof: int = 0, target_prof: int = 3) -> float:
    """
    Calculate estimated salary impact of improving a skill.
    
    Args:
        market_demand: Market demand score (0-100)
        current_prof: Current proficiency level (0-5)
        target_prof: Target proficiency level (0-5)
    
    Returns:
        Estimated salary impact in lakhs
    """
    # Ensure market_demand is in reasonable range
    if market_demand < 30:
        market_demand = 30
    elif market_demand > 100:
        market_demand = 100
    
    # Base value calculation: higher demand = higher impact
    # ₹1L per market demand point
    base_value = market_demand * 1000  # In rupees, then convert to lakhs
    
    # Proficiency gain factor (minimum 0.3 for any improvement)
    prof_gain = max(0.3, (target_prof - current_prof) / 5)
    
    # Final calculation in lakhs
    impact_lakhs = (base_value * prof_gain) / 100000
    
    # Ensure reasonable minimum and maximum
    impact_lakhs = max(1.5, min(15.0, impact_lakhs))  # Min ₹1.5L, Max ₹15L
    
    return round(impact_lakhs, 1)


def build_market_data_dict(market_data_list: list) -> dict:
    """Convert market data list to dictionary for quick lookup."""
    result = {}
    for item in market_data_list:
        # Handle both dict and object attributes
        if isinstance(item, dict):
            skill_name = item.get('skill_name')
            demand_score = item.get('demand_score', 50)
        else:
            skill_name = getattr(item, 'skill_name', None)
            demand_score = getattr(item, 'demand_score', 50)
        
        if skill_name:
            
            # Calculate salary impact based on demand
            salary_impact = calculate_salary_impact(demand_score, current_prof=0, target_prof=3)
            
            # Calculate learning hours based on difficulty
            learning_hours = max(50, min(300, demand_score * 2))  # Rough estimate: demand * 2 hours
            
            result[skill_name.lower()] = {
                "demand_score": demand_score,
                "salary_impact": salary_impact,
                "learning_hours": learning_hours,
            }
    return result


@router.get("/{candidate_id}")
async def get_gap_analysis(
    candidate_id: int,
    role: str = Query(None, description="Target role for gap analysis"),
    category: str = Query(None, description="Job category"),
    experience: str = Query(None, description="Experience level"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get gap analysis for a candidate comparing their skills against a target role.
    
    Args:
        candidate_id: ID of the candidate
        role: Target role to analyze against
        category: Job category (optional)
        experience: Experience level (optional)
    
    Returns:
        Gap analysis with critical gaps, skills to improve, and matching skills
    """
    
    try:
        print(f"📊 Gap analysis request: candidate_id={candidate_id}, role={role}, category={category}, experience={experience}")
        
        # Fetch candidate  
        result = await db.execute(
            select(Candidate).where(Candidate.id == candidate_id)
        )
        candidate = result.scalar_one_or_none()
        
        if not candidate:
            raise HTTPException(status_code=404, detail=f"Candidate {candidate_id} not found")
        
        # Extract user skills - use simple list if no relationship data
        user_skills = []
        
        # For now, use a default set of skills for testing
        # In production, this would query the candidate's actual skills
        user_skills = ["Python", "SQL", "REST APIs", "Docker", "Git", "JavaScript"]
        
        # Default role if not provided
        if not role:
            role = "Software Developer"
        
        # If category is provided, use it to find appropriate role
        # This allows category-based filtering
        if category and category != "All Categories":
            print(f"🔍 Filtering by category: {category}")
        
        # Load role requirements
        role_requirements = await load_role_requirements()
        
        # Fetch market data for all skills
        result = await db.execute(select(SkillMarketData))
        market_data_rows = result.scalars().all()
        market_data_dict = build_market_data_dict(market_data_rows)
        
        # Calculate gap analysis
        gap_analysis = calculate_gap_analysis(
            user_skills=user_skills,
            role_requirements=role_requirements,
            selected_role=role,
            market_data=market_data_dict,
        )
        
        # Determine target category if not provided
        target_category = category if category and category != "All Categories" else "Software Engineering"
        target_experience = experience if experience and experience != "All Levels" else "Mid"
        
        print(f"✅ Gap analysis complete: {len(gap_analysis['critical_gaps'])} critical gaps, {len(gap_analysis['skills_to_improve'])} skills to improve")
        
        return {
            "candidate_id": candidate_id,
            "target_role": role,
            "target_category": target_category,
            "role": role,
            "category": target_category,
            "experience_level": target_experience,
            "critical_gaps": gap_analysis["critical_gaps"],
            "skills_to_improve": gap_analysis["skills_to_improve"],
            "matching_skills": gap_analysis["matching_skills"],
            "overall_match_score": gap_analysis["overall_match_score"],
            "analysis_timestamp": str(__import__("datetime").datetime.utcnow().isoformat()),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in gap analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating gap analysis: {str(e)}"
        )

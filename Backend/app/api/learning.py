"""
Learning time estimation and prerequisites API endpoints
"""
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import get_db
from app.models.skill_market import SkillMarketData

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Learning complexity data (1-5 scale)
SKILL_COMPLEXITY: Dict[str, int] = {
    # Frontend Skills
    "HTML5": 1,
    "CSS3": 1,
    "CSS": 1,
    "JavaScript": 2,
    "TypeScript": 2,
    "React": 3,
    "Vue.js": 3,
    "Angular": 4,
    "Next.js": 3,
    "Tailwind CSS": 1,
    "Redux": 3,
    "Web Design": 2,
    
    # Backend Skills
    "Python": 2,
    "Node.js": 3,
    "Express.js": 2,
    "REST APIs": 2,
    "GraphQL": 3,
    "FastAPI": 2,
    "Django": 3,
    "Flask": 2,
    "Spring Boot": 4,
    "Java": 3,
    ".NET": 3,
    "Go": 2,
    "Rust": 4,
    "PHP": 2,
    
    # Database Skills
    "SQL": 2,
    "MongoDB": 2,
    "PostgreSQL": 3,
    "MySQL": 2,
    "Redis": 2,
    "Elasticsearch": 3,
    "Firebase": 2,
    
    # DevOps & Cloud
    "Docker": 3,
    "Kubernetes": 4,
    "AWS": 4,
    "Azure": 4,
    "GCP": 4,
    "Terraform": 3,
    "CI/CD": 3,
    "Jenkins": 3,
    "GitHub Actions": 2,
    "Linux": 3,
    "Networking": 3,
    
    # Data & AI
    "Python": 2,
    "Pandas": 2,
    "NumPy": 2,
    "Data Analysis": 3,
    "SQL": 2,
    "Tableau": 2,
    "Power BI": 2,
    "Statistics": 3,
    "Machine Learning": 5,
    "Deep Learning": 5,
    "TensorFlow": 5,
    "PyTorch": 5,
    "Scikit-learn": 3,
    "NLP": 5,
    "Computer Vision": 5,
    
    # Testing & QA
    "Jest": 2,
    "Pytest": 2,
    "Selenium": 3,
    "Cypress": 2,
    "Test Automation": 3,
    "Manual Testing": 1,
    "API Testing": 2,
    
    # Other Skills
    "Git": 1,
    "GitHub": 1,
    "GitLab": 1,
    "Agile": 1,
    "Scrum": 1,
    "JIRA": 1,
    "Communication": 1,
    "Project Management": 2,
    "System Design": 5,
    "Microservices": 4,
    "Authentication": 2,
    "Security": 4,
    "Blockchain": 5,
}

# Prerequisites mapping
PREREQUISITES: Dict[str, List[str]] = {
    # Frontend
    "React": ["JavaScript", "HTML5", "CSS3"],
    "Vue.js": ["JavaScript", "HTML5", "CSS3"],
    "Angular": ["JavaScript", "TypeScript", "HTML5", "CSS3"],
    "Next.js": ["React", "Node.js", "JavaScript"],
    "TypeScript": ["JavaScript"],
    "Redux": ["React", "JavaScript"],
    "Tailwind CSS": ["CSS3"],
    
    # Backend
    "Node.js": ["JavaScript"],
    "Express.js": ["Node.js", "JavaScript"],
    "FastAPI": ["Python"],
    "Django": ["Python"],
    "Flask": ["Python"],
    "Spring Boot": ["Java"],
    "GraphQL": ["REST APIs", "Backend fundamentals"],
    "REST APIs": ["Backend fundamentals"],
    
    # Database
    "PostgreSQL": ["SQL", "Database fundamentals"],
    "MongoDB": ["Database fundamentals"],
    "Redis": ["Database fundamentals"],
    
    # DevOps & Cloud
    "Docker": ["Linux"],
    "Kubernetes": ["Docker", "Linux", "Container fundamentals"],
    "AWS": ["Cloud fundamentals", "Linux", "Networking"],
    "Azure": ["Cloud fundamentals", "Networking"],
    "GCP": ["Cloud fundamentals", "Networking"],
    "Terraform": ["Cloud fundamentals", "Infrastructure as Code"],
    "CI/CD": ["Git", "Linux"],
    "Jenkins": ["CI/CD", "Linux"],
    
    # Data & AI
    "Machine Learning": ["Python", "Statistics", "Mathematics", "Data Analysis"],
    "Deep Learning": ["Machine Learning", "Python", "Linear Algebra"],
    "TensorFlow": ["Python", "Machine Learning"],
    "PyTorch": ["Python", "Machine Learning"],
    "NLP": ["Machine Learning", "Python"],
    "Computer Vision": ["Machine Learning", "Python"],
    "Data Analysis": ["SQL", "Python"],
    
    # Testing
    "Selenium": ["Test Automation"],
    "Cypress": ["Test Automation", "JavaScript"],
    "Jest": ["JavaScript"],
    "Pytest": ["Python"],
    
    # Other
    "System Design": ["Backend fundamentals", "Databases", "Networking"],
    "Microservices": ["Backend fundamentals", "Docker"],
    "Blockchain": ["Cryptography", "System Design"],
    "Security": ["Networking", "Linux"],
}


@router.get("/time-estimate")
async def estimate_learning_time(
    skill: str = Query(..., description="Skill to learn"),
    current_level: int = Query(0, ge=0, le=5, description="Current proficiency (0-5)"),
    target_level: int = Query(3, ge=1, le=5, description="Target proficiency (1-5)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Estimate time required to learn a skill to target level
    
    Query parameters:
    - skill: Skill to learn (required)
    - current_level: Current proficiency 0-5 (default: 0)
    - target_level: Target proficiency 1-5 (default: 3)
    
    Returns estimated hours, weeks/months, difficulty, and prerequisites
    """
    try:
        if current_level >= target_level:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target level must be greater than current level"
            )
        
        # Get skill complexity (default to 3 if not found)
        complexity = SKILL_COMPLEXITY.get(skill, 3)
        
        # Get prerequisites
        prerequisites = PREREQUISITES.get(skill, [])
        
        # Calculate base learning hours
        # Formula: (target - current) * complexity * 30 hours per level
        level_gap = target_level - current_level
        base_hours = level_gap * complexity * 30
        
        # Estimate weeks (assuming 10 hours/week study)
        weeks = base_hours / 10
        
        # Format time estimates
        if weeks < 4:
            time_estimate_weeks = f"{int(weeks)}-{int(weeks)+1} weeks"
        elif weeks < 12:
            time_estimate_weeks = f"{int(weeks)}-{int(weeks)+2} weeks"
        else:
            time_estimate_weeks = f"{int(weeks)}-{int(weeks)+4} weeks"
        
        months = weeks / 4.33  # More accurate month calculation
        if months < 1:
            time_estimate_months = f"{int(weeks)}-{int(weeks)+2} weeks"
        elif months < 3:
            time_estimate_months = f"{int(months)}-{int(months)+1} months"
        else:
            time_estimate_months = f"{int(months)}-{int(months)+2} months"
        
        # Difficulty mapping
        difficulty_map = {
            1: "Easy",
            2: "Easy",
            3: "Intermediate",
            4: "Advanced",
            5: "Expert"
        }
        difficulty = difficulty_map.get(complexity, "Intermediate")
        
        # Get market demand for context
        market_demand = 50
        try:
            result = await db.execute(
                select(SkillMarketData.demand_score).where(
                    SkillMarketData.skill_name == skill
                )
            )
            demand = result.scalars().first()
            if demand:
                market_demand = demand
        except Exception as e:
            logger.warning(f"Could not fetch market demand for {skill}: {e}")
        
        logger.info(f"📚 Learning time estimated for {skill}: {time_estimate_months}")
        
        return {
            "skill_name": skill,
            "current_level": current_level,
            "target_level": target_level,
            "estimated_hours": int(base_hours),
            "estimated_weeks": time_estimate_weeks,
            "estimated_months": time_estimate_months,
            "difficulty": difficulty,
            "complexity_score": complexity,
            "prerequisites": prerequisites,
            "market_demand": market_demand,
            "study_hours_per_week": 10,
            "recommended_resources": [
                "Online courses (Udemy, Coursera, Pluralsight)",
                "Official documentation and tutorials",
                "Hands-on practice projects",
                "Community forums and Discord servers",
                "YouTube tutorials and guided learning",
                "Books and technical blogs"
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"❌ Learning time estimation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/prerequisites/{skill}")
async def get_prerequisites(skill: str, db: AsyncSession = Depends(get_db)):
    """
    Get prerequisites and complexity for a skill
    
    Path parameters:
    - skill: Skill name to get prerequisites for
    
    Returns prerequisites list, complexity score, and learning tips
    """
    try:
        complexity = SKILL_COMPLEXITY.get(skill, 3)
        prerequisites = PREREQUISITES.get(skill, [])
        
        # Get market demand
        market_demand = 50
        try:
            result = await db.execute(
                select(SkillMarketData.demand_score).where(
                    SkillMarketData.skill_name == skill
                )
            )
            demand = result.scalars().first()
            if demand:
                market_demand = demand
        except Exception as e:
            logger.warning(f"Could not fetch market demand for {skill}: {e}")
        
        # Difficulty mapping
        difficulty_map = {1: "Easy", 2: "Easy", 3: "Intermediate", 4: "Advanced", 5: "Expert"}
        difficulty = difficulty_map.get(complexity, "Intermediate")
        
        logger.info(f"📚 Prerequisites retrieved for {skill}: {len(prerequisites)} prerequisites")
        
        return {
            "skill_name": skill,
            "complexity": complexity,
            "difficulty": difficulty,
            "prerequisites": prerequisites,
            "market_demand": market_demand,
            "learning_tips": [
                f"Start with: {prerequisites[0] if prerequisites else 'fundamentals'}",
                "Practice daily for best results",
                "Build real projects to solidify knowledge",
                "Join communities and contribute"
            ]
        }
        
    except Exception as e:
        logger.exception(f"❌ Prerequisites retrieval error for {skill}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/roadmap/{skill}")
async def get_learning_roadmap(
    skill: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a structured learning roadmap for a skill
    
    Path parameters:
    - skill: Skill to get roadmap for
    
    Returns phases, time estimates, and milestone objectives
    """
    try:
        complexity = SKILL_COMPLEXITY.get(skill, 3)
        prerequisites = PREREQUISITES.get(skill, [])
        
        # Get market demand
        market_demand = 50
        try:
            result = await db.execute(
                select(SkillMarketData.demand_score).where(
                    SkillMarketData.skill_name == skill
                )
            )
            demand = result.scalars().first()
            if demand:
                market_demand = demand
        except Exception as e:
            logger.warning(f"Could not fetch market demand: {e}")
        
        # Define learning phases (5 levels)
        phases = [
            {
                "level": 1,
                "name": "Fundamentals",
                "description": f"Learn basic {skill} concepts and setup",
                "duration_weeks": complexity * 2,
                "topics": [
                    "Core concepts",
                    "Installation & setup",
                    "Basic syntax",
                    "Hello World projects"
                ]
            },
            {
                "level": 2,
                "name": "Intermediate Basics",
                "description": f"Build simple {skill} applications",
                "duration_weeks": complexity * 3,
                "topics": [
                    "Common patterns",
                    "Best practices",
                    "Small projects",
                    "Debugging skills"
                ]
            },
            {
                "level": 3,
                "name": "Intermediate",
                "description": f"Develop proficiency in {skill}",
                "duration_weeks": complexity * 4,
                "topics": [
                    "Advanced features",
                    "Performance optimization",
                    "Real-world projects",
                    "Code review practices"
                ]
            },
            {
                "level": 4,
                "name": "Advanced",
                "description": f"Master {skill} and best practices",
                "duration_weeks": complexity * 6,
                "topics": [
                    "Deep internals",
                    "System design",
                    "Production deployment",
                    "Architecture patterns"
                ]
            },
            {
                "level": 5,
                "name": "Expert",
                "description": f"Become a {skill} expert",
                "duration_weeks": complexity * 8,
                "topics": [
                    "Advanced patterns",
                    "Contributing to ecosystem",
                    "Teaching others",
                    "Research and innovation"
                ]
            }
        ]
        
        logger.info(f"📚 Learning roadmap generated for {skill}")
        
        return {
            "skill_name": skill,
            "complexity": complexity,
            "market_demand": market_demand,
            "prerequisites": prerequisites,
            "phases": phases,
            "total_weeks_to_proficiency": sum(p["duration_weeks"] for p in phases[:3]),
            "tips": [
                "Complete prerequisites first",
                "Code daily to build muscle memory",
                "Build projects to learn practically",
                "Join communities for support"
            ]
        }
        
    except Exception as e:
        logger.exception(f"❌ Roadmap generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

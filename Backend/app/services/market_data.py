"""
Market intelligence service
Provides skill demand, trends, job roles, salary data
"""
import json
import logging
from typing import Dict, List, Optional
from pathlib import Path
from datetime import date
from collections import defaultdict

from app.core.config import settings

logger = logging.getLogger(__name__)


class MarketDataService:
    """
    Provide market intelligence for skills
    """
    
    def __init__(self):
        """Initialize with market data"""
        self.market_data = self._load_market_data()
        self.job_roles_mapping = self._get_job_roles_mapping()
        logger.info(f"✅ MarketDataService initialized with {len(self.market_data)} skills")
    
    def _load_market_data(self) -> Dict[str, Dict]:
        """
        Load market data from JSON file
        If not exists, generate from frontend mock skills
        """
        market_path = Path(settings.DATA_DIR) / "skills_market_data.json"
        
        if market_path.exists():
            try:
                with open(market_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Convert to dict keyed by skill name
                market_dict = {}
                for item in data:
                    skill_name = item.get('skill_name', item.get('name', ''))
                    market_dict[skill_name.lower()] = item
                
                logger.info(f"✅ Loaded market data for {len(market_dict)} skills")
                return market_dict
            
            except Exception as e:
                logger.error(f"Failed to load market data: {e}")
        
        # Fallback: generate from hardcoded values (from your frontend mock)
        return self._get_fallback_market_data()
    
    def _get_fallback_market_data(self) -> Dict[str, Dict]:
        """
        Fallback market data based on your frontend's initialMockSkills
        """
        # Your 49 mock skills with market demand
        mock_data = {
            "react": {"demand_score": 92, "trend": "up", "trend_percentage": 23},
            "typescript": {"demand_score": 87, "trend": "up", "trend_percentage": 18},
            "node.js": {"demand_score": 82, "trend": "stable", "trend_percentage": 5},
            "python": {"demand_score": 88, "trend": "up", "trend_percentage": 18},
            "aws": {"demand_score": 83, "trend": "up", "trend_percentage": 15},
            "postgresql": {"demand_score": 79, "trend": "stable", "trend_percentage": 3},
            "docker": {"demand_score": 81, "trend": "up", "trend_percentage": 12},
            "git": {"demand_score": 95, "trend": "stable", "trend_percentage": 2},
            "graphql": {"demand_score": 72, "trend": "up", "trend_percentage": 15},
            "kubernetes": {"demand_score": 76, "trend": "up", "trend_percentage": 22},
            "vue.js": {"demand_score": 68, "trend": "stable", "trend_percentage": 4},
            "angular": {"demand_score": 65, "trend": "down", "trend_percentage": -5},
            "mongodb": {"demand_score": 74, "trend": "up", "trend_percentage": 10},
            "redis": {"demand_score": 71, "trend": "up", "trend_percentage": 8},
            "java": {"demand_score": 82, "trend": "stable", "trend_percentage": 1},
            "javascript": {"demand_score": 94, "trend": "stable", "trend_percentage": 2},
            "sql": {"demand_score": 91, "trend": "stable", "trend_percentage": 1},
            "rest apis": {"demand_score": 89, "trend": "stable", "trend_percentage": 3},
        }
        
        logger.warning("⚠️ Using fallback market data (file not found)")
        return mock_data
    
    def _get_job_roles_mapping(self) -> Dict[str, List[str]]:
        """
        Hardcoded skill → job roles mapping
        """
        return {
            "react": ["Frontend Developer", "Full Stack Developer", "UI Engineer"],
            "angular": ["Frontend Developer", "Full Stack Developer"],
            "vue.js": ["Frontend Developer", "Full Stack Developer"],
            "javascript": ["Frontend Developer", "Backend Developer", "Full Stack Developer"],
            "typescript": ["Frontend Developer", "Backend Developer", "Full Stack Developer"],
            "python": ["Backend Developer", "Data Scientist", "ML Engineer", "Full Stack Developer"],
            "java": ["Backend Developer", "Full Stack Developer", "Enterprise Developer"],
            "node.js": ["Backend Developer", "Full Stack Developer"],
            "django": ["Backend Developer", "Full Stack Developer"],
            "flask": ["Backend Developer", "Full Stack Developer"],
            "sql": ["Backend Developer", "Database Administrator", "Data Analyst"],
            "postgresql": ["Backend Developer", "Database Administrator"],
            "mongodb": ["Backend Developer", "Full Stack Developer"],
            "redis": ["Backend Developer", "DevOps Engineer"],
            "aws": ["Cloud Engineer", "DevOps Engineer", "Backend Developer"],
            "azure": ["Cloud Engineer", "DevOps Engineer"],
            "gcp": ["Cloud Engineer", "DevOps Engineer"],
            "docker": ["DevOps Engineer", "Backend Developer"],
            "kubernetes": ["DevOps Engineer", "Cloud Engineer"],
            "terraform": ["DevOps Engineer", "Cloud Engineer"],
            "git": ["All Developers"],
        }
    
    def get_market_demand(self, skill_name: str) -> int:
        """Get market demand score (0-100) for a skill"""
        skill_lower = skill_name.lower()
        data = self.market_data.get(skill_lower, {})
        return data.get('demand_score', 50)  # Default to 50
    
    def get_trend(self, skill_name: str) -> str:
        """Get trend direction for a skill"""
        skill_lower = skill_name.lower()
        data = self.market_data.get(skill_lower, {})
        return data.get('trend', 'stable')
    
    def get_trend_percentage(self, skill_name: str) -> float:
        """Get trend percentage for a skill"""
        skill_lower = skill_name.lower()
        data = self.market_data.get(skill_lower, {})
        return data.get('trend_percentage', 0.0)
    
    def get_job_roles(self, skill_name: str) -> List[str]:
        """Get job roles that require this skill"""
        skill_lower = skill_name.lower()
        return self.job_roles_mapping.get(skill_lower, ["Software Developer"])
    
    def get_job_levels(self, proficiency: float) -> List[str]:
        """
        Get job levels based on proficiency
        
        Args:
            proficiency: Proficiency level (0-5)
        
        Returns:
            List of job levels
        """
        if proficiency >= 4.5:
            return ["Senior", "Lead", "Principal", "Staff"]
        elif proficiency >= 3.5:
            return ["Mid-Level", "Senior"]
        elif proficiency >= 2.5:
            return ["Entry-Level", "Mid-Level"]
        else:
            return ["Entry-Level", "Junior"]
    
    def generate_recommendation(self, skill_name: str, proficiency: float, demand: int) -> str:
        """
        Generate investment recommendation for a skill
        """
        if demand >= 85 and proficiency >= 3.5:
            return "Excellent Investment - High demand & strong proficiency"
        elif demand >= 85:
            return "Excellent Investment - High market demand"
        elif demand >= 70:
            return "Good Investment - Solid market demand"
        elif demand >= 60:
            return "Emerging Opportunity - Growing demand"
        else:
            return "Consider for specialization"


# Global instance
_market_data_service = None

def get_market_data_service() -> MarketDataService:
    """Get or create global MarketDataService instance"""
    global _market_data_service
    if _market_data_service is None:
        _market_data_service = MarketDataService()
    return _market_data_service

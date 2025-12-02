"""
Skill extraction from resume text
Uses multiple methods: Dictionary matching, NER, Pattern matching
"""
import re
import json
import logging
from typing import List, Dict, Tuple, Set
from pathlib import Path
from collections import defaultdict

# NLP
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    logging.warning("spaCy not installed. NER extraction will be disabled.")

from app.core.config import settings

logger = logging.getLogger(__name__)


class SkillExtractor:
    """
    Multi-method skill extraction from resume text
    """
    
    def __init__(self):
        """Initialize skill extractor with skills taxonomy"""
        self.skills_dict = self._load_skills_taxonomy()
        self.skill_patterns = self._build_skill_patterns()
        self.nlp_model = self._load_spacy_model()
        logger.info(f"✅ SkillExtractor initialized with {len(self.skills_dict)} skills")
    
    def _load_skills_taxonomy(self) -> Dict[str, Dict]:
        """
        Load skills taxonomy from JSON file
        Supports old format: {"skill_aliases": {"JavaScript": [...], ...}}
        """
        skills_path = Path(settings.DATA_DIR) / "skills.json"
        
        if not skills_path.exists():
            logger.warning(f"Skills file not found: {skills_path}")
            return self._get_fallback_skills()
        
        try:
            with open(skills_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle old format
            if "skill_aliases" in data:
                skills_aliases = data["skill_aliases"]
                skills_dict = {}
                
                for skill_name, aliases in skills_aliases.items():
                    # Categorize skill (simplified logic)
                    category = self._categorize_skill(skill_name)
                    
                    skills_dict[skill_name.lower()] = {
                        "name": skill_name,
                        "category": category,
                        "aliases": [alias.lower() for alias in aliases],
                        "pattern": self._create_pattern(skill_name, aliases)
                    }
                
                logger.info(f"✅ Loaded {len(skills_dict)} skills from old format")
                return skills_dict
            
            # Handle new format (if exists)
            else:
                # Convert to internal format
                skills_dict = {}
                for skill in data:
                    name_lower = skill['name'].lower()
                    skills_dict[name_lower] = {
                        "name": skill['name'],
                        "category": skill.get('category', 'Other'),
                        "aliases": skill.get('aliases', []),
                        "pattern": self._create_pattern(skill['name'], skill.get('aliases', []))
                    }
                return skills_dict
        
        except Exception as e:
            logger.error(f"Failed to load skills taxonomy: {e}")
            return self._get_fallback_skills()
    
    def _categorize_skill(self, skill_name: str) -> str:
        """
        Categorize skill based on name (heuristic)
        """
        skill_lower = skill_name.lower()
        
        # Programming languages
        if any(lang in skill_lower for lang in ['java', 'python', 'javascript', 'typescript', 'ruby', 'php', 'c++', 'c#', 'go', 'rust', 'swift', 'kotlin']):
            return "Programming Languages"
        
        # Frontend
        if any(fw in skill_lower for fw in ['react', 'angular', 'vue', 'svelte', 'next', 'nuxt', 'html', 'css']):
            return "Frontend"
        
        # Backend
        if any(fw in skill_lower for fw in ['django', 'flask', 'express', 'spring', 'laravel', 'node', 'fastapi']):
            return "Backend"
        
        # Databases
        if any(db in skill_lower for db in ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'oracle']):
            return "Database"
        
        # Cloud
        if any(cloud in skill_lower for cloud in ['aws', 'azure', 'gcp', 'cloud', 'lambda', 'ec2', 's3']):
            return "Cloud"
        
        # DevOps
        if any(tool in skill_lower for tool in ['docker', 'kubernetes', 'jenkins', 'terraform', 'ansible', 'ci/cd']):
            return "DevOps"
        
        return "Other"
    
    def _create_pattern(self, skill_name: str, aliases: List[str]) -> re.Pattern:
        """
        Create regex pattern for skill matching
        """
        all_terms = [skill_name] + aliases
        # Escape special regex characters and create pattern
        escaped_terms = [re.escape(term) for term in all_terms]
        pattern_str = r'\b(' + '|'.join(escaped_terms) + r')\b'
        return re.compile(pattern_str, re.IGNORECASE)
    
    def _build_skill_patterns(self) -> List[Tuple[str, re.Pattern]]:
        """Build list of (skill_name, pattern) tuples for matching"""
        patterns = []
        for skill_data in self.skills_dict.values():
            patterns.append((skill_data['name'], skill_data['pattern']))
        return patterns
    
    def _load_spacy_model(self):
        """Load spaCy NLP model for NER"""
        if not SPACY_AVAILABLE:
            logger.warning("spaCy not available, NER extraction disabled")
            return None
        
        try:
            nlp = spacy.load(settings.SPACY_MODEL)
            logger.info(f"✅ Loaded spaCy model: {settings.SPACY_MODEL}")
            return nlp
        except Exception as e:
            logger.error(f"Failed to load spaCy model: {e}")
            return None
    
    def _get_fallback_skills(self) -> Dict[str, Dict]:
        """
        Fallback skills if no taxonomy file exists
        Uses your frontend mock skills
        """
        fallback = {
            "react": {"name": "React", "category": "Frontend", "aliases": ["reactjs", "react.js"], "pattern": re.compile(r'\b(react|reactjs)\b', re.IGNORECASE)},
            "python": {"name": "Python", "category": "Programming Languages", "aliases": ["python3"], "pattern": re.compile(r'\b(python|python3)\b', re.IGNORECASE)},
            "javascript": {"name": "JavaScript", "category": "Programming Languages", "aliases": ["js"], "pattern": re.compile(r'\b(javascript|js)\b', re.IGNORECASE)},
            "typescript": {"name": "TypeScript", "category": "Programming Languages", "aliases": ["ts"], "pattern": re.compile(r'\b(typescript|ts)\b', re.IGNORECASE)},
            "node.js": {"name": "Node.js", "category": "Backend", "aliases": ["nodejs", "node"], "pattern": re.compile(r'\b(node\.?js|nodejs)\b', re.IGNORECASE)},
            "sql": {"name": "SQL", "category": "Database", "aliases": ["mysql", "postgresql"], "pattern": re.compile(r'\b(sql|mysql|postgresql)\b', re.IGNORECASE)},
            "docker": {"name": "Docker", "category": "DevOps", "aliases": [], "pattern": re.compile(r'\bdocker\b', re.IGNORECASE)},
            "aws": {"name": "AWS", "category": "Cloud", "aliases": ["amazon web services"], "pattern": re.compile(r'\b(aws|amazon web services)\b', re.IGNORECASE)},
        }
        logger.warning("⚠️ Using fallback skills (taxonomy file not found)")
        return fallback
    
    def extract_skills_dictionary(self, text: str) -> List[Dict]:
        """
        Extract skills using dictionary matching
        
        Args:
            text: Resume text
        
        Returns:
            List of extracted skills with metadata
        """
        extracted = []
        found_skills = set()
        
        for skill_name, pattern in self.skill_patterns:
            matches = pattern.findall(text)
            if matches and skill_name.lower() not in found_skills:
                skill_data = self.skills_dict.get(skill_name.lower())
                if skill_data:
                    extracted.append({
                        "name": skill_data['name'],
                        "category": skill_data['category'],
                        "confidence": 0.9,  # High confidence for exact matches
                        "extraction_method": "Dictionary",
                        "match_count": len(matches)
                    })
                    found_skills.add(skill_name.lower())
        
        logger.info(f"📚 Dictionary extraction found {len(extracted)} skills")
        return extracted
    
    def extract_skills_ner(self, text: str) -> List[Dict]:
        """
        Extract skills using Named Entity Recognition (spaCy)
        
        Args:
            text: Resume text
        
        Returns:
            List of extracted skills
        """
        if not self.nlp_model:
            logger.warning("NER extraction skipped (model not loaded)")
            return []
        
        extracted = []
        found_skills = set()
        
        try:
            # Process text with spaCy
            doc = self.nlp_model(text[:10000])  # Limit text length
            
            # Extract entities that might be skills
            for ent in doc.ents:
                if ent.label_ in ['ORG', 'PRODUCT', 'GPE']:  # Organizations, products
                    skill_name_lower = ent.text.lower()
                    if skill_name_lower in self.skills_dict and skill_name_lower not in found_skills:
                        skill_data = self.skills_dict[skill_name_lower]
                        extracted.append({
                            "name": skill_data['name'],
                            "category": skill_data['category'],
                            "confidence": 0.7,  # Medium confidence for NER
                            "extraction_method": "NER",
                            "match_count": 1
                        })
                        found_skills.add(skill_name_lower)
            
            logger.info(f"🤖 NER extraction found {len(extracted)} skills")
        
        except Exception as e:
            logger.error(f"NER extraction failed: {e}")
        
        return extracted
    
    def extract_skills(self, text: str) -> Tuple[List[Dict], str]:
        """
        Extract skills using all available methods
        
        Args:
            text: Resume text
        
        Returns:
            Tuple of (skills_list, extraction_methods_used)
        """
        all_skills = {}
        methods_used = []
        
        # Method 1: Dictionary matching
        dict_skills = self.extract_skills_dictionary(text)
        for skill in dict_skills:
            all_skills[skill['name']] = skill
        if dict_skills:
            methods_used.append("Dictionary")
        
        # Method 2: NER (if available)
        ner_skills = self.extract_skills_ner(text)
        for skill in ner_skills:
            if skill['name'] not in all_skills:
                all_skills[skill['name']] = skill
        if ner_skills:
            methods_used.append("NER")
        
        # Convert to list and sort by confidence
        skills_list = sorted(
            all_skills.values(),
            key=lambda x: x['confidence'],
            reverse=True
        )
        
        methods_str = " + ".join(methods_used) if methods_used else "None"
        
        logger.info(f"✅ Total skills extracted: {len(skills_list)} (Methods: {methods_str})")
        
        return skills_list, methods_str
    
    def calculate_proficiency(self, skill_name: str, text: str, match_count: int) -> float:
        """
        Calculate proficiency level (0-5) based on context
        
        Simple heuristic:
        - 1+ mentions: Beginner (1.0)
        - 2-3 mentions: Intermediate (2.5)
        - 4-6 mentions: Advanced (3.5)
        - 7+ mentions: Expert (4.5)
        """
        if match_count >= 7:
            return 4.5
        elif match_count >= 4:
            return 3.5
        elif match_count >= 2:
            return 2.5
        else:
            return 1.5
    
    def categorize_skills(self, skills: List[Dict]) -> Dict[str, List[str]]:
        """
        Group skills by category
        
        Args:
            skills: List of skill dicts
        
        Returns:
            Dict mapping category to skill names
        """
        categorized = defaultdict(list)
        for skill in skills:
            categorized[skill['category']].append(skill['name'])
        return dict(categorized)


# Global instance
_skill_extractor = None

def get_skill_extractor() -> SkillExtractor:
    """Get or create global SkillExtractor instance"""
    global _skill_extractor
    if _skill_extractor is None:
        _skill_extractor = SkillExtractor()
    return _skill_extractor

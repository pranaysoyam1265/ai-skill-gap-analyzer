"""
Resume parsing service
Extracts text and personal information from resumes
"""
import re
import logging
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class ResumeParser:
    """
    Parse resume to extract personal information
    """
    
    # Regex patterns for information extraction
    EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    PHONE_PATTERN = re.compile(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
    
    # Common name indicators
    NAME_INDICATORS = ['name:', 'candidate:', 'applicant:']
    
    def extract_email(self, text: str) -> Optional[str]:
        """Extract email address from text"""
        matches = self.EMAIL_PATTERN.findall(text)
        if matches:
            # Return first match
            return matches[0]
        return None
    
    def extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from text"""
        matches = self.PHONE_PATTERN.findall(text)
        if matches:
            # Clean and return first match
            phone = re.sub(r'[^\d+]', '', matches[0])
            return phone if len(phone) >= 10 else None
        return None
    
    def extract_name(self, text: str) -> str:
        """
        Extract candidate name from resume
        Uses heuristics to find name in first few lines
        """
        lines = text.split('\n')
        
        # Check first 5 lines for name
        for i, line in enumerate(lines[:5]):
            line_clean = line.strip()
            
            # Skip empty lines
            if not line_clean:
                continue
            
            # Check for explicit name indicators
            for indicator in self.NAME_INDICATORS:
                if indicator in line_clean.lower():
                    # Extract text after indicator
                    name = line_clean.split(':', 1)[-1].strip()
                    if name and len(name) > 2:
                        return name
            
            # First non-empty line is often the name
            if i == 0 and len(line_clean) > 2 and len(line_clean) < 50:
                # Check if it looks like a name (2-3 words)
                words = line_clean.split()
                if 2 <= len(words) <= 3 and all(word.isalpha() or '-' in word for word in words):
                    return line_clean
        
        # Fallback: use first non-empty line
        for line in lines[:5]:
            if line.strip():
                return line.strip()[:100]  # Limit length
        
        return "Unknown Candidate"
    
    def extract_location(self, text: str) -> Optional[str]:
        """
        Extract location from resume (simplified)
        Looks for common location patterns
        """
        location_pattern = re.compile(
            r'\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}|[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b'
        )
        matches = location_pattern.findall(text[:1000])  # Check first 1000 chars
        
        if matches:
            return matches[0]
        
        return None
    
    def parse_resume(
        self,
        text: str
    ) -> Dict[str, Optional[str]]:
        """
        Parse resume text to extract personal information
        
        Args:
            text: Resume text content
        
        Returns:
            Dict with extracted information
        """
        try:
            info = {
                "name": self.extract_name(text),
                "email": self.extract_email(text),
                "phone": self.extract_phone(text),
                "location": self.extract_location(text),
            }
            
            logger.info(f"✅ Parsed resume: name='{info['name']}', email={info['email']}")
            return info
        
        except Exception as e:
            logger.error(f"Resume parsing failed: {e}")
            return {
                "name": "Unknown Candidate",
                "email": None,
                "phone": None,
                "location": None,
            }


# Global instance
_resume_parser = None

def get_resume_parser() -> ResumeParser:
    """Get or create global ResumeParser instance"""
    global _resume_parser
    if _resume_parser is None:
        _resume_parser = ResumeParser()
    return _resume_parser

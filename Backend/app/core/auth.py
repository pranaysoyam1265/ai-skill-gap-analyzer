from fastapi import Depends, HTTPException, status, Header
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> Dict:
    """
    Validate JWT token and return user info.
    
    For development, returns a mock user.
    """
    try:
        # For development: Return mock user
        # In production, you would validate with Supabase or your auth provider
        
        logger.debug("Using development/mock authentication mode")
        
        return {
            "sub": "mock-user-id-dev",
            "email": "dev@example.com"
        }
        
    except Exception as e:
        logger.warning(f"Auth error (using mock user): {e}")
        # Return mock user for development
        return {
            "sub": "mock-user-id-dev",
            "email": "dev@example.com"
        }

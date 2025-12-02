"""
Common dependencies for API routes
Includes authentication, database sessions, and utilities
"""
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from app.core.database import get_db
from app.core.config import settings

logger = logging.getLogger(__name__)


async def get_current_user_id(
    authorization: Optional[str] = Header(None)
) -> Optional[str]:
    """
    Extract user ID from Supabase JWT token (optional for now)
    
    For Day 1: Returns None (authentication handled by Supabase in frontend)
    For Day 3: Will implement proper JWT validation
    """
    # TODO: Implement Supabase JWT validation
    # For now, accept any request (development only!)
    
    if settings.DEBUG:
        logger.debug("⚠️ Authentication disabled in DEBUG mode")
        return None
    
    # In production, validate JWT here
    return None


async def verify_file_upload(
    file_size: int,
    file_extension: str
) -> bool:
    """
    Verify uploaded file meets requirements
    
    Args:
        file_size: File size in bytes
        file_extension: File extension (e.g., ".pdf")
    
    Returns:
        True if valid
    
    Raises:
        HTTPException: If validation fails
    """
    # Check size
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum of {settings.MAX_UPLOAD_SIZE / 1024 / 1024:.1f}MB"
        )
    
    # Check extension
    if file_extension.lower() not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file_extension}' not supported. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    return True


def get_pagination_params(
    skip: int = 0,
    limit: int = 100
) -> tuple:
    """
    Standard pagination parameters
    
    Args:
        skip: Number of records to skip
        limit: Maximum records to return
    
    Returns:
        Tuple of (skip, limit) with validation
    """
    if skip < 0:
        skip = 0
    if limit < 1:
        limit = 1
    if limit > 100:
        limit = 100
    
    return skip, limit

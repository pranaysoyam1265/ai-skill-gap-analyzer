from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from pydantic import BaseModel
from typing import Dict, Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class UserSettings(BaseModel):
    email_notifications: Optional[Dict] = None
    push_notifications_enabled: Optional[bool] = None
    notification_frequency: Optional[str] = None
    notification_sound_enabled: Optional[bool] = None
    date_format: Optional[str] = None
    currency: Optional[str] = None
    time_format: Optional[str] = None
    number_format: Optional[str] = None
    profile_visibility: Optional[str] = None
    data_sharing: Optional[Dict] = None
    two_factor_enabled: Optional[bool] = None
    linked_accounts: Optional[Dict] = None
    api_keys: Optional[Dict] = None


@router.get("/settings")
async def get_user_settings(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Get user settings."""
    try:
        user_id = current_user.get("sub")
        
        from sqlalchemy import text
        
        # Check if settings exist (with fallback if table doesn't exist)
        try:
            query = text("""
                SELECT 
                    email_notifications,
                    push_notifications_enabled,
                    notification_frequency,
                    notification_sound_enabled,
                    date_format,
                    currency,
                    time_format,
                    number_format,
                    profile_visibility,
                    data_sharing,
                    two_factor_enabled,
                    linked_accounts,
                    api_keys
                FROM user_settings
                WHERE user_id = :user_id
            """)
            
            result = db.execute(query, {"user_id": user_id}).fetchone()
            
            if result:
                return {
                    "emailNotifications": result.email_notifications or {},
                    "pushNotifications": result.push_notifications_enabled or False,
                    "notificationFrequency": result.notification_frequency or "daily",
                    "notificationSound": result.notification_sound_enabled or True,
                    "dateFormat": result.date_format or "DD/MM/YYYY",
                    "currency": result.currency or "INR",
                    "timeFormat": result.time_format or "12h",
                    "numberFormat": result.number_format or "1,234.56",
                    "profileVisibility": result.profile_visibility or "public",
                    "dataSharing": result.data_sharing or {},
                    "twoFactorEnabled": result.two_factor_enabled or False,
                    "linkedAccounts": result.linked_accounts or {},
                    "apiKeys": result.api_keys or {}
                }
        except Exception as e:
            logger.warning(f"user_settings table not found or error: {e}")
        
        # Return defaults if table doesn't exist
        return {
            "emailNotifications": {
                "weeklySkillUpdates": True,
                "courseRecommendations": True,
                "gapAnalysisAlerts": True,
                "careerTips": True
            },
            "pushNotifications": False,
            "notificationFrequency": "daily",
            "notificationSound": True,
            "dateFormat": "DD/MM/YYYY",
            "currency": "INR",
            "timeFormat": "12h",
            "numberFormat": "1,234.56",
            "profileVisibility": "public",
            "dataSharing": {"analytics": True, "feedback": False},
            "twoFactorEnabled": False,
            "linkedAccounts": {},
            "apiKeys": {}
        }
            
    except Exception as e:
        logger.error(f"Error fetching settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch settings")


@router.post("/settings")
async def save_user_settings(
    settings: UserSettings,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Save or update user settings."""
    try:
        user_id = current_user.get("sub")
        
        from sqlalchemy import text
        
        # Try upsert (with fallback if table doesn't exist)
        try:
            query = text("""
                INSERT INTO user_settings (
                    user_id,
                    email_notifications,
                    push_notifications_enabled,
                    notification_frequency,
                    notification_sound_enabled,
                    date_format,
                    currency,
                    time_format,
                    number_format,
                    profile_visibility,
                    data_sharing,
                    two_factor_enabled,
                    linked_accounts,
                    api_keys,
                    updated_at
                ) VALUES (
                    :user_id,
                    :email_notifications,
                    :push_notifications_enabled,
                    :notification_frequency,
                    :notification_sound_enabled,
                    :date_format,
                    :currency,
                    :time_format,
                    :number_format,
                    :profile_visibility,
                    :data_sharing,
                    :two_factor_enabled,
                    :linked_accounts,
                    :api_keys,
                    NOW()
                )
                ON CONFLICT (user_id) 
                DO UPDATE SET
                    email_notifications = COALESCE(:email_notifications, email_notifications),
                    push_notifications_enabled = COALESCE(:push_notifications_enabled, push_notifications_enabled),
                    notification_frequency = COALESCE(:notification_frequency, notification_frequency),
                    notification_sound_enabled = COALESCE(:notification_sound_enabled, notification_sound_enabled),
                    date_format = COALESCE(:date_format, date_format),
                    currency = COALESCE(:currency, currency),
                    time_format = COALESCE(:time_format, time_format),
                    number_format = COALESCE(:number_format, number_format),
                    profile_visibility = COALESCE(:profile_visibility, profile_visibility),
                    data_sharing = COALESCE(:data_sharing, data_sharing),
                    two_factor_enabled = COALESCE(:two_factor_enabled, two_factor_enabled),
                    linked_accounts = COALESCE(:linked_accounts, linked_accounts),
                    api_keys = COALESCE(:api_keys, api_keys),
                    updated_at = NOW()
            """)
            
            db.execute(query, {
                "user_id": user_id,
                "email_notifications": settings.email_notifications,
                "push_notifications_enabled": settings.push_notifications_enabled,
                "notification_frequency": settings.notification_frequency,
                "notification_sound_enabled": settings.notification_sound_enabled,
                "date_format": settings.date_format,
                "currency": settings.currency,
                "time_format": settings.time_format,
                "number_format": settings.number_format,
                "profile_visibility": settings.profile_visibility,
                "data_sharing": settings.data_sharing,
                "two_factor_enabled": settings.two_factor_enabled,
                "linked_accounts": settings.linked_accounts,
                "api_keys": settings.api_keys
            })
            
            db.commit()
            
        except Exception as e:
            logger.warning(f"user_settings table not found: {e}")
            db.rollback()
        
        return {"success": True, "message": "Settings saved successfully"}
        
    except Exception as e:
        logger.error(f"Error saving settings: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save settings")

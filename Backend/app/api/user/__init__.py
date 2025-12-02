from fastapi import APIRouter
from .statistics import router as statistics_router
from .gap_analyses import router as gap_analyses_router
from .activity import router as activity_router
from .settings import router as settings_router
from .sessions import router as sessions_router
from .export import router as export_router
from .data import router as data_router

router = APIRouter()

# Include all user-related endpoints
router.include_router(statistics_router, tags=["user"])
router.include_router(gap_analyses_router, tags=["user"])
router.include_router(activity_router, tags=["user"])
router.include_router(settings_router, tags=["user"])
router.include_router(sessions_router, tags=["user"])
router.include_router(export_router, tags=["user-export"])
router.include_router(data_router, tags=["user-data"])

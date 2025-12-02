"""
Main FastAPI application
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging
import time

from app.core.config import settings
from app.core.database import init_db, close_db, check_db_connection
from app.api import resumes, candidates, market, trends, learning, gap_analysis, career_advisor, skills
from app.api.user import router as user_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info(f"🚀 Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"🌐 CORS Origins: {settings.CORS_ORIGINS}")
    logger.info(f"📊 Database: {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")
    
    # Initialize database (non-blocking - continue if fails)
    try:
        await init_db()
        logger.info("✅ Database initialized successfully")
        
        # Check connection
        try:
            is_connected = await check_db_connection()
            if is_connected:
                logger.info("✅ Database connection successful")
            else:
                logger.warning("⚠️ Database connection failed - API will continue in degraded mode")
        except Exception as conn_e:
            logger.warning(f"⚠️ Database connection check failed: {conn_e}")
    
    except Exception as e:
        logger.warning(f"⚠️ Database initialization warning (API will continue): {e}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down application...")
    try:
        await close_db()
    except Exception as shutdown_e:
        logger.warning(f"⚠️ Database shutdown warning: {shutdown_e}")
    logger.info("✅ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered skill gap analysis and career development platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.3f}s"
    return response


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation Error",
            "detail": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal Server Error",
            "detail": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API information"""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs",
        "database": "connected"
    }


# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    db_status = await check_db_connection()
    return {
        "status": "healthy" if db_status else "degraded",
        "database": "connected" if db_status else "disconnected",
        "version": settings.VERSION
    }


# Include routers
app.include_router(resumes.router, prefix="/api")
app.include_router(candidates.router, prefix="/api")
app.include_router(market.router, prefix="/api/market", tags=["market"])
app.include_router(trends.router, prefix="/api/trends", tags=["trends"])
app.include_router(learning.router, prefix="/api/learning", tags=["learning"])
app.include_router(gap_analysis.router, prefix="/api", tags=["gap-analysis"])
app.include_router(career_advisor.router, prefix="/api/career-advisor", tags=["career-advisor"])
app.include_router(skills.router, prefix="/api/skills", tags=["skills"])
app.include_router(user_router, prefix="/api/user", tags=["user"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=settings.DEBUG
    )

"""
Configuration settings for SkillMatch Backend
Loads from environment variables with validation
"""
from pydantic_settings import BaseSettings
from pydantic import Field, validator, computed_field
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable loading"""
    
    # Project Info
    PROJECT_NAME: str = "SkillMatch AI Backend"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000
    DEBUG: bool = True
    
    # Database
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 5_242_880  # 5MB
    UPLOAD_DIR: str = "uploads/temp"
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".doc", ".txt"]
    
    # ML Models
    SPACY_MODEL: str = "en_core_web_sm"
    
    # Paths
    DATA_DIR: str = "data"
    
    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Construct async database URL"""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    @computed_field
    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Construct sync database URL (for Alembic)"""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    @computed_field
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS origins"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    @validator("UPLOAD_DIR")
    def create_upload_dir(cls, v):
        """Ensure upload directory exists"""
        os.makedirs(v, exist_ok=True)
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


# Global settings instance
settings = Settings()

# Print confirmation on load
if __name__ != "__main__":
    print(f"[OK] {settings.PROJECT_NAME} v{settings.VERSION} - Configuration loaded")


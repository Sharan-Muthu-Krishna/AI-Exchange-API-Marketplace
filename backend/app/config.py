"""
AIExchange - AI API Marketplace & Gateway
Backend Application Configuration

For production: All secrets MUST be set via environment variables.
For development: Use .env file (never commit this file!)
"""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database - Required, no default in production
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:Sharan@1969@localhost:5432/aiexchange"
    )
    
    # JWT Configuration - Required in production
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "dev-only-secret-key-change-in-production"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # API Key Configuration
    API_KEY_PREFIX: str = "ae_live_"
    
    # Platform Settings
    PLATFORM_COMMISSION_RATE: float = 0.10
    DEFAULT_BUYER_CREDITS: float = 100.0
    
    # CORS - Frontend URL for production
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()

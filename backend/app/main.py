"""
AIExchange - AI API Marketplace & Gateway
FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth_router,
    vendor_router,
    buyer_router,
    admin_router,
    gateway_router,
    marketplace_router
)


# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup: Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created")
    
    yield
    
    # Shutdown
    await engine.dispose()
    print("👋 Application shutdown")


# Create FastAPI app
app = FastAPI(
    title="AIExchange",
    description="AI API Marketplace & Gateway - A multi-tenant SaaS platform for AI API providers and consumers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - Production + Development origins
allowed_origins = [
    settings.FRONTEND_URL,  # Production frontend URL (from env)
    "http://localhost:3000",  # Next.js dev
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(vendor_router, prefix="/api")
app.include_router(buyer_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(marketplace_router, prefix="/api")
app.include_router(gateway_router)  # Gateway at root /v1


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "AIExchange",
        "version": "1.0.0",
        "description": "AI API Marketplace & Gateway",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

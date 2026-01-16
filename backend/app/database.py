"""
Database configuration and session management.
"""
import ssl
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def get_database_url():
    """
    Process DATABASE_URL for asyncpg compatibility.
    Neon uses sslmode=require which asyncpg doesn't support directly.
    """
    url = settings.DATABASE_URL
    
    # Remove sslmode parameter as asyncpg handles SSL differently
    if "?" in url:
        base_url, params = url.split("?", 1)
        # Filter out sslmode and channel_binding parameters
        param_list = params.split("&")
        filtered_params = [p for p in param_list if not p.startswith("sslmode=") and not p.startswith("channel_binding=")]
        if filtered_params:
            url = base_url + "?" + "&".join(filtered_params)
        else:
            url = base_url
    
    return url


# For Neon/external SSL connections, we need SSL context
def get_ssl_context():
    """Create SSL context for secure database connections."""
    # Check if we're connecting to a cloud database (Neon, etc.)
    if "neon.tech" in settings.DATABASE_URL or "render.com" in settings.DATABASE_URL:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        return ssl_context
    return None


# Create async engine with proper SSL handling
connect_args = {}
ssl_context = get_ssl_context()
if ssl_context:
    connect_args["ssl"] = ssl_context

engine = create_async_engine(
    get_database_url(),
    echo=settings.DEBUG,
    future=True,
    connect_args=connect_args
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


async def get_db():
    """Dependency to get database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

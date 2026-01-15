"""
Database initialization script
Creates an admin user for platform management
"""
import asyncio
import sys
sys.path.insert(0, '.')

from app.database import AsyncSessionLocal, engine, Base
from app.models.user import User, UserRole
from app.services.auth_service import AuthService


async def init_database():
    """Initialize database with admin user."""
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created")
    
    # Create admin user
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        
        # Check if admin exists
        result = await db.execute(
            select(User).where(User.role == UserRole.ADMIN)
        )
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print(f"ℹ️  Admin user already exists: {existing_admin.email}")
            return
        
        # Create admin
        admin = User(
            email="admin@aiexchange.com",
            password_hash=AuthService.hash_password("Admin@123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        await db.commit()
        print("✅ Admin user created:")
        print("   Email: admin@aiexchange.com")
        print("   Password: Admin@123")


if __name__ == "__main__":
    asyncio.run(init_database())

"""
Authentication Service
JWT generation, password hashing, API key validation
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple
from uuid import UUID

import bcrypt
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.user import User, UserRole, Vendor, Buyer
from app.models.key import ApiKey


class AuthService:
    """Authentication and authorization service."""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    
    @staticmethod
    def create_access_token(user_id: UUID, role: UserRole) -> str:
        """Create a JWT access token."""
        expires = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": str(user_id),
            "role": role.value,
            "exp": expires,
            "type": "access"
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    def create_refresh_token(user_id: UUID, role: UserRole) -> str:
        """Create a JWT refresh token."""
        expires = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {
            "sub": str(user_id),
            "role": role.value,
            "exp": expires,
            "type": "refresh"
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def generate_api_key() -> Tuple[str, str, str]:
        """
        Generate a new API key.
        Returns: (full_key, key_hash, key_prefix)
        """
        # Generate 32 random bytes -> 64 hex characters
        random_part = secrets.token_hex(32)
        full_key = f"{settings.API_KEY_PREFIX}{random_part}"
        
        # Hash for storage
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        
        # Prefix for display (first 12 chars after prefix)
        key_prefix = f"{settings.API_KEY_PREFIX}{random_part[:8]}..."
        
        return full_key, key_hash, key_prefix
    
    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash an API key for lookup."""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    @classmethod
    async def authenticate_user(
        cls, 
        db: AsyncSession, 
        email: str, 
        password: str
    ) -> Optional[User]:
        """Authenticate a user by email and password."""
        result = await db.execute(
            select(User).where(User.email == email, User.is_active == True)
        )
        user = result.scalar_one_or_none()
        
        if not user or not cls.verify_password(password, user.password_hash):
            return None
        
        return user
    
    @classmethod
    async def validate_api_key(
        cls,
        db: AsyncSession,
        api_key: str
    ) -> Optional[Tuple[ApiKey, Buyer, User]]:
        """
        Validate an API key and return the associated key, buyer, and user.
        """
        key_hash = cls.hash_api_key(api_key)
        
        result = await db.execute(
            select(ApiKey, Buyer, User)
            .join(Buyer, ApiKey.buyer_id == Buyer.id)
            .join(User, Buyer.user_id == User.id)
            .where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)
        )
        row = result.first()
        
        if not row:
            return None
        
        api_key_obj, buyer, user = row
        
        # Update last used timestamp
        api_key_obj.last_used_at = datetime.utcnow()
        await db.commit()
        
        return api_key_obj, buyer, user
    
    @classmethod
    async def get_vendor_by_user_id(
        cls,
        db: AsyncSession,
        user_id: UUID
    ) -> Optional[Vendor]:
        """Get vendor by user ID."""
        result = await db.execute(
            select(Vendor).where(Vendor.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    @classmethod
    async def get_buyer_by_user_id(
        cls,
        db: AsyncSession,
        user_id: UUID
    ) -> Optional[Buyer]:
        """Get buyer by user ID."""
        result = await db.execute(
            select(Buyer).where(Buyer.user_id == user_id)
        )
        return result.scalar_one_or_none()

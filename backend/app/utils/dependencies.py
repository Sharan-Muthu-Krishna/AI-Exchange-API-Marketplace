"""
FastAPI Dependencies
Authentication and authorization dependencies
"""
from typing import Optional, List, Tuple
from uuid import UUID

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserRole, Buyer
from app.models.key import ApiKey
from app.services.auth_service import AuthService


# OAuth2 scheme for JWT tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Get current user from JWT token."""
    if not token:
        return None
    
    payload = AuthService.decode_token(token)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    try:
        result = await db.execute(
            select(User).where(User.id == UUID(user_id))
        )
        return result.scalar_one_or_none()
    except:
        return None


async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """Get current active user, raise if not authenticated."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return current_user


def require_role(allowed_roles: List[UserRole]):
    """Dependency factory to require specific roles."""
    async def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    
    return role_checker


async def get_api_key_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db)
) -> Tuple[ApiKey, Buyer]:
    """
    Get buyer from API key in Authorization header.
    Expected format: Bearer ae_live_xxxx
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract key from Bearer token
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    api_key = parts[1]
    
    # Validate the key starts with expected prefix
    if not api_key.startswith("ae_live_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format"
        )
    
    # Validate key
    result = await AuthService.validate_api_key(db, api_key)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive API key"
        )
    
    api_key_obj, buyer, user = result
    
    # Check if buyer's user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return api_key_obj, buyer

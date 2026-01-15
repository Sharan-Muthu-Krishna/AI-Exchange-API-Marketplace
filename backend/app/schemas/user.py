"""
User, Vendor, Buyer Schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole


# --- Token Schemas ---
class Token(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: UUID  # user_id
    role: UserRole
    exp: datetime


# --- User Schemas ---
class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr


class UserCreate(UserBase):
    """User registration schema."""
    password: str = Field(..., min_length=8)
    role: UserRole


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """User response schema."""
    id: UUID
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# --- Vendor Schemas ---
class VendorCreate(BaseModel):
    """Vendor registration schema."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    company_name: Optional[str] = None


class VendorResponse(BaseModel):
    """Vendor response schema."""
    id: UUID
    user_id: UUID
    company_name: Optional[str]
    wallet_balance: float
    created_at: datetime
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True


# --- Buyer Schemas ---
class BuyerCreate(BaseModel):
    """Buyer registration schema."""
    email: EmailStr
    password: str = Field(..., min_length=8)


class BuyerResponse(BaseModel):
    """Buyer response schema."""
    id: UUID
    user_id: UUID
    wallet_balance: float
    created_at: datetime
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

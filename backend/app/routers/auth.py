"""
Authentication Router
Login, Register, Token refresh
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.config import settings
from app.models.user import User, UserRole, Vendor, Buyer
from app.schemas.user import (
    UserCreate, UserResponse, UserLogin,
    VendorCreate, VendorResponse,
    BuyerCreate, BuyerResponse,
    Token
)
from app.services.auth_service import AuthService
from app.utils.dependencies import get_current_active_user


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user (vendor or buyer)."""
    # Check if email exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Admin can only be created by existing admin (not via public registration)
    if user_data.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be created via registration"
        )
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=AuthService.hash_password(user_data.password),
        role=user_data.role
    )
    db.add(user)
    await db.flush()
    
    # Create role-specific record
    if user_data.role == UserRole.VENDOR:
        vendor = Vendor(user_id=user.id)
        db.add(vendor)
    elif user_data.role == UserRole.BUYER:
        buyer = Buyer(
            user_id=user.id,
            wallet_balance=settings.DEFAULT_BUYER_CREDITS
        )
        db.add(buyer)
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.post("/register/vendor", status_code=status.HTTP_201_CREATED)
async def register_vendor(
    vendor_data: VendorCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new vendor."""
    # Check if email exists
    result = await db.execute(
        select(User).where(User.email == vendor_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = User(
        email=vendor_data.email,
        password_hash=AuthService.hash_password(vendor_data.password),
        role=UserRole.VENDOR
    )
    db.add(user)
    await db.flush()
    
    # Create vendor
    vendor = Vendor(
        user_id=user.id,
        company_name=vendor_data.company_name
    )
    db.add(vendor)
    
    await db.commit()
    await db.refresh(vendor)
    
    return {
        "id": str(vendor.id),
        "user_id": str(vendor.user_id),
        "company_name": vendor.company_name,
        "wallet_balance": float(vendor.wallet_balance),
        "message": "Vendor registered successfully"
    }


@router.post("/register/buyer", status_code=status.HTTP_201_CREATED)
async def register_buyer(
    buyer_data: BuyerCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new buyer."""
    # Check if email exists
    result = await db.execute(
        select(User).where(User.email == buyer_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = User(
        email=buyer_data.email,
        password_hash=AuthService.hash_password(buyer_data.password),
        role=UserRole.BUYER
    )
    db.add(user)
    await db.flush()
    
    # Create buyer with default credits
    buyer = Buyer(
        user_id=user.id,
        wallet_balance=settings.DEFAULT_BUYER_CREDITS
    )
    db.add(buyer)
    
    await db.commit()
    await db.refresh(buyer)
    
    return {
        "id": str(buyer.id),
        "user_id": str(buyer.user_id),
        "wallet_balance": float(buyer.wallet_balance),
        "message": "Buyer registered successfully"
    }


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login and get access token."""
    user = await AuthService.authenticate_user(
        db, form_data.username, form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = AuthService.create_access_token(user.id, user.role)
    refresh_token = AuthService.create_refresh_token(user.id, user.role)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/login/json", response_model=Token)
async def login_json(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login with JSON body and get access token."""
    user = await AuthService.authenticate_user(
        db, credentials.email, credentials.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = AuthService.create_access_token(user.id, user.role)
    refresh_token = AuthService.create_refresh_token(user.id, user.role)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token."""
    payload = AuthService.decode_token(refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    result = await db.execute(
        select(User).where(User.id == user_id, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    new_access_token = AuthService.create_access_token(user.id, user.role)
    new_refresh_token = AuthService.create_refresh_token(user.id, user.role)
    
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user info."""
    return current_user

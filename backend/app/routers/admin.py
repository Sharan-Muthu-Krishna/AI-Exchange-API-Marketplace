"""
Admin Router
Platform administration, user management, logs
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.models.user import User, UserRole, Vendor, Buyer
from app.models.api import Api
from app.models.transaction import ApiUsage, PlatformRevenue, WalletTransaction, TransactionType
from app.models.log import SystemLog
from app.schemas.user import UserResponse, VendorResponse, BuyerResponse
from app.utils.dependencies import require_role


router = APIRouter(prefix="/admin", tags=["Admin"])


# Require admin role for all endpoints
admin_required = require_role([UserRole.ADMIN])


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """Get admin dashboard overview."""
    # Total users by role
    vendors_result = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.VENDOR)
    )
    total_vendors = vendors_result.scalar_one()
    
    buyers_result = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.BUYER)
    )
    total_buyers = buyers_result.scalar_one()
    
    # Total APIs
    apis_result = await db.execute(select(func.count(Api.id)))
    total_apis = apis_result.scalar_one()
    
    # Active APIs
    active_apis_result = await db.execute(
        select(func.count(Api.id)).where(Api.is_active == True)
    )
    active_apis = active_apis_result.scalar_one()
    
    # Total API calls
    calls_result = await db.execute(select(func.count(ApiUsage.id)))
    total_calls = calls_result.scalar_one()
    
    # Calls in last 24h
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_calls_result = await db.execute(
        select(func.count(ApiUsage.id)).where(ApiUsage.timestamp >= yesterday)
    )
    recent_calls = recent_calls_result.scalar_one()
    
    # Platform revenue
    revenue_result = await db.execute(
        select(func.sum(PlatformRevenue.commission))
    )
    total_revenue = float(revenue_result.scalar_one() or 0)
    
    return {
        "total_vendors": total_vendors,
        "total_buyers": total_buyers,
        "total_apis": total_apis,
        "active_apis": active_apis,
        "total_api_calls": total_calls,
        "calls_last_24h": recent_calls,
        "total_platform_revenue": total_revenue
    }


# === User Management ===

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """List all users with filters."""
    query = select(User)
    
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: UUID,
    is_active: bool,
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """Enable or disable a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own account"
        )
    
    user.is_active = is_active
    await db.commit()
    
    return {"message": f"User {'enabled' if is_active else 'disabled'} successfully"}


# === Vendor Management ===

@router.get("/vendors")
async def list_vendors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """List all vendors."""
    result = await db.execute(
        select(Vendor, User.email)
        .join(User, Vendor.user_id == User.id)
        .order_by(Vendor.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = result.all()
    
    return [
        {
            "id": str(vendor.id),
            "user_id": str(vendor.user_id),
            "email": email,
            "company_name": vendor.company_name,
            "wallet_balance": float(vendor.wallet_balance),
            "created_at": vendor.created_at.isoformat()
        }
        for vendor, email in rows
    ]


# === Buyer Management ===

@router.get("/buyers")
async def list_buyers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """List all buyers."""
    result = await db.execute(
        select(Buyer, User.email)
        .join(User, Buyer.user_id == User.id)
        .order_by(Buyer.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = result.all()
    
    return [
        {
            "id": str(buyer.id),
            "user_id": str(buyer.user_id),
            "email": email,
            "wallet_balance": float(buyer.wallet_balance),
            "created_at": buyer.created_at.isoformat()
        }
        for buyer, email in rows
    ]


# === API Management ===

@router.get("/apis")
async def list_all_apis(
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """List all APIs in the platform."""
    query = select(Api, Vendor.company_name).join(Vendor, Api.vendor_id == Vendor.id)
    
    if is_active is not None:
        query = query.where(Api.is_active == is_active)
    
    query = query.order_by(Api.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "id": str(api.id),
            "name": api.name,
            "vendor_id": str(api.vendor_id),
            "vendor_name": vendor_name,
            "category": api.category,
            "price_per_call": float(api.price_per_call),
            "is_active": api.is_active,
            "created_at": api.created_at.isoformat()
        }
        for api, vendor_name in rows
    ]


@router.patch("/apis/{api_id}/status")
async def update_api_status(
    api_id: UUID,
    is_active: bool,
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """Enable or disable an API."""
    result = await db.execute(select(Api).where(Api.id == api_id))
    api = result.scalar_one_or_none()
    
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API not found"
        )
    
    api.is_active = is_active
    await db.commit()
    
    return {"message": f"API {'enabled' if is_active else 'disabled'} successfully"}


# === Traffic & Analytics ===

@router.get("/traffic")
async def get_traffic(
    hours: int = Query(24, ge=1, le=168),
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """Get traffic statistics."""
    since = datetime.utcnow() - timedelta(hours=hours)
    
    # Total calls
    total_result = await db.execute(
        select(func.count(ApiUsage.id)).where(ApiUsage.timestamp >= since)
    )
    total_calls = total_result.scalar_one()
    
    # Success rate
    success_result = await db.execute(
        select(func.count(ApiUsage.id)).where(
            and_(ApiUsage.timestamp >= since, ApiUsage.status == "SUCCESS")
        )
    )
    successful_calls = success_result.scalar_one()
    
    # Average response time
    avg_time_result = await db.execute(
        select(func.avg(ApiUsage.response_time_ms)).where(ApiUsage.timestamp >= since)
    )
    avg_response_time = float(avg_time_result.scalar_one() or 0)
    
    # Top APIs
    top_apis_result = await db.execute(
        select(Api.name, func.count(ApiUsage.id).label("calls"))
        .join(Api, ApiUsage.api_id == Api.id)
        .where(ApiUsage.timestamp >= since)
        .group_by(Api.id, Api.name)
        .order_by(func.count(ApiUsage.id).desc())
        .limit(10)
    )
    top_apis = [{"name": name, "calls": calls} for name, calls in top_apis_result.all()]
    
    return {
        "period_hours": hours,
        "total_calls": total_calls,
        "successful_calls": successful_calls,
        "failed_calls": total_calls - successful_calls,
        "success_rate": (successful_calls / total_calls * 100) if total_calls > 0 else 0,
        "avg_response_time_ms": round(avg_response_time, 2),
        "top_apis": top_apis
    }


# === System Logs ===

@router.get("/logs")
async def get_api_usage_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """Get API usage logs (call history)."""
    query = (
        select(ApiUsage, Api.name, User.email)
        .join(Api, ApiUsage.api_id == Api.id)
        .join(Buyer, ApiUsage.buyer_id == Buyer.id)
        .join(User, Buyer.user_id == User.id)
        .order_by(ApiUsage.timestamp.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "id": str(usage.id),
            "api_name": api_name,
            "buyer_email": buyer_email,
            "status": usage.status.value if usage.status else "UNKNOWN",
            "credits_used": float(usage.credits_used),
            "response_time_ms": float(usage.response_time_ms) if usage.response_time_ms else 0,
            "error_message": usage.error_message,
            "timestamp": usage.timestamp.isoformat()
        }
        for usage, api_name, buyer_email in rows
    ]


# === Platform Revenue ===

@router.get("/revenue")
async def get_revenue(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """Get platform revenue statistics."""
    since = datetime.utcnow() - timedelta(days=days)
    
    # Total revenue
    total_result = await db.execute(
        select(func.sum(PlatformRevenue.commission)).where(
            PlatformRevenue.timestamp >= since
        )
    )
    total_revenue = float(total_result.scalar_one() or 0)
    
    # Revenue by day (simplified)
    all_time_result = await db.execute(
        select(func.sum(PlatformRevenue.commission))
    )
    all_time_revenue = float(all_time_result.scalar_one() or 0)
    
    return {
        "period_days": days,
        "period_revenue": total_revenue,
        "all_time_revenue": all_time_revenue
    }

"""
Vendor Router
API management, analytics, earnings
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.api import Api
from app.models.transaction import ApiUsage, WalletTransaction, TransactionType
from app.schemas.api import ApiCreate, ApiUpdate, ApiResponse, ApiDetailResponse, ApiListResponse
from app.schemas.transaction import WalletTransactionResponse, ApiUsageResponse, WalletSummary
from app.utils.dependencies import require_role
from app.services.auth_service import AuthService


router = APIRouter(prefix="/vendor", tags=["Vendor"])


async def get_current_vendor(
    current_user: User = Depends(require_role([UserRole.VENDOR])),
    db: AsyncSession = Depends(get_db)
):
    """Get current vendor from user."""
    vendor = await AuthService.get_vendor_by_user_id(db, current_user.id)
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )
    return vendor


@router.get("/dashboard")
async def get_dashboard(
    vendor = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor dashboard overview."""
    # Total APIs
    apis_result = await db.execute(
        select(func.count(Api.id)).where(Api.vendor_id == vendor.id)
    )
    total_apis = apis_result.scalar_one()
    
    # Active APIs
    active_result = await db.execute(
        select(func.count(Api.id)).where(
            Api.vendor_id == vendor.id,
            Api.is_active == True
        )
    )
    active_apis = active_result.scalar_one()
    
    # Total calls (via join)
    calls_result = await db.execute(
        select(func.count(ApiUsage.id))
        .join(Api, ApiUsage.api_id == Api.id)
        .where(Api.vendor_id == vendor.id)
    )
    total_calls = calls_result.scalar_one()
    
    # Total earnings
    earnings_result = await db.execute(
        select(func.sum(WalletTransaction.amount))
        .where(
            WalletTransaction.vendor_id == vendor.id,
            WalletTransaction.type == TransactionType.CREDIT
        )
    )
    total_earnings = float(earnings_result.scalar_one() or 0)
    
    return {
        "wallet_balance": float(vendor.wallet_balance),
        "total_apis": total_apis,
        "active_apis": active_apis,
        "total_calls": total_calls,
        "total_earnings": total_earnings
    }


@router.get("/apis", response_model=List[ApiDetailResponse])
async def list_my_apis(
    vendor = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """List all APIs owned by current vendor."""
    result = await db.execute(
        select(Api).where(Api.vendor_id == vendor.id).order_by(Api.created_at.desc())
    )
    apis = result.scalars().all()
    
    # Add gateway URL and stats
    response = []
    for api in apis:
        # Get call count
        calls_result = await db.execute(
            select(func.count(ApiUsage.id)).where(ApiUsage.api_id == api.id)
        )
        total_calls = calls_result.scalar_one()
        
        api_dict = {
            "id": api.id,
            "vendor_id": api.vendor_id,
            "name": api.name,
            "description": api.description,
            "category": api.category,
            "real_endpoint": api.real_endpoint,
            "input_schema": api.input_schema,
            "output_schema": api.output_schema,
            "price_per_call": float(api.price_per_call),
            "is_active": api.is_active,
            "created_at": api.created_at,
            "updated_at": api.updated_at,
            "gateway_url": f"/v1/apis/{api.id}/run",
            "total_calls": total_calls
        }
        response.append(ApiDetailResponse(**api_dict))
    
    return response


@router.post("/apis", response_model=ApiDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_api(
    api_data: ApiCreate,
    vendor = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Create a new API."""
    api = Api(
        vendor_id=vendor.id,
        name=api_data.name,
        description=api_data.description,
        category=api_data.category,
        real_endpoint=api_data.real_endpoint,
        input_schema=api_data.input_schema,
        output_schema=api_data.output_schema,
        price_per_call=api_data.price_per_call
    )
    db.add(api)
    await db.commit()
    await db.refresh(api)
    
    return ApiDetailResponse(
        id=api.id,
        vendor_id=api.vendor_id,
        name=api.name,
        description=api.description,
        category=api.category,
        real_endpoint=api.real_endpoint,
        input_schema=api.input_schema,
        output_schema=api.output_schema,
        price_per_call=float(api.price_per_call),
        is_active=api.is_active,
        created_at=api.created_at,
        gateway_url=f"/v1/apis/{api.id}/run",
        total_calls=0
    )


@router.get("/apis/{api_id}", response_model=ApiDetailResponse)
async def get_api(
    api_id: UUID,
    vendor = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific API by ID."""
    result = await db.execute(
        select(Api).where(Api.id == api_id, Api.vendor_id == vendor.id)
    )
    api = result.scalar_one_or_none()
    
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API not found"
        )
    
    # Get call count
    calls_result = await db.execute(
        select(func.count(ApiUsage.id)).where(ApiUsage.api_id == api.id)
    )
    total_calls = calls_result.scalar_one()
    
    return ApiDetailResponse(
        id=api.id,
        vendor_id=api.vendor_id,
        name=api.name,
        description=api.description,
        category=api.category,
        real_endpoint=api.real_endpoint,
        input_schema=api.input_schema,
        output_schema=api.output_schema,
        price_per_call=float(api.price_per_call),
        is_active=api.is_active,
        created_at=api.created_at,
        updated_at=api.updated_at,
        gateway_url=f"/v1/apis/{api.id}/run",
        total_calls=total_calls
    )


@router.patch("/apis/{api_id}", response_model=ApiDetailResponse)
async def update_api(
    api_id: UUID,
    api_data: ApiUpdate,
    vendor = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Update an API."""
    result = await db.execute(
        select(Api).where(Api.id == api_id, Api.vendor_id == vendor.id)
    )
    api = result.scalar_one_or_none()
    
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API not found"
        )
    
    # Update fields
    update_data = api_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(api, field, value)
    
    await db.commit()
    await db.refresh(api)
    
    return ApiDetailResponse(
        id=api.id,
        vendor_id=api.vendor_id,
        name=api.name,
        description=api.description,
        category=api.category,
        real_endpoint=api.real_endpoint,
        input_schema=api.input_schema,
        output_schema=api.output_schema,
        price_per_call=float(api.price_per_call),
        is_active=api.is_active,
        created_at=api.created_at,
        updated_at=api.updated_at,
        gateway_url=f"/v1/apis/{api.id}/run"
    )


@router.delete("/apis/{api_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api(
    api_id: UUID,
    vendor = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate an API (soft delete)."""
    result = await db.execute(
        select(Api).where(Api.id == api_id, Api.vendor_id == vendor.id)
    )
    api = result.scalar_one_or_none()
    
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API not found"
        )
    
    api.is_active = False
    await db.commit()


@router.get("/apis/{api_id}/analytics")
async def get_api_analytics(
    api_id: UUID,
    vendor = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get analytics for a specific API."""
    # Verify ownership
    result = await db.execute(
        select(Api).where(Api.id == api_id, Api.vendor_id == vendor.id)
    )
    api = result.scalar_one_or_none()
    
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API not found"
        )
    
    # Total calls
    calls_result = await db.execute(
        select(func.count(ApiUsage.id)).where(ApiUsage.api_id == api_id)
    )
    total_calls = calls_result.scalar_one()
    
    # Successful calls
    success_result = await db.execute(
        select(func.count(ApiUsage.id)).where(
            ApiUsage.api_id == api_id,
            ApiUsage.status == "SUCCESS"
        )
    )
    successful_calls = success_result.scalar_one()
    
    # Total earnings
    earnings_result = await db.execute(
        select(func.sum(WalletTransaction.amount))
        .where(
            WalletTransaction.api_id == api_id,
            WalletTransaction.vendor_id == vendor.id,
            WalletTransaction.type == TransactionType.CREDIT
        )
    )
    total_earnings = float(earnings_result.scalar_one() or 0)
    
    # Average response time
    avg_time_result = await db.execute(
        select(func.avg(ApiUsage.response_time_ms)).where(ApiUsage.api_id == api_id)
    )
    avg_response_time = float(avg_time_result.scalar_one() or 0)
    
    return {
        "api_id": str(api_id),
        "api_name": api.name,
        "total_calls": total_calls,
        "successful_calls": successful_calls,
        "failed_calls": total_calls - successful_calls,
        "success_rate": (successful_calls / total_calls * 100) if total_calls > 0 else 0,
        "total_earnings": total_earnings,
        "avg_response_time_ms": round(avg_response_time, 2)
    }


@router.get("/logs")
async def get_logs(
    api_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    vendor = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get API usage logs for vendor's APIs."""
    # Build query
    query = (
        select(ApiUsage, Api.name)
        .join(Api, ApiUsage.api_id == Api.id)
        .where(Api.vendor_id == vendor.id)
    )
    
    if api_id:
        query = query.where(ApiUsage.api_id == api_id)
    
    query = query.order_by(ApiUsage.timestamp.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "id": str(usage.id),
            "api_id": str(usage.api_id),
            "api_name": api_name,
            "buyer_id": str(usage.buyer_id),
            "api_key_id": str(usage.api_key_id),
            "credits_used": float(usage.credits_used),
            "status": usage.status.value if usage.status else "UNKNOWN",
            "response_time_ms": float(usage.response_time_ms) if usage.response_time_ms else 0,
            "error_message": usage.error_message,
            "timestamp": usage.timestamp.isoformat()
        }
        for usage, api_name in rows
    ]


@router.get("/earnings", response_model=WalletSummary)
async def get_earnings(
    vendor = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get vendor earnings summary."""
    # Total earned
    total_result = await db.execute(
        select(func.sum(WalletTransaction.amount))
        .where(
            WalletTransaction.vendor_id == vendor.id,
            WalletTransaction.type == TransactionType.CREDIT
        )
    )
    total_earned = float(total_result.scalar_one() or 0)
    
    # Recent transactions
    tx_result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.vendor_id == vendor.id)
        .order_by(WalletTransaction.timestamp.desc())
        .limit(10)
    )
    transactions = tx_result.scalars().all()
    
    return WalletSummary(
        balance=float(vendor.wallet_balance),
        total_earned=total_earned,
        recent_transactions=[
            WalletTransactionResponse(
                id=tx.id,
                buyer_id=tx.buyer_id,
                vendor_id=tx.vendor_id,
                api_id=tx.api_id,
                amount=float(tx.amount),
                type=tx.type,
                description=tx.description,
                timestamp=tx.timestamp
            )
            for tx in transactions
        ]
    )

"""
Marketplace Router
Public API discovery
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.api import Api
from app.models.user import Vendor
from app.models.transaction import ApiUsage
from app.schemas.api import ApiResponse, ApiListResponse


router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("/apis", response_model=ApiListResponse)
async def list_apis(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Browse available APIs in the marketplace.
    Public endpoint - no authentication required.
    """
    # Base query - only active APIs
    query = (
        select(Api, Vendor.company_name)
        .join(Vendor, Api.vendor_id == Vendor.id)
        .where(Api.is_active == True)
    )
    
    # Apply filters
    if category:
        query = query.where(Api.category == category)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            (Api.name.ilike(search_term)) | (Api.description.ilike(search_term))
        )
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    
    # Apply pagination
    query = query.order_by(Api.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    rows = result.all()
    
    # Build response
    items = []
    for api, vendor_name in rows:
        # Get call count for popularity
        calls_result = await db.execute(
            select(func.count(ApiUsage.id)).where(ApiUsage.api_id == api.id)
        )
        total_calls = calls_result.scalar_one()
        
        items.append(ApiResponse(
            id=api.id,
            vendor_id=api.vendor_id,
            name=api.name,
            description=api.description,
            category=api.category,
            price_per_call=float(api.price_per_call),
            is_active=api.is_active,
            created_at=api.created_at,
            gateway_url=f"/v1/apis/{api.id}/run",
            vendor_name=vendor_name,
            total_calls=total_calls
        ))
    
    return ApiListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/apis/{api_id}")
async def get_api_details(
    api_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific API.
    Public endpoint - no authentication required.
    """
    result = await db.execute(
        select(Api, Vendor.company_name)
        .join(Vendor, Api.vendor_id == Vendor.id)
        .where(Api.id == api_id, Api.is_active == True)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API not found"
        )
    
    api, vendor_name = row
    
    # Get call count
    calls_result = await db.execute(
        select(func.count(ApiUsage.id)).where(ApiUsage.api_id == api.id)
    )
    total_calls = calls_result.scalar_one()
    
    # Return all details including input/output schemas
    return {
        "id": str(api.id),
        "vendor_id": str(api.vendor_id),
        "name": api.name,
        "description": api.description,
        "category": api.category,
        "price_per_call": float(api.price_per_call),
        "is_active": api.is_active,
        "created_at": api.created_at.isoformat(),
        "gateway_url": f"/v1/apis/{api.id}/run",
        "vendor_name": vendor_name,
        "total_calls": total_calls,
        "input_schema": api.input_schema,
        "output_schema": api.output_schema
    }


@router.get("/categories")
async def list_categories(
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of API categories.
    """
    result = await db.execute(
        select(Api.category, func.count(Api.id).label("count"))
        .where(Api.is_active == True, Api.category.isnot(None))
        .group_by(Api.category)
        .order_by(func.count(Api.id).desc())
    )
    categories = result.all()
    
    return [
        {"name": cat, "count": count}
        for cat, count in categories
    ]

"""
Buyer Router
Subscriptions, API keys, credits, usage
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User, UserRole, Buyer
from app.models.api import Api, Subscription
from app.models.key import ApiKey
from app.models.transaction import ApiUsage, WalletTransaction, TransactionType
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse
from app.schemas.key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreated
from app.schemas.transaction import (
    CreditPurchase, WalletTransactionResponse, 
    ApiUsageResponse, WalletSummary
)
from app.utils.dependencies import require_role
from app.services.auth_service import AuthService
from app.services.billing_service import BillingService


router = APIRouter(prefix="/buyer", tags=["Buyer"])


async def get_current_buyer(
    current_user: User = Depends(require_role([UserRole.BUYER])),
    db: AsyncSession = Depends(get_db)
):
    """Get current buyer from user."""
    buyer = await AuthService.get_buyer_by_user_id(db, current_user.id)
    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buyer profile not found"
        )
    return buyer


@router.get("/dashboard")
async def get_dashboard(
    buyer = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_db)
):
    """Get buyer dashboard overview."""
    # Active subscriptions
    subs_result = await db.execute(
        select(func.count(Subscription.id)).where(
            Subscription.buyer_id == buyer.id,
            Subscription.is_active == True
        )
    )
    active_subscriptions = subs_result.scalar_one()
    
    # Total API calls
    calls_result = await db.execute(
        select(func.count(ApiUsage.id)).where(ApiUsage.buyer_id == buyer.id)
    )
    total_calls = calls_result.scalar_one()
    
    # Total spent
    spent_result = await db.execute(
        select(func.sum(WalletTransaction.amount))
        .where(
            WalletTransaction.buyer_id == buyer.id,
            WalletTransaction.type == TransactionType.DEBIT
        )
    )
    total_spent = float(spent_result.scalar_one() or 0)
    
    # API keys count
    keys_result = await db.execute(
        select(func.count(ApiKey.id)).where(
            ApiKey.buyer_id == buyer.id,
            ApiKey.is_active == True
        )
    )
    active_keys = keys_result.scalar_one()
    
    return {
        "wallet_balance": float(buyer.wallet_balance),
        "active_subscriptions": active_subscriptions,
        "total_api_calls": total_calls,
        "total_spent": total_spent,
        "active_api_keys": active_keys
    }


# === Subscriptions ===

@router.get("/subscriptions", response_model=List[SubscriptionResponse])
async def list_subscriptions(
    buyer = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_db)
):
    """List all buyer subscriptions."""
    result = await db.execute(
        select(Subscription, Api.name, Api.price_per_call)
        .join(Api, Subscription.api_id == Api.id)
        .where(Subscription.buyer_id == buyer.id)
        .order_by(Subscription.created_at.desc())
    )
    rows = result.all()
    
    return [
        SubscriptionResponse(
            id=sub.id,
            buyer_id=sub.buyer_id,
            api_id=sub.api_id,
            is_active=sub.is_active,
            created_at=sub.created_at,
            api_name=api_name,
            api_price=float(api_price)
        )
        for sub, api_name, api_price in rows
    ]


@router.post("/subscriptions", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    sub_data: SubscriptionCreate,
    buyer = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_db)
):
    """Subscribe to an API."""
    # Check if API exists and is active
    api_result = await db.execute(
        select(Api).where(Api.id == sub_data.api_id, Api.is_active == True)
    )
    api = api_result.scalar_one_or_none()
    
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API not found or inactive"
        )
    
    # Check if already subscribed
    existing = await db.execute(
        select(Subscription).where(
            Subscription.buyer_id == buyer.id,
            Subscription.api_id == sub_data.api_id
        )
    )
    existing_sub = existing.scalar_one_or_none()
    
    if existing_sub:
        if existing_sub.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already subscribed to this API"
            )
        # Reactivate
        existing_sub.is_active = True
        await db.commit()
        await db.refresh(existing_sub)
        return SubscriptionResponse(
            id=existing_sub.id,
            buyer_id=existing_sub.buyer_id,
            api_id=existing_sub.api_id,
            is_active=existing_sub.is_active,
            created_at=existing_sub.created_at,
            api_name=api.name,
            api_price=float(api.price_per_call)
        )
    
    # Create new subscription
    subscription = Subscription(
        buyer_id=buyer.id,
        api_id=sub_data.api_id
    )
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)
    
    return SubscriptionResponse(
        id=subscription.id,
        buyer_id=subscription.buyer_id,
        api_id=subscription.api_id,
        is_active=subscription.is_active,
        created_at=subscription.created_at,
        api_name=api.name,
        api_price=float(api.price_per_call)
    )


@router.delete("/subscriptions/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_subscription(
    subscription_id: UUID,
    buyer = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a subscription."""
    result = await db.execute(
        select(Subscription).where(
            Subscription.id == subscription_id,
            Subscription.buyer_id == buyer.id
        )
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    subscription.is_active = False
    await db.commit()


# === API Keys ===

@router.get("/keys", response_model=List[ApiKeyResponse])
async def list_api_keys(
    buyer = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_db)
):
    """List all API keys."""
    result = await db.execute(
        select(ApiKey)
        .where(ApiKey.buyer_id == buyer.id)
        .order_by(ApiKey.created_at.desc())
    )
    keys = result.scalars().all()
    
    return [
        ApiKeyResponse(
            id=key.id,
            buyer_id=key.buyer_id,
            key_prefix=key.key_prefix,
            name=key.name,
            is_active=key.is_active,
            last_used_at=key.last_used_at,
            created_at=key.created_at
        )
        for key in keys
    ]


@router.post("/keys", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    key_data: ApiKeyCreate,
    buyer = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_db)
):
    """Create a new API key."""
    # Generate key
    full_key, key_hash, key_prefix = AuthService.generate_api_key()
    
    api_key = ApiKey(
        buyer_id=buyer.id,
        key_hash=key_hash,
        key_prefix=key_prefix,
        name=key_data.name
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    
    return ApiKeyCreated(
        id=api_key.id,
        key=full_key,  # Only returned once!
        key_prefix=key_prefix,
        name=api_key.name
    )


@router.delete("/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: UUID,
    buyer = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_db)
):
    """Revoke an API key."""
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.id == key_id,
            ApiKey.buyer_id == buyer.id
        )
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    api_key.is_active = False
    await db.commit()


# === Credits ===

@router.post("/credits/purchase", response_model=WalletTransactionResponse)
async def purchase_credits(
    purchase: CreditPurchase,
    buyer = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_db)
):
    """Purchase credits (simulated)."""
    transaction = await BillingService.purchase_credits(
        db, buyer.id, purchase.amount
    )
    
    return WalletTransactionResponse(
        id=transaction.id,
        buyer_id=transaction.buyer_id,
        vendor_id=transaction.vendor_id,
        api_id=transaction.api_id,
        amount=float(transaction.amount),
        type=transaction.type,
        description=transaction.description,
        timestamp=transaction.timestamp
    )


@router.get("/credits", response_model=WalletSummary)
async def get_credits(
    buyer = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_db)
):
    """Get credit balance and transaction history."""
    # Total spent
    total_spent = await BillingService.get_buyer_total_spent(db, buyer.id)
    
    # Recent transactions
    tx_result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.buyer_id == buyer.id)
        .order_by(WalletTransaction.timestamp.desc())
        .limit(10)
    )
    transactions = tx_result.scalars().all()
    
    return WalletSummary(
        balance=float(buyer.wallet_balance),
        total_spent=total_spent,
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


# === Usage ===

@router.get("/usage", response_model=List[ApiUsageResponse])
async def get_usage(
    api_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    buyer = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_db)
):
    """Get API usage history."""
    query = (
        select(ApiUsage, Api.name)
        .join(Api, ApiUsage.api_id == Api.id)
        .where(ApiUsage.buyer_id == buyer.id)
    )
    
    if api_id:
        query = query.where(ApiUsage.api_id == api_id)
    
    query = query.order_by(ApiUsage.timestamp.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        ApiUsageResponse(
            id=usage.id,
            api_id=usage.api_id,
            buyer_id=usage.buyer_id,
            api_key_id=usage.api_key_id,
            credits_used=float(usage.credits_used),
            status=usage.status,
            response_time_ms=float(usage.response_time_ms) if usage.response_time_ms else None,
            error_message=usage.error_message,
            timestamp=usage.timestamp,
            api_name=api_name
        )
        for usage, api_name in rows
    ]

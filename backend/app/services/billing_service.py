"""
Billing Service
Credit operations, wallet transactions, platform commission
"""
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.config import settings
from app.models.user import Buyer, Vendor
from app.models.api import Api
from app.models.transaction import (
    WalletTransaction, TransactionType, 
    ApiUsage, UsageStatus, PlatformRevenue
)


class BillingService:
    """Billing and wallet management service."""
    
    @staticmethod
    async def get_buyer_balance(db: AsyncSession, buyer_id: UUID) -> Decimal:
        """Get buyer's current wallet balance."""
        result = await db.execute(
            select(Buyer.wallet_balance).where(Buyer.id == buyer_id)
        )
        balance = result.scalar_one_or_none()
        return Decimal(str(balance)) if balance else Decimal("0")
    
    @staticmethod
    async def get_vendor_balance(db: AsyncSession, vendor_id: UUID) -> Decimal:
        """Get vendor's current wallet balance."""
        result = await db.execute(
            select(Vendor.wallet_balance).where(Vendor.id == vendor_id)
        )
        balance = result.scalar_one_or_none()
        return Decimal(str(balance)) if balance else Decimal("0")
    
    @classmethod
    async def purchase_credits(
        cls,
        db: AsyncSession,
        buyer_id: UUID,
        amount: float
    ) -> WalletTransaction:
        """
        Purchase credits for a buyer (simulated).
        """
        amount_decimal = Decimal(str(amount))
        
        # Update buyer balance
        result = await db.execute(
            select(Buyer).where(Buyer.id == buyer_id)
        )
        buyer = result.scalar_one()
        buyer.wallet_balance = Decimal(str(buyer.wallet_balance)) + amount_decimal
        
        # Create transaction record
        transaction = WalletTransaction(
            buyer_id=buyer_id,
            amount=amount_decimal,
            type=TransactionType.PURCHASE,
            description=f"Credit purchase: {amount} credits"
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        
        return transaction
    
    @classmethod
    async def check_sufficient_credits(
        cls,
        db: AsyncSession,
        buyer_id: UUID,
        required_credits: float
    ) -> bool:
        """Check if buyer has sufficient credits."""
        balance = await cls.get_buyer_balance(db, buyer_id)
        return balance >= Decimal(str(required_credits))
    
    @classmethod
    async def process_api_call_billing(
        cls,
        db: AsyncSession,
        api: Api,
        buyer_id: UUID,
        api_key_id: UUID,
        status: UsageStatus,
        response_time_ms: Optional[float] = None,
        error_message: Optional[str] = None
    ) -> ApiUsage:
        """
        Process billing for an API call.
        1. Deduct from buyer wallet
        2. Credit vendor wallet (minus commission)
        3. Record platform commission
        4. Log API usage
        """
        price = Decimal(str(api.price_per_call))
        commission_rate = Decimal(str(settings.PLATFORM_COMMISSION_RATE))
        commission = price * commission_rate
        vendor_earnings = price - commission
        
        # Only charge if successful
        if status == UsageStatus.SUCCESS:
            # 1. Deduct from buyer
            buyer_result = await db.execute(
                select(Buyer).where(Buyer.id == buyer_id)
            )
            buyer = buyer_result.scalar_one()
            buyer.wallet_balance = Decimal(str(buyer.wallet_balance)) - price
            
            # 2. Credit vendor
            vendor_result = await db.execute(
                select(Vendor).where(Vendor.id == api.vendor_id)
            )
            vendor = vendor_result.scalar_one()
            vendor.wallet_balance = Decimal(str(vendor.wallet_balance)) + vendor_earnings
            
            credits_used = float(price)
        else:
            credits_used = 0.0
        
        # 3. Create API usage log
        usage = ApiUsage(
            api_id=api.id,
            buyer_id=buyer_id,
            api_key_id=api_key_id,
            credits_used=credits_used,
            status=status,
            response_time_ms=response_time_ms,
            error_message=error_message
        )
        db.add(usage)
        await db.flush()  # Get the usage ID
        
        # 4. Record platform commission (only for successful calls)
        if status == UsageStatus.SUCCESS:
            revenue = PlatformRevenue(
                api_usage_id=usage.id,
                commission=float(commission)
            )
            db.add(revenue)
            
            # 5. Create wallet transactions
            # Buyer debit
            buyer_tx = WalletTransaction(
                buyer_id=buyer_id,
                api_id=api.id,
                amount=float(price),
                type=TransactionType.DEBIT,
                description=f"API call: {api.name}"
            )
            db.add(buyer_tx)
            
            # Vendor credit
            vendor_tx = WalletTransaction(
                vendor_id=api.vendor_id,
                api_id=api.id,
                amount=float(vendor_earnings),
                type=TransactionType.CREDIT,
                description=f"API earnings: {api.name}"
            )
            db.add(vendor_tx)
            
            # Platform commission
            platform_tx = WalletTransaction(
                api_id=api.id,
                amount=float(commission),
                type=TransactionType.COMMISSION,
                description=f"Platform commission: {api.name}"
            )
            db.add(platform_tx)
        
        await db.commit()
        await db.refresh(usage)
        
        return usage
    
    @classmethod
    async def get_buyer_total_spent(cls, db: AsyncSession, buyer_id: UUID) -> float:
        """Get total amount spent by a buyer."""
        result = await db.execute(
            select(func.sum(WalletTransaction.amount))
            .where(
                WalletTransaction.buyer_id == buyer_id,
                WalletTransaction.type == TransactionType.DEBIT
            )
        )
        total = result.scalar_one_or_none()
        return float(total) if total else 0.0
    
    @classmethod
    async def get_vendor_total_earned(cls, db: AsyncSession, vendor_id: UUID) -> float:
        """Get total amount earned by a vendor."""
        result = await db.execute(
            select(func.sum(WalletTransaction.amount))
            .where(
                WalletTransaction.vendor_id == vendor_id,
                WalletTransaction.type == TransactionType.CREDIT
            )
        )
        total = result.scalar_one_or_none()
        return float(total) if total else 0.0

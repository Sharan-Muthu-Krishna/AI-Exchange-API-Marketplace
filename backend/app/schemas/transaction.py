"""
Transaction Schemas - Credits, Usage, Wallet
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.transaction import TransactionType, UsageStatus


class CreditPurchase(BaseModel):
    """Credit purchase schema (simulated)."""
    amount: float = Field(..., gt=0, description="Amount of credits to purchase")


class WalletTransactionResponse(BaseModel):
    """Wallet transaction response."""
    id: UUID
    buyer_id: Optional[UUID] = None
    vendor_id: Optional[UUID] = None
    api_id: Optional[UUID] = None
    amount: float
    type: TransactionType
    description: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True


class ApiUsageResponse(BaseModel):
    """API usage log response."""
    id: UUID
    api_id: UUID
    buyer_id: UUID
    api_key_id: UUID
    credits_used: float
    status: UsageStatus
    response_time_ms: Optional[float] = None
    error_message: Optional[str] = None
    timestamp: datetime
    # Optional related data
    api_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class ApiUsageListResponse(BaseModel):
    """Paginated API usage list."""
    items: List[ApiUsageResponse]
    total: int
    page: int
    page_size: int


class PlatformRevenueResponse(BaseModel):
    """Platform revenue response."""
    id: UUID
    api_usage_id: UUID
    commission: float
    timestamp: datetime
    
    class Config:
        from_attributes = True


class WalletSummary(BaseModel):
    """Wallet summary for buyers/vendors."""
    balance: float
    total_spent: Optional[float] = None  # For buyers
    total_earned: Optional[float] = None  # For vendors
    recent_transactions: List[WalletTransactionResponse] = []

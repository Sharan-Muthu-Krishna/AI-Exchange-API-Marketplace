"""
Subscription Schemas
"""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Optional


class SubscriptionCreate(BaseModel):
    """Create subscription schema."""
    api_id: UUID


class SubscriptionResponse(BaseModel):
    """Subscription response schema."""
    id: UUID
    buyer_id: UUID
    api_id: UUID
    is_active: bool
    created_at: datetime
    # Optional related data
    api_name: Optional[str] = None
    api_price: Optional[float] = None
    
    class Config:
        from_attributes = True

"""
API Key Schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    """Create API key schema."""
    name: Optional[str] = Field(None, max_length=100)


class ApiKeyResponse(BaseModel):
    """API key response schema (without full key)."""
    id: UUID
    buyer_id: UUID
    key_prefix: str  # e.g., ae_live_abc...
    name: Optional[str] = None
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ApiKeyCreated(BaseModel):
    """API key created response (includes full key - only shown once)."""
    id: UUID
    key: str  # Full key - ONLY returned on creation
    key_prefix: str
    name: Optional[str] = None
    message: str = "Store this key securely. It will not be shown again."

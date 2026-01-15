"""
API Schemas
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl


class ApiBase(BaseModel):
    """Base API schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None


class ApiCreate(ApiBase):
    """Create API schema."""
    real_endpoint: str = Field(..., description="The actual vendor endpoint URL")
    input_schema: Optional[str] = None  # JSON schema as string
    output_schema: Optional[str] = None  # JSON schema as string
    price_per_call: float = Field(..., gt=0, description="Credits per API call")


class ApiUpdate(BaseModel):
    """Update API schema."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    input_schema: Optional[str] = None
    output_schema: Optional[str] = None
    price_per_call: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None


class ApiResponse(ApiBase):
    """API response schema."""
    id: UUID
    vendor_id: UUID
    price_per_call: float
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Gateway URL (generated)
    gateway_url: Optional[str] = None
    # Optional vendor info
    vendor_name: Optional[str] = None
    # Stats
    total_calls: Optional[int] = None
    
    class Config:
        from_attributes = True


class ApiDetailResponse(ApiResponse):
    """Detailed API response with schemas (for vendor/documentation)."""
    real_endpoint: Optional[str] = None  # Only shown to vendor
    input_schema: Optional[str] = None
    output_schema: Optional[str] = None


class ApiListResponse(BaseModel):
    """Paginated API list response."""
    items: List[ApiResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

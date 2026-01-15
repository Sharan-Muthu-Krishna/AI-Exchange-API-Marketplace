"""
API and Subscription Models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Api(Base):
    """API model - Each model/API published by vendors."""
    __tablename__ = "apis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    real_endpoint = Column(String(500), nullable=False)  # Private vendor URL
    input_schema = Column(Text, nullable=True)  # JSON schema for input
    output_schema = Column(Text, nullable=True)  # JSON schema for output
    price_per_call = Column(Numeric(precision=10, scale=4), nullable=False, default=1.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    vendor = relationship("Vendor", back_populates="apis")
    subscriptions = relationship("Subscription", back_populates="api")
    api_usages = relationship("ApiUsage", back_populates="api")
    wallet_transactions = relationship("WalletTransaction", back_populates="api")


class Subscription(Base):
    """Subscription model - Which buyer has access to which API."""
    __tablename__ = "subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("buyers.id"), nullable=False)
    api_id = Column(UUID(as_uuid=True), ForeignKey("apis.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    buyer = relationship("Buyer", back_populates="subscriptions")
    api = relationship("Api", back_populates="subscriptions")

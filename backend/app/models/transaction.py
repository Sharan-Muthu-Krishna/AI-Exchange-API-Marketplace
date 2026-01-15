"""
Transaction Models - Usage, Wallet Transactions, Platform Revenue
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class UsageStatus(str, enum.Enum):
    """API usage status enumeration."""
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    TIMEOUT = "TIMEOUT"
    RATE_LIMITED = "RATE_LIMITED"


class TransactionType(str, enum.Enum):
    """Wallet transaction type enumeration."""
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"
    COMMISSION = "COMMISSION"
    PURCHASE = "PURCHASE"  # Credit purchase


class ApiUsage(Base):
    """API Usage model - Every API call goes here."""
    __tablename__ = "api_usage"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_id = Column(UUID(as_uuid=True), ForeignKey("apis.id"), nullable=False)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("buyers.id"), nullable=False)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=False)
    credits_used = Column(Numeric(precision=10, scale=4), nullable=False)
    status = Column(SQLEnum(UsageStatus), nullable=False)
    response_time_ms = Column(Numeric(precision=10, scale=2), nullable=True)
    error_message = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    api = relationship("Api", back_populates="api_usages")
    buyer = relationship("Buyer", back_populates="api_usages")
    api_key = relationship("ApiKey", back_populates="api_usages")
    platform_revenue = relationship("PlatformRevenue", back_populates="api_usage", uselist=False)


class WalletTransaction(Base):
    """Wallet Transaction model - Tracks all credit movements."""
    __tablename__ = "wallet_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("buyers.id"), nullable=True)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=True)
    api_id = Column(UUID(as_uuid=True), ForeignKey("apis.id"), nullable=True)
    amount = Column(Numeric(precision=12, scale=4), nullable=False)
    type = Column(SQLEnum(TransactionType), nullable=False)
    description = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    buyer = relationship("Buyer", back_populates="wallet_transactions")
    vendor = relationship("Vendor", back_populates="wallet_transactions")
    api = relationship("Api", back_populates="wallet_transactions")


class PlatformRevenue(Base):
    """Platform Revenue model - Commission from each API call."""
    __tablename__ = "platform_revenue"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_usage_id = Column(UUID(as_uuid=True), ForeignKey("api_usage.id"), nullable=False)
    commission = Column(Numeric(precision=10, scale=4), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    api_usage = relationship("ApiUsage", back_populates="platform_revenue")

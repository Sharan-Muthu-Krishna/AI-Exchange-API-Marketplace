"""
User, Vendor, and Buyer Models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration."""
    ADMIN = "ADMIN"
    VENDOR = "VENDOR"
    BUYER = "BUYER"


class User(Base):
    """User model - All humans: admins, vendors, buyers."""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    vendor = relationship("Vendor", back_populates="user", uselist=False)
    buyer = relationship("Buyer", back_populates="user", uselist=False)
    system_logs = relationship("SystemLog", back_populates="user")


class Vendor(Base):
    """Vendor model - Only for users who are vendors."""
    __tablename__ = "vendors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    company_name = Column(String, nullable=True)
    wallet_balance = Column(Numeric(precision=12, scale=2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="vendor")
    apis = relationship("Api", back_populates="vendor")
    wallet_transactions = relationship("WalletTransaction", back_populates="vendor")


class Buyer(Base):
    """Buyer model - API consumers."""
    __tablename__ = "buyers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    wallet_balance = Column(Numeric(precision=12, scale=2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="buyer")
    api_keys = relationship("ApiKey", back_populates="buyer")
    subscriptions = relationship("Subscription", back_populates="buyer")
    api_usages = relationship("ApiUsage", back_populates="buyer")
    wallet_transactions = relationship("WalletTransaction", back_populates="buyer")

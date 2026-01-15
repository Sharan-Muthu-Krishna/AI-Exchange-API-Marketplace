"""
API Key Model
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ApiKey(Base):
    """API Key model - Buyer API keys for authentication."""
    __tablename__ = "api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("buyers.id"), nullable=False)
    key_hash = Column(String(256), unique=True, nullable=False, index=True)
    key_prefix = Column(String(20), nullable=False)  # Store prefix for display (e.g., ae_live_abc...)
    name = Column(String(100), nullable=True)  # Optional friendly name
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    buyer = relationship("Buyer", back_populates="api_keys")
    api_usages = relationship("ApiUsage", back_populates="api_key")

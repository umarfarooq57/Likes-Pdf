"""
Subscription Model
Database models for SaaS subscription management
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, JSON, Numeric, Text
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class PlanType(str, enum.Enum):
    """Subscription plan types"""
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    """Subscription status"""
    ACTIVE = "active"
    TRIAL = "trial"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Plan(Base):
    """Subscription plan definition"""
    __tablename__ = "plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Pricing
    price_monthly = Column(Numeric(10, 2), default=0, nullable=False)
    price_yearly = Column(Numeric(10, 2), default=0, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    
    # Limits
    max_file_size_mb = Column(Integer, default=10, nullable=False)
    max_files_per_day = Column(Integer, default=5, nullable=False)
    max_storage_mb = Column(Integer, default=100, nullable=False)
    max_pages_per_document = Column(Integer, default=50, nullable=False)
    
    # Features
    features = Column(JSON, nullable=True)  # List of enabled features
    ai_enabled = Column(Boolean, default=False, nullable=False)
    ocr_enabled = Column(Boolean, default=False, nullable=False)
    scanner_enabled = Column(Boolean, default=False, nullable=False)
    batch_processing = Column(Boolean, default=False, nullable=False)
    priority_processing = Column(Boolean, default=False, nullable=False)
    api_access = Column(Boolean, default=False, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")

    def __repr__(self):
        return f"<Plan {self.name}>"


class Subscription(Base):
    """User subscription record"""
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(String(36), ForeignKey("plans.id"), nullable=False)
    
    # Status
    status = Column(String(50), default=SubscriptionStatus.ACTIVE.value, nullable=False)
    
    # Billing
    billing_cycle = Column(String(20), default="monthly", nullable=False)  # monthly, yearly
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    
    # Trial
    trial_start = Column(DateTime, nullable=True)
    trial_end = Column(DateTime, nullable=True)
    
    # Payment gateway
    stripe_subscription_id = Column(String(255), nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    
    # Cancellation
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)
    cancelled_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subscription")
    plan = relationship("Plan", back_populates="subscriptions")
    invoices = relationship("Invoice", back_populates="subscription", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Subscription {self.user_id} - {self.plan_id}>"


class Invoice(Base):
    """Billing invoice"""
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subscription_id = Column(String(36), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False)
    
    # Invoice details
    invoice_number = Column(String(50), unique=True, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, paid, failed, refunded
    
    # Period
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Payment
    paid_at = Column(DateTime, nullable=True)
    payment_method = Column(String(50), nullable=True)
    stripe_invoice_id = Column(String(255), nullable=True)
    
    # PDF
    invoice_pdf_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    subscription = relationship("Subscription", back_populates="invoices")

    def __repr__(self):
        return f"<Invoice {self.invoice_number}>"


class UsageRecord(Base):
    """Usage tracking for rate limiting and billing"""
    __tablename__ = "usage_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Usage details
    action_type = Column(String(50), nullable=False)  # conversion, ocr, ai_chat, etc.
    resource_id = Column(String(36), nullable=True)  # conversion_id or document_id
    
    # Metrics
    file_size_bytes = Column(Integer, default=0, nullable=False)
    pages_processed = Column(Integer, default=0, nullable=False)
    processing_time_ms = Column(Integer, default=0, nullable=False)
    
    # Billing
    credits_used = Column(Integer, default=1, nullable=False)
    
    # Context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<UsageRecord {self.user_id} - {self.action_type}>"

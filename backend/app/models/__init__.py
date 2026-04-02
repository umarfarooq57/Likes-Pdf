"""
DocuForge Database Models
All SQLAlchemy models for the application
"""

# User models
from app.models.user import User, UserRole

# Document models
from app.models.document import Document, DocumentVersion, DocumentStatus

# Conversion models
from app.models.conversion import Conversion, ConversionType, ConversionStatus

# Workflow models
from app.models.workflow import Workflow, WorkflowRun

# Subscription models
from app.models.subscription import Plan, Subscription, Invoice, UsageRecord, PlanType, SubscriptionStatus

# Scanner models
from app.models.scanner import ScanSession, ScanPage, ScanTemplate, ScanStatus, ScanMode


# Security models
from app.models.security import (
    PDFProtection, Watermark, AppliedWatermark, DigitalSignature,
    SigningCertificate, FileEncryption, WatermarkType, SignatureStatus
)

# Audit models
from app.models.audit import (
    ActivityLog, APIRequestLog, SystemHealth, ErrorLog, JobQueue, Notification,
    ActivityType
)

__all__ = [
    # User
    "User", "UserRole",
    # Document
    "Document", "DocumentVersion", "DocumentStatus",
    # Conversion
    "Conversion", "ConversionType", "ConversionStatus",
    # Workflow
    "Workflow", "WorkflowRun",
    # Subscription
    "Plan", "Subscription", "Invoice", "UsageRecord", "PlanType", "SubscriptionStatus",
    # Scanner
    "ScanSession", "ScanPage", "ScanTemplate", "ScanStatus", "ScanMode",
    # Security
    "PDFProtection", "Watermark", "AppliedWatermark", "DigitalSignature",
    "SigningCertificate", "FileEncryption", "WatermarkType", "SignatureStatus",
    # Audit
    "ActivityLog", "APIRequestLog", "SystemHealth", "ErrorLog", "JobQueue", "Notification",
    "ActivityType",
]

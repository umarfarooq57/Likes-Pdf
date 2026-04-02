"""
Audit & Activity Models
Database models for logging and monitoring
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, JSON, Text, Index
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ActivityType(str, enum.Enum):
    """Activity log event types"""
    # Auth
    LOGIN = "login"
    LOGOUT = "logout"
    REGISTER = "register"
    PASSWORD_RESET = "password_reset"
    PASSWORD_CHANGE = "password_change"
    EMAIL_VERIFY = "email_verify"

    # Documents
    DOCUMENT_UPLOAD = "document_upload"
    DOCUMENT_DOWNLOAD = "document_download"
    DOCUMENT_DELETE = "document_delete"
    DOCUMENT_VIEW = "document_view"

    # Conversions
    CONVERSION_START = "conversion_start"
    CONVERSION_COMPLETE = "conversion_complete"
    CONVERSION_FAIL = "conversion_fail"

    # Editing
    EDIT_MERGE = "edit_merge"
    EDIT_SPLIT = "edit_split"
    EDIT_ROTATE = "edit_rotate"
    EDIT_DELETE_PAGES = "edit_delete_pages"
    EDIT_EXTRACT_PAGES = "edit_extract_pages"
    EDIT_REORDER = "edit_reorder"
    EDIT_ADD_PAGES = "edit_add_pages"

    # Security
    PDF_PROTECT = "pdf_protect"
    PDF_UNLOCK = "pdf_unlock"
    WATERMARK_ADD = "watermark_add"
    SIGNATURE_ADD = "signature_add"

    # (AI events removed)

    # Scanner
    SCAN_START = "scan_start"
    SCAN_COMPLETE = "scan_complete"

    # Subscription
    SUBSCRIPTION_CREATE = "subscription_create"
    SUBSCRIPTION_UPGRADE = "subscription_upgrade"
    SUBSCRIPTION_DOWNGRADE = "subscription_downgrade"
    SUBSCRIPTION_CANCEL = "subscription_cancel"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAIL = "payment_fail"

    # Admin
    ADMIN_USER_MODIFY = "admin_user_modify"
    ADMIN_USER_DELETE = "admin_user_delete"
    ADMIN_SETTINGS_CHANGE = "admin_settings_change"


class ActivityLog(Base):
    """User activity log for audit trail"""
    __tablename__ = "activity_logs"

    __table_args__ = (
        Index('ix_activity_user_created', 'user_id', 'created_at'),
        Index('ix_activity_type_created', 'activity_type', 'created_at'),
    )

    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)

    # Activity details
    activity_type = Column(String(50), nullable=False)
    description = Column(String(500), nullable=True)

    # Resource reference
    # document, conversion, etc.
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(36), nullable=True)

    # Additional data
    extra_data = Column(JSON, nullable=True)

    # Request context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    session_id = Column(String(255), nullable=True)

    # Status
    success = Column(Boolean, default=True, nullable=False)
    error_message = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<ActivityLog {self.activity_type}>"


class APIRequestLog(Base):
    """API request logging for monitoring and rate limiting"""
    __tablename__ = "api_request_logs"

    __table_args__ = (
        Index('ix_api_log_user_endpoint', 'user_id', 'endpoint'),
        Index('ix_api_log_created', 'created_at'),
    )

    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)

    # Request details
    method = Column(String(10), nullable=False)
    endpoint = Column(String(500), nullable=False)
    query_params = Column(JSON, nullable=True)

    # Response
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Integer, nullable=True)

    # Context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    # Rate limiting
    rate_limit_remaining = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<APIRequestLog {self.method} {self.endpoint}>"


class SystemHealth(Base):
    """System health metrics"""
    __tablename__ = "system_health"

    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))

    # Service
    # api, worker, redis, db
    service_name = Column(String(100), nullable=False)

    # Status
    status = Column(String(20), nullable=False)  # healthy, degraded, down

    # Metrics
    cpu_usage = Column(Integer, nullable=True)  # percentage
    memory_usage = Column(Integer, nullable=True)  # percentage
    disk_usage = Column(Integer, nullable=True)  # percentage

    # Queue metrics (for workers)
    queue_size = Column(Integer, nullable=True)
    active_tasks = Column(Integer, nullable=True)

    # Response time
    response_time_ms = Column(Integer, nullable=True)

    # Error rate
    error_rate = Column(Integer, nullable=True)  # per minute

    details = Column(JSON, nullable=True)

    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<SystemHealth {self.service_name} - {self.status}>"


class ErrorLog(Base):
    """Application error logging"""
    __tablename__ = "error_logs"

    __table_args__ = (
        Index('ix_error_log_created', 'created_at'),
        Index('ix_error_log_type', 'error_type'),
    )

    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))

    # Error details
    error_type = Column(String(255), nullable=False)
    error_message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)

    # Context
    user_id = Column(String(36), nullable=True)
    request_id = Column(String(255), nullable=True)
    endpoint = Column(String(500), nullable=True)

    # Additional data
    context_data = Column(JSON, nullable=True)

    # Resolution
    resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<ErrorLog {self.error_type}>"


class JobQueue(Base):
    """Background job queue tracking"""
    __tablename__ = "job_queue"

    __table_args__ = (
        Index('ix_job_status', 'status'),
        Index('ix_job_user', 'user_id'),
    )

    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))
    celery_task_id = Column(String(255), unique=True, nullable=True)
    user_id = Column(String(36), ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)

    # Job details
    job_type = Column(String(100), nullable=False)
    job_name = Column(String(255), nullable=False)

    # Status
    status = Column(String(50), default="pending", nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    current_step = Column(String(255), nullable=True)

    # Priority (higher = more priority)
    priority = Column(Integer, default=0, nullable=False)

    # Input/Output
    input_data = Column(JSON, nullable=True)
    result_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)

    # Retry
    max_retries = Column(Integer, default=3, nullable=False)
    retry_count = Column(Integer, default=0, nullable=False)

    # Timing
    scheduled_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<JobQueue {self.job_type} - {self.status}>"


class Notification(Base):
    """User notifications"""
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True,
                default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)

    # Notification details
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    # info, success, warning, error
    notification_type = Column(String(50), nullable=False)

    # Link to resource
    action_url = Column(String(500), nullable=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(36), nullable=True)

    # Status
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)

    # Delivery
    email_sent = Column(Boolean, default=False, nullable=False)
    push_sent = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Notification {self.title}>"

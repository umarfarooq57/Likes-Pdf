"""
Security Model
Database models for PDF security features
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, JSON, Text, LargeBinary
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class WatermarkType(str, enum.Enum):
    """Watermark types"""
    TEXT = "text"
    IMAGE = "image"


class SignatureStatus(str, enum.Enum):
    """Digital signature status"""
    PENDING = "pending"
    SIGNED = "signed"
    VERIFIED = "verified"
    INVALID = "invalid"


class PDFProtection(Base):
    """PDF security settings applied to a document"""
    __tablename__ = "pdf_protections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    # Password protection
    has_user_password = Column(Boolean, default=False, nullable=False)
    has_owner_password = Column(Boolean, default=False, nullable=False)
    user_password_hash = Column(String(255), nullable=True)  # For verification only
    owner_password_hash = Column(String(255), nullable=True)
    
    # Permissions (when owner password is set)
    allow_printing = Column(Boolean, default=True, nullable=False)
    allow_copying = Column(Boolean, default=True, nullable=False)
    allow_modification = Column(Boolean, default=True, nullable=False)
    allow_annotation = Column(Boolean, default=True, nullable=False)
    allow_form_filling = Column(Boolean, default=True, nullable=False)
    allow_extraction = Column(Boolean, default=True, nullable=False)
    allow_assembly = Column(Boolean, default=True, nullable=False)
    print_quality = Column(String(20), default="high", nullable=False)  # high, low
    
    # Encryption
    encryption_method = Column(String(50), default="AES-256", nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document")

    def __repr__(self):
        return f"<PDFProtection {self.document_id}>"


class Watermark(Base):
    """Watermark configuration"""
    __tablename__ = "watermarks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    watermark_type = Column(String(20), nullable=False)  # text, image
    
    # Text watermark
    text_content = Column(String(500), nullable=True)
    font_name = Column(String(100), default="Helvetica", nullable=True)
    font_size = Column(Integer, default=48, nullable=True)
    font_color = Column(String(20), default="#000000", nullable=True)
    
    # Image watermark
    image_storage_key = Column(String(500), nullable=True)
    
    # Position & style
    position = Column(String(50), default="center", nullable=False)  # center, diagonal, tiled, custom
    opacity = Column(Integer, default=30, nullable=False)  # 0-100
    rotation = Column(Integer, default=45, nullable=False)  # degrees
    scale = Column(Integer, default=100, nullable=False)  # percentage
    
    # Custom position
    x_offset = Column(Integer, default=0, nullable=True)
    y_offset = Column(Integer, default=0, nullable=True)
    
    # Apply to
    apply_to_pages = Column(String(50), default="all", nullable=False)  # all, first, last, custom
    custom_pages = Column(JSON, nullable=True)  # List of page numbers
    
    is_default = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Watermark {self.name}>"


class AppliedWatermark(Base):
    """Record of watermark applied to a document"""
    __tablename__ = "applied_watermarks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    watermark_id = Column(String(36), ForeignKey("watermarks.id", ondelete="SET NULL"), nullable=True)
    
    # Snapshot of watermark settings at time of application
    watermark_settings = Column(JSON, nullable=False)
    
    pages_applied = Column(JSON, nullable=False)  # List of page numbers
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document = relationship("Document")
    watermark = relationship("Watermark")

    def __repr__(self):
        return f"<AppliedWatermark {self.document_id}>"


class DigitalSignature(Base):
    """Digital signature for a document"""
    __tablename__ = "digital_signatures"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Signature info
    status = Column(String(50), default=SignatureStatus.PENDING.value, nullable=False)
    signer_name = Column(String(255), nullable=False)
    signer_email = Column(String(255), nullable=True)
    
    # Signature appearance
    signature_image_key = Column(String(500), nullable=True)
    page_number = Column(Integer, nullable=False)
    position_x = Column(Integer, nullable=False)
    position_y = Column(Integer, nullable=False)
    width = Column(Integer, default=200, nullable=False)
    height = Column(Integer, default=100, nullable=False)
    
    # Certificate (for cryptographic signatures)
    certificate_subject = Column(String(500), nullable=True)
    certificate_issuer = Column(String(500), nullable=True)
    certificate_serial = Column(String(100), nullable=True)
    
    # Verification
    signature_hash = Column(String(255), nullable=True)
    signed_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    # Reason and location
    reason = Column(String(500), nullable=True)
    location = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document = relationship("Document")

    def __repr__(self):
        return f"<DigitalSignature {self.document_id}>"


class SigningCertificate(Base):
    """User's digital signing certificate"""
    __tablename__ = "signing_certificates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    
    # Certificate data (encrypted)
    certificate_pem = Column(Text, nullable=False)
    private_key_encrypted = Column(LargeBinary, nullable=True)  # Encrypted with user's password
    
    # Certificate info
    subject = Column(String(500), nullable=False)
    issuer = Column(String(500), nullable=False)
    serial_number = Column(String(100), nullable=False)
    
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    
    is_default = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<SigningCertificate {self.name}>"


class FileEncryption(Base):
    """File encryption at rest tracking"""
    __tablename__ = "file_encryptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Encryption details
    algorithm = Column(String(50), default="AES-256-GCM", nullable=False)
    key_id = Column(String(255), nullable=False)  # Reference to key management system
    
    # Initialization vector (stored for decryption)
    iv = Column(LargeBinary, nullable=False)
    
    encrypted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document = relationship("Document")

    def __repr__(self):
        return f"<FileEncryption {self.document_id}>"

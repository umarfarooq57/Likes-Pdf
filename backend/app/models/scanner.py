"""
Scanner Model
Database models for document scanning features
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, JSON, Text, Float
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ScanStatus(str, enum.Enum):
    """Scan processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ScanMode(str, enum.Enum):
    """Scan color mode"""
    COLOR = "color"
    GRAYSCALE = "grayscale"
    BLACK_WHITE = "black_white"


class ScanSession(Base):
    """Multi-page scanning session"""
    __tablename__ = "scan_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Session info
    name = Column(String(255), nullable=True)
    status = Column(String(50), default=ScanStatus.PENDING.value, nullable=False)
    
    # Settings
    scan_mode = Column(String(20), default=ScanMode.COLOR.value, nullable=False)
    dpi = Column(Integer, default=300, nullable=False)
    output_format = Column(String(10), default="pdf", nullable=False)  # pdf, png, jpg
    
    # Processing options
    auto_crop = Column(Boolean, default=True, nullable=False)
    auto_enhance = Column(Boolean, default=True, nullable=False)
    auto_deskew = Column(Boolean, default=True, nullable=False)
    noise_removal = Column(Boolean, default=False, nullable=False)
    edge_detection = Column(Boolean, default=True, nullable=False)
    
    # OCR settings
    ocr_enabled = Column(Boolean, default=False, nullable=False)
    ocr_language = Column(String(50), default="eng", nullable=False)
    
    # Output
    output_document_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    total_pages = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    pages = relationship("ScanPage", back_populates="session", cascade="all, delete-orphan", order_by="ScanPage.page_number")
    output_document = relationship("Document", foreign_keys=[output_document_id])

    def __repr__(self):
        return f"<ScanSession {self.id}>"


class ScanPage(Base):
    """Individual scanned page"""
    __tablename__ = "scan_pages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("scan_sessions.id", ondelete="CASCADE"), nullable=False)
    
    # Page info
    page_number = Column(Integer, nullable=False)
    
    # Original image
    original_storage_key = Column(String(500), nullable=False)
    original_width = Column(Integer, nullable=True)
    original_height = Column(Integer, nullable=True)
    
    # Processed image
    processed_storage_key = Column(String(500), nullable=True)
    
    # Edge detection results
    corners_detected = Column(JSON, nullable=True)  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
    perspective_matrix = Column(JSON, nullable=True)
    
    # Processing status
    status = Column(String(50), default=ScanStatus.PENDING.value, nullable=False)
    processing_applied = Column(JSON, nullable=True)  # List of operations applied
    
    # OCR result
    ocr_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    
    # Metadata
    capture_source = Column(String(50), nullable=True)  # camera, webcam, upload
    capture_device = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = relationship("ScanSession", back_populates="pages")

    def __repr__(self):
        return f"<ScanPage {self.session_id} p{self.page_number}>"


class ScanTemplate(Base):
    """Saved scan settings template"""
    __tablename__ = "scan_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Settings
    scan_mode = Column(String(20), default=ScanMode.COLOR.value, nullable=False)
    dpi = Column(Integer, default=300, nullable=False)
    output_format = Column(String(10), default="pdf", nullable=False)
    
    # Processing
    auto_crop = Column(Boolean, default=True, nullable=False)
    auto_enhance = Column(Boolean, default=True, nullable=False)
    auto_deskew = Column(Boolean, default=True, nullable=False)
    noise_removal = Column(Boolean, default=False, nullable=False)
    
    # OCR
    ocr_enabled = Column(Boolean, default=False, nullable=False)
    ocr_language = Column(String(50), default="eng", nullable=False)
    
    is_default = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<ScanTemplate {self.name}>"

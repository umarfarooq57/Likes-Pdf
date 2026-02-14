"""
Conversion Model
Database model for document conversions and jobs
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ConversionType(str, enum.Enum):
    """Type of conversion operation"""
    # Format conversions
    PDF_TO_WORD = "pdf_to_word"
    WORD_TO_PDF = "word_to_pdf"
    PDF_TO_EXCEL = "pdf_to_excel"
    EXCEL_TO_PDF = "excel_to_pdf"
    PDF_TO_PPT = "pdf_to_ppt"
    PPT_TO_PDF = "ppt_to_pdf"
    PDF_TO_IMAGES = "pdf_to_images"
    IMAGES_TO_PDF = "images_to_pdf"
    HTML_TO_PDF = "html_to_pdf"
    MARKDOWN_TO_PDF = "markdown_to_pdf"
    PDF_TO_TEXT = "pdf_to_text"
    PDF_TO_HTML = "pdf_to_html"
    PDF_TO_CSV = "pdf_to_csv"
    PDF_TO_XML = "pdf_to_xml"
    PDF_TO_JSON = "pdf_to_json"
    CSV_TO_PDF = "csv_to_pdf"
    JSON_TO_PDF = "json_to_pdf"
    
    # Editing operations
    MERGE = "merge"
    SPLIT = "split"
    ROTATE = "rotate"
    REORDER = "reorder"
    DELETE_PAGES = "delete_pages"
    EXTRACT_PAGES = "extract_pages"
    
    # Optimization
    COMPRESS = "compress"
    LINEARIZE = "linearize"
    REPAIR = "repair"


class ConversionStatus(str, enum.Enum):
    """Conversion job status"""
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Conversion(Base):
    """Document conversion job model"""
    __tablename__ = "conversions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    source_document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    
    # Conversion details
    conversion_type = Column(String(50), nullable=False)
    status = Column(String(50), default=ConversionStatus.PENDING.value, nullable=False)
    target_format = Column(String(20), nullable=True)
    
    # Options and parameters
    options = Column(JSON, nullable=True)
    
    # Result
    result_key = Column(String(500), nullable=True)
    result_filename = Column(String(500), nullable=True)
    result_size = Column(Integer, nullable=True)
    
    # Progress tracking
    progress = Column(Integer, default=0, nullable=False)
    current_step = Column(String(255), nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Celery integration
    celery_task_id = Column(String(255), nullable=True)
    
    # Timing
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="conversions")
    source_document = relationship("Document", back_populates="conversions")

    def __repr__(self):
        return f"<Conversion {self.id} {self.conversion_type}>"

    def mark_completed(self, result_key: str, result_filename: str = None):
        """Mark conversion as completed"""
        self.status = ConversionStatus.COMPLETED.value
        self.result_key = result_key
        self.result_filename = result_filename
        self.progress = 100
        self.completed_at = datetime.utcnow()
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.processing_time_ms = int(delta.total_seconds() * 1000)

    def mark_failed(self, error_message: str):
        """Mark conversion as failed"""
        self.status = ConversionStatus.FAILED.value
        self.error_message = error_message
        self.completed_at = datetime.utcnow()

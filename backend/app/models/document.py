"""
Document Model
Database model for uploaded documents
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, BigInteger, Integer, ForeignKey, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class DocumentStatus(str, enum.Enum):
    """Document status enumeration"""
    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"
    DELETED = "deleted"


class Document(Base):
    """Uploaded document model"""
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    # File info
    original_name = Column(String(500), nullable=False)
    storage_key = Column(String(500), unique=True, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    file_extension = Column(String(20), nullable=False)
    
    # Document metadata
    page_count = Column(Integer, nullable=True)
    doc_metadata = Column(JSON, nullable=True)
    
    # Status
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    error_message = Column(String(500), nullable=True)
    
    # Lifecycle
    is_temp = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="documents")
    conversions = relationship("Conversion", back_populates="source_document", cascade="all, delete-orphan")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Document {self.original_name}>"


class DocumentVersion(Base):
    """Document version history"""
    __tablename__ = "document_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    version_number = Column(Integer, nullable=False)
    storage_key = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    
    change_description = Column(String(500), nullable=True)
    created_by = Column(String(36), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="versions")

    def __repr__(self):
        return f"<DocumentVersion {self.document_id} v{self.version_number}>"

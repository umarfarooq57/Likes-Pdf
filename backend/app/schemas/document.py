"""
Document Schemas
Pydantic models for document data validation
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.document import DocumentStatus


class DocumentBase(BaseModel):
    """Base document schema"""
    original_name: str
    mime_type: str
    file_size: int


class DocumentCreate(DocumentBase):
    """Create document schema (internal)"""
    storage_key: str
    file_extension: str
    user_id: Optional[UUID] = None


class DocumentResponse(BaseModel):
    """Document response schema"""
    id: UUID
    original_name: str
    mime_type: str
    file_size: int
    file_extension: str
    page_count: Optional[int] = None
    status: DocumentStatus
    is_temp: bool
    created_at: datetime
    metadata: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    """Response after file upload"""
    id: UUID
    filename: str
    size: int
    mime_type: str
    page_count: Optional[int] = None
    preview_url: Optional[str] = None


class DocumentListResponse(BaseModel):
    """List of documents response"""
    documents: List[DocumentResponse]
    total: int
    page: int
    page_size: int


class DocumentDownloadResponse(BaseModel):
    """Download URL response"""
    download_url: str
    filename: str
    expires_in: int

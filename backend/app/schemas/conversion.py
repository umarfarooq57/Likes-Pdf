"""
Conversion Schemas
Pydantic models for conversion operations
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.conversion import ConversionStatus, ConversionType


# ============== Request Schemas ==============

class ConversionRequest(BaseModel):
    """Base conversion request"""
    document_id: UUID
    options: Dict[str, Any] = {}


class MergeRequest(BaseModel):
    """Merge multiple PDFs request"""
    document_ids: List[UUID] = Field(..., min_length=2)
    output_filename: Optional[str] = None


class SplitRequest(BaseModel):
    """Split PDF request"""
    document_id: UUID
    mode: str = Field(..., pattern="^(pages|range|size)$")
    pages: Optional[List[int]] = None  # For specific pages
    ranges: Optional[List[str]] = None  # For ranges like "1-5,10-15"
    size_mb: Optional[int] = None  # For split by size


class RotateRequest(BaseModel):
    """Rotate pages request"""
    document_id: UUID
    rotations: Dict[int, int]  # {page_number: degrees}


class ReorderRequest(BaseModel):
    """Reorder pages request"""
    document_id: UUID
    new_order: List[int]  # New page order


class DeletePagesRequest(BaseModel):
    """Delete pages request"""
    document_id: UUID
    pages: List[int]  # Pages to delete


class ExtractPagesRequest(BaseModel):
    """Extract pages request"""
    document_id: UUID
    pages: List[int]  # Pages to extract


class CompressRequest(BaseModel):
    """Compress PDF request"""
    document_id: UUID
    quality: str = Field(default="medium", pattern="^(low|medium|high)$")


class ConvertRequest(BaseModel):
    """Format conversion request"""
    document_id: UUID
    target_format: str
    options: Dict[str, Any] = {}


class HtmlToPdfRequest(BaseModel):
    """HTML to PDF conversion request"""
    html_content: Optional[str] = None
    url: Optional[str] = None
    options: Dict[str, Any] = {}


class MarkdownToPdfRequest(BaseModel):
    """Markdown to PDF request"""
    markdown_content: str
    options: Dict[str, Any] = {}


# ============== Response Schemas ==============

class ConversionResponse(BaseModel):
    """Conversion job response"""
    id: UUID
    conversion_type: ConversionType
    status: ConversionStatus
    progress: int
    current_step: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConversionStatusResponse(BaseModel):
    """Conversion status check response"""
    id: UUID
    status: ConversionStatus
    progress: int
    current_step: Optional[str] = None
    result_url: Optional[str] = None
    result_filename: Optional[str] = None
    error_message: Optional[str] = None
    processing_time_ms: Optional[int] = None


class ConversionResultResponse(BaseModel):
    """Conversion result response"""
    id: UUID
    status: ConversionStatus
    download_url: str
    filename: str
    file_size: int
    processing_time_ms: int

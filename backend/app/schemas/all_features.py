"""
Comprehensive Schemas
Pydantic models for all DocuForge features
"""

from datetime import datetime
from typing import Optional, Dict, Any, List, Union
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, HttpUrl


# ============== Common Schemas ==============

class OperationResponse(BaseModel):
    """Generic operation response"""
    success: bool
    message: str
    result_id: Optional[str] = None
    download_url: Optional[str] = None
    processing_time_ms: Optional[int] = None


class TaskStatusResponse(BaseModel):
    """Background task status"""
    task_id: str
    status: str  # pending, processing, completed, failed
    progress: int = 0
    current_step: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Paginated list response"""
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int


# ============== Document Schemas ==============

class DocumentUploadResponse(BaseModel):
    """Document upload response"""
    id: UUID
    original_name: str
    storage_key: str
    file_size: int
    file_extension: str
    mime_type: str
    page_count: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentInfo(BaseModel):
    """Detailed document information"""
    id: UUID
    original_name: str
    file_size: int
    file_extension: str
    mime_type: str
    page_count: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentPreviewResponse(BaseModel):
    """Document preview data"""
    id: UUID
    preview_urls: List[str]
    page_count: int
    width: Optional[float] = None
    height: Optional[float] = None


# ============== Organize & Structure Schemas ==============

class MergeRequest(BaseModel):
    """Merge PDFs request"""
    document_ids: List[UUID] = Field(..., min_length=2,
                                     description="At least 2 PDFs required")
    add_bookmarks: bool = True
    output_filename: Optional[str] = None


class MergeWithTOCRequest(BaseModel):
    """Merge with table of contents"""
    document_ids: List[UUID]
    # [{"title": "Chapter 1", "page": 1, "level": 1}]
    toc_entries: List[Dict[str, Any]]


class SplitRequest(BaseModel):
    """Split PDF request"""
    document_id: UUID
    mode: str = Field(..., pattern="^(pages|range|size|bookmarks)$")
    pages: Optional[List[int]] = None
    ranges: Optional[List[str]] = None  # "1-5,10-15"
    max_size_mb: Optional[float] = None


class ExtractPagesRequest(BaseModel):
    """Extract specific pages"""
    document_id: UUID
    pages: List[int] = Field(..., min_length=1)


class DeletePagesRequest(BaseModel):
    """Delete pages from PDF"""
    document_id: UUID
    pages: List[int] = Field(..., min_length=1)


class ReorderPagesRequest(BaseModel):
    """Reorder pages"""
    document_id: UUID
    new_order: List[int]


class RotatePagesRequest(BaseModel):
    """Rotate pages"""
    document_id: UUID
    rotations: Dict[int, int]  # {page_number: angle}
    # or rotate all
    rotate_all: Optional[int] = None  # 90, 180, 270


class CropPagesRequest(BaseModel):
    """Crop pages"""
    document_id: UUID
    # [left%, top%, right%, bottom%]
    crop_box: List[float] = Field(..., min_length=4, max_length=4)
    pages: Optional[List[int]] = None


class InsertPagesRequest(BaseModel):
    """Insert pages from another PDF"""
    document_id: UUID
    pages_to_insert_id: UUID
    insert_after: int = 0  # 0 = at beginning


class RepairRequest(BaseModel):
    """Repair corrupted PDF"""
    document_id: UUID


class FlattenRequest(BaseModel):
    """Flatten annotations"""
    document_id: UUID


class BatchRenameRequest(BaseModel):
    """Batch rename PDFs"""
    document_ids: List[UUID]
    pattern: str = "{name}_{index}"  # Supports {name}, {index}, {date}


# ============== Conversion Schemas ==============

class ConversionRequest(BaseModel):
    """Generic conversion request"""
    document_id: UUID
    target_format: str
    options: Dict[str, Any] = {}


class PDFToImagesRequest(BaseModel):
    """PDF to images conversion"""
    document_id: UUID
    format: str = Field(default="png", pattern="^(png|jpg|jpeg|webp)$")
    dpi: int = Field(default=150, ge=72, le=600)
    pages: Optional[List[int]] = None
    single_image: bool = False


class ImagesToPDFRequest(BaseModel):
    """Images to PDF conversion"""
    document_ids: List[UUID]
    page_size: str = "A4"  # A4, Letter, Legal
    margin: float = 0.5  # inches
    fit_mode: str = "contain"  # contain, cover, stretch


class PDFToWordRequest(BaseModel):
    """PDF to Word conversion"""
    document_id: UUID
    preserve_layout: bool = True


class PDFToExcelRequest(BaseModel):
    """PDF to Excel conversion"""
    document_id: UUID
    extract_tables: bool = True


class HTMLToPDFRequest(BaseModel):
    """HTML to PDF conversion"""
    html_content: Optional[str] = None
    url: Optional[str] = None
    options: Dict[str, Any] = {}


class MarkdownToPDFRequest(BaseModel):
    """Markdown to PDF conversion"""
    markdown_content: str
    options: Dict[str, Any] = {}


class BatchConversionRequest(BaseModel):
    """Batch conversion"""
    document_ids: List[UUID]
    target_format: str
    options: Dict[str, Any] = {}


# ============== Optimization Schemas ==============

class CompressRequest(BaseModel):
    """Compress PDF"""
    document_id: UUID
    quality: str = Field(default="medium", pattern="^(low|medium|high)$")


class CompressResponse(BaseModel):
    """Compression result"""
    success: bool
    original_size: int
    new_size: int
    reduction_percent: float
    download_url: str


class LinearizeRequest(BaseModel):
    """Linearize for web"""
    document_id: UUID


class OptimizeImagesRequest(BaseModel):
    """Optimize images in PDF"""
    document_id: UUID
    quality: int = Field(default=75, ge=10, le=100)
    max_dimension: Optional[int] = None


# ============== OCR Schemas ==============

class OCRRequest(BaseModel):
    """OCR processing request"""
    document_id: UUID
    language: str = "eng"
    pages: Optional[List[int]] = None
    create_searchable_pdf: bool = False
    output_format: str = "text"  # text, json, hocr


class OCRResponse(BaseModel):
    """OCR result"""
    success: bool
    text: str
    confidence: float
    pages_processed: int
    language: str
    download_url: Optional[str] = None


class SearchablePDFRequest(BaseModel):
    """Create searchable PDF from scanned document"""
    document_id: UUID
    language: str = "eng"


# ============== Edit & Annotate Schemas ==============

class AddTextRequest(BaseModel):
    """Add text to PDF"""
    document_id: UUID
    page: int
    text: str
    position: List[float]  # [x, y]
    font_size: int = 12
    font_name: str = "Helvetica"
    color: str = "#000000"


class AddImageRequest(BaseModel):
    """Add image to PDF"""
    document_id: UUID
    image_id: UUID
    page: int
    position: List[float]  # [x, y, width, height]
    opacity: float = 1.0


class HighlightRequest(BaseModel):
    """Add highlight annotation"""
    document_id: UUID
    page: int
    rect: List[float]  # [x1, y1, x2, y2]
    color: str = "#FFFF00"


class AddCommentRequest(BaseModel):
    """Add comment/annotation"""
    document_id: UUID
    page: int
    position: List[float]  # [x, y]
    content: str
    author: Optional[str] = None


class AddShapeRequest(BaseModel):
    """Add shape to PDF"""
    document_id: UUID
    page: int
    shape_type: str  # rectangle, circle, line, arrow
    rect: List[float]  # [x1, y1, x2, y2]
    stroke_color: str = "#000000"
    fill_color: Optional[str] = None
    stroke_width: float = 1.0


class RedactRequest(BaseModel):
    """Redact content"""
    document_id: UUID
    page: int
    rect: List[float]  # [x1, y1, x2, y2]
    fill_color: str = "#000000"


class EditMetadataRequest(BaseModel):
    """Edit PDF metadata"""
    document_id: UUID
    title: Optional[str] = None
    author: Optional[str] = None
    subject: Optional[str] = None
    keywords: Optional[str] = None
    creator: Optional[str] = None


class ComparePDFsRequest(BaseModel):
    """Compare two PDFs"""
    document_id_1: UUID
    document_id_2: UUID


class ComparePDFsResponse(BaseModel):
    """PDF comparison result"""
    differences_count: int
    pages_with_changes: List[int]
    download_url: str
    details: Dict[str, Any]


# ============== Header/Footer/Watermark Schemas ==============

class AddHeaderFooterRequest(BaseModel):
    """Add header and/or footer"""
    document_id: UUID
    header_text: Optional[str] = None
    footer_text: Optional[str] = None
    font_size: int = 10
    pages: Optional[List[int]] = None


class AddPageNumbersRequest(BaseModel):
    """Add page numbers"""
    document_id: UUID
    position: str = "bottom-center"
    format_string: str = "{page} / {total}"
    font_size: int = 10
    start_page: int = 1
    skip_first: bool = False


class AddTextWatermarkRequest(BaseModel):
    """Add text watermark"""
    document_id: UUID
    text: str
    font_size: int = 48
    color: str = "#808080"
    opacity: float = 0.3
    rotation: float = 45.0
    position: str = "center"  # center, diagonal, tiled
    pages: Optional[List[int]] = None


class AddImageWatermarkRequest(BaseModel):
    """Add image watermark"""
    document_id: UUID
    watermark_image_id: UUID
    opacity: float = 0.3
    scale: float = 0.5
    position: str = "center"
    pages: Optional[List[int]] = None


# ============== Security Schemas ==============

class PasswordProtectRequest(BaseModel):
    """Password protect PDF"""
    document_id: UUID
    user_password: Optional[str] = None
    owner_password: Optional[str] = None
    allow_printing: bool = True
    allow_copying: bool = True
    allow_modification: bool = False
    allow_annotation: bool = True
    allow_form_filling: bool = True


class UnlockPDFRequest(BaseModel):
    """Unlock/remove password"""
    document_id: UUID
    password: str


class SecurityCheckResponse(BaseModel):
    """PDF security status"""
    is_encrypted: bool
    needs_password: bool
    permissions: Optional[Dict[str, bool]] = None
    encryption_method: Optional[str] = None


class DigitalSignRequest(BaseModel):
    """Add digital signature"""
    document_id: UUID
    certificate_data: Optional[str] = None  # Base64 PFX
    certificate_password: Optional[str] = None
    signature_image_id: Optional[UUID] = None
    page: int = 1
    position: List[float] = [400, 100, 550, 150]
    reason: Optional[str] = None
    location: Optional[str] = None


# ============== Forms Schemas ==============

class FillFormRequest(BaseModel):
    """Fill PDF form fields"""
    document_id: UUID
    fields: Dict[str, Any]  # {field_name: value}


class ExtractFormDataRequest(BaseModel):
    """Extract form field data"""
    document_id: UUID


class FormDataResponse(BaseModel):
    """Form data extraction result"""
    fields: List[Dict[str, Any]]
    field_count: int


class CreateFormFieldRequest(BaseModel):
    """Create form field"""
    document_id: UUID
    page: int
    field_type: str  # text, checkbox, radio, dropdown, signature
    field_name: str
    rect: List[float]  # [x1, y1, x2, y2]
    default_value: Optional[str] = None
    options: Optional[List[str]] = None  # For dropdown/radio


# ============== AI Features Schemas ==============

class SummarizeRequest(BaseModel):
    """AI summarization request"""
    document_id: UUID
    length: str = Field(default="medium", pattern="^(short|medium|long)$")
    style: str = Field(
        default="bullet", pattern="^(bullet|paragraph|executive)$")


class SummarizeResponse(BaseModel):
    """Summarization result"""
    summary: str
    length: str
    style: str
    word_count: int
    tokens_used: int


class ExtractTablesRequest(BaseModel):
    """AI table extraction"""
    document_id: UUID
    pages: Optional[List[int]] = None
    output_format: str = "json"  # json, csv, excel


class ExtractTablesResponse(BaseModel):
    """Table extraction result"""
    tables: List[Dict[str, Any]]
    table_count: int
    download_url: Optional[str] = None


class TranslateRequest(BaseModel):
    """Document translation"""
    document_id: UUID
    source_language: str = "auto"
    target_language: str
    preserve_formatting: bool = True


class TranslateResponse(BaseModel):
    """Translation result"""
    translated_text: str
    source_language: str
    target_language: str
    download_url: Optional[str] = None


class TextToSpeechRequest(BaseModel):
    """Convert document to audio"""
    document_id: UUID
    voice: str = "alloy"  # OpenAI voices
    speed: float = 1.0
    pages: Optional[List[int]] = None


class TextToSpeechResponse(BaseModel):
    """TTS result"""
    audio_url: str
    duration_seconds: float
    format: str


class ClassifyRequest(BaseModel):
    """Document classification"""
    document_id: UUID


class ClassifyResponse(BaseModel):
    """Classification result"""
    category: str
    confidence: float
    sub_categories: List[str]
    tags: List[str]


class ExtractEntitiesRequest(BaseModel):
    """Named entity extraction"""
    document_id: UUID


class ExtractEntitiesResponse(BaseModel):
    """Entity extraction result"""
    entities: Dict[str, List[str]]  # {entity_type: [values]}
    entity_count: int


class ChatRequest(BaseModel):
    """Chat with document"""
    document_id: UUID
    question: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response"""
    answer: str
    conversation_id: str
    referenced_pages: List[int]
    tokens_used: int


# ============== Cloud Integration Schemas ==============

class CloudImportRequest(BaseModel):
    """Import from cloud storage"""
    provider: str  # google_drive, dropbox, onedrive
    file_id: str
    access_token: str


class CloudExportRequest(BaseModel):
    """Export to cloud storage"""
    document_id: UUID
    provider: str
    folder_id: Optional[str] = None
    access_token: str


class ShareLinkRequest(BaseModel):
    """Create shareable link"""
    document_id: UUID
    expires_in_hours: Optional[int] = 24
    password: Optional[str] = None
    allow_download: bool = True
    max_views: Optional[int] = None


class ShareLinkResponse(BaseModel):
    """Share link result"""
    link: str
    expires_at: Optional[datetime] = None
    password_protected: bool


# ============== Collaboration Schemas ==============

class CreateTeamRequest(BaseModel):
    """Create team"""
    name: str
    description: Optional[str] = None


class InviteTeamMemberRequest(BaseModel):
    """Invite team member"""
    email: EmailStr
    role: str = "member"  # admin, member, viewer


class DocumentVersionResponse(BaseModel):
    """Document version info"""
    version_id: UUID
    version_number: int
    created_at: datetime
    created_by: str
    comment: Optional[str] = None
    size: int


class CommentThreadRequest(BaseModel):
    """Create comment thread"""
    document_id: UUID
    page: int
    position: List[float]
    content: str


class CommentReplyRequest(BaseModel):
    """Reply to comment"""
    thread_id: UUID
    content: str


# ============== Scanner Schemas ==============

class ScanEnhanceRequest(BaseModel):
    """Enhance scanned document"""
    document_id: UUID
    auto_deskew: bool = True
    remove_background: bool = True
    enhance_contrast: bool = True
    remove_shadows: bool = False


class ReceiptScanRequest(BaseModel):
    """Scan and extract receipt data"""
    document_id: UUID
    language: str = "eng"


class ReceiptScanResponse(BaseModel):
    """Receipt scan result"""
    vendor: Optional[str] = None
    date: Optional[str] = None
    total: Optional[float] = None
    tax: Optional[float] = None
    items: List[Dict[str, Any]]
    currency: Optional[str] = None
    raw_text: str


class IDScanRequest(BaseModel):
    """Scan ID document"""
    document_id: UUID
    id_type: str = "auto"  # auto, passport, drivers_license, national_id


class IDScanResponse(BaseModel):
    """ID scan result"""
    document_type: str
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    id_number: Optional[str] = None
    expiry_date: Optional[str] = None
    nationality: Optional[str] = None
    confidence: float


# ============== Batch Processing Schemas ==============

class BatchOperationRequest(BaseModel):
    """Batch operation request"""
    document_ids: List[UUID]
    operation: str
    options: Dict[str, Any] = {}


class BatchOperationResponse(BaseModel):
    """Batch operation result"""
    total: int
    successful: int
    failed: int
    results: List[Dict[str, Any]]
    download_url: Optional[str] = None  # ZIP of all results

"""
Security Endpoints
PDF security operations: password protection, watermarks, signatures
"""

import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user_id_optional
from app.core.config import settings
from app.services.document_service import DocumentService
from app.services.conversion_service import ConversionService
from app.engines.security_engine import SecurityEngine
from app.models.conversion import ConversionType


router = APIRouter()


# ============== Request/Response Schemas ==============

class PasswordProtectRequest(BaseModel):
    """Request to password-protect a PDF"""
    document_id: str
    user_password: Optional[str] = Field(
        None, description="Password to open document")
    owner_password: Optional[str] = Field(
        None, description="Password for full access")
    allow_printing: bool = True
    allow_copying: bool = True
    allow_modification: bool = False
    allow_annotation: bool = True
    allow_form_filling: bool = True


class RemovePasswordRequest(BaseModel):
    """Request to remove password from PDF"""
    document_id: str
    password: Optional[str] = None


class WatermarkTextRequest(BaseModel):
    """Request to add text watermark"""
    document_id: str
    text: str
    font_size: int = 48
    font_color: str = "#808080"  # Gray
    opacity: float = 0.3
    rotation: float = 45.0
    position: str = "center"  # center, diagonal, tiled
    pages: Optional[List[int]] = None  # None = all pages


class WatermarkImageRequest(BaseModel):
    """Request to add image watermark"""
    document_id: str
    watermark_image_id: str  # Document ID of uploaded watermark image
    opacity: float = 0.3
    scale: float = 1.0
    position: str = "center"
    pages: Optional[List[int]] = None


class AddPageNumbersRequest(BaseModel):
    """Request to add page numbers"""
    document_id: str
    position: str = "bottom-center"
    format_string: str = "Page {page} of {total}"
    font_size: int = 10
    start_page: int = 1
    skip_first: bool = False


# Metadata endpoints removed (feature disabled)


class SecurityCheckResponse(BaseModel):
    """PDF security status response"""
    document_id: str
    is_encrypted: bool
    needs_password: bool
    permissions: Optional[dict] = None
    metadata: Optional[dict] = None


class OperationResponse(BaseModel):
    """Generic operation response"""
    success: bool
    message: str
    result_document_id: Optional[str] = None
    download_url: Optional[str] = None


# ============== Helper Functions ==============

def hex_to_rgb(hex_color: str) -> tuple:
    """Convert hex color to RGB tuple (0-1 range)"""
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255
    g = int(hex_color[2:4], 16) / 255
    b = int(hex_color[4:6], 16) / 255
    return (r, g, b)


# ============== Endpoints ==============

@router.post("/protect", response_model=OperationResponse)
async def password_protect_pdf(
    request: PasswordProtectRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Add password protection and permissions to a PDF.

    - **user_password**: Required to open the document
    - **owner_password**: Required for full access (edit permissions, remove password)
    """
    doc_service = DocumentService(db)

    # Get source document
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.file_extension.lower() != "pdf":
        raise HTTPException(status_code=400, detail="Document must be a PDF")

    # Prepare paths
    input_path = settings.UPLOAD_DIR / document.storage_key
    output_id = str(uuid.uuid4())
    output_path = settings.PROCESSED_DIR / f"{output_id}.pdf"
    settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    try:
        # Apply protection
        permissions = {
            "allow_printing": request.allow_printing,
            "allow_copying": request.allow_copying,
            "allow_modification": request.allow_modification,
            "allow_annotation": request.allow_annotation,
            "allow_form_filling": request.allow_form_filling,
        }

        SecurityEngine.encrypt_pdf(
            input_path=input_path,
            output_path=output_path,
            user_password=request.user_password,
            owner_password=request.owner_password,
            permissions=permissions
        )

        # Create result document record
        result_doc = await doc_service.create_from_processed(
            original_name=f"protected_{document.original_name}",
            storage_key=f"{output_id}.pdf",
            mime_type="application/pdf",
            file_size=output_path.stat().st_size,
            user_id=user_id
        )

        return OperationResponse(
            success=True,
            message="PDF protected successfully",
            result_document_id=str(result_doc.id),
            download_url=f"/api/v1/documents/{result_doc.id}/download"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to protect PDF: {str(e)}")


@router.post("/unlock", response_model=OperationResponse)
async def remove_pdf_password(
    request: RemovePasswordRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove password protection from a PDF.
    Provide the user or owner password in `password` field.
    """
    doc_service = DocumentService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    input_path = settings.UPLOAD_DIR / document.storage_key
    output_id = str(uuid.uuid4())
    output_path = settings.PROCESSED_DIR / f"{output_id}.pdf"
    settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    try:
        # Attempt to decrypt using provided password (or empty string)
        password = request.password or ""
        SecurityEngine.decrypt_pdf(
            input_path=input_path,
            output_path=output_path,
            password=password
        )

        result_doc = await doc_service.create_from_processed(
            original_name=f"unlocked_{document.original_name}",
            storage_key=f"{output_id}.pdf",
            mime_type="application/pdf",
            file_size=output_path.stat().st_size,
            user_id=user_id
        )

        return OperationResponse(
            success=True,
            message="PDF unlocked successfully",
            result_document_id=str(result_doc.id),
            download_url=f"/api/v1/documents/{result_doc.id}/download"
        )

    except ValueError:
        raise HTTPException(
            status_code=400, detail="Invalid password provided")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to unlock PDF: {str(e)}")


@router.get("/check/{document_id}", response_model=SecurityCheckResponse)
async def check_pdf_security(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Check the security status and permissions of a PDF.
    """
    doc_service = DocumentService(db)

    document = await doc_service.get_by_id(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    input_path = settings.UPLOAD_DIR / document.storage_key

    try:
        result = SecurityEngine.check_pdf_protection(input_path)

        return SecurityCheckResponse(
            document_id=document_id,
            is_encrypted=result.get("is_encrypted", False),
            needs_password=result.get("needs_password", False),
            permissions=result.get("permissions"),
            metadata=result.get("metadata")
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to check PDF: {str(e)}")


@router.post("/watermark/text", response_model=OperationResponse)
async def add_text_watermark(
    request: WatermarkTextRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a text watermark to PDF pages.

    Positions: center, diagonal, tiled
    """
    doc_service = DocumentService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    input_path = settings.UPLOAD_DIR / document.storage_key
    output_id = str(uuid.uuid4())
    output_path = settings.PROCESSED_DIR / f"{output_id}.pdf"

    try:
        SecurityEngine.add_text_watermark(
            input_path=input_path,
            output_path=output_path,
            text=request.text,
            font_size=request.font_size,
            font_color=hex_to_rgb(request.font_color),
            opacity=request.opacity,
            rotation=request.rotation,
            position=request.position,
            pages=request.pages
        )

        result_doc = await doc_service.create_from_processed(
            original_name=f"watermarked_{document.original_name}",
            storage_key=f"{output_id}.pdf",
            mime_type="application/pdf",
            file_size=output_path.stat().st_size,
            user_id=user_id
        )

        return OperationResponse(
            success=True,
            message="Watermark added successfully",
            result_document_id=str(result_doc.id),
            download_url=f"/api/v1/documents/{result_doc.id}/download"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to add watermark: {str(e)}")


@router.post("/watermark/image", response_model=OperationResponse)
async def add_image_watermark(
    request: WatermarkImageRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Add an image watermark to PDF pages.

    Positions: center, top-left, top-right, bottom-left, bottom-right
    """
    doc_service = DocumentService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    watermark_doc = await doc_service.get_by_id(request.watermark_image_id)
    if not watermark_doc:
        raise HTTPException(
            status_code=404, detail="Watermark image not found")

    input_path = settings.UPLOAD_DIR / document.storage_key
    watermark_path = settings.UPLOAD_DIR / watermark_doc.storage_key
    output_id = str(uuid.uuid4())
    output_path = settings.PROCESSED_DIR / f"{output_id}.pdf"

    try:
        SecurityEngine.add_image_watermark(
            input_path=input_path,
            output_path=output_path,
            image_path=watermark_path,
            opacity=request.opacity,
            scale=request.scale,
            position=request.position,
            pages=request.pages
        )

        result_doc = await doc_service.create_from_processed(
            original_name=f"watermarked_{document.original_name}",
            storage_key=f"{output_id}.pdf",
            mime_type="application/pdf",
            file_size=output_path.stat().st_size,
            user_id=user_id
        )

        return OperationResponse(
            success=True,
            message="Image watermark added successfully",
            result_document_id=str(result_doc.id),
            download_url=f"/api/v1/documents/{result_doc.id}/download"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to add watermark: {str(e)}")


@router.post("/page-numbers", response_model=OperationResponse)
async def add_page_numbers(
    request: AddPageNumbersRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Add page numbers to a PDF.

    Positions: bottom-center, bottom-left, bottom-right, top-center, top-left, top-right
    Format: Use {page} and {total} placeholders
    """
    doc_service = DocumentService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    input_path = settings.UPLOAD_DIR / document.storage_key
    output_id = str(uuid.uuid4())
    output_path = settings.PROCESSED_DIR / f"{output_id}.pdf"

    try:
        SecurityEngine.add_page_numbers(
            input_path=input_path,
            output_path=output_path,
            position=request.position,
            format_string=request.format_string,
            font_size=request.font_size,
            start_page=request.start_page,
            skip_first=request.skip_first
        )

        result_doc = await doc_service.create_from_processed(
            original_name=f"numbered_{document.original_name}",
            storage_key=f"{output_id}.pdf",
            mime_type="application/pdf",
            file_size=output_path.stat().st_size,
            user_id=user_id
        )

        return OperationResponse(
            success=True,
            message="Page numbers added successfully",
            result_document_id=str(result_doc.id),
            download_url=f"/api/v1/documents/{result_doc.id}/download"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to add page numbers: {str(e)}")


# Metadata endpoints removed — metadata editing feature has been removed from the API


@router.get("/thumbnails/{document_id}")
async def get_page_thumbnails(
    document_id: str,
    dpi: int = 72,
    max_dimension: int = 200,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate thumbnail images for each page of a PDF.
    Returns list of thumbnail URLs.
    """
    doc_service = DocumentService(db)

    document = await doc_service.get_by_id(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    input_path = settings.UPLOAD_DIR / document.storage_key
    output_dir = settings.TEMP_DIR / "thumbnails" / document_id

    try:
        thumbnails = SecurityEngine.get_page_thumbnails(
            input_path=input_path,
            output_dir=output_dir,
            dpi=dpi,
            max_dimension=max_dimension
        )

        # Return relative URLs
        return {
            "document_id": document_id,
            "page_count": len(thumbnails),
            "thumbnails": [
                f"/api/v1/documents/thumbnail/{document_id}/{i + 1}"
                for i in range(len(thumbnails))
            ]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate thumbnails: {str(e)}")

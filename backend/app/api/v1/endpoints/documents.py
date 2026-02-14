"""
Document Endpoints
File upload, download, and management
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id_optional
from app.core.config import settings
from app.services.document_service import DocumentService
from app.schemas.document import (
    DocumentResponse,
    DocumentUploadResponse,
    DocumentListResponse,
)

# Optional PDF engine import
try:
    from app.engines.pdf_engine import PDFEngine
    PDF_ENGINE_AVAILABLE = True
except ImportError:
    PDFEngine = None
    PDF_ENGINE_AVAILABLE = False


router = APIRouter()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Upload a document file"""
    # Validate file size
    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB"
        )

    # Validate file extension
    file_ext = file.filename.split(
        '.')[-1].lower() if '.' in file.filename else ''
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Upload file
    service = DocumentService(db)
    document = await service.upload_file(
        file,
        user_id=uuid.UUID(user_id) if user_id else None
    )

    # Get page count for PDFs (if engine available)
    page_count = None
    if file_ext == 'pdf' and PDF_ENGINE_AVAILABLE:
        try:
            file_path = settings.UPLOAD_DIR / document.storage_key
            page_count = PDFEngine.get_page_count(file_path)
            await service.update_page_count(document.id, page_count)
        except Exception:
            pass

    return DocumentUploadResponse(
        id=document.id,
        filename=document.original_name,
        size=document.file_size,
        mime_type=document.mime_type,
        page_count=page_count,
    )


@router.post("/upload/batch", response_model=List[DocumentUploadResponse])
async def upload_multiple_documents(
    files: List[UploadFile] = File(...),
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Upload multiple documents at once"""
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 files per batch upload"
        )

    service = DocumentService(db)
    results = []

    for file in files:
        try:
            document = await service.upload_file(
                file,
                user_id=uuid.UUID(user_id) if user_id else None
            )

            results.append(DocumentUploadResponse(
                id=document.id,
                filename=document.original_name,
                size=document.file_size,
                mime_type=document.mime_type,
            ))
        except Exception as e:
            # Continue with other files even if one fails
            continue

    return results


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """List user's documents"""
    service = DocumentService(db)

    if not user_id:
        # Return empty for anonymous users
        return DocumentListResponse(
            documents=[],
            total=0,
            page=page,
            page_size=page_size
        )

    documents, total = await service.get_user_documents(
        uuid.UUID(user_id),
        page=page,
        page_size=page_size
    )

    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get document details"""
    service = DocumentService(db)
    document = await service.get_by_id(document_id)

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return document


@router.get("/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Download a document"""
    service = DocumentService(db)
    file_path = await service.get_file_path(document_id)

    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    document = await service.get_by_id(document_id)

    return FileResponse(
        path=file_path,
        filename=document.original_name,
        media_type=document.mime_type
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Delete a document"""
    service = DocumentService(db)
    document = await service.get_by_id(document_id)

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Check ownership
    if document.user_id and str(document.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this document"
        )

    await service.delete(document_id)

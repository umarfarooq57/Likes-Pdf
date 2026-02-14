"""
Editing Endpoints
PDF editing operations - merge, split, rotate, etc.
Synchronous processing (no Celery required)
"""

import uuid
import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id_optional
from app.core.config import settings
from app.services.document_service import DocumentService
from app.services.conversion_service import ConversionService
from app.models.conversion import ConversionType, ConversionStatus
from app.schemas.conversion import (
    ConversionResponse,
    MergeRequest,
    SplitRequest,
    RotateRequest,
    ReorderRequest,
    DeletePagesRequest,
    ExtractPagesRequest,
)

# Import PDF Engine
try:
    from app.engines.pdf_engine import PDFEngine
    PDF_ENGINE_AVAILABLE = True
except ImportError:
    PDFEngine = None
    PDF_ENGINE_AVAILABLE = False


router = APIRouter()


def ensure_pdf_engine():
    """Check if PDF engine is available"""
    if not PDF_ENGINE_AVAILABLE:
        raise HTTPException(
            status_code=500,
            detail="PDF engine not available. Please install pymupdf."
        )


@router.post("/merge", response_model=ConversionResponse)
async def merge_pdfs(
    request: MergeRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Merge multiple PDFs into one"""
    ensure_pdf_engine()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    # Debug logging
    print(f"[MERGE] Received document_ids: {request.document_ids}")

    # Get all documents
    input_paths = []
    first_doc_id = None
    for doc_id in request.document_ids:
        print(f"[MERGE] Looking up document: {doc_id}")
        # Ensure doc_id is UUID
        if isinstance(doc_id, str):
            doc_id = uuid.UUID(doc_id)
        document = await doc_service.get_by_id(doc_id)
        print(f"[MERGE] Found document: {document}")
        if document:
            if first_doc_id is None:
                first_doc_id = doc_id
            input_paths.append(
                Path(settings.UPLOAD_DIR / document.storage_key))

    if len(input_paths) < 2:
        raise HTTPException(
            status_code=400,
            detail=f"At least 2 valid PDF documents required. Found {len(input_paths)} documents."
        )

    print(f"[MERGE] Creating conversion, first_doc_id type: {type(first_doc_id)}, value: {first_doc_id}")
    
    # Create conversion record - ensure first_doc_id is string
    conversion = await conv_service.create_conversion(
        document_id=str(first_doc_id) if first_doc_id else None,
        conversion_type=ConversionType.MERGE,
        user_id=user_id,  # Already string or None
        target_format="pdf",
    )

    print(f"[MERGE] Conversion created: {conversion.id}")
    output_path = Path(settings.PROCESSED_DIR / f"{conversion.id}.pdf")
    print(f"[MERGE] Output path: {output_path}")
    print(f"[MERGE] Input paths: {input_paths}")

    try:
        PDFEngine.merge_pdfs(input_paths, output_path)
        print(f"[MERGE] PDFEngine.merge_pdfs completed")
        await conv_service.mark_completed(conversion.id, str(output_path))
        print(f"[MERGE] Marked completed")
    except Exception as e:
        print(f"[MERGE] Error: {e}")
        import traceback
        traceback.print_exc()
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Merge failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/split", response_model=ConversionResponse)
async def split_pdf(
    request: SplitRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Split PDF into multiple files"""
    ensure_pdf_engine()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.SPLIT,
        user_id=user_id,
        options={"mode": request.mode}
    )

    input_path = Path(settings.UPLOAD_DIR / document.storage_key)
    output_dir = Path(settings.PROCESSED_DIR / str(conversion.id))
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Build page_ranges for PDFEngine
        page_ranges = None
        
        if request.pages:
            # Convert individual pages to single-page ranges (1-indexed)
            page_ranges = [(p, p) for p in request.pages]
        elif request.ranges:
            # Parse range strings like "1-3", "5-7"
            page_ranges = []
            for r in request.ranges:
                parts = r.split('-')
                if len(parts) == 2:
                    page_ranges.append((int(parts[0]), int(parts[1])))
                elif len(parts) == 1:
                    page_ranges.append((int(parts[0]), int(parts[0])))

        result_files = PDFEngine.split_pdf(input_path, output_dir, page_ranges=page_ranges)

        # For split, we return the directory path
        await conv_service.mark_completed(conversion.id, str(output_dir), "split_results.zip")
    except Exception as e:
        import traceback
        traceback.print_exc()
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Split failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/rotate", response_model=ConversionResponse)
async def rotate_pages(
    request: RotateRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Rotate specific pages in PDF"""
    ensure_pdf_engine()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Validate rotations
    for page, degrees in request.rotations.items():
        if degrees % 90 != 0:
            raise HTTPException(
                status_code=400,
                detail="Rotation must be 0, 90, 180, or 270 degrees"
            )

    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.ROTATE,
        user_id=user_id,
        options={"rotations": request.rotations}
    )

    input_path = Path(settings.UPLOAD_DIR / document.storage_key)
    output_path = Path(settings.PROCESSED_DIR / f"{conversion.id}.pdf")

    try:
        # Convert to 0-indexed
        rotations = {k - 1: v for k, v in request.rotations.items()}
        PDFEngine.rotate_pages(input_path, output_path, rotations)
        await conv_service.mark_completed(conversion.id, str(output_path))
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Rotate failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/reorder", response_model=ConversionResponse)
async def reorder_pages(
    request: ReorderRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Reorder pages in PDF"""
    ensure_pdf_engine()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.REORDER,
        user_id=user_id,
        options={"new_order": request.new_order}
    )

    input_path = Path(settings.UPLOAD_DIR / document.storage_key)
    output_path = Path(settings.PROCESSED_DIR / f"{conversion.id}.pdf")

    try:
        # Convert to 0-indexed
        new_order = [p - 1 for p in request.new_order]
        PDFEngine.reorder_pages(input_path, output_path, new_order)
        await conv_service.mark_completed(conversion.id, str(output_path))
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(
            status_code=500, detail=f"Reorder failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/delete-pages", response_model=ConversionResponse)
async def delete_pages(
    request: DeletePagesRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Delete specific pages from PDF"""
    ensure_pdf_engine()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.DELETE_PAGES,
        user_id=user_id,
        options={"pages": request.pages}
    )

    input_path = Path(settings.UPLOAD_DIR / document.storage_key)
    output_path = Path(settings.PROCESSED_DIR / f"{conversion.id}.pdf")

    try:
        # Convert to 0-indexed
        pages = [p - 1 for p in request.pages]
        PDFEngine.delete_pages(input_path, output_path, pages)
        await conv_service.mark_completed(conversion.id, str(output_path))
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(
            status_code=500, detail=f"Delete pages failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/extract-pages", response_model=ConversionResponse)
async def extract_pages(
    request: ExtractPagesRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Extract specific pages from PDF"""
    ensure_pdf_engine()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.EXTRACT_PAGES,
        user_id=user_id,
        options={"pages": request.pages}
    )

    input_path = Path(settings.UPLOAD_DIR / document.storage_key)
    output_path = Path(settings.PROCESSED_DIR / f"{conversion.id}.pdf")

    try:
        # Convert to 0-indexed
        pages = [p - 1 for p in request.pages]
        PDFEngine.extract_pages(input_path, output_path, pages)
        await conv_service.mark_completed(conversion.id, str(output_path))
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(
            status_code=500, detail=f"Extract pages failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    return conversion

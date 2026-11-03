"""
Editing Endpoints
PDF editing operations - merge, split, rotate, etc.
All CPU-bound calls run in a thread pool to avoid blocking the event loop.
"""

import asyncio
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
    CropRequest,
)

# Import PDF Engine and accurately detect availability of PyMuPDF
try:
    import importlib
    pdf_module = importlib.import_module('app.engines.pdf_engine')
    PDFEngine = getattr(pdf_module, 'PDFEngine', None)
    # pdf_module exposes PYMUPDF_AVAILABLE or PYPDF_AVAILABLE flags
    PYMUPDF_AVAILABLE = bool(getattr(pdf_module, 'PYMUPDF_AVAILABLE', False))
    PYPDF_AVAILABLE = bool(getattr(pdf_module, 'PYPDF_AVAILABLE', False))
    PDF_ENGINE_AVAILABLE = PYMUPDF_AVAILABLE or PYPDF_AVAILABLE
except Exception:
    PDFEngine = None
    PYMUPDF_AVAILABLE = False
    PYPDF_AVAILABLE = False
    PDF_ENGINE_AVAILABLE = False


router = APIRouter()


def ensure_any_pdf_engine():
    """Ensure at least one PDF engine (pymupdf or pypdf) is available"""
    if not PDF_ENGINE_AVAILABLE:
        raise HTTPException(
            status_code=500,
            detail=(
                "PDF engine not available. Install one of the following:\n"
                "- PyMuPDF (recommended, full feature set): pip install pymupdf\n"
                "- pypdf (fallback for merge/split): pip install pypdf"
            )
        )


def ensure_pymupdf():
    """Ensure PyMuPDF is available for advanced editing features"""
    if not PYMUPDF_AVAILABLE:
        raise HTTPException(
            status_code=500,
            detail=(
                "PyMuPDF not available. Advanced PDF editing (rotate, reorder, extract, compress) "
                "requires PyMuPDF. Install via: pip install pymupdf"
            )
        )


def validate_pdf_document(document, tool_name: str):
    ext = (document.file_extension or "").lower().lstrip(".")
    if ext != "pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format for {tool_name}. Expected .pdf, but received '{document.original_name}' (.{ext or 'unknown'})."
        )


@router.post("/merge", response_model=ConversionResponse)
async def merge_pdfs(
    request: MergeRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Merge multiple PDFs into one"""
    ensure_any_pdf_engine()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    # Get all documents
    input_paths = []
    first_doc_id = None
    for doc_id in request.document_ids:
        if isinstance(doc_id, str):
            doc_id = uuid.UUID(doc_id)
        document = await doc_service.get_by_id(doc_id)
        if document:
            validate_pdf_document(document, "Merge PDF")
            if first_doc_id is None:
                first_doc_id = doc_id
            input_paths.append(
                Path(settings.UPLOAD_DIR / document.storage_key))

    if len(input_paths) < 2:
        raise HTTPException(
            status_code=400,
            detail=f"At least 2 valid PDF documents required. Found {len(input_paths)} documents."
        )

    # Create conversion record
    conversion = await conv_service.create_conversion(
        document_id=str(first_doc_id) if first_doc_id else None,
        conversion_type=ConversionType.MERGE,
        user_id=user_id,
        target_format="pdf",
    )

    output_path = Path(settings.PROCESSED_DIR / f"{conversion.id}.pdf")

    try:
        await asyncio.to_thread(PDFEngine.merge_pdfs, input_paths, output_path)
        await conv_service.mark_completed(conversion.id, str(output_path), "merged_document.pdf")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Merge failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    download_url = f"/api/v1/convert/{conversion.id}/download"

    return ConversionResponse(
        id=conversion.id,
        conversion_type=conversion.conversion_type,
        status=conversion.status,
        progress=conversion.progress or 100,
        current_step=conversion.current_step or "Completed",
        download_url=download_url,
        result_url=download_url,
        result_filename=conversion.result_filename or "merged_document.pdf",
        created_at=conversion.created_at,
        started_at=conversion.started_at,
        completed_at=conversion.completed_at,
    )


@router.post("/split", response_model=ConversionResponse)
async def split_pdf(
    request: SplitRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Split PDF into multiple files"""
    ensure_any_pdf_engine()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    validate_pdf_document(document, "Split PDF")

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

        await asyncio.to_thread(
            PDFEngine.split_pdf, input_path, output_dir, page_ranges
        )

        # For split, we return the directory path
        await conv_service.mark_completed(conversion.id, str(output_dir), "split_results.zip")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Split failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    download_url = f"/api/v1/convert/{conversion.id}/download"
    return ConversionResponse(
        id=conversion.id,
        conversion_type=conversion.conversion_type,
        status=conversion.status,
        progress=100,
        current_step="Completed",
        download_url=download_url,
        result_url=download_url,
        result_filename=conversion.result_filename or "split_results.zip",
        created_at=conversion.created_at,
        started_at=conversion.started_at,
        completed_at=conversion.completed_at,
    )


@router.post("/rotate", response_model=ConversionResponse)
async def rotate_pages(
    request: RotateRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Rotate specific pages in PDF"""
    ensure_pymupdf()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    validate_pdf_document(document, "Rotate PDF")

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
        await asyncio.to_thread(PDFEngine.rotate_pages, input_path, output_path, rotations)
        await conv_service.mark_completed(conversion.id, str(output_path))
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Rotate failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    download_url = f"/api/v1/convert/{conversion.id}/download"
    return ConversionResponse(
        id=conversion.id,
        conversion_type=conversion.conversion_type,
        status=conversion.status,
        progress=100,
        current_step="Completed",
        download_url=download_url,
        result_url=download_url,
        result_filename=conversion.result_filename,
        created_at=conversion.created_at,
        started_at=conversion.started_at,
        completed_at=conversion.completed_at,
    )


@router.post("/reorder", response_model=ConversionResponse)
async def reorder_pages(
    request: ReorderRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Reorder pages in PDF"""
    ensure_pymupdf()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    validate_pdf_document(document, "Reorder Pages")

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
        await asyncio.to_thread(PDFEngine.reorder_pages, input_path, output_path, new_order)
        await conv_service.mark_completed(conversion.id, str(output_path))
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(
            status_code=500, detail=f"Reorder failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    download_url = f"/api/v1/convert/{conversion.id}/download"
    return ConversionResponse(
        id=conversion.id,
        conversion_type=conversion.conversion_type,
        status=conversion.status,
        progress=100,
        current_step="Completed",
        download_url=download_url,
        result_url=download_url,
        result_filename=conversion.result_filename,
        created_at=conversion.created_at,
        started_at=conversion.started_at,
        completed_at=conversion.completed_at,
    )


@router.post("/delete-pages", response_model=ConversionResponse)
async def delete_pages(
    request: DeletePagesRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Delete specific pages from PDF"""
    ensure_pymupdf()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    validate_pdf_document(document, "Delete Pages")

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
        await asyncio.to_thread(PDFEngine.delete_pages, input_path, output_path, pages)
        await conv_service.mark_completed(conversion.id, str(output_path))
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(
            status_code=500, detail=f"Delete pages failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    download_url = f"/api/v1/convert/{conversion.id}/download"
    return ConversionResponse(
        id=conversion.id,
        conversion_type=conversion.conversion_type,
        status=conversion.status,
        progress=100,
        current_step="Completed",
        download_url=download_url,
        result_url=download_url,
        result_filename=conversion.result_filename,
        created_at=conversion.created_at,
        started_at=conversion.started_at,
        completed_at=conversion.completed_at,
    )


@router.post("/extract-pages", response_model=ConversionResponse)
async def extract_pages(
    request: ExtractPagesRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Extract specific pages from PDF"""
    ensure_pymupdf()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    validate_pdf_document(document, "Extract Pages")

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
        await asyncio.to_thread(PDFEngine.extract_pages, input_path, output_path, pages)
        await conv_service.mark_completed(conversion.id, str(output_path))
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(
            status_code=500, detail=f"Extract pages failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    download_url = f"/api/v1/convert/{conversion.id}/download"
    return ConversionResponse(
        id=conversion.id,
        conversion_type=conversion.conversion_type,
        status=conversion.status,
        progress=100,
        current_step="Completed",
        download_url=download_url,
        result_url=download_url,
        result_filename=conversion.result_filename,
        created_at=conversion.created_at,
        started_at=conversion.started_at,
        completed_at=conversion.completed_at,
    )


@router.post("/crop", response_model=ConversionResponse)
async def crop_pdf(
    request: CropRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Crop PDF pages by removing margins (percentages 0-100 from each edge)"""
    ensure_pymupdf()

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    validate_pdf_document(document, "Crop PDF")

    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.CROP,
        user_id=user_id,
        options={
            "left": request.left,
            "top": request.top,
            "right": request.right,
            "bottom": request.bottom,
            "pages": request.pages,
        }
    )

    input_path = Path(settings.UPLOAD_DIR / document.storage_key)
    output_path = Path(settings.PROCESSED_DIR / f"{conversion.id}.pdf")

    def _crop_pdf(src: Path, dst: Path,
                  left: float, top: float, right: float, bottom: float,
                  target_pages=None):
        """Apply set_cropbox to each page using margin percentages."""
        import fitz
        doc = fitz.open(str(src))
        page_count = len(doc)

        page_indices = set()
        if target_pages:
            for p in target_pages:
                idx = p - 1  # convert 1-based to 0-based
                if 0 <= idx < page_count:
                    page_indices.add(idx)
        else:
            page_indices = set(range(page_count))

        for i, page in enumerate(doc):
            if i not in page_indices:
                continue
            r = page.rect
            new_left   = r.x0 + (r.width  * left   / 100.0)
            new_top    = r.y0 + (r.height * top    / 100.0)
            new_right  = r.x1 - (r.width  * right  / 100.0)
            new_bottom = r.y1 - (r.height * bottom / 100.0)

            if new_left >= new_right or new_top >= new_bottom:
                # Invalid crop box — skip this page to avoid corruption
                continue
            crop_box = fitz.Rect(new_left, new_top, new_right, new_bottom)
            page.set_cropbox(crop_box)

        doc.save(str(dst), garbage=3, deflate=True)
        doc.close()

    try:
        await asyncio.to_thread(
            _crop_pdf, input_path, output_path,
            request.left, request.top, request.right, request.bottom,
            request.pages
        )
        await conv_service.mark_completed(
            conversion.id, str(output_path),
            f"{os.path.splitext(document.original_name)[0]}_cropped.pdf"
        )
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Crop failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    download_url = f"/api/v1/convert/{conversion.id}/download"
    return ConversionResponse(
        id=conversion.id,
        conversion_type=conversion.conversion_type,
        status=conversion.status,
        progress=100,
        current_step="Completed",
        download_url=download_url,
        result_url=download_url,
        result_filename=conversion.result_filename,
        created_at=conversion.created_at,
        started_at=conversion.started_at,
        completed_at=conversion.completed_at,
    )

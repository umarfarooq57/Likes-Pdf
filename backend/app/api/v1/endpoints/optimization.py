"""
Optimization Endpoints
PDF compression, linearization, and repair
All CPU-bound calls run in a thread pool to avoid blocking the event loop.
"""

import asyncio
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id_optional
from app.core.config import settings
from app.services.document_service import DocumentService
from app.services.conversion_service import ConversionService
from app.models.conversion import ConversionType
from app.schemas.conversion import ConversionResponse, CompressRequest

# Optional PDF engine
try:
    from app.engines.pdf_engine import PDFEngine
    _PDF_ENGINE_OK = True
except Exception:
    PDFEngine = None  # type: ignore[assignment]
    _PDF_ENGINE_OK = False


router = APIRouter()


@router.post("/compress", response_model=ConversionResponse)
async def compress_pdf(
    request: CompressRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Compress PDF to reduce file size"""
    if not _PDF_ENGINE_OK:
        raise HTTPException(status_code=503, detail="PDF engine not available")

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    ext = (document.file_extension or "").lower().lstrip(".")
    if ext != "pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format for PDF compression. Expected .pdf, but received '{document.original_name}' (.{ext or 'unknown'})."
        )

    conversion = await conv_service.create_conversion(
        document_id=request.document_id,
        conversion_type=ConversionType.COMPRESS,
        user_id=user_id,
        options={"quality": request.quality}
    )

    input_path = Path(settings.UPLOAD_DIR / document.storage_key)
    output_path = Path(settings.PROCESSED_DIR / f"{conversion.id}.pdf")
    result_name = f"{Path(document.original_name).stem}_compressed.pdf"

    # Try Celery first; fall back to direct (thread-pool) execution
    dispatched_to_celery = False
    try:
        from app.workers.optimization_tasks import compress_pdf_task
        task = compress_pdf_task.delay(
            input_path=str(input_path),
            output_path=str(output_path),
            quality=request.quality,
            conversion_id=str(conversion.id)
        )
        await conv_service.set_celery_task_id(conversion.id, task.id)
        dispatched_to_celery = True
    except Exception:
        pass  # Redis/Celery unavailable — run synchronously

    if not dispatched_to_celery:
        try:
            await asyncio.to_thread(
                PDFEngine.compress_pdf, input_path, output_path, request.quality
            )
            await conv_service.mark_completed(conversion.id, str(output_path), result_name)
        except Exception as e:
            await conv_service.mark_failed(conversion.id, str(e))
            raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")

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
        result_filename=conversion.result_filename or result_name,
        created_at=conversion.created_at,
        started_at=conversion.started_at,
        completed_at=conversion.completed_at,
    )


@router.post("/linearize", response_model=ConversionResponse)
async def linearize_pdf(
    document_id: uuid.UUID,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Linearize PDF for fast web viewing"""
    if not _PDF_ENGINE_OK:
        raise HTTPException(status_code=503, detail="PDF engine not available")

    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    conversion = await conv_service.create_conversion(
        document_id=str(document_id),
        conversion_type=ConversionType.LINEARIZE,
        user_id=user_id,
    )

    input_path = Path(settings.UPLOAD_DIR / document.storage_key)
    output_path = Path(settings.PROCESSED_DIR / f"{conversion.id}.pdf")
    result_name = f"{Path(document.original_name).stem}_linearized.pdf"

    dispatched_to_celery = False
    try:
        from app.workers.optimization_tasks import linearize_pdf_task
        task = linearize_pdf_task.delay(
            input_path=str(input_path),
            output_path=str(output_path),
            conversion_id=str(conversion.id)
        )
        await conv_service.set_celery_task_id(conversion.id, task.id)
        dispatched_to_celery = True
    except Exception:
        pass

    if not dispatched_to_celery:
        try:
            await asyncio.to_thread(PDFEngine.linearize_pdf, input_path, output_path)
            await conv_service.mark_completed(conversion.id, str(output_path), result_name)
        except Exception as e:
            await conv_service.mark_failed(conversion.id, str(e))
            raise HTTPException(status_code=500, detail=f"Linearization failed: {str(e)}")

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
        result_filename=conversion.result_filename or result_name,
        created_at=conversion.created_at,
        started_at=conversion.started_at,
        completed_at=conversion.completed_at,
    )


# Repair endpoint removed — feature disabled

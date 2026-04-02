"""
Optimization Endpoints
PDF compression, linearization, and repair
"""

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
from app.engines.pdf_engine import PDFEngine
from app.workers.optimization_tasks import (
    compress_pdf_task,
    linearize_pdf_task,
)
from app.schemas.conversion import ConversionResponse, CompressRequest


router = APIRouter()


@router.post("/compress", response_model=ConversionResponse)
async def compress_pdf(
    request: CompressRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Compress PDF to reduce file size"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)

    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    conversion = await conv_service.create_conversion(
        document_id=request.document_id,
        conversion_type=ConversionType.COMPRESS,
        user_id=user_id,
        options={"quality": request.quality}
    )

    input_path = str(settings.UPLOAD_DIR / document.storage_key)
    output_path = str(settings.PROCESSED_DIR / f"{conversion.id}.pdf")

    try:
        task = compress_pdf_task.delay(
            input_path=input_path,
            output_path=output_path,
            quality=request.quality,
            conversion_id=str(conversion.id)
        )
        await conv_service.set_celery_task_id(conversion.id, task.id)
    except Exception:
        # Fallback for local/dev environments where Celery or Redis isn't running.
        try:
            PDFEngine.compress_pdf(Path(input_path), Path(
                output_path), request.quality)
            await conv_service.mark_completed(
                conversion.id,
                output_path,
                f"{Path(document.original_name).stem}_compressed.pdf"
            )
        except Exception as e:
            await conv_service.mark_failed(conversion.id, str(e))
            raise HTTPException(
                status_code=500, detail=f"Compression failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/linearize", response_model=ConversionResponse)
async def linearize_pdf(
    document_id: uuid.UUID,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Linearize PDF for fast web viewing"""
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

    input_path = str(settings.UPLOAD_DIR / document.storage_key)
    output_path = str(settings.PROCESSED_DIR / f"{conversion.id}.pdf")

    try:
        task = linearize_pdf_task.delay(
            input_path=input_path,
            output_path=output_path,
            conversion_id=str(conversion.id)
        )
        await conv_service.set_celery_task_id(conversion.id, task.id)
    except Exception:
        # Fallback for local/dev environments where Celery or Redis isn't running.
        try:
            PDFEngine.linearize_pdf(Path(input_path), Path(output_path))
            await conv_service.mark_completed(
                conversion.id,
                output_path,
                f"{Path(document.original_name).stem}_linearized.pdf"
            )
        except Exception as e:
            await conv_service.mark_failed(conversion.id, str(e))
            raise HTTPException(
                status_code=500, detail=f"Linearization failed: {str(e)}")

    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


# Repair endpoint removed — feature disabled

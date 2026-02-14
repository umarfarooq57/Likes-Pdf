"""
Optimization Endpoints
PDF compression, linearization, and repair
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id_optional
from app.core.config import settings
from app.services.document_service import DocumentService
from app.services.conversion_service import ConversionService
from app.models.conversion import ConversionType
from app.workers.optimization_tasks import (
    compress_pdf_task,
    linearize_pdf_task,
    repair_pdf_task,
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
    
    task = compress_pdf_task.delay(
        input_path=input_path,
        output_path=output_path,
        quality=request.quality,
        conversion_id=str(conversion.id)
    )
    
    await conv_service.set_celery_task_id(conversion.id, task.id)
    
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
    
    task = linearize_pdf_task.delay(
        input_path=input_path,
        output_path=output_path,
        conversion_id=str(conversion.id)
    )
    
    await conv_service.set_celery_task_id(conversion.id, task.id)
    
    return conversion


@router.post("/repair", response_model=ConversionResponse)
async def repair_pdf(
    document_id: uuid.UUID,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Attempt to repair a corrupt PDF"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(document_id),
        conversion_type=ConversionType.REPAIR,
        user_id=user_id,
    )
    
    input_path = str(settings.UPLOAD_DIR / document.storage_key)
    output_path = str(settings.PROCESSED_DIR / f"{conversion.id}.pdf")
    
    task = repair_pdf_task.delay(
        input_path=input_path,
        output_path=output_path,
        conversion_id=str(conversion.id)
    )
    
    await conv_service.set_celery_task_id(conversion.id, task.id)
    
    return conversion



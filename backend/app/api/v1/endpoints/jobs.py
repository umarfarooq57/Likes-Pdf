"""
Job Status & History Endpoints
Track async conversion progress and view history
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id_optional
from app.services.conversion_service import ConversionService
from app.models.conversion import Conversion, ConversionStatus
from app.schemas.conversion import ConversionStatusResponse, ConversionResponse
from app.core.config import settings

router = APIRouter()


@router.get("/{job_id}/status", response_model=ConversionStatusResponse)
async def get_job_status(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get status of a specific job"""
    conv_service = ConversionService(db)
    conversion = await conv_service.get_by_id(job_id)
    
    if not conversion:
        raise HTTPException(status_code=404, detail="Job not found")
    
    result_url = None
    if conversion.status == ConversionStatus.COMPLETED.value and conversion.result_key:
        result_url = f"/api/v1/convert/{job_id}/download"
    
    return ConversionStatusResponse(
        id=conversion.id,
        status=conversion.status,
        progress=conversion.progress or 0,
        current_step=conversion.current_step or "",
        result_url=result_url,
        result_filename=conversion.result_filename,
        error_message=conversion.error_message,
        processing_time_ms=conversion.processing_time_ms
    )


@router.get("/history", response_model=List[ConversionResponse])
async def get_job_history(
    skip: int = 0,
    limit: int = 20,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Get conversion history (latest first)"""
    query = select(Conversion).order_by(desc(Conversion.created_at)).offset(skip).limit(limit)
    
    if user_id:
        query = query.where(Conversion.user_id == user_id)
        
    result = await db.execute(query)
    conversions = result.scalars().all()
    
    return conversions


@router.delete("/{job_id}")
async def cancel_job(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Cancel a running job or delete a completed one"""
    conv_service = ConversionService(db)
    conversion = await conv_service.get_by_id(job_id)
    
    if not conversion:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # If running, try to revoke Celery task
    if conversion.celery_task_id and conversion.status in [
        ConversionStatus.PENDING.value, 
        ConversionStatus.QUEUED.value,
        ConversionStatus.PROCESSING.value
    ]:
        try:
            from app.workers.celery_app import celery_app
            celery_app.control.revoke(conversion.celery_task_id, terminate=True)
            await conv_service.mark_failed(job_id, "Cancelled by user")
        except Exception:
            pass # Ignore celery errors if task not found
            
    # Always delete record from DB
    await db.delete(conversion)
    await db.commit()
        
    return {"message": "Job cancelled/deleted successfully"}

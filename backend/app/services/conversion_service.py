"""
Conversion Service
Business logic for document conversions
"""

from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.conversion import Conversion, ConversionStatus, ConversionType
from app.models.document import Document


def _utc_now() -> datetime:
    """Return naive UTC datetime to match SQLAlchemy DateTime column standard."""
    return datetime.utcnow()


def _to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Safely convert any datetime (aware or naive) to a naive UTC datetime."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class ConversionService:
    """Service for conversion operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_conversion(
        self,
        document_id,  # Can be string or UUID
        conversion_type: ConversionType,
        user_id = None,  # Can be string or None
        target_format: Optional[str] = None,
        options: Dict[str, Any] = None
    ) -> Conversion:
        """Create a new conversion job"""
        # Ensure IDs are strings (model uses String(36))
        doc_id_str = str(document_id) if document_id else None
        user_id_str = str(user_id) if user_id else None
        
        conversion = Conversion(
            user_id=user_id_str,
            source_document_id=doc_id_str,  # Correct column name
            conversion_type=conversion_type.value if hasattr(conversion_type, 'value') else str(conversion_type),
            target_format=target_format,
            options=options or {},
            status=ConversionStatus.PROCESSING.value,
            started_at=_utc_now(),
        )

        self.db.add(conversion)
        await self.db.commit()
        await self.db.refresh(conversion)

        return conversion

    async def get_by_id(self, conversion_id) -> Optional[Conversion]:
        """Get conversion by ID"""
        # Ensure ID is string
        conv_id_str = str(conversion_id) if conversion_id else None
        if not conv_id_str:
            return None
        result = await self.db.execute(
            select(Conversion).where(Conversion.id == conv_id_str)
        )
        return result.scalar_one_or_none()

    async def update_status(
        self,
        conversion_id,
        status: ConversionStatus,
        progress: int = None,
        current_step: str = None,
        error_message: str = None,
        result_key: str = None,
        result_filename: str = None,
        result_size: int = None,
        processing_time_ms: int = None
    ) -> Optional[Conversion]:
        """Update conversion status"""
        conversion = await self.get_by_id(conversion_id)
        if not conversion:
            return None

        conversion.status = status.value if hasattr(status, 'value') else str(status)

        if progress is not None:
            conversion.progress = progress
        if current_step is not None:
            conversion.current_step = current_step
        if error_message is not None:
            conversion.error_message = error_message
        if result_key is not None:
            conversion.result_key = result_key
        if result_filename is not None:
            conversion.result_filename = result_filename
        if result_size is not None:
            conversion.result_size = result_size
        if processing_time_ms is not None:
            conversion.processing_time_ms = processing_time_ms

        # Update timestamps
        status_val = status.value if hasattr(status, 'value') else str(status)
        if (status == ConversionStatus.PROCESSING or status_val == "processing") and not conversion.started_at:
            conversion.started_at = _utc_now()
        if status in [ConversionStatus.COMPLETED, ConversionStatus.FAILED] or status_val in ["completed", "failed"]:
            conversion.completed_at = _utc_now()

        await self.db.commit()
        await self.db.refresh(conversion)

        return conversion

    async def set_celery_task_id(
        self,
        conversion_id: UUID,
        task_id: str
    ) -> None:
        """Set Celery task ID for tracking"""
        conversion = await self.get_by_id(conversion_id)
        if conversion:
            conversion.celery_task_id = task_id
            conversion.status = ConversionStatus.QUEUED.value
            await self.db.commit()

    async def sync_celery_status(self, conversion: Conversion) -> Optional[Conversion]:
        """Update DB conversion status based on current Celery task state if active."""
        if not conversion or not conversion.celery_task_id:
            return conversion

        if conversion.status not in {
            ConversionStatus.QUEUED.value,
            ConversionStatus.PENDING.value,
            ConversionStatus.PROCESSING.value,
        }:
            return conversion

        try:
            from celery.result import AsyncResult
            from app.workers.celery_app import celery_app
            task_result = AsyncResult(conversion.celery_task_id, app=celery_app)
            state = (task_result.state or "").upper()

            if state in {"PENDING", "RECEIVED", "RETRY"}:
                await self.update_status(
                    conversion.id,
                    ConversionStatus.QUEUED,
                    current_step="Queued",
                )
            elif state in {"STARTED", "PROGRESS"}:
                meta = task_result.info if isinstance(task_result.info, dict) else {}
                progress = int(meta.get("progress", 15))
                step = str(meta.get("step", "Processing"))
                await self.update_status(
                    conversion.id,
                    ConversionStatus.PROCESSING,
                    progress=progress,
                    current_step=step,
                )
            elif state == "SUCCESS":
                payload = task_result.result if isinstance(task_result.result, dict) else {}
                if payload.get("status") == "completed" and payload.get("output_file"):
                    await self.mark_completed(
                        conversion.id,
                        str(payload["output_file"]),
                        conversion.result_filename,
                    )
                else:
                    await self.mark_failed(
                        conversion.id,
                        str(payload.get("error", "Conversion task failed")),
                    )
            elif state == "FAILURE":
                await self.mark_failed(conversion.id, str(task_result.result))
        except Exception:
            pass

        return await self.get_by_id(conversion.id)

    async def get_user_conversions(
        self,
        user_id: UUID,
        limit: int = 50
    ) -> List[Conversion]:
        """Get recent conversions for user"""
        result = await self.db.execute(
            select(Conversion)
            .where(Conversion.user_id == user_id)
            .order_by(Conversion.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_started(self, conversion_id) -> Optional[Conversion]:
        """Mark conversion as processing and record started_at timestamp"""
        conversion = await self.get_by_id(conversion_id)
        if not conversion:
            return None
        conversion.status = ConversionStatus.PROCESSING.value
        if not conversion.started_at:
            conversion.started_at = _utc_now()
        await self.db.commit()
        await self.db.refresh(conversion)
        return conversion

    async def mark_completed(
        self,
        conversion_id,
        result_path: str,
        result_filename: str = None
    ) -> Optional[Conversion]:
        """Mark conversion as completed"""
        import os
        conversion = await self.get_by_id(conversion_id)
        if not conversion:
            return None

        conversion.status = ConversionStatus.COMPLETED.value
        conversion.progress = 100
        conversion.result_key = result_path
        conversion.result_filename = result_filename or os.path.basename(
            result_path)
        conversion.completed_at = _utc_now()
        if not conversion.started_at:
            conversion.started_at = conversion.created_at or _utc_now()
        
        try:
            started = _to_naive_utc(conversion.started_at)
            completed = _to_naive_utc(conversion.completed_at)
            if started and completed:
                delta = completed - started
                conversion.processing_time_ms = max(0, int(delta.total_seconds() * 1000))
        except Exception:
            conversion.processing_time_ms = 0

        if os.path.exists(result_path):
            conversion.result_size = os.path.getsize(result_path)

        await self.db.commit()
        await self.db.refresh(conversion)
        return conversion

    async def mark_failed(
        self,
        conversion_id,
        error_message: str
    ) -> Optional[Conversion]:
        """Mark conversion as failed"""
        conversion = await self.get_by_id(conversion_id)
        if not conversion:
            return None

        conversion.status = ConversionStatus.FAILED.value
        conversion.error_message = error_message
        conversion.completed_at = _utc_now()

        await self.db.commit()
        await self.db.refresh(conversion)
        return conversion


async def get_conversion_service(db: AsyncSession) -> ConversionService:
    """Dependency to get conversion service"""
    return ConversionService(db)

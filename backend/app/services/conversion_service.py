"""
Conversion Service
Business logic for document conversions
"""

from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.conversion import Conversion, ConversionStatus, ConversionType
from app.models.document import Document


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
            status=ConversionStatus.PENDING.value,
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
        if status == ConversionStatus.PROCESSING and not conversion.started_at:
            conversion.started_at = datetime.utcnow()
        if status in [ConversionStatus.COMPLETED, ConversionStatus.FAILED]:
            conversion.completed_at = datetime.utcnow()

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
            conversion.status = ConversionStatus.QUEUED
            await self.db.commit()

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
        conversion.completed_at = datetime.utcnow()

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
        conversion.completed_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(conversion)
        return conversion


async def get_conversion_service(db: AsyncSession) -> ConversionService:
    """Dependency to get conversion service"""
    return ConversionService(db)

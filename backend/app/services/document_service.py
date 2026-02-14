"""
Document Service
Business logic for document operations
"""

import os
import uuid
import aiofiles
from pathlib import Path
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import UploadFile
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.document import Document, DocumentStatus


class DocumentService:
    """Service for document operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def upload_file(
        self,
        file: UploadFile,
        user_id: Optional[UUID] = None
    ) -> Document:
        """Upload and save a file"""
        # Generate unique storage key
        file_ext = Path(file.filename).suffix.lower()
        storage_key = f"{uuid.uuid4()}{file_ext}"
        storage_path = settings.UPLOAD_DIR / storage_key

        # Save file to disk
        file_size = 0
        async with aiofiles.open(storage_path, 'wb') as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                await f.write(chunk)
                file_size += len(chunk)

        # Create document record
        document = Document(
            user_id=user_id,
            original_name=file.filename,
            storage_key=storage_key,
            mime_type=file.content_type or "application/octet-stream",
            file_size=file_size,
            file_extension=file_ext.lstrip('.'),
            status=DocumentStatus.UPLOADED,
            is_temp=user_id is None,  # Temp if guest user
            expires_at=datetime.utcnow() + timedelta(hours=24) if user_id is None else None,
        )

        self.db.add(document)
        await self.db.commit()
        await self.db.refresh(document)

        return document

    async def get_by_id(self, document_id) -> Optional[Document]:
        """Get document by ID"""
        # Convert UUID to string if needed (DB stores as string)
        if hasattr(document_id, 'hex'):
            # It's a UUID object, convert to string
            document_id = str(document_id)
        elif not isinstance(document_id, str):
            document_id = str(document_id)

        result = await self.db.execute(
            select(Document).where(Document.id == document_id)
        )
        return result.scalar_one_or_none()

    async def get_user_documents(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Document], int]:
        """Get paginated documents for user"""
        # Count total
        count_result = await self.db.execute(
            select(func.count()).where(Document.user_id == user_id)
        )
        total = count_result.scalar()

        # Get documents
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(Document)
            .where(Document.user_id == user_id)
            .where(Document.status != DocumentStatus.DELETED)
            .order_by(Document.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        documents = result.scalars().all()

        return list(documents), total

    async def get_file_path(self, document_id: UUID) -> Optional[Path]:
        """Get file path for download"""
        document = await self.get_by_id(document_id)
        if not document:
            return None

        file_path = settings.UPLOAD_DIR / document.storage_key
        if not file_path.exists():
            return None

        return file_path

    async def delete(self, document_id: UUID) -> bool:
        """Delete document and file"""
        document = await self.get_by_id(document_id)
        if not document:
            return False

        # Delete file from storage
        file_path = settings.UPLOAD_DIR / document.storage_key
        if file_path.exists():
            os.remove(file_path)

        # Mark as deleted
        document.status = DocumentStatus.DELETED
        await self.db.flush()

        return True

    async def update_page_count(self, document_id: UUID, page_count: int) -> None:
        """Update document page count"""
        document = await self.get_by_id(document_id)
        if document:
            document.page_count = page_count
            await self.db.flush()

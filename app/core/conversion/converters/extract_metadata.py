"""
Extract Metadata from PDF
Uses PyPDF2
"""
import os
import json
import logging
from typing import Dict, Any
from PyPDF2 import PdfReader
from datetime import datetime

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class ExtractMetadataConverter(BaseConverter):
    """Extract metadata from PDF"""

    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Extract PDF metadata (title, author, creator, page count, etc.)
        """
        self._validate_input(input_path, [".pdf"])

        output_path = self._get_output_path(output_dir, output_file_id, ".json")

        try:
            logger.info(f"Extracting metadata from: {input_path}")

            reader = PdfReader(input_path)
            info = reader.metadata

            file_size = os.path.getsize(input_path)

            metadata = {
                "file_size_bytes": file_size,
                "file_size_mb": round(file_size / (1024 * 1024), 2),
                "total_pages": len(reader.pages),
                "title": info.title if info else None,
                "author": info.author if info else None,
                "subject": info.subject if info else None,
                "creator": info.creator if info else None,
                "producer": info.producer if info else None,
                "creation_date": str(info.creation_date) if info and info.creation_date else None,
                "modification_date": str(info.modification_date) if info and info.modification_date else None,
                "is_encrypted": reader.is_encrypted,
            }

            # Page dimensions (from first page)
            if len(reader.pages) > 0:
                page = reader.pages[0]
                box = page.mediabox
                metadata["page_width_pts"] = float(box.width)
                metadata["page_height_pts"] = float(box.height)
                metadata["page_width_inches"] = round(float(box.width) / 72, 2)
                metadata["page_height_inches"] = round(float(box.height) / 72, 2)

            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2, default=str)

            logger.info(f"Metadata extraction complete: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Extract metadata failed: {e}", exc_info=True)
            raise RuntimeError(f"Extract metadata failed: {str(e)}")

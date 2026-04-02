"""
Rotate PDF Converter
Rotates PDF pages by specified degrees
Uses PyPDF2
"""
import os
import logging
from typing import Dict, Any
from PyPDF2 import PdfReader, PdfWriter

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class RotatePDFConverter(BaseConverter):
    """Rotate PDF pages"""

    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Rotate PDF pages

        Options:
            - angle: Rotation angle (90, 180, 270). Default: 90
            - pages: List of page numbers to rotate (1-indexed). None = all pages.
        """
        self._validate_input(input_path, [".pdf"])

        output_path = self._get_output_path(output_dir, output_file_id, ".pdf")

        try:
            angle = options.get("angle", 90)
            if angle not in (90, 180, 270):
                raise ValueError("Angle must be 90, 180, or 270")

            logger.info(f"Rotating PDF by {angle}°: {input_path}")

            reader = PdfReader(input_path)
            writer = PdfWriter()
            total_pages = len(reader.pages)
            target_pages = options.get("pages", None)

            for i, page in enumerate(reader.pages):
                if target_pages is None or (i + 1) in target_pages:
                    page.rotate(angle)
                writer.add_page(page)

            with open(output_path, "wb") as f:
                writer.write(f)

            logger.info(f"Rotate complete: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Rotate PDF failed: {e}", exc_info=True)
            raise RuntimeError(f"Rotate PDF failed: {str(e)}")

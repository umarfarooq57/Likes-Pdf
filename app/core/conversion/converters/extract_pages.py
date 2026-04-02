"""
Extract Pages from PDF
Extracts specified pages into a new PDF
Uses PyPDF2
"""
import os
import logging
from typing import Dict, Any
from PyPDF2 import PdfReader, PdfWriter

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class ExtractPagesConverter(BaseConverter):
    """Extract specific pages from PDF into a new PDF"""

    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Extract pages from PDF

        Options:
            - pages: List of page numbers to extract (1-indexed, required)
        """
        self._validate_input(input_path, [".pdf"])

        output_path = self._get_output_path(output_dir, output_file_id, ".pdf")

        try:
            pages = options.get("pages", [])
            if not pages:
                raise ValueError("'pages' option is required (list of page numbers)")

            logger.info(f"Extracting pages {pages} from: {input_path}")

            reader = PdfReader(input_path)
            writer = PdfWriter()
            total_pages = len(reader.pages)

            for page_num in pages:
                if 1 <= page_num <= total_pages:
                    writer.add_page(reader.pages[page_num - 1])
                else:
                    logger.warning(f"Skipping invalid page number: {page_num}")

            with open(output_path, "wb") as f:
                writer.write(f)

            logger.info(f"Extract pages complete: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Extract pages failed: {e}", exc_info=True)
            raise RuntimeError(f"Extract pages failed: {str(e)}")

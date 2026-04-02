"""
Extract Text from PDF
Uses PyPDF2 for basic text extraction
"""
import os
import logging
from typing import Dict, Any
from PyPDF2 import PdfReader

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class ExtractTextConverter(BaseConverter):
    """Extract text content from PDF"""

    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Extract text from PDF

        Options:
            - pages: List of page numbers (1-indexed). None = all pages.
        """
        self._validate_input(input_path, [".pdf"])

        output_path = self._get_output_path(output_dir, output_file_id, ".txt")

        try:
            logger.info(f"Extracting text from: {input_path}")

            reader = PdfReader(input_path)
            total_pages = len(reader.pages)
            target_pages = options.get("pages", None)

            extracted_text = []
            for i, page in enumerate(reader.pages):
                if target_pages is None or (i + 1) in target_pages:
                    text = page.extract_text()
                    if text:
                        extracted_text.append(f"--- Page {i + 1} ---\n{text}")

            full_text = "\n\n".join(extracted_text)

            with open(output_path, "w", encoding="utf-8") as f:
                f.write(full_text)

            logger.info(f"Text extraction complete: {len(full_text)} characters from {total_pages} pages")
            return output_path

        except Exception as e:
            logger.error(f"Extract text failed: {e}", exc_info=True)
            raise RuntimeError(f"Extract text failed: {str(e)}")

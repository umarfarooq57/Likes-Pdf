"""
Split PDF Converter
Splits a PDF into individual pages
Uses PyPDF2
"""
import os
import logging
import zipfile
from typing import Dict, Any
from PyPDF2 import PdfReader, PdfWriter

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class SplitPDFConverter(BaseConverter):
    """Split PDF into individual pages"""

    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Split PDF into separate pages

        Options:
            - pages: List of page numbers to extract (1-indexed). None = all pages.
        """
        self._validate_input(input_path, [".pdf"])

        output_path = self._get_output_path(output_dir, output_file_id, ".zip")

        try:
            logger.info(f"Splitting PDF: {input_path}")

            reader = PdfReader(input_path)
            total_pages = len(reader.pages)
            target_pages = options.get("pages", None)

            if target_pages is None:
                target_pages = list(range(1, total_pages + 1))

            # Create temp dir for split pages
            temp_dir = os.path.join(output_dir, f"{output_file_id}_split")
            os.makedirs(temp_dir, exist_ok=True)

            page_files = []
            for page_num in target_pages:
                if 1 <= page_num <= total_pages:
                    writer = PdfWriter()
                    writer.add_page(reader.pages[page_num - 1])

                    page_path = os.path.join(temp_dir, f"page_{page_num}.pdf")
                    with open(page_path, "wb") as f:
                        writer.write(f)
                    page_files.append(page_path)

            # ZIP all pages
            with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for pf in page_files:
                    zipf.write(pf, os.path.basename(pf))

            # Cleanup temp
            import shutil
            shutil.rmtree(temp_dir)

            logger.info(f"Split complete: {len(page_files)} pages -> {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Split PDF failed: {e}", exc_info=True)
            raise RuntimeError(f"Split PDF failed: {str(e)}")

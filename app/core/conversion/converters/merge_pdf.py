"""
Merge PDF Converter
Combines multiple PDFs into a single file
Uses PyPDF2
"""
import os
import logging
from typing import Dict, Any
from PyPDF2 import PdfMerger

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class MergePDFConverter(BaseConverter):
    """Merge multiple PDFs into one"""

    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Merge PDFs

        Options:
            - additional_files: List of additional PDF file paths to merge
        """
        self._validate_input(input_path, [".pdf"])

        output_path = self._get_output_path(output_dir, output_file_id, ".pdf")

        try:
            logger.info(f"Merging PDFs starting with: {input_path}")

            merger = PdfMerger()
            merger.append(input_path)

            additional = options.get("additional_files", [])
            for extra_path in additional:
                if os.path.exists(extra_path):
                    merger.append(extra_path)

            merger.write(output_path)
            merger.close()

            logger.info(f"Merge complete: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Merge PDF failed: {e}", exc_info=True)
            raise RuntimeError(f"Merge PDF failed: {str(e)}")

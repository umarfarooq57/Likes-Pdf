"""
Remove Password from PDF
Decrypts a password-protected PDF
Uses PyPDF2
"""
import os
import logging
from typing import Dict, Any
from PyPDF2 import PdfReader, PdfWriter

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class RemovePasswordConverter(BaseConverter):
    """Remove password from an encrypted PDF"""

    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Remove password from PDF

        Options:
            - password: Current password of the PDF (required)
        """
        self._validate_input(input_path, [".pdf"])

        output_path = self._get_output_path(output_dir, output_file_id, ".pdf")

        try:
            password = options.get("password")
            if not password:
                raise ValueError("'password' option is required to decrypt PDF")

            logger.info(f"Removing password from: {input_path}")

            reader = PdfReader(input_path)

            if not reader.is_encrypted:
                raise ValueError("PDF is not encrypted")

            # Decrypt
            if not reader.decrypt(password):
                raise ValueError("Incorrect password")

            writer = PdfWriter()

            for page in reader.pages:
                writer.add_page(page)

            # Copy metadata if available
            if reader.metadata:
                writer.add_metadata(reader.metadata)

            with open(output_path, "wb") as f:
                writer.write(f)

            logger.info(f"Password removed: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Remove password failed: {e}", exc_info=True)
            raise RuntimeError(f"Remove password failed: {str(e)}")

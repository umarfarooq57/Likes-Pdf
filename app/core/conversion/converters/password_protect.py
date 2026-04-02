"""
Password Protect PDF
Encrypts PDF with user/owner password
Uses PyPDF2
"""
import os
import logging
from typing import Dict, Any
from PyPDF2 import PdfReader, PdfWriter

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class PasswordProtectConverter(BaseConverter):
    """Add password protection to PDF"""

    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Password protect a PDF

        Options:
            - user_password: Password required to open PDF (required)
            - owner_password: Password for full access (optional, defaults to user_password)
        """
        self._validate_input(input_path, [".pdf"])

        output_path = self._get_output_path(output_dir, output_file_id, ".pdf")

        try:
            user_password = options.get("user_password")
            if not user_password:
                raise ValueError("'user_password' option is required")

            owner_password = options.get("owner_password", user_password)

            logger.info(f"Adding password protection to: {input_path}")

            reader = PdfReader(input_path)
            writer = PdfWriter()

            for page in reader.pages:
                writer.add_page(page)

            # Copy metadata
            if reader.metadata:
                writer.add_metadata(reader.metadata)

            # Encrypt
            writer.encrypt(
                user_password=user_password,
                owner_password=owner_password
            )

            with open(output_path, "wb") as f:
                writer.write(f)

            logger.info(f"Password protection added: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Password protect failed: {e}", exc_info=True)
            raise RuntimeError(f"Password protect failed: {str(e)}")

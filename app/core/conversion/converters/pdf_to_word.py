"""
PDF to Word Converter
Uses pdf2docx library
"""
import os
import logging
from typing import Dict, Any
from pdf2docx import Converter

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class PDFToWordConverter(BaseConverter):
    """Convert PDF to Word (DOCX)"""
    
    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Convert PDF to DOCX
        
        Options:
            - start_page: First page to convert (0-indexed, default: 0)
            - end_page: Last page to convert (default: None = all pages)
        """
        self._validate_input(input_path, [".pdf"])
        
        output_path = self._get_output_path(output_dir, output_file_id, ".docx")
        
        try:
            logger.info(f"Converting PDF to Word: {input_path}")
            
            # Get options
            start_page = options.get("start_page", 0)
            end_page = options.get("end_page", None)
            
            # Create converter
            cv = Converter(input_path)
            
            # Convert
            cv.convert(output_path, start=start_page, end=end_page)
            cv.close()
            
            logger.info(f"PDF to Word conversion complete: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"PDF to Word conversion failed: {e}", exc_info=True)
            raise RuntimeError(f"PDF to Word conversion failed: {str(e)}")

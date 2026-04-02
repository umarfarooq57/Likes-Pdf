"""
Images to PDF Converter
Uses img2pdf library
"""
import os
import logging
from typing import Dict, Any
import img2pdf
from PIL import Image

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class ImagesToPDFConverter(BaseConverter):
    """Convert images to PDF"""
    
    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Convert image(s) to PDF
        
        Options:
            - additional_images: List of additional image paths to include
        """
        self._validate_input(input_path, [".jpg", ".jpeg", ".png"])
        
        output_path = self._get_output_path(output_dir, output_file_id, ".pdf")
        
        try:
            logger.info(f"Converting images to PDF: {input_path}")
            
            # Collect all images
            image_paths = [input_path]
            if "additional_images" in options:
                image_paths.extend(options["additional_images"])
            
            # Convert images to PDF
            with open(output_path, "wb") as f:
                f.write(img2pdf.convert(image_paths))
            
            logger.info(f"Images to PDF conversion complete: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Images to PDF conversion failed: {e}", exc_info=True)
            raise RuntimeError(f"Images to PDF conversion failed: {str(e)}")

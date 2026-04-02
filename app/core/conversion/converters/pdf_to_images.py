"""
PDF to Images Converter
Uses pdf2image library (requires poppler-utils)
"""
import os
import logging
from typing import Dict, Any
from pdf2image import convert_from_path
import zipfile

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class PDFToImagesConverter(BaseConverter):
    """Convert PDF to images (PNG)"""
    
    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Convert PDF to images
        
        Options:
            - dpi: Image resolution (default: 200)
            - format: Image format (default: "png")
        """
        self._validate_input(input_path, [".pdf"])
        
        try:
            logger.info(f"Converting PDF to images: {input_path}")
            
            # Get options
            dpi = options.get("dpi", 200)
            img_format = options.get("format", "png").lower()
            
            # Convert PDF to images
            images = convert_from_path(input_path, dpi=dpi)
            
            # Create temp directory for images
            temp_dir = os.path.join(output_dir, f"{output_file_id}_images")
            os.makedirs(temp_dir, exist_ok=True)
            
            # Save images
            image_paths = []
            for i, image in enumerate(images):
                image_path = os.path.join(temp_dir, f"page_{i+1}.{img_format}")
                image.save(image_path, img_format.upper())
                image_paths.append(image_path)
            
            logger.info(f"Converted {len(images)} pages to images")
            
            # Create ZIP file
            output_path = self._get_output_path(output_dir, output_file_id, ".zip")
            with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for image_path in image_paths:
                    zipf.write(image_path, os.path.basename(image_path))
            
            # Cleanup temp directory
            import shutil
            shutil.rmtree(temp_dir)
            
            logger.info(f"PDF to images conversion complete: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"PDF to images conversion failed: {e}", exc_info=True)
            raise RuntimeError(f"PDF to images conversion failed: {str(e)}")

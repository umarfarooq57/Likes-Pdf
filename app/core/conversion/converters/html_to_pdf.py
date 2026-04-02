"""
HTML to PDF Converter
Uses wkhtmltopdf (installed via system packages)
"""
import os
import subprocess
import logging
from typing import Dict, Any

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class HTMLToPDFConverter(BaseConverter):
    """Convert HTML to PDF"""
    
    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Convert HTML to PDF using wkhtmltopdf
        
        Options:
            - page_size: Page size (default: "A4")
            - orientation: "Portrait" or "Landscape" (default: "Portrait")
        """
        self._validate_input(input_path, [".html", ".htm"])
        
        output_path = self._get_output_path(output_dir, output_file_id, ".pdf")
        
        try:
            logger.info(f"Converting HTML to PDF: {input_path}")
            
            # Get options
            page_size = options.get("page_size", "A4")
            orientation = options.get("orientation", "Portrait")
            
            # wkhtmltopdf command
            cmd = [
                "wkhtmltopdf",
                "--quiet",
                "--page-size", page_size,
                "--orientation", orientation,
                input_path,
                output_path
            ]
            
            # Run conversion
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                raise RuntimeError(f"wkhtmltopdf conversion failed: {result.stderr}")
            
            if not os.path.exists(output_path):
                raise RuntimeError("wkhtmltopdf did not create output file")
            
            logger.info(f"HTML to PDF conversion complete: {output_path}")
            return output_path
            
        except subprocess.TimeoutExpired:
            logger.error("HTML to PDF conversion timed out")
            raise RuntimeError("Conversion timed out (>60s)")
        except Exception as e:
            logger.error(f"HTML to PDF conversion failed: {e}", exc_info=True)
            raise RuntimeError(f"HTML to PDF conversion failed: {str(e)}")

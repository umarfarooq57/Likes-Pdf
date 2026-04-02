"""
Office to PDF Converter
Uses LibreOffice (installed via system packages)
"""
import os
import subprocess
import logging
from typing import Dict, Any

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class OfficeToPDFConverter(BaseConverter):
    """Convert Office documents (Word, Excel, PowerPoint) to PDF"""
    
    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Convert Office document to PDF using LibreOffice
        
        Supports: .docx, .doc, .xlsx, .xls, .pptx, .ppt
        """
        self._validate_input(input_path, [".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt"])
        
        try:
            logger.info(f"Converting Office document to PDF: {input_path}")
            
            # LibreOffice command
            # --headless: Run without GUI
            # --convert-to pdf: Convert to PDF
            # --outdir: Output directory
            cmd = [
                "libreoffice",
                "--headless",
                "--convert-to", "pdf",
                "--outdir", output_dir,
                input_path
            ]
            
            # Run conversion
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60  # 60 second timeout
            )
            
            if result.returncode != 0:
                raise RuntimeError(f"LibreOffice conversion failed: {result.stderr}")
            
            # LibreOffice creates file with same name but .pdf extension
            input_basename = os.path.splitext(os.path.basename(input_path))[0]
            temp_output = os.path.join(output_dir, f"{input_basename}.pdf")
            
            # Rename to our output file ID
            output_path = self._get_output_path(output_dir, output_file_id, ".pdf")
            if os.path.exists(temp_output):
                os.rename(temp_output, output_path)
            else:
                raise RuntimeError("LibreOffice did not create output file")
            
            logger.info(f"Office to PDF conversion complete: {output_path}")
            return output_path
            
        except subprocess.TimeoutExpired:
            logger.error("Office to PDF conversion timed out")
            raise RuntimeError("Conversion timed out (>60s)")
        except Exception as e:
            logger.error(f"Office to PDF conversion failed: {e}", exc_info=True)
            raise RuntimeError(f"Office to PDF conversion failed: {str(e)}")

"""
Main Conversion Engine
Orchestrates all conversion operations using registry pattern
"""
import os
import time
import uuid
import logging
from typing import Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)


class ConversionEngine:
    """
    Main conversion engine that orchestrates all conversions
    Uses registry pattern for extensibility
    """
    
    def __init__(self):
        self.converters = {}
        self._register_converters()
    
    def _register_converters(self):
        """Register all available converters"""
        # Import converters
        from app.core.conversion.converters.pdf_to_word import PDFToWordConverter
        from app.core.conversion.converters.pdf_to_images import PDFToImagesConverter
        from app.core.conversion.converters.pdf_to_excel import PDFToExcelConverter
        from app.core.conversion.converters.images_to_pdf import ImagesToPDFConverter
        from app.core.conversion.converters.office_to_pdf import OfficeToPDFConverter
        from app.core.conversion.converters.html_to_pdf import HTMLToPDFConverter
        from app.core.conversion.converters.merge_pdf import MergePDFConverter
        from app.core.conversion.converters.split_pdf import SplitPDFConverter
        from app.core.conversion.converters.extract_pages import ExtractPagesConverter
        from app.core.conversion.converters.rotate_pdf import RotatePDFConverter
        from app.core.conversion.converters.compress_pdf import CompressPDFConverter
        from app.core.conversion.converters.extract_text import ExtractTextConverter
        from app.core.conversion.converters.extract_metadata import ExtractMetadataConverter
        from app.core.conversion.converters.password_protect import PasswordProtectConverter
        from app.core.conversion.converters.remove_password import RemovePasswordConverter

        # Conversion features (5)
        self.converters["pdf_to_word"] = PDFToWordConverter()
        self.converters["pdf_to_images"] = PDFToImagesConverter()
        self.converters["pdf_to_excel"] = PDFToExcelConverter()
        self.converters["images_to_pdf"] = ImagesToPDFConverter()
        self.converters["office_to_pdf"] = OfficeToPDFConverter()
        self.converters["html_to_pdf"] = HTMLToPDFConverter()

        # Editing features (9)
        self.converters["merge_pdf"] = MergePDFConverter()
        self.converters["split_pdf"] = SplitPDFConverter()
        self.converters["extract_pages"] = ExtractPagesConverter()
        self.converters["rotate_pdf"] = RotatePDFConverter()
        self.converters["compress_pdf"] = CompressPDFConverter()
        self.converters["extract_text"] = ExtractTextConverter()
        self.converters["extract_metadata"] = ExtractMetadataConverter()
        self.converters["password_protect"] = PasswordProtectConverter()
        self.converters["remove_password"] = RemovePasswordConverter()

        logger.info(f"Registered {len(self.converters)} converters")
    
    async def convert(
        self,
        input_path: str,
        conversion_type: str,
        options: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Perform conversion
        
        Args:
            input_path: Path to input file
            conversion_type: Type of conversion (e.g., "pdf_to_word")
            options: Additional conversion options
        
        Returns:
            Dictionary with conversion results
        """
        start_time = time.time()
        
        try:
            # Get converter
            converter = self.converters.get(conversion_type)
            if not converter:
                raise ValueError(f"Unsupported conversion type: {conversion_type}")
            
            # Generate output file ID
            output_file_id = str(uuid.uuid4())
            
            # Prepare output directory
            output_dir = os.path.join(settings.storage_path, "outputs")
            os.makedirs(output_dir, exist_ok=True)
            
            # Perform conversion
            logger.info(f"Starting conversion: {conversion_type}")
            output_path = await converter.convert(
                input_path=input_path,
                output_dir=output_dir,
                output_file_id=output_file_id,
                options=options or {}
            )
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Get output filename
            output_filename = os.path.basename(output_path)
            
            logger.info(f"Conversion completed in {processing_time:.2f}s: {output_filename}")
            
            return {
                "status": "success",
                "output_file_id": output_file_id,
                "output_filename": output_filename,
                "download_url": f"/api/download/{output_file_id}",
                "processing_time_seconds": round(processing_time, 2)
            }
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Conversion failed after {processing_time:.2f}s: {e}", exc_info=True)
            raise

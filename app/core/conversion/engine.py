"""
Main Conversion Engine
Orchestrates all conversion operations using registry pattern
"""
import os
import time
import uuid
import logging
import mimetypes
from importlib import import_module
from typing import Dict, Any

from app.config import settings
from app.core import result_store

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
        def load_converter(module_name: str, class_name: str):
            try:
                module = import_module(module_name)
                return getattr(module, class_name)
            except Exception as exc:
                logger.warning(f"Skipping converter {class_name}: {exc}")
                return None

        PDFToWordConverter = load_converter(
            "app.core.conversion.converters.pdf_to_word", "PDFToWordConverter"
        )
        PDFToImagesConverter = load_converter(
            "app.core.conversion.converters.pdf_to_images", "PDFToImagesConverter"
        )
        PDFToExcelConverter = load_converter(
            "app.core.conversion.converters.pdf_to_excel", "PDFToExcelConverter"
        )
        ImagesToPDFConverter = load_converter(
            "app.core.conversion.converters.images_to_pdf", "ImagesToPDFConverter"
        )
        OfficeToPDFConverter = load_converter(
            "app.core.conversion.converters.office_to_pdf", "OfficeToPDFConverter"
        )
        HTMLToPDFConverter = load_converter(
            "app.core.conversion.converters.html_to_pdf", "HTMLToPDFConverter"
        )
        MergePDFConverter = load_converter(
            "app.core.conversion.converters.merge_pdf", "MergePDFConverter"
        )
        SplitPDFConverter = load_converter(
            "app.core.conversion.converters.split_pdf", "SplitPDFConverter"
        )
        ExtractPagesConverter = load_converter(
            "app.core.conversion.converters.extract_pages", "ExtractPagesConverter"
        )
        RotatePDFConverter = load_converter(
            "app.core.conversion.converters.rotate_pdf", "RotatePDFConverter"
        )
        CompressPDFConverter = load_converter(
            "app.core.conversion.converters.compress_pdf", "CompressPDFConverter"
        )
        ExtractTextConverter = load_converter(
            "app.core.conversion.converters.extract_text", "ExtractTextConverter"
        )
        ExtractMetadataConverter = load_converter(
            "app.core.conversion.converters.extract_metadata", "ExtractMetadataConverter"
        )
        PasswordProtectConverter = load_converter(
            "app.core.conversion.converters.password_protect", "PasswordProtectConverter"
        )
        RemovePasswordConverter = load_converter(
            "app.core.conversion.converters.remove_password", "RemovePasswordConverter"
        )

        # Conversion features (5)
        if PDFToWordConverter:
            self.converters["pdf_to_word"] = PDFToWordConverter()
        if PDFToImagesConverter:
            self.converters["pdf_to_images"] = PDFToImagesConverter()
        if PDFToExcelConverter:
            self.converters["pdf_to_excel"] = PDFToExcelConverter()
        if ImagesToPDFConverter:
            self.converters["images_to_pdf"] = ImagesToPDFConverter()
        if OfficeToPDFConverter:
            self.converters["office_to_pdf"] = OfficeToPDFConverter()
        if HTMLToPDFConverter:
            self.converters["html_to_pdf"] = HTMLToPDFConverter()

        # Editing features (9)
        if MergePDFConverter:
            self.converters["merge_pdf"] = MergePDFConverter()
        if SplitPDFConverter:
            self.converters["split_pdf"] = SplitPDFConverter()
        if ExtractPagesConverter:
            self.converters["extract_pages"] = ExtractPagesConverter()
        if RotatePDFConverter:
            self.converters["rotate_pdf"] = RotatePDFConverter()
        if CompressPDFConverter:
            self.converters["compress_pdf"] = CompressPDFConverter()
        if ExtractTextConverter:
            self.converters["extract_text"] = ExtractTextConverter()
        if ExtractMetadataConverter:
            self.converters["extract_metadata"] = ExtractMetadataConverter()
        if PasswordProtectConverter:
            self.converters["password_protect"] = PasswordProtectConverter()
        if RemovePasswordConverter:
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

            # Keep result in memory so downloads survive ephemeral FS cleanup windows.
            with open(output_path, "rb") as fh:
                payload = fh.read()

            content_type = mimetypes.guess_type(output_filename)[0] or "application/octet-stream"
            result_store.put(
                output_file_id,
                payload,
                output_filename,
                content_type=content_type,
                ttl_seconds=settings.file_retention_hours * 3600,
            )

            try:
                os.remove(output_path)
            except OSError:
                pass
            
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

"""
Conversion endpoints
Handles PDF conversions and editing operations
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from enum import Enum
import os
import logging

from app.config import settings
from app.core.conversion.engine import ConversionEngine

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize conversion engine
conversion_engine = ConversionEngine()


class ConversionType(str, Enum):
    """Supported conversion types"""
    # Conversions (6)
    PDF_TO_WORD = "pdf_to_word"
    PDF_TO_IMAGES = "pdf_to_images"
    PDF_TO_EXCEL = "pdf_to_excel"
    IMAGES_TO_PDF = "images_to_pdf"
    OFFICE_TO_PDF = "office_to_pdf"
    HTML_TO_PDF = "html_to_pdf"
    # Editing (9)
    MERGE_PDF = "merge_pdf"
    SPLIT_PDF = "split_pdf"
    EXTRACT_PAGES = "extract_pages"
    ROTATE_PDF = "rotate_pdf"
    COMPRESS_PDF = "compress_pdf"
    EXTRACT_TEXT = "extract_text"
    EXTRACT_METADATA = "extract_metadata"
    PASSWORD_PROTECT = "password_protect"
    REMOVE_PASSWORD = "remove_password"


class ConversionRequest(BaseModel):
    """Conversion request model"""
    file_id: str
    conversion_type: ConversionType
    options: dict = {}


class ConversionResponse(BaseModel):
    """Conversion response model"""
    status: str
    output_file_id: str
    output_filename: str
    download_url: str
    processing_time_seconds: float


@router.post("/convert", response_model=ConversionResponse)
async def convert_file(request: ConversionRequest):
    """
    Convert a file

    Args:
        request: Conversion request with file_id and conversion_type

    Returns:
        Conversion response with output file details
    """
    try:
        logger.info(f"Conversion requested: {request.conversion_type} for file {request.file_id}")

        # Find input file
        upload_dir = os.path.join(settings.storage_path, "uploads")
        matching_files = [
            f for f in os.listdir(upload_dir)
            if f.startswith(request.file_id)
        ]

        if not matching_files:
            raise HTTPException(status_code=404, detail="Input file not found")

        input_path = os.path.join(upload_dir, matching_files[0])

        # Perform conversion
        result = await conversion_engine.convert(
            input_path=input_path,
            conversion_type=request.conversion_type.value,
            options=request.options
        )

        logger.info(f"Conversion completed: {result['output_file_id']}")

        return ConversionResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Conversion error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


@router.get("/conversions/supported")
async def get_supported_conversions():
    """Get list of all 15 supported conversion and editing types"""
    return {
        "total_features": 15,
        "conversions": [
            {
                "type": "pdf_to_word",
                "name": "PDF to Word",
                "description": "Convert PDF to DOCX format",
                "input": "PDF",
                "output": "DOCX"
            },
            {
                "type": "pdf_to_images",
                "name": "PDF to Images",
                "description": "Convert PDF pages to PNG images",
                "input": "PDF",
                "output": "PNG (ZIP)"
            },
            {
                "type": "pdf_to_excel",
                "name": "PDF to Excel",
                "description": "Extract tables from PDF to Excel spreadsheet",
                "input": "PDF",
                "output": "XLSX"
            },
            {
                "type": "images_to_pdf",
                "name": "Images to PDF",
                "description": "Combine images into a single PDF",
                "input": "JPG/PNG",
                "output": "PDF"
            },
            {
                "type": "office_to_pdf",
                "name": "Office to PDF",
                "description": "Convert Word/Excel/PowerPoint to PDF",
                "input": "DOCX/XLSX/PPTX",
                "output": "PDF"
            },
            {
                "type": "html_to_pdf",
                "name": "HTML to PDF",
                "description": "Convert HTML file to PDF",
                "input": "HTML",
                "output": "PDF"
            },
            {
                "type": "merge_pdf",
                "name": "Merge PDFs",
                "description": "Combine multiple PDFs into one file",
                "input": "Multiple PDFs",
                "output": "PDF"
            },
            {
                "type": "split_pdf",
                "name": "Split PDF",
                "description": "Split PDF into individual page files",
                "input": "PDF",
                "output": "ZIP (PDFs)"
            },
            {
                "type": "extract_pages",
                "name": "Extract Pages",
                "description": "Extract specific pages into a new PDF",
                "input": "PDF",
                "output": "PDF"
            },
            {
                "type": "rotate_pdf",
                "name": "Rotate PDF",
                "description": "Rotate PDF pages by 90/180/270 degrees",
                "input": "PDF",
                "output": "PDF"
            },
            {
                "type": "compress_pdf",
                "name": "Compress PDF",
                "description": "Reduce PDF file size using Ghostscript",
                "input": "PDF",
                "output": "PDF"
            },
            {
                "type": "extract_text",
                "name": "Extract Text",
                "description": "Extract all text content from PDF",
                "input": "PDF",
                "output": "TXT"
            },
            {
                "type": "extract_metadata",
                "name": "Extract Metadata",
                "description": "Extract PDF metadata (author, title, pages, dimensions)",
                "input": "PDF",
                "output": "JSON"
            },
            {
                "type": "password_protect",
                "name": "Password Protect",
                "description": "Add password encryption to PDF",
                "input": "PDF",
                "output": "PDF (encrypted)"
            },
            {
                "type": "remove_password",
                "name": "Remove Password",
                "description": "Remove password from encrypted PDF",
                "input": "PDF (encrypted)",
                "output": "PDF"
            }
        ]
    }

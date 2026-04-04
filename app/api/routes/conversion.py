"""
Conversion endpoints
Handles PDF conversions and editing operations
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from enum import Enum
import os
import logging
import tempfile

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


class V1ConversionRequest(BaseModel):
    """Compatibility request model used by frontend /api/v1 endpoints."""
    document_id: str | None = None
    options: dict = {}
    html_content: str | None = None
    url: str | None = None


class V1CompressRequest(BaseModel):
    """Compatibility request model for optimization/compress endpoint."""
    document_id: str
    quality: str = "medium"


def _resolve_upload_path(upload_dir: str, file_id: str) -> str | None:
    """Resolve a file id to a stored upload path."""
    matching_files = [f for f in os.listdir(
        upload_dir) if f.startswith(file_id)]
    if not matching_files:
        return None
    return os.path.join(upload_dir, matching_files[0])


class ConversionResponse(BaseModel):
    """Conversion response model"""
    status: str
    output_file_id: str
    output_filename: str
    download_url: str
    processing_time_seconds: float


V1_TO_LEGACY_CONVERSION = {
    "pdf-to-text": ConversionType.EXTRACT_TEXT,
    "pdf-to-word": ConversionType.PDF_TO_WORD,
    "pdf-to-excel": ConversionType.PDF_TO_EXCEL,
    "pdf-to-images": ConversionType.PDF_TO_IMAGES,
    "word-to-pdf": ConversionType.OFFICE_TO_PDF,
    "excel-to-pdf": ConversionType.OFFICE_TO_PDF,
    "ppt-to-pdf": ConversionType.OFFICE_TO_PDF,
    "html-to-pdf": ConversionType.HTML_TO_PDF,
}


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
        logger.info(
            f"Conversion requested: {request.conversion_type} for file {request.file_id}")

        # Find input file
        upload_dir = os.path.join(settings.storage_path, "uploads")
        input_path = _resolve_upload_path(upload_dir, request.file_id)

        if not input_path:
            raise HTTPException(status_code=404, detail="Input file not found")

        options = dict(request.options or {})

        # Legacy frontend can provide additional file ids for merge.
        if request.conversion_type == ConversionType.MERGE_PDF:
            additional_ids = options.get("additional_file_ids", [])
            additional_paths = []
            for extra_file_id in additional_ids:
                extra_path = _resolve_upload_path(
                    upload_dir, str(extra_file_id))
                if extra_path:
                    additional_paths.append(extra_path)
            options["additional_files"] = additional_paths

        # Perform conversion
        result = await conversion_engine.convert(
            input_path=input_path,
            conversion_type=request.conversion_type.value,
            options=options
        )

        logger.info(f"Conversion completed: {result['output_file_id']}")

        return ConversionResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Conversion error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Conversion failed: {str(e)}")


@router.post("/convert/{tool_name}")
async def convert_v1(tool_name: str, request: V1ConversionRequest):
    """Frontend compatibility endpoint for /api/v1/convert/* routes."""
    conversion_type = V1_TO_LEGACY_CONVERSION.get(tool_name)
    if not conversion_type:
        raise HTTPException(
            status_code=404, detail="Unsupported conversion endpoint")

    # html-to-pdf in root app expects an uploaded html file; v1 frontend may send html/url directly.
    if tool_name == "html-to-pdf" and not request.document_id:
        if not request.html_content and not request.url:
            raise HTTPException(
                status_code=400, detail="Provide document_id or html_content/url")

        if request.url:
            raise HTTPException(
                status_code=400, detail="URL HTML conversion is not supported on this deployment")

        upload_dir = os.path.join(settings.storage_path, "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        temp_file_id = next(tempfile._get_candidate_names())
        temp_file_path = os.path.join(upload_dir, f"{temp_file_id}.html")
        with open(temp_file_path, "w", encoding="utf-8") as fh:
            fh.write(request.html_content or "")
        document_id = temp_file_id
    else:
        document_id = request.document_id

    if not document_id:
        raise HTTPException(status_code=400, detail="document_id is required")

    result = await convert_file(
        ConversionRequest(
            file_id=document_id,
            conversion_type=conversion_type,
            options=request.options or {},
        )
    )

    return {
        "id": result.output_file_id,
        "status": "completed",
        "progress": 100,
        "result_url": f"/api/v1/convert/{result.output_file_id}/download",
        "result_filename": result.output_filename,
    }


@router.post("/optimization/compress")
async def compress_v1(request: V1CompressRequest):
    """Compatibility endpoint for frontend calls to /api/v1/optimization/compress."""
    result = await convert_file(
        ConversionRequest(
            file_id=request.document_id,
            conversion_type=ConversionType.COMPRESS_PDF,
            options={"quality": request.quality or "medium"},
        )
    )

    return {
        "id": result.output_file_id,
        "status": "completed",
        "progress": 100,
        "result_url": f"/api/v1/convert/{result.output_file_id}/download",
        "download_url": result.download_url,
        "result_filename": result.output_filename,
    }


@router.get("/convert/{conversion_id}/status")
async def conversion_status_v1(conversion_id: str):
    """Compatibility status endpoint for legacy synchronous conversions."""
    return {
        "id": conversion_id,
        "status": "completed",
        "progress": 100,
        "current_step": "Done",
        "result_url": f"/api/v1/convert/{conversion_id}/download",
    }


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

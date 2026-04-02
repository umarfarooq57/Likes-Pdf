"""
File upload endpoint
Handles PDF and image uploads with validation
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
try:
    import magic
except Exception:
    magic = None
    # libmagic may be missing on some systems (especially Windows).
    # We'll fall back to extension-based MIME checks at runtime.
from datetime import datetime
import logging

from app.config import settings, get_max_upload_size_bytes

router = APIRouter()
logger = logging.getLogger(__name__)

# Allowed file types
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # .pptx
    "application/msword",  # .doc
    "text/html",
}

ALLOWED_EXTENSIONS = {
    ".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx", ".pptx", ".doc", ".html"
}


def validate_file(file: UploadFile) -> tuple[bool, str]:
    """
    Validate uploaded file
    Returns: (is_valid, error_message)
    """
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"

    return True, ""


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file for processing

    Returns:
        - file_id: Unique identifier for the uploaded file
        - filename: Original filename
        - size: File size in bytes
        - upload_time: Timestamp
    """
    try:
        # Validate file
        is_valid, error_msg = validate_file(file)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        # Read file content
        content = await file.read()
        file_size = len(content)

        # Check file size
        max_size = get_max_upload_size_bytes()
        if file_size > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {settings.max_upload_size_mb}MB"
            )

        # Check if file is empty
        if file_size == 0:
            raise HTTPException(status_code=400, detail="File is empty")

        # Verify MIME type using magic if available, otherwise fallback to extension
        if magic is not None:
            mime = magic.Magic(mime=True)
            detected_mime = mime.from_buffer(content)
        else:
            import mimetypes
            detected_mime, _ = mimetypes.guess_type(file.filename)
            if detected_mime is None:
                detected_mime = "application/octet-stream"

        if detected_mime not in ALLOWED_MIME_TYPES:
            logger.warning(
                f"Suspicious file upload: {file.filename}, MIME: {detected_mime}")
            # Allow it but log warning (some valid files may have different MIME)

        # Generate unique file ID
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1].lower()

        # Save file to storage
        upload_dir = os.path.join(settings.storage_path, "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, f"{file_id}{file_ext}")

        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(
            f"File uploaded: {file_id} ({file.filename}, {file_size} bytes)")

        return {
            "file_id": file_id,
            "filename": file.filename,
            "size": file_size,
            "size_mb": round(file_size / (1024 * 1024), 2),
            "mime_type": detected_mime,
            "upload_time": datetime.utcnow().isoformat(),
            "expires_in_hours": settings.file_retention_hours
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

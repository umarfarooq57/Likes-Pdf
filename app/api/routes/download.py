"""
File download endpoint
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
import io
import os
import logging

from app.config import settings
from app.core import result_store

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/download/{file_id}")
async def download_file(file_id: str):
    """
    Download a converted file
    
    Args:
        file_id: File identifier from conversion response
    """
    try:
        # Primary: in-memory result store (safe for ephemeral filesystems)
        result_entry = result_store.get(file_id)
        if result_entry:
            logger.info(f"Streaming conversion result from memory: {file_id}")
            return StreamingResponse(
                io.BytesIO(result_entry.content),
                media_type=result_entry.content_type,
                headers={
                    "Content-Disposition": f'attachment; filename="{result_entry.filename}"'
                },
            )

        # Fallback 1: Search in outputs directory
        output_dir = os.path.join(settings.storage_path, "outputs")
        if os.path.isdir(output_dir):
            matching_files = [
                f for f in os.listdir(output_dir)
                if f.startswith(file_id)
            ]

            if matching_files:
                file_path = os.path.join(output_dir, matching_files[0])
                if os.path.exists(file_path):
                    logger.info(f"File downloaded from outputs: {file_id}")
                    return FileResponse(
                        path=file_path,
                        filename=matching_files[0],
                        media_type="application/octet-stream"
                    )

        # Fallback 2: original uploaded files (for /documents/{id}/download compatibility)
        upload_dir = os.path.join(settings.storage_path, "uploads")
        if os.path.isdir(upload_dir):
            upload_matches = [
                f for f in os.listdir(upload_dir)
                if f.startswith(file_id)
            ]
            if upload_matches:
                upload_path = os.path.join(upload_dir, upload_matches[0])
                if os.path.exists(upload_path):
                    logger.info(f"Original uploaded file downloaded: {file_id}")
                    return FileResponse(
                        path=upload_path,
                        filename=upload_matches[0],
                        media_type="application/octet-stream"
                    )

        raise HTTPException(
            status_code=404,
            detail="File not found or expired"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.get("/convert/{file_id}/download")
async def download_conversion_v1(file_id: str):
    """Compatibility endpoint for /api/v1/convert/{id}/download."""
    return await download_file(file_id)


@router.get("/documents/{file_id}/download")
async def download_document_v1(file_id: str):
    """Compatibility endpoint for /api/v1/documents/{id}/download."""
    return await download_file(file_id)

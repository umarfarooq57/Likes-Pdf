"""
File download endpoint
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
import logging

from app.config import settings

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
        # Search in outputs directory
        output_dir = os.path.join(settings.storage_path, "outputs")
        
        # Find file with matching ID (any extension)
        matching_files = [
            f for f in os.listdir(output_dir)
            if f.startswith(file_id)
        ]
        
        if not matching_files:
            raise HTTPException(
                status_code=404,
                detail="File not found or expired"
            )
        
        file_path = os.path.join(output_dir, matching_files[0])
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get original filename from file (stored in metadata or use file_id)
        filename = matching_files[0]
        
        logger.info(f"File downloaded: {file_id}")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/octet-stream"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

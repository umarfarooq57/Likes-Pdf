"""
Health check endpoint
"""
from fastapi import APIRouter
from datetime import datetime
import psutil
import os

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    Returns system status and resource usage
    """
    try:
        # Get disk usage for storage path
        storage_usage = psutil.disk_usage(settings.storage_path)
        
        # Get memory usage
        memory = psutil.virtual_memory()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": settings.app_version,
            "environment": settings.env,
            "resources": {
                "storage": {
                    "total_gb": round(storage_usage.total / (1024**3), 2),
                    "used_gb": round(storage_usage.used / (1024**3), 2),
                    "free_gb": round(storage_usage.free / (1024**3), 2),
                    "percent_used": storage_usage.percent
                },
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "percent_used": memory.percent
                }
            },
            "features": {
                "async_processing": settings.enable_async_processing,
                "ocr": settings.enable_ocr,
                "batch_processing": settings.enable_batch_processing
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

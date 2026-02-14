"""
Security Tasks
Background tasks for PDF security operations
"""

import time
from pathlib import Path
from typing import Dict, Any, Optional, List

from celery import shared_task
from celery.utils.log import get_task_logger

from app.core.config import settings
from app.engines.security_engine import SecurityEngine


logger = get_task_logger(__name__)


def update_progress(task, progress: int, step: str):
    """Update task progress"""
    task.update_state(
        state='PROGRESS',
        meta={'progress': progress, 'step': step}
    )


@shared_task(bind=True, name="security.encrypt_pdf")
def encrypt_pdf_task(
    self,
    input_path: str,
    output_path: str,
    user_password: Optional[str] = None,
    owner_password: Optional[str] = None,
    permissions: Optional[Dict[str, bool]] = None,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Encrypt PDF with password protection"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Initializing encryption")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        update_progress(self, 30, "Applying encryption")
        
        result_path, metadata = SecurityEngine.encrypt_pdf(
            input_path=input_file,
            output_path=output_file,
            user_password=user_password,
            owner_password=owner_password,
            permissions=permissions
        )
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(result_path),
            "file_size": output_file.stat().st_size,
            "encryption_method": metadata.get("encryption_method"),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"PDF encryption failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="security.decrypt_pdf")
def decrypt_pdf_task(
    self,
    input_path: str,
    output_path: str,
    password: str,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Remove password protection from PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Verifying password")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        update_progress(self, 50, "Removing protection")
        
        SecurityEngine.decrypt_pdf(
            input_path=input_file,
            output_path=output_file,
            password=password
        )
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "processing_time_ms": processing_time,
        }
        
    except ValueError as e:
        return {
            "status": "failed",
            "error": "Invalid password",
        }
    except Exception as e:
        logger.error(f"PDF decryption failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="security.add_watermark")
def add_watermark_task(
    self,
    input_path: str,
    output_path: str,
    watermark_type: str,  # "text" or "image"
    watermark_config: Dict[str, Any],
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Add watermark to PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        update_progress(self, 30, "Applying watermark")
        
        if watermark_type == "text":
            SecurityEngine.add_text_watermark(
                input_path=input_file,
                output_path=output_file,
                text=watermark_config.get("text", "WATERMARK"),
                font_size=watermark_config.get("font_size", 48),
                font_color=watermark_config.get("font_color", (0.5, 0.5, 0.5)),
                opacity=watermark_config.get("opacity", 0.3),
                rotation=watermark_config.get("rotation", 45),
                position=watermark_config.get("position", "center"),
                pages=watermark_config.get("pages"),
            )
        else:
            watermark_image = Path(watermark_config.get("image_path"))
            SecurityEngine.add_image_watermark(
                input_path=input_file,
                output_path=output_file,
                image_path=watermark_image,
                opacity=watermark_config.get("opacity", 0.3),
                scale=watermark_config.get("scale", 1.0),
                position=watermark_config.get("position", "center"),
                pages=watermark_config.get("pages"),
            )
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "watermark_type": watermark_type,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Watermark addition failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="security.add_page_numbers")
def add_page_numbers_task(
    self,
    input_path: str,
    output_path: str,
    position: str = "bottom-center",
    format_string: str = "Page {page} of {total}",
    font_size: int = 10,
    start_page: int = 1,
    skip_first: bool = False,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Add page numbers to PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        update_progress(self, 50, "Adding page numbers")
        
        SecurityEngine.add_page_numbers(
            input_path=input_file,
            output_path=output_file,
            position=position,
            format_string=format_string,
            font_size=font_size,
            start_page=start_page,
            skip_first=skip_first
        )
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Page number addition failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="security.generate_thumbnails")
def generate_thumbnails_task(
    self,
    input_path: str,
    output_dir: str,
    dpi: int = 72,
    max_dimension: int = 200,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Generate page thumbnails for a PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        output_directory = Path(output_dir)
        output_directory.mkdir(parents=True, exist_ok=True)
        
        update_progress(self, 30, "Generating thumbnails")
        
        thumbnails = SecurityEngine.get_page_thumbnails(
            input_path=input_file,
            output_dir=output_directory,
            dpi=dpi,
            max_dimension=max_dimension
        )
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "thumbnails": [str(t) for t in thumbnails],
            "page_count": len(thumbnails),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Thumbnail generation failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }

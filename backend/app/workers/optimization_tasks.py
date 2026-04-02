"""
Optimization Tasks
Celery tasks for PDF optimization operations
"""

import time
from pathlib import Path
from typing import Dict, Any, Optional

from celery import shared_task
from celery.utils.log import get_task_logger

from app.engines.pdf_engine import PDFEngine, PYMUPDF_AVAILABLE

# Conditional fitz import
if PYMUPDF_AVAILABLE:
    import fitz

logger = get_task_logger(__name__)


def update_progress(task, progress: int, step: str):
    """Update task progress"""
    task.update_state(
        state='PROGRESS',
        meta={'progress': progress, 'step': step}
    )


@shared_task(bind=True, name="optimize.compress_pdf")
def compress_pdf_task(
    self,
    input_path: str,
    output_path: str,
    quality: str = "medium",
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Compress PDF file"""
    if not PYMUPDF_AVAILABLE:
        return {"status": "failed", "error": "PyMuPDF not installed"}

    start_time = time.time()

    try:
        update_progress(self, 10, "Analyzing document")

        input_file = Path(input_path)
        output_file = Path(output_path)
        original_size = input_file.stat().st_size

        update_progress(self, 40, "Compressing")

        PDFEngine.compress_pdf(input_file, output_file, quality=quality)

        update_progress(self, 90, "Finalizing")

        compressed_size = output_file.stat().st_size
        reduction = ((original_size - compressed_size) / original_size) * 100
        processing_time = int((time.time() - start_time) * 1000)

        return {
            "status": "completed",
            "output_file": str(output_file),
            "original_size": original_size,
            "compressed_size": compressed_size,
            "reduction_percent": round(reduction, 2),
            "processing_time_ms": processing_time,
        }

    except Exception as e:
        logger.error(f"Compress PDF failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="optimize.linearize_pdf")
def linearize_pdf_task(
    self,
    input_path: str,
    output_path: str,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Linearize PDF for web optimization (fast web view)"""
    if not PYMUPDF_AVAILABLE:
        return {"status": "failed", "error": "PyMuPDF not installed"}

    start_time = time.time()

    try:
        update_progress(self, 10, "Loading document")

        input_file = Path(input_path)
        output_file = Path(output_path)
        original_size = input_file.stat().st_size

        update_progress(self, 50, "Linearizing for web")

        doc = fitz.open(str(input_file))
        doc.save(
            str(output_file),
            linear=True,
            garbage=3,
            deflate=True,
        )
        doc.close()

        update_progress(self, 90, "Finalizing")

        final_size = output_file.stat().st_size
        processing_time = int((time.time() - start_time) * 1000)

        return {
            "status": "completed",
            "output_file": str(output_file),
            "original_size": original_size,
            "final_size": final_size,
            "processing_time_ms": processing_time,
        }

    except Exception as e:
        logger.error(f"Linearize PDF failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="optimize.repair_pdf")
def repair_pdf_task(
    self,
    input_path: str,
    output_path: str,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Repair task removed - feature disabled"""
    return {"status": "failed", "error": "Repair feature disabled"}

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
    """Attempt to repair a corrupt PDF"""
    if not PYMUPDF_AVAILABLE:
        return {"status": "failed", "error": "PyMuPDF not installed"}
    
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Analyzing document")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        
        update_progress(self, 30, "Attempting repair")
        
        doc = fitz.open(str(input_file))
        issues_found = []
        pages_recovered = 0
        
        for i, page in enumerate(doc):
            try:
                _ = page.get_text()
                pages_recovered += 1
            except Exception as e:
                issues_found.append(f"Page {i+1}: {str(e)}")
        
        update_progress(self, 70, "Rebuilding document")
        
        doc.save(
            str(output_file),
            garbage=4,
            deflate=True,
            clean=True,
        )
        doc.close()
        
        update_progress(self, 90, "Finalizing")
        
        page_count = PDFEngine.get_page_count(output_file)
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "page_count": page_count,
            "pages_recovered": pages_recovered,
            "issues_found": issues_found,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Repair PDF failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }

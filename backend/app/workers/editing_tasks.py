"""
Editing Tasks
Celery tasks for PDF editing operations
"""

import time
from pathlib import Path
from typing import Dict, Any, List, Optional

from celery import shared_task
from celery.utils.log import get_task_logger

from app.engines.pdf_engine import PDFEngine, PYMUPDF_AVAILABLE


logger = get_task_logger(__name__)


def update_progress(task, progress: int, step: str):
    """Update task progress"""
    task.update_state(
        state='PROGRESS',
        meta={'progress': progress, 'step': step}
    )


@shared_task(bind=True, name="edit.merge_pdfs")
def merge_pdfs_task(
    self,
    input_paths: List[str],
    output_path: str,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Merge multiple PDFs into one"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading documents")
        
        input_files = [Path(p) for p in input_paths]
        output_file = Path(output_path)
        
        update_progress(self, 50, "Merging documents")
        
        PDFEngine.merge_pdfs(input_files, output_file)
        
        update_progress(self, 90, "Finalizing")
        
        page_count = PDFEngine.get_page_count(output_file)
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "page_count": page_count,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Merge PDFs failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="edit.split_pdf")
def split_pdf_task(
    self,
    input_path: str,
    output_dir: str,
    pages: Optional[List[int]] = None,
    ranges: Optional[List[tuple]] = None,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Split PDF into multiple files"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        output_directory = Path(output_dir)
        output_directory.mkdir(parents=True, exist_ok=True)
        
        update_progress(self, 50, "Splitting document")
        
        output_files = PDFEngine.split_pdf(
            input_file,
            output_directory,
            pages=pages,
            ranges=ranges
        )
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_files": [str(f) for f in output_files],
            "file_count": len(output_files),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Split PDF failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="edit.rotate_pages")
def rotate_pages_task(
    self,
    input_path: str,
    output_path: str,
    rotations: Dict[int, int],
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Rotate specific pages"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        
        update_progress(self, 50, "Rotating pages")
        
        # Convert string keys to int (JSON serialization issue)
        rotations_int = {int(k): v for k, v in rotations.items()}
        
        PDFEngine.rotate_pages(input_file, output_file, rotations_int)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Rotate pages failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="edit.reorder_pages")
def reorder_pages_task(
    self,
    input_path: str,
    output_path: str,
    new_order: List[int],
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Reorder pages in PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        
        update_progress(self, 50, "Reordering pages")
        
        PDFEngine.reorder_pages(input_file, output_file, new_order)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Reorder pages failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="edit.delete_pages")
def delete_pages_task(
    self,
    input_path: str,
    output_path: str,
    pages: List[int],
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Delete pages from PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        
        update_progress(self, 50, "Deleting pages")
        
        PDFEngine.delete_pages(input_file, output_file, pages)
        
        update_progress(self, 90, "Finalizing")
        
        page_count = PDFEngine.get_page_count(output_file)
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "page_count": page_count,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Delete pages failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="edit.extract_pages")
def extract_pages_task(
    self,
    input_path: str,
    output_path: str,
    pages: List[int],
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Extract specific pages from PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        
        update_progress(self, 50, "Extracting pages")
        
        PDFEngine.extract_pages(input_file, output_file, pages)
        
        update_progress(self, 90, "Finalizing")
        
        page_count = PDFEngine.get_page_count(output_file)
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "page_count": page_count,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Extract pages failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }

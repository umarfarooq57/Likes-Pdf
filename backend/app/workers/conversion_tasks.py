"""
Conversion Tasks
Celery tasks for document format conversions
"""

import time
import uuid
from pathlib import Path
from typing import Dict, Any, Optional

from celery import shared_task
from celery.utils.log import get_task_logger

from app.core.config import settings
from app.engines.pdf_engine import PDFEngine, PYMUPDF_AVAILABLE
from app.engines.converter import DocumentConverter


logger = get_task_logger(__name__)


def update_progress(task, progress: int, step: str):
    """Update task progress for real-time tracking"""
    task.update_state(
        state='PROGRESS',
        meta={'progress': progress, 'step': step}
    )


@shared_task(bind=True, name="convert.pdf_to_images")
def pdf_to_images_task(
    self,
    input_path: str,
    output_dir: str,
    format: str = "png",
    dpi: int = 150,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Convert PDF to images"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Initializing conversion")
        
        input_file = Path(input_path)
        output_directory = Path(output_dir)
        output_directory.mkdir(parents=True, exist_ok=True)
        
        update_progress(self, 30, "Converting pages to images")
        
        output_files = PDFEngine.pdf_to_images(
            input_file,
            output_directory,
            format=format,
            dpi=dpi
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
        logger.error(f"PDF to images conversion failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="convert.images_to_pdf")
def images_to_pdf_task(
    self,
    image_paths: list,
    output_path: str,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Convert images to PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading images")
        
        input_files = [Path(p) for p in image_paths]
        output_file = Path(output_path)
        
        update_progress(self, 50, "Creating PDF")
        
        PDFEngine.images_to_pdf(input_files, output_file)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Images to PDF conversion failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="convert.html_to_pdf")
def html_to_pdf_task(
    self,
    html_content: Optional[str] = None,
    url: Optional[str] = None,
    output_path: str = None,
    options: Dict[str, Any] = None,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Convert HTML to PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Processing HTML")
        
        output_file = Path(output_path)
        
        update_progress(self, 50, "Generating PDF")
        
        DocumentConverter.html_to_pdf(
            html_content=html_content,
            url=url,
            output_path=output_file,
            css=options.get("css") if options else None
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
        logger.error(f"HTML to PDF conversion failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="convert.markdown_to_pdf")
def markdown_to_pdf_task(
    self,
    markdown_content: str,
    output_path: str,
    options: Dict[str, Any] = None,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Convert Markdown to PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Processing Markdown")
        
        output_file = Path(output_path)
        
        update_progress(self, 50, "Generating PDF")
        
        DocumentConverter.markdown_to_pdf(
            markdown_content=markdown_content,
            output_path=output_file,
            css=options.get("css") if options else None
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
        logger.error(f"Markdown to PDF conversion failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="convert.pdf_to_word")
def pdf_to_word_task(
    self,
    input_path: str,
    output_path: str,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Convert PDF to Word (DOCX)"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading PDF")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        
        update_progress(self, 30, "Extracting content")
        update_progress(self, 60, "Creating Word document")
        
        DocumentConverter.pdf_to_docx(input_file, output_file)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"PDF to Word conversion failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="convert.word_to_pdf")
def word_to_pdf_task(
    self,
    input_path: str,
    output_path: str,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Convert Word (DOCX) to PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        
        update_progress(self, 50, "Generating PDF")
        
        DocumentConverter.docx_to_pdf(input_file, output_file)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Word to PDF conversion failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="convert.excel_to_pdf")
def excel_to_pdf_task(
    self,
    input_path: str,
    output_path: str,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Convert Excel to PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading spreadsheet")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        
        update_progress(self, 50, "Generating PDF")
        
        DocumentConverter.excel_to_pdf(input_file, output_file)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Excel to PDF conversion failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="convert.ppt_to_pdf")
def ppt_to_pdf_task(
    self,
    input_path: str,
    output_path: str,
    conversion_id: Optional[str] = None
) -> Dict[str, Any]:
    """Convert PowerPoint to PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading presentation")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        
        update_progress(self, 50, "Generating PDF")
        
        DocumentConverter.ppt_to_pdf(input_file, output_file)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"PowerPoint to PDF conversion failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }

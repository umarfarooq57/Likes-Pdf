"""
Conversion Tasks
Celery tasks for document format conversions
"""

import time
import uuid
from pathlib import Path
from typing import Dict, Any, Optional
import shutil

from celery import shared_task
from celery.utils.log import get_task_logger

from app.core.config import settings
from app.engines.pdf_engine import PDFEngine, PYMUPDF_AVAILABLE
from app.engines.converter import DocumentConverter
from app.engines.converter_engine import ConverterEngine


logger = get_task_logger(__name__)


def update_progress(task, progress: int, step: str):
    """Update task progress for real-time tracking"""
    task.update_state(
        state='PROGRESS',
        meta={'progress': progress, 'step': step}
    )


@shared_task(bind=True, name="convert.run_conversion")
def run_conversion_task(
    self,
    conversion_type: str,
    output_path: str,
    input_path: Optional[str] = None,
    input_paths: Optional[list[str]] = None,
    options: Optional[Dict[str, Any]] = None,
    html_content: Optional[str] = None,
    url: Optional[str] = None,
    markdown_content: Optional[str] = None,
    conversion_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Generic conversion task backed by ConverterEngine."""
    start_time = time.time()
    opts = options or {}

    try:
        update_progress(self, 15, "Starting conversion")

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        if conversion_type == "pdf_to_images":
            if not input_path:
                raise ValueError("input_path is required for pdf_to_images")

            output_dir = output_file.parent / f"{output_file.stem}_images"
            output_dir.mkdir(parents=True, exist_ok=True)
            image_format = str(
                opts.get("format", output_file.suffix.lstrip('.') or "png")).lower()
            dpi = int(opts.get("dpi", 150))

            update_progress(self, 60, "Rendering PDF pages")
            images = ConverterEngine.pdf_to_images(
                pdf_path=Path(input_path),
                output_dir=output_dir,
                format=image_format,
                dpi=dpi,
            )

            if not images:
                raise RuntimeError("No images generated")

            if len(images) == 1:
                final_path = output_file.with_suffix(f".{image_format}")
                shutil.copy(images[0], final_path)
            else:
                final_path = output_file.with_suffix(".zip")
                ConverterEngine.zip_files(images, final_path)

            shutil.rmtree(output_dir, ignore_errors=True)

        elif conversion_type == "images_to_pdf":
            if not input_paths:
                raise ValueError("input_paths is required for images_to_pdf")

            update_progress(self, 60, "Composing PDF")
            ConverterEngine.images_to_pdf(
                image_paths=[Path(p) for p in input_paths],
                output_path=output_file,
            )
            final_path = output_file

        elif conversion_type == "html_to_pdf":
            update_progress(self, 60, "Generating PDF from HTML")
            ConverterEngine.html_to_pdf(
                html_content=html_content,
                url=url,
                output_path=output_file,
                options=opts,
            )
            final_path = output_file

        elif conversion_type == "markdown_to_pdf":
            if not markdown_content:
                raise ValueError(
                    "markdown_content is required for markdown_to_pdf")

            update_progress(self, 60, "Generating PDF from Markdown")
            ConverterEngine.markdown_to_pdf(
                markdown_content=markdown_content,
                output_path=output_file,
                options=opts,
            )
            final_path = output_file

        else:
            if not input_path:
                raise ValueError("input_path is required")

            method_map = {
                "pdf_to_word": lambda: ConverterEngine.pdf_to_word(Path(input_path), output_file),
                "word_to_pdf": lambda: ConverterEngine.word_to_pdf(Path(input_path), output_file),
                "excel_to_pdf": lambda: ConverterEngine.excel_to_pdf(Path(input_path), output_file),
                "ppt_to_pdf": lambda: ConverterEngine.ppt_to_pdf(Path(input_path), output_file),
                "pdf_to_excel": lambda: ConverterEngine.pdf_to_excel(Path(input_path), output_file),
                "pdf_to_ppt": lambda: ConverterEngine.pdf_to_ppt(Path(input_path), output_file),
                "pdf_to_text": lambda: ConverterEngine.pdf_to_text(Path(input_path), output_file),
                "pdf_to_html": lambda: ConverterEngine.pdf_to_html(Path(input_path), output_file),
                "pdf_to_csv": lambda: ConverterEngine.pdf_to_csv(Path(input_path), output_file),
                "pdf_to_xml": lambda: ConverterEngine.pdf_to_xml(Path(input_path), output_file),
                "pdf_to_json": lambda: ConverterEngine.pdf_to_json(Path(input_path), output_file),
                "csv_to_pdf": lambda: ConverterEngine.csv_to_pdf(Path(input_path), output_file),
                "json_to_pdf": lambda: ConverterEngine.json_to_pdf(Path(input_path), output_file),
            }

            if conversion_type not in method_map:
                raise ValueError(
                    f"Unsupported conversion type: {conversion_type}")

            update_progress(self, 60, "Converting document")
            method_map[conversion_type]()
            final_path = output_file

        update_progress(self, 95, "Finalizing")

        processing_time = int((time.time() - start_time) * 1000)
        return {
            "status": "completed",
            "output_file": str(final_path),
            "processing_time_ms": processing_time,
            "file_size": final_path.stat().st_size if final_path.exists() else None,
        }
    except Exception as e:
        logger.error(
            f"Generic conversion failed ({conversion_type}): {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


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

"""
Scanner Tasks
Background tasks for document scanning and image processing
"""

import time
from pathlib import Path
from typing import Dict, Any, Optional, List

from celery import shared_task
from celery.utils.log import get_task_logger

from app.core.config import settings
from app.engines.scanner_engine import ScannerEngine


logger = get_task_logger(__name__)


def update_progress(task, progress: int, step: str):
    """Update task progress"""
    task.update_state(
        state='PROGRESS',
        meta={'progress': progress, 'step': step}
    )


@shared_task(bind=True, name="scanner.process_image")
def process_scan_image_task(
    self,
    input_path: str,
    output_path: str,
    options: Dict[str, Any],
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Process a scanned image with enhancement pipeline"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading image")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        update_progress(self, 30, "Applying enhancements")
        
        result_path, metadata = ScannerEngine.process_scan(
            image_path=input_file,
            output_path=output_file,
            options=options
        )
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(result_path),
            "file_size": output_file.stat().st_size,
            "operations_applied": metadata.get("operations", []),
            "corners_detected": metadata.get("corners_detected"),
            "deskew_angle": metadata.get("deskew_angle"),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Scan processing failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="scanner.detect_edges")
def detect_edges_task(
    self,
    input_path: str,
    debug_output_path: Optional[str] = None,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Detect document edges in an image"""
    start_time = time.time()
    
    try:
        update_progress(self, 20, "Analyzing image")
        
        input_file = Path(input_path)
        debug_path = Path(debug_output_path) if debug_output_path else None
        
        update_progress(self, 50, "Detecting edges")
        
        corners = ScannerEngine.detect_document_edges(
            image_path=input_file,
            debug_output=debug_path
        )
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "corners_detected": corners is not None,
            "corners": corners,
            "debug_image": str(debug_path) if debug_path and debug_path.exists() else None,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Edge detection failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="scanner.perspective_correct")
def perspective_correct_task(
    self,
    input_path: str,
    output_path: str,
    corners: Optional[List[List[int]]] = None,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Apply perspective correction to straighten document"""
    start_time = time.time()
    
    try:
        update_progress(self, 20, "Loading image")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        update_progress(self, 50, "Applying correction")
        
        ScannerEngine.perspective_correction(
            image_path=input_file,
            output_path=output_file,
            corners=corners
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
        logger.error(f"Perspective correction failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="scanner.combine_to_pdf")
def combine_scans_to_pdf_task(
    self,
    image_paths: List[str],
    output_path: str,
    page_size: str = "a4",
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Combine multiple scanned images into a PDF"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading images")
        
        input_files = [Path(p) for p in image_paths]
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Verify all files exist
        for f in input_files:
            if not f.exists():
                raise FileNotFoundError(f"Image not found: {f}")
        
        update_progress(self, 30, "Creating PDF")
        
        ScannerEngine.combine_images_to_pdf(
            image_paths=input_files,
            output_path=output_file,
            page_size=page_size
        )
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "page_count": len(input_files),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"PDF creation failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="scanner.batch_process")
def batch_process_scans_task(
    self,
    input_paths: List[str],
    output_dir: str,
    options: Dict[str, Any],
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Process multiple scanned images in batch"""
    start_time = time.time()
    results = []
    
    try:
        output_directory = Path(output_dir)
        output_directory.mkdir(parents=True, exist_ok=True)
        
        total = len(input_paths)
        
        for i, input_path in enumerate(input_paths):
            progress = int(10 + (80 * i / total))
            update_progress(self, progress, f"Processing image {i + 1} of {total}")
            
            input_file = Path(input_path)
            output_file = output_directory / f"processed_{i + 1}.png"
            
            try:
                result_path, metadata = ScannerEngine.process_scan(
                    image_path=input_file,
                    output_path=output_file,
                    options=options
                )
                results.append({
                    "input": str(input_file),
                    "output": str(result_path),
                    "success": True,
                    "operations": metadata.get("operations", []),
                })
            except Exception as e:
                results.append({
                    "input": str(input_file),
                    "success": False,
                    "error": str(e),
                })
        
        update_progress(self, 95, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        successful = sum(1 for r in results if r.get("success"))
        
        return {
            "status": "completed",
            "total_images": total,
            "successful": successful,
            "failed": total - successful,
            "results": results,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Batch processing failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
            "results": results,
        }


@shared_task(bind=True, name="scanner.enhance_image")
def enhance_image_task(
    self,
    input_path: str,
    output_path: str,
    enhancements: Dict[str, Any],
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Apply specific enhancements to an image"""
    start_time = time.time()
    applied = []
    
    try:
        update_progress(self, 10, "Loading image")
        
        input_file = Path(input_path)
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        current_file = input_file
        temp_files = []
        
        # Apply enhancements in order
        if enhancements.get("deskew"):
            update_progress(self, 25, "Deskewing")
            temp_path = output_file.parent / f"temp_deskew_{output_file.stem}.png"
            temp_files.append(temp_path)
            current_file, angle = ScannerEngine.deskew(current_file, temp_path)
            applied.append(f"deskew_{angle:.1f}deg")
        
        if enhancements.get("denoise"):
            update_progress(self, 40, "Removing noise")
            temp_path = output_file.parent / f"temp_denoise_{output_file.stem}.png"
            temp_files.append(temp_path)
            current_file = ScannerEngine.remove_noise(
                current_file, temp_path,
                strength=enhancements.get("denoise_strength", 10)
            )
            applied.append("denoise")
        
        if enhancements.get("contrast"):
            update_progress(self, 55, "Enhancing contrast")
            temp_path = output_file.parent / f"temp_contrast_{output_file.stem}.png"
            temp_files.append(temp_path)
            current_file = ScannerEngine.enhance_contrast(
                current_file, temp_path,
                clip_limit=enhancements.get("contrast_limit", 2.0)
            )
            applied.append("contrast")
        
        if enhancements.get("grayscale"):
            update_progress(self, 70, "Converting to grayscale")
            temp_path = output_file.parent / f"temp_gray_{output_file.stem}.png"
            temp_files.append(temp_path)
            current_file = ScannerEngine.convert_to_grayscale(current_file, temp_path)
            applied.append("grayscale")
        
        if enhancements.get("bw"):
            update_progress(self, 85, "Converting to B&W")
            temp_path = output_file.parent / f"temp_bw_{output_file.stem}.png"
            temp_files.append(temp_path)
            current_file = ScannerEngine.convert_to_black_white(
                current_file, temp_path,
                adaptive=enhancements.get("bw_adaptive", True)
            )
            applied.append("black_white")
        
        # Copy final result
        import shutil
        shutil.copy(str(current_file), str(output_file))
        
        # Cleanup temp files
        for temp in temp_files:
            if temp.exists() and temp != output_file:
                temp.unlink()
        
        update_progress(self, 95, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "output_file": str(output_file),
            "file_size": output_file.stat().st_size,
            "enhancements_applied": applied,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Image enhancement failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }

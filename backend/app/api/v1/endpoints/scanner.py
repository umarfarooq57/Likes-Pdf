"""
Scanner Endpoints
Document scanning, image processing, and multi-page scan sessions
"""

import uuid
import shutil
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user_id_optional
from app.core.config import settings
from app.services.document_service import DocumentService
from app.engines.scanner_engine import ScannerEngine


router = APIRouter()


# ============== Request/Response Schemas ==============

class ScanSessionCreate(BaseModel):
    """Create a new scan session"""
    name: Optional[str] = None
    scan_mode: str = "color"  # color, grayscale, black_white
    dpi: int = 300
    output_format: str = "pdf"  # pdf, png, jpg
    auto_crop: bool = True
    auto_enhance: bool = True
    auto_deskew: bool = True
    noise_removal: bool = False
    edge_detection: bool = True
    ocr_enabled: bool = False
    ocr_language: str = "eng"


class ScanSessionResponse(BaseModel):
    """Scan session details"""
    id: str
    name: Optional[str]
    status: str
    scan_mode: str
    dpi: int
    output_format: str
    total_pages: int
    created_at: str
    pages: List[dict] = []


class ProcessImageRequest(BaseModel):
    """Request to process a scanned image"""
    auto_crop: bool = True
    auto_enhance: bool = True
    auto_deskew: bool = True
    noise_removal: bool = False
    scan_mode: str = "color"
    dpi: int = 300
    custom_corners: Optional[List[List[int]]] = None


class CombineScansRequest(BaseModel):
    """Request to combine scans into PDF"""
    session_id: str
    page_order: Optional[List[int]] = None  # Reorder pages
    output_name: Optional[str] = None


class EdgeDetectionResponse(BaseModel):
    """Edge detection result"""
    corners_detected: bool
    corners: Optional[List[List[int]]] = None
    preview_url: Optional[str] = None


# ============== Session Management ==============

# In-memory session storage (use Redis in production)
scan_sessions = {}


@router.post("/session", response_model=ScanSessionResponse)
async def create_scan_session(
    session_data: ScanSessionCreate,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new multi-page scan session.
    
    Configure scanning options that will apply to all pages in the session.
    """
    session_id = str(uuid.uuid4())
    
    session = {
        "id": session_id,
        "user_id": user_id,
        "name": session_data.name or f"Scan_{session_id[:8]}",
        "status": "active",
        "scan_mode": session_data.scan_mode,
        "dpi": session_data.dpi,
        "output_format": session_data.output_format,
        "auto_crop": session_data.auto_crop,
        "auto_enhance": session_data.auto_enhance,
        "auto_deskew": session_data.auto_deskew,
        "noise_removal": session_data.noise_removal,
        "edge_detection": session_data.edge_detection,
        "ocr_enabled": session_data.ocr_enabled,
        "ocr_language": session_data.ocr_language,
        "total_pages": 0,
        "pages": [],
        "created_at": str(uuid.uuid1().time),
    }
    
    # Create session directory
    session_dir = settings.TEMP_DIR / "scans" / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    session["directory"] = str(session_dir)
    
    scan_sessions[session_id] = session
    
    return ScanSessionResponse(**session)


@router.get("/session/{session_id}", response_model=ScanSessionResponse)
async def get_scan_session(
    session_id: str,
    user_id: Optional[str] = Depends(get_current_user_id_optional)
):
    """Get scan session details and pages"""
    if session_id not in scan_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = scan_sessions[session_id]
    
    # Check ownership
    if session.get("user_id") and session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return ScanSessionResponse(**session)


@router.delete("/session/{session_id}")
async def delete_scan_session(
    session_id: str,
    user_id: Optional[str] = Depends(get_current_user_id_optional)
):
    """Delete a scan session and all its pages"""
    if session_id not in scan_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = scan_sessions[session_id]
    
    # Cleanup files
    session_dir = Path(session.get("directory", ""))
    if session_dir.exists():
        shutil.rmtree(session_dir)
    
    del scan_sessions[session_id]
    
    return {"message": "Session deleted successfully"}


# ============== Page Upload & Processing ==============

@router.post("/session/{session_id}/upload")
async def upload_scan_page(
    session_id: str,
    file: UploadFile = File(...),
    auto_process: bool = Form(True),
    user_id: Optional[str] = Depends(get_current_user_id_optional)
):
    """
    Upload a scanned image to a session.
    
    The image will be automatically processed according to session settings
    if auto_process is True.
    """
    if session_id not in scan_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = scan_sessions[session_id]
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/tiff", "image/bmp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Upload an image.")
    
    # Save uploaded file
    session_dir = Path(session["directory"])
    page_num = session["total_pages"] + 1
    
    original_ext = Path(file.filename).suffix or ".png"
    original_path = session_dir / f"page_{page_num}_original{original_ext}"
    
    content = await file.read()
    with open(original_path, "wb") as f:
        f.write(content)
    
    page_info = {
        "page_number": page_num,
        "original_path": str(original_path),
        "processed_path": None,
        "status": "uploaded",
        "corners_detected": None,
        "processing_applied": [],
    }
    
    # Auto-process if enabled
    if auto_process:
        try:
            processed_path = session_dir / f"page_{page_num}_processed.png"
            
            options = {
                "edge_detection": session["edge_detection"],
                "auto_crop": session["auto_crop"],
                "auto_deskew": session["auto_deskew"],
                "auto_enhance": session["auto_enhance"],
                "noise_removal": session["noise_removal"],
                "scan_mode": session["scan_mode"],
                "dpi": session["dpi"],
            }
            
            result_path, metadata = ScannerEngine.process_scan(
                original_path, processed_path, options
            )
            
            page_info["processed_path"] = str(result_path)
            page_info["status"] = "processed"
            page_info["corners_detected"] = metadata.get("corners_detected")
            page_info["processing_applied"] = metadata.get("operations", [])
            
        except Exception as e:
            page_info["status"] = "error"
            page_info["error"] = str(e)
    
    session["pages"].append(page_info)
    session["total_pages"] = page_num
    
    return {
        "page_number": page_num,
        "status": page_info["status"],
        "preview_url": f"/api/v1/scanner/session/{session_id}/page/{page_num}/preview",
        "processing_applied": page_info.get("processing_applied", []),
    }


@router.post("/detect-edges")
async def detect_document_edges(
    file: UploadFile = File(...)
):
    """
    Detect document edges in an uploaded image.
    
    Returns the detected corner coordinates for manual adjustment.
    """
    # Save temp file
    temp_path = settings.TEMP_DIR / f"edge_detect_{uuid.uuid4()}{Path(file.filename).suffix}"
    temp_path.parent.mkdir(parents=True, exist_ok=True)
    
    content = await file.read()
    with open(temp_path, "wb") as f:
        f.write(content)
    
    try:
        corners = ScannerEngine.detect_document_edges(temp_path)
        
        return EdgeDetectionResponse(
            corners_detected=corners is not None,
            corners=corners,
            preview_url=None  # Could generate debug image
        )
        
    finally:
        if temp_path.exists():
            temp_path.unlink()


@router.post("/process-image")
async def process_single_image(
    file: UploadFile = File(...),
    options: str = Form("{}"),  # JSON string of ProcessImageRequest
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Process a single image with scan enhancement.
    
    Returns the processed image as a downloadable document.
    """
    import json
    
    try:
        process_options = json.loads(options)
    except json.JSONDecodeError:
        process_options = {}
    
    # Save uploaded file
    temp_id = str(uuid.uuid4())
    temp_input = settings.TEMP_DIR / f"process_{temp_id}_input{Path(file.filename).suffix}"
    temp_output = settings.PROCESSED_DIR / f"processed_{temp_id}.png"
    
    temp_input.parent.mkdir(parents=True, exist_ok=True)
    temp_output.parent.mkdir(parents=True, exist_ok=True)
    
    content = await file.read()
    with open(temp_input, "wb") as f:
        f.write(content)
    
    try:
        # Process image
        scan_options = {
            "edge_detection": True,
            "auto_crop": process_options.get("auto_crop", True),
            "auto_deskew": process_options.get("auto_deskew", True),
            "auto_enhance": process_options.get("auto_enhance", True),
            "noise_removal": process_options.get("noise_removal", False),
            "scan_mode": process_options.get("scan_mode", "color"),
            "dpi": process_options.get("dpi", 300),
        }
        
        # Use custom corners if provided
        if process_options.get("custom_corners"):
            corners = process_options["custom_corners"]
            ScannerEngine.perspective_correction(temp_input, temp_output, corners)
        else:
            ScannerEngine.process_scan(temp_input, temp_output, scan_options)
        
        # Create document record
        doc_service = DocumentService(db)
        result_doc = await doc_service.create_from_processed(
            original_name=f"scanned_{Path(file.filename).stem}.png",
            storage_key=f"processed_{temp_id}.png",
            mime_type="image/png",
            file_size=temp_output.stat().st_size,
            user_id=user_id
        )
        
        return {
            "success": True,
            "document_id": str(result_doc.id),
            "download_url": f"/api/v1/documents/{result_doc.id}/download",
        }
        
    finally:
        if temp_input.exists():
            temp_input.unlink()


@router.get("/session/{session_id}/page/{page_num}/preview")
async def get_page_preview(
    session_id: str,
    page_num: int,
    processed: bool = True
):
    """Get preview image of a scanned page"""
    from fastapi.responses import FileResponse
    
    if session_id not in scan_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = scan_sessions[session_id]
    
    # Find page
    page = None
    for p in session["pages"]:
        if p["page_number"] == page_num:
            page = p
            break
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Return processed or original
    if processed and page.get("processed_path"):
        file_path = Path(page["processed_path"])
    else:
        file_path = Path(page["original_path"])
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")
    
    return FileResponse(file_path, media_type="image/png")


@router.delete("/session/{session_id}/page/{page_num}")
async def delete_page(
    session_id: str,
    page_num: int
):
    """Delete a page from the scan session"""
    if session_id not in scan_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = scan_sessions[session_id]
    
    # Find and remove page
    page_to_remove = None
    for i, p in enumerate(session["pages"]):
        if p["page_number"] == page_num:
            page_to_remove = session["pages"].pop(i)
            break
    
    if not page_to_remove:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Delete files
    for key in ["original_path", "processed_path"]:
        if page_to_remove.get(key):
            path = Path(page_to_remove[key])
            if path.exists():
                path.unlink()
    
    # Renumber remaining pages
    for i, p in enumerate(session["pages"]):
        p["page_number"] = i + 1
    
    session["total_pages"] = len(session["pages"])
    
    return {"message": "Page deleted", "total_pages": session["total_pages"]}


@router.post("/session/{session_id}/reorder")
async def reorder_pages(
    session_id: str,
    new_order: List[int]
):
    """Reorder pages in a scan session"""
    if session_id not in scan_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = scan_sessions[session_id]
    
    if len(new_order) != len(session["pages"]):
        raise HTTPException(status_code=400, detail="Order list must include all pages")
    
    # Reorder pages
    pages_map = {p["page_number"]: p for p in session["pages"]}
    session["pages"] = []
    
    for i, old_num in enumerate(new_order):
        if old_num not in pages_map:
            raise HTTPException(status_code=400, detail=f"Invalid page number: {old_num}")
        page = pages_map[old_num]
        page["page_number"] = i + 1
        session["pages"].append(page)
    
    return {"message": "Pages reordered", "new_order": new_order}


# ============== Combine & Export ==============

@router.post("/session/{session_id}/combine")
async def combine_scans_to_pdf(
    session_id: str,
    output_name: Optional[str] = None,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Combine all scanned pages in a session into a single PDF.
    """
    if session_id not in scan_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = scan_sessions[session_id]
    
    if not session["pages"]:
        raise HTTPException(status_code=400, detail="No pages to combine")
    
    # Collect image paths (prefer processed)
    image_paths = []
    for page in sorted(session["pages"], key=lambda x: x["page_number"]):
        if page.get("processed_path") and Path(page["processed_path"]).exists():
            image_paths.append(Path(page["processed_path"]))
        elif page.get("original_path") and Path(page["original_path"]).exists():
            image_paths.append(Path(page["original_path"]))
    
    if not image_paths:
        raise HTTPException(status_code=400, detail="No valid images found")
    
    # Generate PDF
    output_id = str(uuid.uuid4())
    output_path = settings.PROCESSED_DIR / f"{output_id}.pdf"
    
    try:
        ScannerEngine.combine_images_to_pdf(image_paths, output_path)
        
        # Create document record
        doc_service = DocumentService(db)
        filename = output_name or session.get("name") or f"scan_{session_id[:8]}"
        
        result_doc = await doc_service.create_from_processed(
            original_name=f"{filename}.pdf",
            storage_key=f"{output_id}.pdf",
            mime_type="application/pdf",
            file_size=output_path.stat().st_size,
            user_id=user_id
        )
        
        # Mark session as completed
        session["status"] = "completed"
        session["output_document_id"] = str(result_doc.id)
        
        return {
            "success": True,
            "document_id": str(result_doc.id),
            "download_url": f"/api/v1/documents/{result_doc.id}/download",
            "page_count": len(image_paths),
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create PDF: {str(e)}")


@router.get("/languages")
async def get_ocr_languages():
    """Get available OCR languages"""
    from app.engines.ocr_engine import OCREngine
    
    return {
        "languages": OCREngine.LANGUAGES,
        "available": OCREngine.get_available_languages()
    }


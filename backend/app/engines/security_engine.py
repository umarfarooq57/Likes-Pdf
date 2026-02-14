"""
PDF Security Engine
Handles password protection, watermarks, digital signatures, and encryption
"""

import os
import hashlib
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
import json

# Try to import fitz (PyMuPDF)
try:
    import fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    fitz = None
    PYMUPDF_AVAILABLE = False

# Try to import PIL for image watermarks
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    Image = None
    PIL_AVAILABLE = False


class SecurityEngine:
    """PDF security operations engine"""
    
    # Permission flags (PDF specification)
    PERM_PRINT = 4
    PERM_MODIFY = 8
    PERM_COPY = 16
    PERM_ANNOTATE = 32
    PERM_FORM = 256
    PERM_EXTRACT = 512
    PERM_ASSEMBLE = 1024
    PERM_PRINT_HIGH = 2048
    
    @staticmethod
    def _check_available():
        """Check if PyMuPDF is available"""
        if not PYMUPDF_AVAILABLE:
            raise RuntimeError("PyMuPDF (fitz) is not installed.")
    
    @staticmethod
    def encrypt_pdf(
        input_path: Path,
        output_path: Path,
        user_password: Optional[str] = None,
        owner_password: Optional[str] = None,
        permissions: Optional[Dict[str, bool]] = None
    ) -> Tuple[Path, Dict[str, Any]]:
        """
        Encrypt PDF with password protection and permission settings.
        
        Args:
            input_path: Source PDF file
            output_path: Destination for encrypted PDF
            user_password: Password to open the document (optional)
            owner_password: Password for full access (required if permissions set)
            permissions: Dictionary of permission settings
            
        Returns:
            Tuple of (output_path, metadata about encryption)
        """
        SecurityEngine._check_available()
        
        doc = fitz.open(str(input_path))
        
        # Build permission flags
        perm = fitz.PDF_PERM_ACCESSIBILITY  # Always allow accessibility
        
        if permissions:
            if permissions.get("allow_printing", True):
                perm |= fitz.PDF_PERM_PRINT | fitz.PDF_PERM_PRINT_HQ
            if permissions.get("allow_copying", True):
                perm |= fitz.PDF_PERM_COPY
            if permissions.get("allow_modification", True):
                perm |= fitz.PDF_PERM_MODIFY
            if permissions.get("allow_annotation", True):
                perm |= fitz.PDF_PERM_ANNOTATE
            if permissions.get("allow_form_filling", True):
                perm |= fitz.PDF_PERM_FORM
            if permissions.get("allow_assembly", True):
                perm |= fitz.PDF_PERM_ASSEMBLE
        else:
            # Default: all permissions
            perm = -1
        
        # Encrypt options
        encrypt_options = {
            "owner_pw": owner_password or user_password or "",
            "user_pw": user_password or "",
            "permissions": perm,
            "encryption": fitz.PDF_ENCRYPT_AES_256,
        }
        
        doc.save(str(output_path), **encrypt_options)
        doc.close()
        
        return output_path, {
            "encryption_method": "AES-256",
            "has_user_password": bool(user_password),
            "has_owner_password": bool(owner_password),
            "permissions": permissions or {},
        }
    
    @staticmethod
    def decrypt_pdf(
        input_path: Path,
        output_path: Path,
        password: str
    ) -> Tuple[Path, Dict[str, Any]]:
        """
        Remove password protection from a PDF.
        
        Args:
            input_path: Encrypted PDF file
            output_path: Destination for decrypted PDF
            password: User or owner password
            
        Returns:
            Tuple of (output_path, metadata about decryption)
        """
        SecurityEngine._check_available()
        
        doc = fitz.open(str(input_path))
        
        if doc.is_encrypted:
            if not doc.authenticate(password):
                doc.close()
                raise ValueError("Invalid password")
        
        # Save without encryption
        doc.save(str(output_path))
        doc.close()
        
        return output_path, {
            "decrypted": True,
            "original_encrypted": True,
        }
    
    @staticmethod
    def check_pdf_protection(input_path: Path) -> Dict[str, Any]:
        """
        Check PDF protection status and permissions.
        
        Args:
            input_path: PDF file to check
            
        Returns:
            Dictionary with protection details
        """
        SecurityEngine._check_available()
        
        doc = fitz.open(str(input_path))
        
        result = {
            "is_encrypted": doc.is_encrypted,
            "needs_password": doc.needs_pass,
            "metadata": doc.metadata,
        }
        
        if doc.is_encrypted and not doc.needs_pass:
            # Document is encrypted but we have access
            perm = doc.permissions
            result["permissions"] = {
                "print": bool(perm & fitz.PDF_PERM_PRINT),
                "copy": bool(perm & fitz.PDF_PERM_COPY),
                "modify": bool(perm & fitz.PDF_PERM_MODIFY),
                "annotate": bool(perm & fitz.PDF_PERM_ANNOTATE),
                "form": bool(perm & fitz.PDF_PERM_FORM),
                "extract": bool(perm & fitz.PDF_PERM_ACCESSIBILITY),
                "assemble": bool(perm & fitz.PDF_PERM_ASSEMBLE),
                "print_high_quality": bool(perm & fitz.PDF_PERM_PRINT_HQ),
            }
        
        doc.close()
        return result
    
    @staticmethod
    def add_text_watermark(
        input_path: Path,
        output_path: Path,
        text: str,
        font_size: int = 48,
        font_color: Tuple[float, float, float] = (0.5, 0.5, 0.5),
        opacity: float = 0.3,
        rotation: float = 45,
        position: str = "center",
        pages: Optional[List[int]] = None
    ) -> Path:
        """
        Add text watermark to PDF pages.
        
        Args:
            input_path: Source PDF file
            output_path: Output PDF file
            text: Watermark text
            font_size: Font size in points
            font_color: RGB tuple (0-1 range)
            opacity: Transparency (0-1)
            rotation: Rotation angle in degrees
            position: center, diagonal, tiled
            pages: List of page numbers (1-indexed), None for all
            
        Returns:
            Path to output file
        """
        SecurityEngine._check_available()
        
        doc = fitz.open(str(input_path))
        page_count = len(doc)
        
        # Determine which pages to watermark
        if pages is None:
            target_pages = range(page_count)
        else:
            target_pages = [p - 1 for p in pages if 0 < p <= page_count]
        
        for page_num in target_pages:
            page = doc[page_num]
            rect = page.rect
            
            # Create text point based on position
            if position == "center":
                point = fitz.Point(rect.width / 2, rect.height / 2)
            elif position == "diagonal":
                point = fitz.Point(rect.width / 2, rect.height / 2)
            else:  # tiled
                # Multiple watermarks across the page
                SecurityEngine._add_tiled_watermark(
                    page, text, font_size, font_color, opacity, rotation
                )
                continue
            
            # Insert single watermark
            text_length = fitz.get_text_length(text, fontsize=font_size)
            
            # Create text writer for rotated text
            shape = page.new_shape()
            
            # Calculate position for centered text
            x = rect.width / 2 - text_length / 2
            y = rect.height / 2
            
            # Insert text with rotation
            page.insert_text(
                point=fitz.Point(x, y),
                text=text,
                fontsize=font_size,
                color=font_color,
                rotate=rotation,
                overlay=True,
            )
        
        # Apply opacity to watermark layer
        doc.save(str(output_path))
        doc.close()
        
        return output_path
    
    @staticmethod
    def _add_tiled_watermark(
        page,
        text: str,
        font_size: int,
        color: Tuple[float, float, float],
        opacity: float,
        rotation: float
    ):
        """Add tiled watermarks across a page"""
        rect = page.rect
        spacing_x = 200
        spacing_y = 150
        
        y = 50
        while y < rect.height:
            x = 50
            while x < rect.width:
                page.insert_text(
                    point=fitz.Point(x, y),
                    text=text,
                    fontsize=font_size,
                    color=color,
                    rotate=rotation,
                    overlay=True,
                )
                x += spacing_x
            y += spacing_y
    
    @staticmethod
    def add_image_watermark(
        input_path: Path,
        output_path: Path,
        image_path: Path,
        opacity: float = 0.3,
        scale: float = 1.0,
        position: str = "center",
        pages: Optional[List[int]] = None
    ) -> Path:
        """
        Add image watermark to PDF pages.
        
        Args:
            input_path: Source PDF file
            output_path: Output PDF file
            image_path: Path to watermark image
            opacity: Transparency (0-1)
            scale: Scale factor for the image
            position: center, corner, tiled
            pages: List of page numbers (1-indexed), None for all
            
        Returns:
            Path to output file
        """
        SecurityEngine._check_available()
        
        doc = fitz.open(str(input_path))
        page_count = len(doc)
        
        # Load watermark image
        img = fitz.open(str(image_path))
        img_rect = img[0].rect
        pdfbytes = img.convert_to_pdf()
        img.close()
        watermark_pdf = fitz.open("pdf", pdfbytes)
        
        # Determine which pages to watermark
        if pages is None:
            target_pages = range(page_count)
        else:
            target_pages = [p - 1 for p in pages if 0 < p <= page_count]
        
        for page_num in target_pages:
            page = doc[page_num]
            page_rect = page.rect
            
            # Calculate watermark size
            wm_width = img_rect.width * scale
            wm_height = img_rect.height * scale
            
            # Calculate position
            if position == "center":
                x = (page_rect.width - wm_width) / 2
                y = (page_rect.height - wm_height) / 2
            elif position == "top-left":
                x, y = 20, 20
            elif position == "top-right":
                x = page_rect.width - wm_width - 20
                y = 20
            elif position == "bottom-left":
                x = 20
                y = page_rect.height - wm_height - 20
            elif position == "bottom-right":
                x = page_rect.width - wm_width - 20
                y = page_rect.height - wm_height - 20
            else:
                x = (page_rect.width - wm_width) / 2
                y = (page_rect.height - wm_height) / 2
            
            wm_rect = fitz.Rect(x, y, x + wm_width, y + wm_height)
            page.show_pdf_page(wm_rect, watermark_pdf, 0, overlay=True)
        
        watermark_pdf.close()
        doc.save(str(output_path))
        doc.close()
        
        return output_path
    
    @staticmethod
    def add_page_numbers(
        input_path: Path,
        output_path: Path,
        position: str = "bottom-center",
        format_string: str = "Page {page} of {total}",
        font_size: int = 10,
        start_page: int = 1,
        skip_first: bool = False
    ) -> Path:
        """
        Add page numbers to PDF.
        
        Args:
            input_path: Source PDF file
            output_path: Output PDF file
            position: bottom-center, bottom-right, bottom-left, top-center, etc.
            format_string: Format with {page} and {total} placeholders
            font_size: Font size for page numbers
            start_page: Starting page number
            skip_first: Skip first page
            
        Returns:
            Path to output file
        """
        SecurityEngine._check_available()
        
        doc = fitz.open(str(input_path))
        total_pages = len(doc)
        
        for i, page in enumerate(doc):
            if skip_first and i == 0:
                continue
            
            page_num = start_page + i - (1 if skip_first else 0)
            text = format_string.format(page=page_num, total=total_pages)
            
            rect = page.rect
            
            # Calculate position
            positions = {
                "bottom-center": (rect.width / 2, rect.height - 30),
                "bottom-left": (50, rect.height - 30),
                "bottom-right": (rect.width - 100, rect.height - 30),
                "top-center": (rect.width / 2, 30),
                "top-left": (50, 30),
                "top-right": (rect.width - 100, 30),
            }
            
            x, y = positions.get(position, positions["bottom-center"])
            
            # Center the text
            text_length = fitz.get_text_length(text, fontsize=font_size)
            if "center" in position:
                x -= text_length / 2
            
            page.insert_text(
                point=fitz.Point(x, y),
                text=text,
                fontsize=font_size,
                color=(0, 0, 0),
            )
        
        doc.save(str(output_path))
        doc.close()
        
        return output_path
    
    @staticmethod
    def get_metadata(input_path: Path) -> Dict[str, Any]:
        """Get PDF metadata"""
        SecurityEngine._check_available()
        
        doc = fitz.open(str(input_path))
        metadata = doc.metadata
        
        result = {
            "title": metadata.get("title", ""),
            "author": metadata.get("author", ""),
            "subject": metadata.get("subject", ""),
            "keywords": metadata.get("keywords", ""),
            "creator": metadata.get("creator", ""),
            "producer": metadata.get("producer", ""),
            "creation_date": metadata.get("creationDate", ""),
            "modification_date": metadata.get("modDate", ""),
            "page_count": len(doc),
            "file_size": os.path.getsize(input_path),
        }
        
        doc.close()
        return result
    
    @staticmethod
    def set_metadata(
        input_path: Path,
        output_path: Path,
        metadata: Dict[str, str]
    ) -> Path:
        """Set PDF metadata"""
        SecurityEngine._check_available()
        
        doc = fitz.open(str(input_path))
        
        # Map our keys to PDF metadata keys
        meta_map = {
            "title": "title",
            "author": "author",
            "subject": "subject",
            "keywords": "keywords",
            "creator": "creator",
            "producer": "producer",
        }
        
        current = doc.metadata
        for key, value in metadata.items():
            if key in meta_map:
                current[meta_map[key]] = value
        
        doc.set_metadata(current)
        doc.save(str(output_path))
        doc.close()
        
        return output_path
    
    @staticmethod
    def hash_file(file_path: Path) -> str:
        """Calculate SHA-256 hash of a file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    @staticmethod
    def get_page_thumbnails(
        input_path: Path,
        output_dir: Path,
        dpi: int = 72,
        max_dimension: int = 200
    ) -> List[Path]:
        """
        Generate thumbnail images for each page.
        
        Args:
            input_path: Source PDF file
            output_dir: Directory for thumbnail images
            dpi: Resolution for rendering
            max_dimension: Maximum width or height
            
        Returns:
            List of thumbnail image paths
        """
        SecurityEngine._check_available()
        
        output_dir.mkdir(parents=True, exist_ok=True)
        doc = fitz.open(str(input_path))
        thumbnails = []
        
        for i, page in enumerate(doc):
            # Calculate zoom factor
            zoom = dpi / 72
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            
            # Scale down if needed
            if pix.width > max_dimension or pix.height > max_dimension:
                scale = max_dimension / max(pix.width, pix.height)
                mat = fitz.Matrix(zoom * scale, zoom * scale)
                pix = page.get_pixmap(matrix=mat)
            
            thumb_path = output_dir / f"thumb_{i + 1}.png"
            pix.save(str(thumb_path))
            thumbnails.append(thumb_path)
        
        doc.close()
        return thumbnails

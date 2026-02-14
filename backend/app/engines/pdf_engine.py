"""
PDF Engine
Core PDF processing using PyMuPDF (fitz)
Provides fallback stubs when PyMuPDF is not available
"""

from pathlib import Path
from typing import List, Optional, Tuple

# Try to import fitz, provide stubs if not available
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    fitz = None
    PYMUPDF_AVAILABLE = False


class PDFEngine:
    """PDF processing engine with PyMuPDF backend"""
    
    @staticmethod
    def _check_available():
        """Check if PyMuPDF is available"""
        if not PYMUPDF_AVAILABLE:
            raise RuntimeError("PyMuPDF (fitz) is not installed. Please install pymupdf package.")
    
    @staticmethod
    def get_page_count(pdf_path: Path) -> int:
        """Get the number of pages in a PDF"""
        if not PYMUPDF_AVAILABLE:
            return 0
        doc = fitz.open(str(pdf_path))
        count = len(doc)
        doc.close()
        return count
    
    @staticmethod
    def merge_pdfs(pdf_paths: List[Path], output_path: Path) -> Path:
        """Merge multiple PDFs into one"""
        PDFEngine._check_available()
        
        merged = fitz.open()
        for pdf_path in pdf_paths:
            doc = fitz.open(str(pdf_path))
            merged.insert_pdf(doc)
            doc.close()
        
        merged.save(str(output_path))
        merged.close()
        return output_path
    
    @staticmethod
    def split_pdf(
        pdf_path: Path,
        output_dir: Path,
        page_ranges: Optional[List[Tuple[int, int]]] = None
    ) -> List[Path]:
        """Split PDF into multiple files"""
        PDFEngine._check_available()
        
        output_dir.mkdir(parents=True, exist_ok=True)
        doc = fitz.open(str(pdf_path))
        output_files = []
        
        if page_ranges:
            for i, (start, end) in enumerate(page_ranges):
                output = fitz.open()
                output.insert_pdf(doc, from_page=start-1, to_page=end-1)
                output_path = output_dir / f"split_{i+1}.pdf"
                output.save(str(output_path))
                output.close()
                output_files.append(output_path)
        else:
            for page_num in range(len(doc)):
                output = fitz.open()
                output.insert_pdf(doc, from_page=page_num, to_page=page_num)
                output_path = output_dir / f"page_{page_num+1}.pdf"
                output.save(str(output_path))
                output.close()
                output_files.append(output_path)
        
        doc.close()
        return output_files
    
    @staticmethod
    def rotate_pages(
        pdf_path: Path,
        output_path: Path,
        rotations: dict
    ) -> Path:
        """Rotate specific pages in a PDF
        
        Args:
            pdf_path: Input PDF path
            output_path: Output PDF path
            rotations: Dict of {page_number: degrees} (0-indexed)
        """
        PDFEngine._check_available()
        
        doc = fitz.open(str(pdf_path))
        for page_num, angle in rotations.items():
            if 0 <= page_num < len(doc):
                page = doc[page_num]
                page.set_rotation((page.rotation + angle) % 360)
        
        doc.save(str(output_path))
        doc.close()
        return output_path
    
    @staticmethod
    def reorder_pages(
        pdf_path: Path,
        output_path: Path,
        new_order: List[int]
    ) -> Path:
        """Reorder pages in a PDF (0-indexed)"""
        PDFEngine._check_available()
        
        doc = fitz.open(str(pdf_path))
        doc.select(new_order)  # Already 0-indexed
        doc.save(str(output_path))
        doc.close()
        return output_path
    
    @staticmethod
    def delete_pages(
        pdf_path: Path,
        output_path: Path,
        pages_to_delete: List[int]
    ) -> Path:
        """Delete specific pages from a PDF (0-indexed)"""
        PDFEngine._check_available()
        
        doc = fitz.open(str(pdf_path))
        pages_sorted = sorted(pages_to_delete, reverse=True)  # Already 0-indexed
        
        for page_num in pages_sorted:
            if 0 <= page_num < len(doc):
                doc.delete_page(page_num)
        
        doc.save(str(output_path))
        doc.close()
        return output_path
    
    @staticmethod
    def extract_pages(
        pdf_path: Path,
        output_path: Path,
        pages: List[int]
    ) -> Path:
        """Extract specific pages to a new PDF (0-indexed)"""
        PDFEngine._check_available()
        
        doc = fitz.open(str(pdf_path))
        output = fitz.open()
        
        for page_num in pages:  # Already 0-indexed
            if 0 <= page_num < len(doc):
                output.insert_pdf(doc, from_page=page_num, to_page=page_num)
        
        output.save(str(output_path))
        output.close()
        doc.close()
        return output_path
    
    @staticmethod
    def compress_pdf(
        pdf_path: Path,
        output_path: Path,
        quality: str = "medium"
    ) -> Path:
        """Compress a PDF file"""
        PDFEngine._check_available()
        
        doc = fitz.open(str(pdf_path))
        
        quality_settings = {
            "low": {"deflate": True, "garbage": 4, "linear": True},
            "medium": {"deflate": True, "garbage": 3, "linear": True},
            "high": {"deflate": True, "garbage": 2, "linear": False},
        }
        
        settings = quality_settings.get(quality, quality_settings["medium"])
        doc.save(str(output_path), **settings)
        doc.close()
        return output_path
    
    @staticmethod
    def linearize_pdf(pdf_path: Path, output_path: Path) -> Path:
        """Linearize a PDF for web optimization"""
        PDFEngine._check_available()
        
        doc = fitz.open(str(pdf_path))
        doc.save(str(output_path), linear=True)
        doc.close()
        return output_path
    
    @staticmethod
    def repair_pdf(pdf_path: Path, output_path: Path) -> Path:
        """Attempt to repair a corrupted PDF"""
        PDFEngine._check_available()
        
        doc = fitz.open(str(pdf_path))
        doc.save(str(output_path), garbage=4, clean=True)
        doc.close()
        return output_path
    
    @staticmethod
    def pdf_to_images(
        pdf_path: Path,
        output_dir: Path,
        image_format: str = "png",
        dpi: int = 150
    ) -> List[Path]:
        """Convert PDF pages to images"""
        PDFEngine._check_available()
        
        output_dir.mkdir(parents=True, exist_ok=True)
        doc = fitz.open(str(pdf_path))
        output_files = []
        
        zoom = dpi / 72
        matrix = fitz.Matrix(zoom, zoom)
        
        for page_num, page in enumerate(doc):
            pix = page.get_pixmap(matrix=matrix)
            output_path = output_dir / f"page_{page_num+1}.{image_format}"
            pix.save(str(output_path))
            output_files.append(output_path)
        
        doc.close()
        return output_files
    
    @staticmethod
    def images_to_pdf(image_paths: List[Path], output_path: Path) -> Path:
        """Convert images to a PDF"""
        PDFEngine._check_available()
        
        doc = fitz.open()
        
        for img_path in image_paths:
            img = fitz.open(str(img_path))
            rect = img[0].rect
            pdf_bytes = img.convert_to_pdf()
            img.close()
            
            img_pdf = fitz.open("pdf", pdf_bytes)
            page = doc.new_page(width=rect.width, height=rect.height)
            page.show_pdf_page(rect, img_pdf, 0)
            img_pdf.close()
        
        doc.save(str(output_path))
        doc.close()
        return output_path

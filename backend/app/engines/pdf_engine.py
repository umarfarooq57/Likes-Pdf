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

# Try pypdf as a pure-Python fallback for merge/split when PyMuPDF is unavailable
if not PYMUPDF_AVAILABLE:
    try:
        # type: ignore[import-not-found]
        from pypdf import PdfReader, PdfWriter, PdfMerger
        PYPDF_AVAILABLE = True
    except Exception:
        PdfReader = PdfWriter = PdfMerger = None
        PYPDF_AVAILABLE = False


class PDFEngine:
    """PDF processing engine with PyMuPDF backend"""

    @staticmethod
    def _check_available():
        """Check if PyMuPDF is available"""
        if not PYMUPDF_AVAILABLE:
            raise RuntimeError(
                "PyMuPDF (fitz) is not installed. Please install pymupdf package.")

    @staticmethod
    def get_page_count(pdf_path: Path) -> int:
        """Get the number of pages in a PDF"""
        if PYMUPDF_AVAILABLE:
            doc = fitz.open(str(pdf_path))
            count = len(doc)
            doc.close()
            return count

        # Fallback using pypdf
        if PYPDF_AVAILABLE:
            reader = PdfReader(str(pdf_path))
            return len(reader.pages)

        return 0

    @staticmethod
    def merge_pdfs(pdf_paths: List[Path], output_path: Path) -> Path:
        """Merge multiple PDFs into one"""
        # Prefer PyMuPDF when available for performance and features
        if PYMUPDF_AVAILABLE:
            merged = fitz.open()
            for pdf_path in pdf_paths:
                doc = fitz.open(str(pdf_path))
                merged.insert_pdf(doc)
                doc.close()

            merged.save(str(output_path))
            merged.close()
            return output_path

        # Fallback to pypdf PdfMerger
        if PYPDF_AVAILABLE:
            merger = PdfMerger()
            for pdf_path in pdf_paths:
                merger.append(str(pdf_path))
            merger.write(str(output_path))
            merger.close()
            return output_path

        # If no backend available, raise
        PDFEngine._check_available()

    @staticmethod
    def split_pdf(
        pdf_path: Path,
        output_dir: Path,
        page_ranges: Optional[List[Tuple[int, int]]] = None
    ) -> List[Path]:
        """Split PDF into multiple files"""
        output_dir.mkdir(parents=True, exist_ok=True)

        # PyMuPDF implementation
        if PYMUPDF_AVAILABLE:
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
                    output.insert_pdf(
                        doc, from_page=page_num, to_page=page_num)
                    output_path = output_dir / f"page_{page_num+1}.pdf"
                    output.save(str(output_path))
                    output.close()
                    output_files.append(output_path)

            doc.close()
            return output_files

        # Fallback using pypdf
        if PYPDF_AVAILABLE:
            reader = PdfReader(str(pdf_path))
            output_files = []

            if page_ranges:
                for i, (start, end) in enumerate(page_ranges):
                    writer = PdfWriter()
                    for p in range(start - 1, end):
                        writer.add_page(reader.pages[p])
                    output_path = output_dir / f"split_{i+1}.pdf"
                    with open(output_path, "wb") as f:
                        writer.write(f)
                    output_files.append(output_path)
            else:
                for page_num in range(len(reader.pages)):
                    writer = PdfWriter()
                    writer.add_page(reader.pages[page_num])
                    output_path = output_dir / f"page_{page_num+1}.pdf"
                    with open(output_path, "wb") as f:
                        writer.write(f)
                    output_files.append(output_path)

            return output_files

        # If no backend available, raise
        PDFEngine._check_available()

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
        if PYMUPDF_AVAILABLE:
            doc = fitz.open(str(pdf_path))
            for page_num, angle in rotations.items():
                if 0 <= page_num < len(doc):
                    page = doc[page_num]
                    page.set_rotation((page.rotation + angle) % 360)

            doc.save(str(output_path))
            doc.close()
            return output_path

        if PYPDF_AVAILABLE:
            reader = PdfReader(str(pdf_path))
            writer = PdfWriter()
            for idx, page in enumerate(reader.pages):
                rotate_by = rotations.get(idx, 0)
                if rotate_by:
                    page.rotate(rotate_by)
                writer.add_page(page)

            with open(output_path, "wb") as f:
                writer.write(f)
            return output_path

        PDFEngine._check_available()

    @staticmethod
    def reorder_pages(
        pdf_path: Path,
        output_path: Path,
        new_order: List[int]
    ) -> Path:
        """Reorder pages in a PDF (0-indexed)"""
        if PYMUPDF_AVAILABLE:
            doc = fitz.open(str(pdf_path))
            doc.select(new_order)  # Already 0-indexed
            doc.save(str(output_path))
            doc.close()
            return output_path

        if PYPDF_AVAILABLE:
            reader = PdfReader(str(pdf_path))
            writer = PdfWriter()
            total_pages = len(reader.pages)
            for page_num in new_order:
                if 0 <= page_num < total_pages:
                    writer.add_page(reader.pages[page_num])

            with open(output_path, "wb") as f:
                writer.write(f)
            return output_path

        PDFEngine._check_available()

    @staticmethod
    def delete_pages(
        pdf_path: Path,
        output_path: Path,
        pages_to_delete: List[int]
    ) -> Path:
        """Delete specific pages from a PDF (0-indexed)"""
        if PYMUPDF_AVAILABLE:
            doc = fitz.open(str(pdf_path))
            # Already 0-indexed
            pages_sorted = sorted(pages_to_delete, reverse=True)

            for page_num in pages_sorted:
                if 0 <= page_num < len(doc):
                    doc.delete_page(page_num)

            doc.save(str(output_path))
            doc.close()
            return output_path

        if PYPDF_AVAILABLE:
            reader = PdfReader(str(pdf_path))
            writer = PdfWriter()
            to_delete = set(pages_to_delete)

            for idx, page in enumerate(reader.pages):
                if idx not in to_delete:
                    writer.add_page(page)

            with open(output_path, "wb") as f:
                writer.write(f)
            return output_path

        PDFEngine._check_available()

    @staticmethod
    def extract_pages(
        pdf_path: Path,
        output_path: Path,
        pages: List[int]
    ) -> Path:
        """Extract specific pages to a new PDF (0-indexed)"""
        if PYMUPDF_AVAILABLE:
            doc = fitz.open(str(pdf_path))
            output = fitz.open()

            for page_num in pages:  # Already 0-indexed
                if 0 <= page_num < len(doc):
                    output.insert_pdf(
                        doc, from_page=page_num, to_page=page_num)

            output.save(str(output_path))
            output.close()
            doc.close()
            return output_path

        if PYPDF_AVAILABLE:
            reader = PdfReader(str(pdf_path))
            writer = PdfWriter()
            total_pages = len(reader.pages)

            for page_num in pages:
                if 0 <= page_num < total_pages:
                    writer.add_page(reader.pages[page_num])

            with open(output_path, "wb") as f:
                writer.write(f)
            return output_path

        PDFEngine._check_available()

    @staticmethod
    def compress_pdf(
        pdf_path: Path,
        output_path: Path,
        quality: str = "medium"
    ) -> Path:
        """Compress a PDF file"""
        if PYMUPDF_AVAILABLE:
            doc = fitz.open(str(pdf_path))

            quality_settings = {
                "low": {"deflate": True, "garbage": 4, "linear": True},
                "medium": {"deflate": True, "garbage": 3, "linear": True},
                "high": {"deflate": True, "garbage": 2, "linear": False},
            }

            settings = quality_settings.get(
                quality, quality_settings["medium"])
            doc.save(str(output_path), **settings)
            doc.close()
            return output_path

        if PYPDF_AVAILABLE:
            # pypdf cannot optimize like PyMuPDF; rewrite as a safe fallback.
            reader = PdfReader(str(pdf_path))
            writer = PdfWriter()
            for page in reader.pages:
                writer.add_page(page)
            with open(output_path, "wb") as f:
                writer.write(f)
            return output_path

        PDFEngine._check_available()

    @staticmethod
    def linearize_pdf(pdf_path: Path, output_path: Path) -> Path:
        """Linearize a PDF for web optimization"""
        if PYMUPDF_AVAILABLE:
            doc = fitz.open(str(pdf_path))
            doc.save(str(output_path), linear=True)
            doc.close()
            return output_path

        if PYPDF_AVAILABLE:
            reader = PdfReader(str(pdf_path))
            writer = PdfWriter()
            for page in reader.pages:
                writer.add_page(page)
            with open(output_path, "wb") as f:
                writer.write(f)
            return output_path

        PDFEngine._check_available()

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

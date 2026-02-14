"""
OCR Engine
Optical Character Recognition using Tesseract and fallback methods
"""

import os
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
import json

# Try to import pytesseract
try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    pytesseract = None
    TESSERACT_AVAILABLE = False

# Try to import pdf2image for PDF to image conversion
try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    convert_from_path = None
    PDF2IMAGE_AVAILABLE = False

# Try to import PyMuPDF
try:
    import fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    fitz = None
    PYMUPDF_AVAILABLE = False


class OCREngine:
    """OCR processing engine using Tesseract"""
    
    # Supported languages (Tesseract language codes)
    LANGUAGES = {
        "eng": "English",
        "ara": "Arabic",
        "chi_sim": "Chinese (Simplified)",
        "chi_tra": "Chinese (Traditional)",
        "deu": "German",
        "fra": "French",
        "hin": "Hindi",
        "ita": "Italian",
        "jpn": "Japanese",
        "kor": "Korean",
        "nld": "Dutch",
        "pol": "Polish",
        "por": "Portuguese",
        "rus": "Russian",
        "spa": "Spanish",
        "tur": "Turkish",
        "urd": "Urdu",
        "vie": "Vietnamese",
    }
    
    @staticmethod
    def _check_tesseract():
        """Check if Tesseract is available"""
        if not TESSERACT_AVAILABLE:
            raise RuntimeError("pytesseract is not installed.")
    
    @staticmethod
    def get_available_languages() -> List[str]:
        """Get list of available Tesseract languages"""
        if not TESSERACT_AVAILABLE:
            return []
        try:
            return pytesseract.get_languages()
        except Exception:
            return list(OCREngine.LANGUAGES.keys())
    
    @staticmethod
    def ocr_image(
        image_path: Path,
        language: str = "eng",
        config: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Perform OCR on a single image.
        
        Args:
            image_path: Path to the image
            language: Tesseract language code
            config: Additional Tesseract config
            
        Returns:
            Dictionary with text, confidence, and bounding boxes
        """
        OCREngine._check_tesseract()
        
        img = Image.open(str(image_path))
        
        # Default config for document OCR
        if config is None:
            config = '--oem 3 --psm 6'  # Assume uniform block of text
        
        # Get plain text
        text = pytesseract.image_to_string(img, lang=language, config=config)
        
        # Get detailed data with bounding boxes
        data = pytesseract.image_to_data(img, lang=language, config=config, output_type=pytesseract.Output.DICT)
        
        # Calculate average confidence
        confidences = [int(c) for c in data['conf'] if int(c) > 0]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Extract word boxes
        boxes = []
        n_boxes = len(data['text'])
        for i in range(n_boxes):
            if int(data['conf'][i]) > 0 and data['text'][i].strip():
                boxes.append({
                    'text': data['text'][i],
                    'confidence': int(data['conf'][i]),
                    'x': data['left'][i],
                    'y': data['top'][i],
                    'width': data['width'][i],
                    'height': data['height'][i],
                    'block_num': data['block_num'][i],
                    'line_num': data['line_num'][i],
                    'word_num': data['word_num'][i],
                })
        
        return {
            'text': text.strip(),
            'confidence': avg_confidence,
            'boxes': boxes,
            'language': language,
        }
    
    @staticmethod
    def ocr_pdf(
        pdf_path: Path,
        output_dir: Path,
        language: str = "eng",
        pages: Optional[List[int]] = None,
        dpi: int = 300
    ) -> Dict[str, Any]:
        """
        Perform OCR on a PDF file.
        
        Args:
            pdf_path: Path to the PDF
            output_dir: Directory for temporary files
            language: Tesseract language code
            pages: Optional list of pages to OCR (1-indexed), None for all
            dpi: Resolution for PDF to image conversion
            
        Returns:
            Dictionary with per-page results and full text
        """
        OCREngine._check_tesseract()
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Convert PDF to images
        images = OCREngine._pdf_to_images(pdf_path, output_dir, dpi, pages)
        
        # OCR each image
        page_results = {}
        full_text_parts = []
        total_confidence = 0
        
        for page_num, img_path in images:
            result = OCREngine.ocr_image(img_path, language)
            page_results[page_num] = result
            full_text_parts.append(f"--- Page {page_num} ---\n{result['text']}")
            total_confidence += result['confidence']
            
            # Cleanup temp image
            if img_path.exists():
                img_path.unlink()
        
        avg_confidence = total_confidence / len(images) if images else 0
        
        return {
            'page_results': page_results,
            'full_text': "\n\n".join(full_text_parts),
            'average_confidence': avg_confidence,
            'total_pages': len(images),
            'language': language,
        }
    
    @staticmethod
    def _pdf_to_images(
        pdf_path: Path,
        output_dir: Path,
        dpi: int = 300,
        pages: Optional[List[int]] = None
    ) -> List[Tuple[int, Path]]:
        """Convert PDF pages to images"""
        images = []
        
        if PYMUPDF_AVAILABLE:
            # Use PyMuPDF (faster, no external deps)
            doc = fitz.open(str(pdf_path))
            page_indices = range(len(doc)) if pages is None else [p - 1 for p in pages]
            
            zoom = dpi / 72
            matrix = fitz.Matrix(zoom, zoom)
            
            for i in page_indices:
                if 0 <= i < len(doc):
                    page = doc[i]
                    pix = page.get_pixmap(matrix=matrix)
                    img_path = output_dir / f"page_{i + 1}.png"
                    pix.save(str(img_path))
                    images.append((i + 1, img_path))
            
            doc.close()
        
        elif PDF2IMAGE_AVAILABLE:
            # Use pdf2image (requires poppler)
            pil_images = convert_from_path(
                str(pdf_path),
                dpi=dpi,
                first_page=pages[0] if pages else None,
                last_page=pages[-1] if pages else None,
            )
            
            for i, img in enumerate(pil_images):
                page_num = (pages[i] if pages else i + 1)
                img_path = output_dir / f"page_{page_num}.png"
                img.save(str(img_path), 'PNG')
                images.append((page_num, img_path))
        
        else:
            raise RuntimeError("No PDF to image converter available")
        
        return images
    
    @staticmethod
    def create_searchable_pdf(
        input_pdf: Path,
        output_pdf: Path,
        language: str = "eng",
        dpi: int = 300
    ) -> Dict[str, Any]:
        """
        Create a searchable PDF by adding OCR text layer.
        
        Args:
            input_pdf: Input scanned PDF
            output_pdf: Output searchable PDF
            language: Tesseract language code
            dpi: Resolution for processing
            
        Returns:
            Metadata about the OCR process
        """
        OCREngine._check_tesseract()
        
        if not PYMUPDF_AVAILABLE:
            raise RuntimeError("PyMuPDF is required for searchable PDF creation")
        
        doc = fitz.open(str(input_pdf))
        
        zoom = dpi / 72
        matrix = fitz.Matrix(zoom, zoom)
        
        total_confidence = 0
        page_texts = {}
        
        for page_num, page in enumerate(doc):
            # Render page to image
            pix = page.get_pixmap(matrix=matrix)
            
            # Convert to PIL Image
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # OCR the image
            ocr_data = pytesseract.image_to_data(
                img, lang=language,
                config='--oem 3 --psm 6',
                output_type=pytesseract.Output.DICT
            )
            
            # Add text layer to PDF
            n_boxes = len(ocr_data['text'])
            page_text = []
            
            for i in range(n_boxes):
                if int(ocr_data['conf'][i]) > 0 and ocr_data['text'][i].strip():
                    text = ocr_data['text'][i]
                    
                    # Scale coordinates back to PDF space
                    x = ocr_data['left'][i] / zoom
                    y = ocr_data['top'][i] / zoom
                    w = ocr_data['width'][i] / zoom
                    h = ocr_data['height'][i] / zoom
                    
                    # Estimate font size
                    font_size = max(6, int(h * 0.8))
                    
                    # Insert invisible text
                    try:
                        page.insert_text(
                            fitz.Point(x, y + h - 2),
                            text,
                            fontsize=font_size,
                            color=(1, 1, 1),  # White (invisible on white bg)
                            render_mode=3,  # Invisible
                        )
                    except Exception:
                        pass  # Skip problematic text insertions
                    
                    page_text.append(text)
            
            page_texts[page_num + 1] = ' '.join(page_text)
            
            # Calculate confidence for this page
            confidences = [int(c) for c in ocr_data['conf'] if int(c) > 0]
            if confidences:
                total_confidence += sum(confidences) / len(confidences)
        
        avg_confidence = total_confidence / len(doc) if len(doc) > 0 else 0
        
        # Save searchable PDF
        doc.save(str(output_pdf))
        doc.close()
        
        return {
            'output_path': str(output_pdf),
            'average_confidence': avg_confidence,
            'total_pages': len(page_texts),
            'page_texts': page_texts,
            'language': language,
        }
    
    @staticmethod
    def detect_language(image_path: Path) -> str:
        """
        Attempt to detect the language in an image.
        
        Args:
            image_path: Path to the image
            
        Returns:
            Detected language code
        """
        OCREngine._check_tesseract()
        
        img = Image.open(str(image_path))
        
        # Try to detect script/orientation
        try:
            osd = pytesseract.image_to_osd(img)
            # Parse OSD output for script
            for line in osd.split('\n'):
                if 'Script:' in line:
                    script = line.split(':')[1].strip()
                    script_to_lang = {
                        'Latin': 'eng',
                        'Arabic': 'ara',
                        'Han': 'chi_sim',
                        'Cyrillic': 'rus',
                        'Devanagari': 'hin',
                        'Japanese': 'jpn',
                        'Korean': 'kor',
                    }
                    return script_to_lang.get(script, 'eng')
        except Exception:
            pass
        
        return 'eng'  # Default to English
    
    @staticmethod
    def extract_tables(
        image_path: Path,
        language: str = "eng"
    ) -> List[List[List[str]]]:
        """
        Attempt to extract tables from an image.
        
        Args:
            image_path: Path to the image
            language: Tesseract language code
            
        Returns:
            List of tables, each table is a list of rows
        """
        OCREngine._check_tesseract()
        
        img = Image.open(str(image_path))
        
        # Use TSV output for structured data
        tsv_data = pytesseract.image_to_data(
            img, lang=language,
            config='--oem 3 --psm 6',
            output_type=pytesseract.Output.DATAFRAME
        )
        
        # Group by block and line to reconstruct table structure
        tables = []
        current_table = []
        current_row = []
        last_line_num = -1
        last_block_num = -1
        
        for _, row in tsv_data.iterrows():
            if row['conf'] < 0 or not str(row['text']).strip():
                continue
            
            block_num = row['block_num']
            line_num = row['line_num']
            text = str(row['text']).strip()
            
            # New block = new table
            if block_num != last_block_num:
                if current_row:
                    current_table.append(current_row)
                if current_table:
                    tables.append(current_table)
                current_table = []
                current_row = []
            
            # New line = new row
            elif line_num != last_line_num:
                if current_row:
                    current_table.append(current_row)
                current_row = []
            
            current_row.append(text)
            last_line_num = line_num
            last_block_num = block_num
        
        # Don't forget the last row/table
        if current_row:
            current_table.append(current_row)
        if current_table:
            tables.append(current_table)
        
        return tables

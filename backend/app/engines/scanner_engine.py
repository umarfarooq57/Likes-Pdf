"""
Scanner Engine
Document scanning with edge detection, perspective correction, and image enhancement
Uses OpenCV for image processing
"""

import os
import math
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
import numpy as np

# Try to import OpenCV
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    cv2 = None
    OPENCV_AVAILABLE = False

# Try to import PIL
try:
    from PIL import Image, ImageEnhance, ImageFilter
    PIL_AVAILABLE = True
except ImportError:
    Image = None
    PIL_AVAILABLE = False


class ScannerEngine:
    """Document scanning and image processing engine"""
    
    @staticmethod
    def _check_opencv():
        """Check if OpenCV is available"""
        if not OPENCV_AVAILABLE:
            raise RuntimeError("OpenCV (cv2) is not installed.")
    
    @staticmethod
    def _check_pil():
        """Check if PIL is available"""
        if not PIL_AVAILABLE:
            raise RuntimeError("Pillow (PIL) is not installed.")
    
    @staticmethod
    def detect_document_edges(
        image_path: Path,
        debug_output: Optional[Path] = None
    ) -> Optional[List[List[int]]]:
        """
        Detect document edges in an image.
        
        Args:
            image_path: Path to the image
            debug_output: Optional path to save debug visualization
            
        Returns:
            List of 4 corner points [[x1,y1], [x2,y2], [x3,y3], [x4,y4]] or None
        """
        ScannerEngine._check_opencv()
        
        # Read image
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        orig = image.copy()
        height, width = image.shape[:2]
        
        # Resize for processing (faster)
        max_dim = 1000
        ratio = 1.0
        if max(height, width) > max_dim:
            ratio = max_dim / max(height, width)
            image = cv2.resize(image, None, fx=ratio, fy=ratio)
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Dilate to close gaps
        kernel = np.ones((3, 3), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=1)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return None
        
        # Find the largest contour
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Approximate the contour to a polygon
        peri = cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, 0.02 * peri, True)
        
        # Check if we have 4 corners (document)
        if len(approx) == 4:
            # Scale back to original size
            corners = approx.reshape(4, 2) / ratio
            corners = corners.astype(int).tolist()
            
            # Order points: top-left, top-right, bottom-right, bottom-left
            corners = ScannerEngine._order_points(np.array(corners))
            
            if debug_output:
                debug_img = orig.copy()
                pts = np.array(corners, np.int32).reshape((-1, 1, 2))
                cv2.polylines(debug_img, [pts], True, (0, 255, 0), 3)
                for pt in corners:
                    cv2.circle(debug_img, tuple(pt), 10, (0, 0, 255), -1)
                cv2.imwrite(str(debug_output), debug_img)
            
            return corners.tolist()
        
        return None
    
    @staticmethod
    def _order_points(pts: np.ndarray) -> np.ndarray:
        """Order points in clockwise order starting from top-left"""
        rect = np.zeros((4, 2), dtype="float32")
        
        # Top-left has smallest sum, bottom-right has largest sum
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        
        # Top-right has smallest difference, bottom-left has largest difference
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        
        return rect.astype(int)
    
    @staticmethod
    def perspective_correction(
        image_path: Path,
        output_path: Path,
        corners: Optional[List[List[int]]] = None
    ) -> Path:
        """
        Apply perspective correction to straighten a document.
        
        Args:
            image_path: Source image
            output_path: Output image path
            corners: Optional pre-detected corners
            
        Returns:
            Path to corrected image
        """
        ScannerEngine._check_opencv()
        
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Detect corners if not provided
        if corners is None:
            corners = ScannerEngine.detect_document_edges(image_path)
        
        if corners is None:
            # No document detected, return original
            cv2.imwrite(str(output_path), image)
            return output_path
        
        pts = np.array(corners, dtype="float32")
        
        # Calculate output dimensions
        (tl, tr, br, bl) = pts
        
        width_top = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        width_bottom = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        max_width = int(max(width_top, width_bottom))
        
        height_left = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        height_right = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        max_height = int(max(height_left, height_right))
        
        # Destination points
        dst = np.array([
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1]
        ], dtype="float32")
        
        # Apply perspective transform
        M = cv2.getPerspectiveTransform(pts, dst)
        warped = cv2.warpPerspective(image, M, (max_width, max_height))
        
        cv2.imwrite(str(output_path), warped)
        return output_path
    
    @staticmethod
    def auto_crop(
        image_path: Path,
        output_path: Path,
        margin: int = 10
    ) -> Path:
        """
        Auto-crop an image to remove white borders.
        
        Args:
            image_path: Source image
            output_path: Output image path
            margin: Extra margin to keep around content
            
        Returns:
            Path to cropped image
        """
        ScannerEngine._check_opencv()
        
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Threshold to find content
        _, thresh = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Get bounding box of all contours
            x_min = float('inf')
            y_min = float('inf')
            x_max = 0
            y_max = 0
            
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                x_min = min(x_min, x)
                y_min = min(y_min, y)
                x_max = max(x_max, x + w)
                y_max = max(y_max, y + h)
            
            # Add margin
            height, width = image.shape[:2]
            x_min = max(0, x_min - margin)
            y_min = max(0, y_min - margin)
            x_max = min(width, x_max + margin)
            y_max = min(height, y_max + margin)
            
            # Crop
            cropped = image[y_min:y_max, x_min:x_max]
            cv2.imwrite(str(output_path), cropped)
        else:
            cv2.imwrite(str(output_path), image)
        
        return output_path
    
    @staticmethod
    def deskew(
        image_path: Path,
        output_path: Path
    ) -> Tuple[Path, float]:
        """
        Correct skew in a scanned document.
        
        Args:
            image_path: Source image
            output_path: Output image path
            
        Returns:
            Tuple of (output_path, angle_corrected)
        """
        ScannerEngine._check_opencv()
        
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        
        # Detect lines using Hough transform
        lines = cv2.HoughLines(edges, 1, np.pi / 180, 200)
        
        angle = 0.0
        if lines is not None:
            angles = []
            for rho, theta in lines[:, 0]:
                angle_deg = np.degrees(theta) - 90
                if -45 < angle_deg < 45:  # Filter reasonable angles
                    angles.append(angle_deg)
            
            if angles:
                angle = np.median(angles)
        
        # Rotate to correct skew
        if abs(angle) > 0.5:  # Only correct if angle is significant
            height, width = image.shape[:2]
            center = (width // 2, height // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            
            # Calculate new image size
            cos = np.abs(M[0, 0])
            sin = np.abs(M[0, 1])
            new_width = int((height * sin) + (width * cos))
            new_height = int((height * cos) + (width * sin))
            
            M[0, 2] += (new_width / 2) - center[0]
            M[1, 2] += (new_height / 2) - center[1]
            
            rotated = cv2.warpAffine(image, M, (new_width, new_height),
                                      borderMode=cv2.BORDER_REPLICATE)
            cv2.imwrite(str(output_path), rotated)
        else:
            cv2.imwrite(str(output_path), image)
        
        return output_path, angle
    
    @staticmethod
    def remove_noise(
        image_path: Path,
        output_path: Path,
        strength: int = 10
    ) -> Path:
        """
        Remove noise from scanned document.
        
        Args:
            image_path: Source image
            output_path: Output image path
            strength: Denoising strength (higher = more smoothing)
            
        Returns:
            Path to denoised image
        """
        ScannerEngine._check_opencv()
        
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Apply Non-local Means Denoising
        denoised = cv2.fastNlMeansDenoisingColored(image, None, strength, strength, 7, 21)
        
        cv2.imwrite(str(output_path), denoised)
        return output_path
    
    @staticmethod
    def enhance_contrast(
        image_path: Path,
        output_path: Path,
        clip_limit: float = 2.0
    ) -> Path:
        """
        Enhance contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization).
        
        Args:
            image_path: Source image
            output_path: Output image path
            clip_limit: Threshold for contrast limiting
            
        Returns:
            Path to enhanced image
        """
        ScannerEngine._check_opencv()
        
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE to L channel
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        # Merge channels
        lab = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        cv2.imwrite(str(output_path), enhanced)
        return output_path
    
    @staticmethod
    def convert_to_grayscale(
        image_path: Path,
        output_path: Path
    ) -> Path:
        """Convert image to grayscale"""
        ScannerEngine._check_opencv()
        
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        cv2.imwrite(str(output_path), gray)
        
        return output_path
    
    @staticmethod
    def convert_to_black_white(
        image_path: Path,
        output_path: Path,
        adaptive: bool = True
    ) -> Path:
        """
        Convert image to black and white (binary).
        
        Args:
            image_path: Source image
            output_path: Output image path
            adaptive: Use adaptive thresholding for better results
            
        Returns:
            Path to B&W image
        """
        ScannerEngine._check_opencv()
        
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        if adaptive:
            # Adaptive thresholding for documents
            binary = cv2.adaptiveThreshold(
                gray, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                11, 2
            )
        else:
            # Otsu's thresholding
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        cv2.imwrite(str(output_path), binary)
        return output_path
    
    @staticmethod
    def resize_image(
        image_path: Path,
        output_path: Path,
        target_dpi: int = 300,
        current_dpi: int = 72
    ) -> Path:
        """
        Resize image to target DPI.
        
        Args:
            image_path: Source image
            output_path: Output image path
            target_dpi: Target DPI
            current_dpi: Current/assumed DPI
            
        Returns:
            Path to resized image
        """
        ScannerEngine._check_pil()
        
        img = Image.open(str(image_path))
        
        scale = target_dpi / current_dpi
        new_size = (int(img.width * scale), int(img.height * scale))
        
        resized = img.resize(new_size, Image.LANCZOS)
        resized.save(str(output_path), dpi=(target_dpi, target_dpi))
        
        return output_path
    
    @staticmethod
    def process_scan(
        image_path: Path,
        output_path: Path,
        options: Dict[str, Any]
    ) -> Tuple[Path, Dict[str, Any]]:
        """
        Apply full scan processing pipeline.
        
        Args:
            image_path: Source image
            output_path: Output image path
            options: Processing options
            
        Returns:
            Tuple of (output_path, processing_metadata)
        """
        import tempfile
        import shutil
        
        current_path = image_path
        temp_files = []
        metadata = {"operations": []}
        
        try:
            # Edge detection and perspective correction
            if options.get("edge_detection", True):
                corners = ScannerEngine.detect_document_edges(current_path)
                if corners:
                    metadata["corners_detected"] = corners
                    temp_path = Path(tempfile.mktemp(suffix=".png"))
                    temp_files.append(temp_path)
                    current_path = ScannerEngine.perspective_correction(
                        current_path, temp_path, corners
                    )
                    metadata["operations"].append("perspective_correction")
            
            # Auto crop
            if options.get("auto_crop", True):
                temp_path = Path(tempfile.mktemp(suffix=".png"))
                temp_files.append(temp_path)
                current_path = ScannerEngine.auto_crop(current_path, temp_path)
                metadata["operations"].append("auto_crop")
            
            # Deskew
            if options.get("auto_deskew", True):
                temp_path = Path(tempfile.mktemp(suffix=".png"))
                temp_files.append(temp_path)
                current_path, angle = ScannerEngine.deskew(current_path, temp_path)
                metadata["deskew_angle"] = angle
                metadata["operations"].append("deskew")
            
            # Noise removal
            if options.get("noise_removal", False):
                temp_path = Path(tempfile.mktemp(suffix=".png"))
                temp_files.append(temp_path)
                current_path = ScannerEngine.remove_noise(current_path, temp_path)
                metadata["operations"].append("noise_removal")
            
            # Contrast enhancement
            if options.get("auto_enhance", True):
                temp_path = Path(tempfile.mktemp(suffix=".png"))
                temp_files.append(temp_path)
                current_path = ScannerEngine.enhance_contrast(current_path, temp_path)
                metadata["operations"].append("contrast_enhancement")
            
            # Color mode conversion
            scan_mode = options.get("scan_mode", "color")
            if scan_mode == "grayscale":
                temp_path = Path(tempfile.mktemp(suffix=".png"))
                temp_files.append(temp_path)
                current_path = ScannerEngine.convert_to_grayscale(current_path, temp_path)
                metadata["operations"].append("grayscale")
            elif scan_mode == "black_white":
                temp_path = Path(tempfile.mktemp(suffix=".png"))
                temp_files.append(temp_path)
                current_path = ScannerEngine.convert_to_black_white(current_path, temp_path)
                metadata["operations"].append("black_white")
            
            # DPI adjustment
            target_dpi = options.get("dpi", 300)
            if target_dpi != 72:
                temp_path = Path(tempfile.mktemp(suffix=".png"))
                temp_files.append(temp_path)
                current_path = ScannerEngine.resize_image(
                    current_path, temp_path, target_dpi
                )
                metadata["operations"].append(f"resize_dpi_{target_dpi}")
            
            # Copy final result
            shutil.copy(str(current_path), str(output_path))
            
        finally:
            # Cleanup temp files
            for temp_file in temp_files:
                if temp_file.exists():
                    temp_file.unlink()
        
        return output_path, metadata
    
    @staticmethod
    def combine_images_to_pdf(
        image_paths: List[Path],
        output_path: Path,
        page_size: str = "a4"
    ) -> Path:
        """
        Combine multiple images into a single PDF.
        
        Args:
            image_paths: List of image paths
            output_path: Output PDF path
            page_size: Page size (a4, letter, etc.)
            
        Returns:
            Path to output PDF
        """
        ScannerEngine._check_pil()
        
        # Page sizes in pixels at 72 DPI
        page_sizes = {
            "a4": (595, 842),
            "letter": (612, 792),
            "legal": (612, 1008),
        }
        
        page_width, page_height = page_sizes.get(page_size, page_sizes["a4"])
        
        images = []
        for img_path in image_paths:
            img = Image.open(str(img_path))
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # Fit image to page while maintaining aspect ratio
            img_ratio = img.width / img.height
            page_ratio = page_width / page_height
            
            if img_ratio > page_ratio:
                new_width = page_width - 40  # Margin
                new_height = int(new_width / img_ratio)
            else:
                new_height = page_height - 40
                new_width = int(new_height * img_ratio)
            
            img = img.resize((new_width, new_height), Image.LANCZOS)
            
            # Create page with white background
            page = Image.new('RGB', (page_width, page_height), 'white')
            x = (page_width - new_width) // 2
            y = (page_height - new_height) // 2
            page.paste(img, (x, y))
            
            images.append(page)
        
        if images:
            images[0].save(
                str(output_path),
                save_all=True,
                append_images=images[1:],
                resolution=72.0
            )
        
        return output_path

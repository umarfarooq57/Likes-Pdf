"""
Compress PDF Converter
Reduces PDF file size using Ghostscript
"""
import os
import subprocess
import logging
from typing import Dict, Any

try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None

from app.core.conversion.converters.base import BaseConverter

logger = logging.getLogger(__name__)


class CompressPDFConverter(BaseConverter):
    """Compress PDF to reduce file size"""

    @staticmethod
    def _compress_with_pymupdf(input_path: str, output_path: str, quality: str) -> None:
        """Fallback compression when Ghostscript is unavailable."""
        if fitz is None:
            raise RuntimeError("Ghostscript is unavailable and PyMuPDF is not installed")

        quality_settings = {
            "screen": {"deflate": True, "garbage": 4, "linear": True},
            "ebook": {"deflate": True, "garbage": 3, "linear": True},
            "printer": {"deflate": True, "garbage": 2, "linear": False},
            "prepress": {"deflate": True, "garbage": 2, "linear": False},
        }

        doc = fitz.open(input_path)
        try:
            settings = quality_settings.get(quality, quality_settings["ebook"])
            doc.save(output_path, **settings)
        finally:
            doc.close()

    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Compress PDF using Ghostscript

        Options:
            - quality: Compression quality (screen, ebook, printer, prepress). Default: ebook
                screen   = 72 dpi  (smallest file, lowest quality)
                ebook    = 150 dpi (good balance)
                printer  = 300 dpi (high quality)
                prepress = 300 dpi (highest quality)
        """
        self._validate_input(input_path, [".pdf"])

        output_path = self._get_output_path(output_dir, output_file_id, ".pdf")

        try:
            quality = options.get("quality", "ebook")
            valid_qualities = ["screen", "ebook", "printer", "prepress"]
            if quality not in valid_qualities:
                quality = "ebook"

            logger.info(f"Compressing PDF (quality={quality}): {input_path}")

            original_size = os.path.getsize(input_path)

            cmd = [
                "gs",
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.4",
                f"-dPDFSETTINGS=/{quality}",
                "-dNOPAUSE",
                "-dQUIET",
                "-dBATCH",
                f"-sOutputFile={output_path}",
                input_path
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120
            )

            if result.returncode != 0:
                raise RuntimeError(f"Ghostscript failed: {result.stderr}")

            if not os.path.exists(output_path):
                raise RuntimeError("Ghostscript did not create output file")

            new_size = os.path.getsize(output_path)
            reduction = ((original_size - new_size) / original_size) * 100 if original_size > 0 else 0

            logger.info(
                f"Compression complete: {original_size} -> {new_size} bytes "
                f"({reduction:.1f}% reduction)"
            )
            return output_path

        except FileNotFoundError:
            logger.warning("Ghostscript not found, falling back to PyMuPDF compression")
            self._compress_with_pymupdf(input_path, output_path, quality)

            if not os.path.exists(output_path):
                raise RuntimeError("PyMuPDF fallback did not create output file")

            new_size = os.path.getsize(output_path)
            reduction = ((original_size - new_size) / original_size) * 100 if original_size > 0 else 0
            logger.info(
                f"Compression complete (fallback): {original_size} -> {new_size} bytes "
                f"({reduction:.1f}% reduction)"
            )
            return output_path

        except subprocess.TimeoutExpired:
            raise RuntimeError("Compression timed out (>120s)")
        except Exception as e:
            logger.error(f"Compress PDF failed: {e}", exc_info=True)
            raise RuntimeError(f"Compress PDF failed: {str(e)}")

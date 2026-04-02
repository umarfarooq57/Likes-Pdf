"""
File utilities for temp file management and cleanup
"""
import os
import time
import logging
from contextlib import contextmanager
from typing import Generator
import tempfile

logger = logging.getLogger(__name__)


@contextmanager
def temp_file(suffix: str = "", prefix: str = "pdf_", dir: str = "/tmp/pdf-temp") -> Generator[str, None, None]:
    """
    Context manager for temporary files
    Automatically deletes file when done
    
    Usage:
        with temp_file(suffix=".pdf") as temp_path:
            # Use temp_path
            pass
        # File is automatically deleted
    """
    os.makedirs(dir, exist_ok=True)
    
    fd, path = tempfile.mkstemp(suffix=suffix, prefix=prefix, dir=dir)
    os.close(fd)
    
    try:
        yield path
    finally:
        try:
            if os.path.exists(path):
                os.remove(path)
                logger.debug(f"Deleted temp file: {path}")
        except Exception as e:
            logger.warning(f"Failed to delete temp file {path}: {e}")


def cleanup_old_files(directory: str, max_age_hours: int) -> int:
    """
    Delete files older than max_age_hours
    
    Args:
        directory: Directory to clean
        max_age_hours: Maximum file age in hours
    
    Returns:
        Number of files deleted
    """
    if not os.path.exists(directory):
        return 0
    
    deleted_count = 0
    current_time = time.time()
    max_age_seconds = max_age_hours * 3600
    
    try:
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                
                if file_age > max_age_seconds:
                    try:
                        os.remove(file_path)
                        deleted_count += 1
                        logger.info(f"Deleted old file: {filename} (age: {file_age/3600:.1f}h)")
                    except Exception as e:
                        logger.error(f"Failed to delete {filename}: {e}")
    
    except Exception as e:
        logger.error(f"Cleanup failed for {directory}: {e}")
    
    return deleted_count


def get_file_size_mb(file_path: str) -> float:
    """Get file size in megabytes"""
    if not os.path.exists(file_path):
        return 0.0
    return os.path.getsize(file_path) / (1024 * 1024)


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks
    """
    # Remove path components
    filename = os.path.basename(filename)
    
    # Remove dangerous characters
    dangerous_chars = ['..', '/', '\\', '\0']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')
    
    return filename

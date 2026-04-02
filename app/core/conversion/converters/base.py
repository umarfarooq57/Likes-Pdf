"""
Base converter class
All converters inherit from this
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
import os


class BaseConverter(ABC):
    """Base class for all converters"""
    
    @abstractmethod
    async def convert(
        self,
        input_path: str,
        output_dir: str,
        output_file_id: str,
        options: Dict[str, Any]
    ) -> str:
        """
        Perform conversion
        
        Args:
            input_path: Path to input file
            output_dir: Directory to save output file
            output_file_id: Unique ID for output file
            options: Conversion options
        
        Returns:
            Path to output file
        """
        pass
    
    def _get_output_path(self, output_dir: str, output_file_id: str, extension: str) -> str:
        """Generate output file path"""
        if not extension.startswith("."):
            extension = f".{extension}"
        return os.path.join(output_dir, f"{output_file_id}{extension}")
    
    def _validate_input(self, input_path: str, allowed_extensions: list):
        """Validate input file exists and has correct extension"""
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")
        
        ext = os.path.splitext(input_path)[1].lower()
        if ext not in allowed_extensions:
            raise ValueError(
                f"Invalid input file type: {ext}. "
                f"Allowed: {', '.join(allowed_extensions)}"
            )

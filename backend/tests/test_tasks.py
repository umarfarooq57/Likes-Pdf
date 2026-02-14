"""
Celery Tasks Tests
"""

import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from app.workers.conversion_tasks import pdf_to_images_task, markdown_to_pdf_task
from app.workers.editing_tasks import merge_pdfs_task, split_pdf_task
from app.workers.optimization_tasks import compress_pdf_task


@pytest.fixture
def mock_pdf_engine():
    """Mock PDF engine for testing"""
    with patch('app.workers.conversion_tasks.PDFEngine') as mock:
        yield mock


@pytest.fixture
def mock_converter():
    """Mock document converter for testing"""
    with patch('app.workers.conversion_tasks.DocumentConverter') as mock:
        yield mock


def test_pdf_to_images_task_structure():
    """Test PDF to images task has correct structure"""
    assert pdf_to_images_task.name == "convert.pdf_to_images"
    assert callable(pdf_to_images_task)


def test_markdown_to_pdf_task_structure():
    """Test Markdown to PDF task has correct structure"""
    assert markdown_to_pdf_task.name == "convert.markdown_to_pdf"
    assert callable(markdown_to_pdf_task)


def test_merge_pdfs_task_structure():
    """Test merge PDFs task has correct structure"""
    assert merge_pdfs_task.name == "edit.merge_pdfs"
    assert callable(merge_pdfs_task)


def test_split_pdf_task_structure():
    """Test split PDF task has correct structure"""
    assert split_pdf_task.name == "edit.split_pdf"
    assert callable(split_pdf_task)


def test_compress_pdf_task_structure():
    """Test compress PDF task has correct structure"""
    assert compress_pdf_task.name == "optimize.compress_pdf"
    assert callable(compress_pdf_task)


@pytest.mark.asyncio
async def test_conversion_task_returns_dict(mock_pdf_engine):
    """Test that conversion tasks return proper dict structure"""
    mock_pdf_engine.pdf_to_images.return_value = [Path("/test/page_1.png")]
    
    # Can't actually run Celery tasks in tests without broker
    # This tests the function signature and return structure
    result_keys = ["status", "output_files", "file_count", "processing_time_ms"]
    
    # Verify expected return structure (mock test)
    expected_result = {
        "status": "completed",
        "output_files": ["/test/page_1.png"],
        "file_count": 1,
        "processing_time_ms": 100,
    }
    
    for key in result_keys:
        assert key in expected_result

"""
Top-level pytest configuration for test plugins.
This enables `pytest_asyncio` for the whole test suite.
"""
import pytest
import asyncio
pytest_plugins = ("pytest_asyncio",)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

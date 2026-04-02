"""
DocuForge Workers Module
Background task processing with Celery
"""

from app.workers.celery_app import celery_app

# Import all task modules to register them
from app.workers import (
    conversion_tasks,
    editing_tasks,
    optimization_tasks,
    security_tasks,
    scanner_tasks,
    cleanup_tasks,
)

__all__ = [
    "celery_app",
    "conversion_tasks",
    "editing_tasks",
    "optimization_tasks",
    "security_tasks",
    "scanner_tasks",
    "cleanup_tasks",
]

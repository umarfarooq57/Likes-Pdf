"""
Celery Application Configuration
DocuForge Background Task Processing
"""

from celery import Celery

from app.core.config import settings


celery_app = Celery(
    "docuforge",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.conversion_tasks",
        "app.workers.editing_tasks",
        "app.workers.optimization_tasks",
        "app.workers.security_tasks",
        "app.workers.scanner_tasks",
        "app.workers.cleanup_tasks",
    ],
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes
    task_soft_time_limit=550,
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
    result_expires=7200,  # 2 hours
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# Task routing by priority
celery_app.conf.task_routes = {
    "app.workers.conversion_tasks.*": {"queue": "conversions"},
    "app.workers.editing_tasks.*": {"queue": "editing"},
    "app.workers.optimization_tasks.*": {"queue": "optimization"},
    "app.workers.security_tasks.*": {"queue": "security"},
    "app.workers.scanner_tasks.*": {"queue": "scanner"},
    "app.workers.cleanup_tasks.*": {"queue": "cleanup"},
}

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "cleanup-temp-files": {
        "task": "app.workers.cleanup_tasks.cleanup_temp_files",
        "schedule": 3600.0,  # Every hour
    },
    "cleanup-expired-documents": {
        "task": "app.workers.cleanup_tasks.cleanup_expired_documents",
        "schedule": 86400.0,  # Every 24 hours
    },
    "reset-daily-usage": {
        "task": "app.workers.cleanup_tasks.reset_daily_usage",
        "schedule": 86400.0,  # Every 24 hours
    },
}

"""
Configuration management using Pydantic Settings
Loads from environment variables and .env file
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""

    # Environment
    env: str = Field(default="development", alias="ENV")

    # Database
    database_url: str = Field(
        default="postgresql://postgres:pdfpassword@localhost:5432/pdf_platform",
        alias="DATABASE_URL"
    )

    # Redis (Phase 1+)
    redis_url: Optional[str] = Field(default=None, alias="REDIS_URL")

    # Storage
    storage_path: str = Field(default="./storage", alias="STORAGE_PATH")
    max_upload_size_mb: int = Field(default=10, alias="MAX_UPLOAD_SIZE_MB")
    file_retention_hours: int = Field(default=1, alias="FILE_RETENTION_HOURS")

    # Application
    app_name: str = Field(default="PDF Platform", alias="APP_NAME")
    app_version: str = Field(default="1.0.0", alias="APP_VERSION")

    # CORS
    allowed_origins: str = Field(default="*", alias="ALLOWED_ORIGINS")

    # Rate Limiting
    rate_limit_per_minute: int = Field(
        default=60, alias="RATE_LIMIT_PER_MINUTE")

    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_format: str = Field(default="json", alias="LOG_FORMAT")

    # Worker (Phase 1+)
    worker_concurrency: int = Field(default=2, alias="WORKER_CONCURRENCY")
    max_workers: int = Field(default=2, alias="MAX_WORKERS")
    max_jobs_per_worker: int = Field(default=50, alias="MAX_JOBS_PER_WORKER")

    # Security
    secret_key: str = Field(
        default="change-this-in-production", alias="SECRET_KEY")

    # Feature Flags
    enable_async_processing: bool = Field(
        default=True, alias="ENABLE_ASYNC_PROCESSING")
    enable_ocr: bool = Field(default=False, alias="ENABLE_OCR")
    enable_batch_processing: bool = Field(
        default=True, alias="ENABLE_BATCH_PROCESSING")

    # Pydantic v2 configuration: use `model_config` to control env loading
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        # Allow extra environment variables (e.g., POSTGRES_USER) without error
        "extra": "ignore",
    }


# Global settings instance
settings = Settings()


# Computed properties
def get_max_upload_size_bytes() -> int:
    """Get max upload size in bytes"""
    return settings.max_upload_size_mb * 1024 * 1024


def get_allowed_origins_list() -> list:
    """Parse CORS origins from comma-separated string"""
    if settings.allowed_origins == "*":
        return ["*"]
    return [origin.strip() for origin in settings.allowed_origins.split(",")]


def ensure_directories():
    """Create necessary directories if they don't exist"""
    dirs = [
        settings.storage_path,
        os.path.join(settings.storage_path, "uploads"),
        os.path.join(settings.storage_path, "outputs"),
        "logs",
        "/tmp/pdf-temp"
    ]
    for directory in dirs:
        os.makedirs(directory, exist_ok=True)

"""
Application Configuration
Environment-based settings with Pydantic
Complete configuration for DocuForge PDF Platform
"""

from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Project
    PROJECT_NAME: str = "DocuForge"
    PROJECT_DESCRIPTION: str = "Enterprise PDF & Document Platform"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    VERSION: str = "1.0.0"

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Database (SQLite for development, PostgreSQL for production)
    DATABASE_URL: str = "sqlite+aiosqlite:///./docuforge.db"
    DATABASE_URL_SYNC: str = "sqlite:///./docuforge.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # File Storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "storage" / "processed"
    TEMP_DIR: Path = BASE_DIR / "storage" / "temp"
    TEMPLATES_DIR: Path = BASE_DIR / "storage" / "templates"

    # File Limits
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    MAX_BATCH_FILES: int = 50
    ALLOWED_EXTENSIONS: List[str] = [
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
        "jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff",
        "html", "htm", "md", "txt", "csv", "xml", "json",
        "rtf", "odt", "ods", "odp", "epub", "tex"
    ]

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://frontend:3000",
    ]

    # Processing
    MAX_WORKERS: int = 4
    JOB_TIMEOUT: int = 600  # 10 minutes
    MAX_PDF_PAGES: int = 5000

    # AI Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-opus-20240229"

    # AI Limits
    AI_MAX_TOKENS: int = 4000
    AI_TEMPERATURE: float = 0.3
    AI_MAX_CONTEXT_LENGTH: int = 100000

    # OCR Configuration
    TESSERACT_PATH: Optional[str] = None
    OCR_LANGUAGES: str = "eng"
    OCR_DPI: int = 300

    # Cloud Storage
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # Google Cloud
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    GCS_BUCKET: Optional[str] = None

    # Dropbox
    DROPBOX_APP_KEY: Optional[str] = None
    DROPBOX_APP_SECRET: Optional[str] = None

    # OneDrive
    ONEDRIVE_CLIENT_ID: Optional[str] = None
    ONEDRIVE_CLIENT_SECRET: Optional[str] = None

    # Email (for notifications)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@docuforge.io"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds

    # Subscription Tiers (operations per month)
    FREE_TIER_LIMIT: int = 50
    PRO_TIER_LIMIT: int = 5000
    ENTERPRISE_TIER_LIMIT: int = -1  # Unlimited

    # File Retention (in days)
    TEMP_FILE_RETENTION: int = 1
    PROCESSED_FILE_RETENTION: int = 7
    PREMIUM_FILE_RETENTION: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

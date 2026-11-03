"""
DocuForge - Enterprise PDF & Document Platform
Production-ready document utility SaaS platform
"""

import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router
from app.middleware.rate_limit import RateLimitMiddleware
from fastapi import UploadFile, File, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.document_service import DocumentService
import uuid

# Optional PDF engine for page-count extraction
try:
    from app.engines.pdf_engine import PDFEngine as _PDFEngine
    _PDF_ENGINE_OK = True
except Exception:
    _PDFEngine = None  # type: ignore[assignment]
    _PDF_ENGINE_OK = False


def _get_page_count(storage_key: str) -> int | None:
    """Return PDF page count or None if unavailable."""
    if not _PDF_ENGINE_OK:
        return None
    try:
        return _PDFEngine.get_page_count(settings.UPLOAD_DIR / storage_key)
    except Exception:
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("Starting DocuForge API...")

    # Create upload directories
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)

    # Create static directory if not exists
    static_dir = Path(__file__).parent.parent / "static"
    static_dir.mkdir(parents=True, exist_ok=True)

    yield

    # Shutdown
    print("Shutting down DocuForge API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Next-generation document utility platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiting middleware
try:
    app.add_middleware(RateLimitMiddleware)
except Exception:
    pass

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "content-disposition", "*"],
)

# Mount static files for downloads (created in lifespan)
static_path = Path(__file__).parent.parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Production Proxy Endpoints - Next.js forwards /api/* requests here
@app.post('/api/upload')
async def api_upload(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Production upload endpoint for Next.js same-origin proxy"""
    try:
        # Enforce file size limit before processing
        if file.size and file.size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB"
            )
        service = DocumentService(db)
        document = await service.upload_file(file, user_id=None)
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    page_count = None
    if document.file_extension in ('pdf',):
        page_count = await asyncio.to_thread(_get_page_count, document.storage_key)

    return {
        'id': str(document.id),
        'file_id': str(document.id),
        'filename': document.original_name,
        'size': document.file_size,
        'size_mb': round(document.file_size / (1024*1024), 2),
        'mime_type': document.mime_type,
        'page_count': page_count,
        'upload_time': document.created_at.isoformat() if hasattr(document, 'created_at') else None,
        'expires_in_hours': 24,
    }


@app.post('/api/upload/batch')
async def api_upload_batch(files: list[UploadFile] = File(...), db: AsyncSession = Depends(get_db)):
    """Batch upload endpoint - uploads all files concurrently."""
    service = DocumentService(db)

    async def _upload_one(file: UploadFile) -> dict:
        try:
            if file.size and file.size > settings.MAX_UPLOAD_SIZE:
                raise ValueError(f"File '{file.filename}' too large. Maximum size is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB")
            document = await service.upload_file(file, user_id=None)
            page_count = None
            if document.file_extension in ('pdf',):
                page_count = await asyncio.to_thread(_get_page_count, document.storage_key)
            return {
                'id': str(document.id),
                'file_id': str(document.id),
                'filename': document.original_name,
                'size': document.file_size,
                'mime_type': document.mime_type,
                'page_count': page_count,
                'success': True,
                'error': None,
            }
        except Exception as e:
            return {
                'id': None,
                'file_id': None,
                'filename': getattr(file, 'filename', 'unknown'),
                'success': False,
                'error': str(e),
            }

    results = await asyncio.gather(*[_upload_one(f) for f in files])
    return list(results)


# Compatibility endpoints (legacy frontend paths)
@app.post('/documents/upload')
async def compat_upload_document(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    # Reuse DocumentService upload logic
    try:
        if file.size and file.size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB"
            )
        service = DocumentService(db)
        document = await service.upload_file(file, user_id=None)
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    page_count = None
    if document.file_extension in ('pdf',):
        page_count = await asyncio.to_thread(_get_page_count, document.storage_key)

    return {
        'id': str(document.id),
        'file_id': str(document.id),
        'filename': document.original_name,
        'size': document.file_size,
        'size_mb': round(document.file_size / (1024*1024), 2),
        'mime_type': document.mime_type,
        'page_count': page_count,
        'upload_time': document.created_at.isoformat() if hasattr(document, 'created_at') else None,
        'expires_in_hours': 24,
    }


@app.post('/documents/upload/batch')
async def compat_upload_batch(files: list[UploadFile] = File(...), db: AsyncSession = Depends(get_db)):
    service = DocumentService(db)
    async def _compat_upload_one(file: UploadFile) -> dict:
        try:
            if file.size and file.size > settings.MAX_UPLOAD_SIZE:
                raise ValueError(f"File '{file.filename}' too large. Maximum size is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB")
            document = await service.upload_file(file, user_id=None)
            page_count = None
            if document.file_extension in ('pdf',):
                page_count = await asyncio.to_thread(_get_page_count, document.storage_key)
            return {
                'id': str(document.id),
                'file_id': str(document.id),
                'filename': document.original_name,
                'size': document.file_size,
                'mime_type': document.mime_type,
                'page_count': page_count,
                'success': True,
                'error': None,
            }
        except Exception as e:
            return {
                'id': None,
                'file_id': None,
                'filename': getattr(file, 'filename', 'unknown'),
                'success': False,
                'error': str(e),
            }

    results = await asyncio.gather(*[_compat_upload_one(f) for f in files])
    return list(results)



@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "DocuForge API",
        "version": "1.0.0",
        "description": "Enterprise PDF & Document Platform"
    }


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check — tests real connectivity"""
    import time
    from sqlalchemy import text

    health = {
        "status": "healthy",
        "timestamp": time.time(),
        "database": "unknown",
        "redis": "unknown",
        "workers": "unknown",
    }
    overall_ok = True

    # --- Database check ---
    try:
        await db.execute(text("SELECT 1"))
        health["database"] = "connected"
    except Exception as e:
        health["database"] = f"error: {str(e)[:100]}"
        overall_ok = False

    # --- Redis check ---
    try:
        import redis as redis_lib
        r = redis_lib.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        r.ping()
        health["redis"] = "connected"
        r.close()
    except Exception:
        # Redis optional — warn but don't fail
        health["redis"] = "unavailable (Celery tasks will run synchronously)"

    # --- Celery workers check ---
    try:
        from app.workers.celery_app import celery_app
        inspector = celery_app.control.inspect(timeout=1)
        active = inspector.active()
        if active:
            health["workers"] = f"active ({len(active)} node(s))"
        else:
            health["workers"] = "no workers running (synchronous fallback active)"
    except Exception:
        health["workers"] = "unavailable (synchronous fallback active)"

    if not overall_ok:
        health["status"] = "degraded"

    return health

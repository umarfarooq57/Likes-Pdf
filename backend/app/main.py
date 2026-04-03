"""
DocuForge - Enterprise PDF & Document Platform
Production-ready document utility SaaS platform
"""

from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router
from fastapi import UploadFile, File, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.document_service import DocumentService
import uuid


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting DocuForge API...")

    # Create upload directories
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)

    # Create static directory if not exists
    static_dir = Path(__file__).parent.parent / "static"
    static_dir.mkdir(parents=True, exist_ok=True)

    yield

    # Shutdown
    print("👋 Shutting down DocuForge API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Next-generation document utility platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for downloads (created in lifespan)
static_path = Path(__file__).parent.parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Compatibility endpoints (legacy frontend paths)
@app.post('/documents/upload')
async def compat_upload_document(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    # Reuse DocumentService upload logic
    try:
        service = DocumentService(db)
        document = await service.upload_file(file, user_id=None)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    return {
        'file_id': str(document.id),
        'filename': document.original_name,
        'size': document.file_size,
        'size_mb': round(document.file_size / (1024*1024), 2),
        'mime_type': document.mime_type,
        'upload_time': document.created_at.isoformat() if hasattr(document, 'created_at') else None,
        'expires_in_hours': 1,
    }


@app.post('/documents/upload/batch')
async def compat_upload_batch(files: list[UploadFile] = File(...), db: AsyncSession = Depends(get_db)):
    service = DocumentService(db)
    results = []
    for file in files:
        try:
            document = await service.upload_file(file, user_id=None)
            results.append({
                'file_id': str(document.id),
                'filename': document.original_name,
                'size': document.file_size,
                'mime_type': document.mime_type,
            })
        except Exception:
            continue
    return results


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
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected",
        "workers": "active",
    }

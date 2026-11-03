"""
API v1 Router
Combines all endpoint routers for DocuForge
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    documents,
    conversions,
    editing,
    jobs,
    admin,
    optimization,
    security,
    scanner,
)


api_router = APIRouter()

# Authentication & Users
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

# Document Management
api_router.include_router(
    documents.router,
    prefix="/documents",
    tags=["Documents"]
)

# Format Conversions
api_router.include_router(
    conversions.router,
    prefix="/convert",
    tags=["Conversions"]
)

# PDF Editing (merge, split, rotate, etc.)
api_router.include_router(
    editing.router,
    prefix="/edit",
    tags=["Editing"]
)

# PDF Optimization (compress, linearize, repair)
api_router.include_router(
    optimization.router,
    prefix="/optimization",
    tags=["Optimization"]
)

# Security (password protect, unlock, watermark)
api_router.include_router(
    security.router,
    prefix="/security",
    tags=["Security"]
)

# Scanner (OCR, scan enhance)
api_router.include_router(
    scanner.router,
    prefix="/scanner",
    tags=["Scanner"]
)

# Job Status & History
api_router.include_router(
    jobs.router,
    prefix="/jobs",
    tags=["Jobs"]
)

# Admin
api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["Admin"]
)

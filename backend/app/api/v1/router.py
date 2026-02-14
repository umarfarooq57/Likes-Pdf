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
    optimization,
    security,
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

# PDF Optimization (compress, repair, linearize)
api_router.include_router(
    optimization.router,
    prefix="/optimize",
    tags=["Optimization"]
)

# PDF Security (password, watermark, signatures)
api_router.include_router(
    security.router,
    prefix="/security",
    tags=["Security"]
)

# PDF Security (password, watermark, signatures)
api_router.include_router(
    security.router,
    prefix="/security",
    tags=["Security"]
)

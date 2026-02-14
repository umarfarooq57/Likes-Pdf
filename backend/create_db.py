"""
Database Creation Script
Creates all tables for DocuForge
"""

import asyncio
from app.core.database import engine, Base

# Import all models so they are registered with Base.metadata
from app.models import (
    User, Document, DocumentVersion,
    Conversion, Workflow, WorkflowRun,
    Plan, Subscription, Invoice, UsageRecord,
    ScanSession, ScanPage, ScanTemplate,
    AITask, ChatConversation, ChatMessage, DocumentAnalysis, OCRResult,
    PDFProtection, Watermark, AppliedWatermark, DigitalSignature, SigningCertificate, FileEncryption,
    ActivityLog, APIRequestLog, SystemHealth, ErrorLog, JobQueue, Notification,
)


async def create_all_tables():
    """Create all database tables"""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created successfully!")
    
    # Print all created tables
    async with engine.begin() as conn:
        def get_tables(connection):
            return Base.metadata.tables.keys()
        tables = await conn.run_sync(get_tables)
        print(f"\n📋 Created {len(list(tables))} tables:")
        for table in sorted(tables):
            print(f"   - {table}")


if __name__ == "__main__":
    asyncio.run(create_all_tables())

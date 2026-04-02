# DocuForge Database Schema (AI features excluded)

This document defines the core database schema for DocuForge, intentionally excluding AI/OCR-specific tables and fields per project scope.

## Principles
- Keep schema minimal and normalized.
- Use UUID primary keys for public-facing resources.
- Add audit logs for important actions.
- Use separate `document_versions` for versioning files.

## Tables

### users
- id: UUID (PK)
- email: string (unique, indexed)
- password_hash: string
- full_name: string
- role: enum (`free`, `pro`, `admin`)
- is_active: bool
- is_verified: bool
- created_at: datetime
- last_login: datetime (nullable)

Indexes: email (unique)

### documents
- id: UUID (PK)
- owner_id: UUID (FK -> users.id)
- filename: string
- storage_path: string
- file_size: integer
- mime_type: string
- status: enum (`uploaded`, `processing`, `processed`, `failed`)
- created_at: datetime
- processed_at: datetime (nullable)

Indexes: owner_id, status

### document_versions
- id: UUID (PK)
- document_id: UUID (FK -> documents.id)
- version_index: integer
- filename: string
- storage_path: string
- file_size: integer
- created_at: datetime

Unique constraint: (document_id, version_index)

### jobs
- id: UUID (PK)
- type: string (e.g., `conversion`, `optimization`, `unlock`)
- status: enum(`pending`,`running`,`completed`,`failed`)
- payload: JSON (job parameters)
- result_ref: JSON (result metadata or output document id)
- progress: integer (0-100)
- created_at: datetime
- started_at: datetime (nullable)
- finished_at: datetime (nullable)

Indexes: status, type

### audit_logs
- id: UUID (PK)
- actor_id: UUID (FK -> users.id, nullable for system actions)
- action: string
- resource_type: string
- resource_id: UUID (nullable)
- meta: JSON
- created_at: datetime

Indexes: actor_id, resource_type

### tokens (optional)
- id: UUID (PK)
- user_id: UUID (FK -> users.id)
- refresh_token: string (hashed)
- revoked: boolean
- created_at: datetime
- expires_at: datetime

## Alembic Migration Plan
1. Create initial migration `0001_create_core_tables` to add `users`, `documents`, `document_versions`, `jobs`, `audit_logs`.
2. Add unique/index constraints and FK relationships in migration.
3. Seed admin user (optional) via a data migration.
4. Future migrations: add features incrementally (e.g., subscriptions, quotas, new engines).

## Notes about AI/OCR
- All AI/OCR-related tables (e.g., `ai_tasks`, `ocr_results`, `document_analysis`) are intentionally omitted.
- If AI features are re-introduced later, create a separate migration and namespace those tables.

## Next Implementation Steps
1. Add SQLAlchemy models for the above tables under `backend/app/models/` (if missing) respecting existing naming conventions.
2. Configure Alembic `env.py` target metadata to include these models.
3. Create migration file using `alembic revision --autogenerate -m "create core tables"` and review.
4. Run migrations against a local development DB and fix any schema issues.

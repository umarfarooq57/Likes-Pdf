"""seed admin user

Revision ID: 20260224_seed_admin_user
Revises: 1f2cfb6fc77d
Create Date: 2026-02-24 00:10:00.000000
"""
from alembic import op
import sqlalchemy as sa
import uuid
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '20260224_seed_admin_user'
down_revision = '1f2cfb6fc77d'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    users_table = sa.table(
        'users',
        sa.column('id', sa.String(length=36)),
        sa.column('email', sa.String(length=255)),
        sa.column('hashed_password', sa.String(length=255)),
        sa.column('full_name', sa.String(length=255)),
        sa.column('is_active', sa.Boolean()),
        sa.column('is_verified', sa.Boolean()),
        sa.column('is_superuser', sa.Boolean()),
        sa.column('role', sa.String(length=50)),
        sa.column('created_at', sa.DateTime())
    )

    admin_id = str(uuid.uuid4())
    # Password: Admin123!
    hashed = "$2b$12$2GGzRzQGEAYWkT4eygdO/uSk4Ryd5L8xYncnLwHa0J9lLE6aEgDu2"

    insert = users_table.insert().values(
        id=admin_id,
        email='admin@example.com',
        hashed_password=hashed,
        full_name='Administrator',
        is_active=True,
        is_verified=True,
        is_superuser=True,
        role='admin',
        created_at=datetime.utcnow()
    )

    try:
        conn.execute(insert)
    except Exception:
        # Ignore if already exists
        pass


def downgrade():
    conn = op.get_bind()
    try:
        conn.execute(
            sa.text("DELETE FROM users WHERE email='admin@example.com'"))
    except Exception:
        pass

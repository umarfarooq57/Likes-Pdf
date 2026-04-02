"""remove ai and ocr columns

Revision ID: 20260224_remove_ai_ocr_columns
Revises: 
Create Date: 2026-02-24 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260224_remove_ai_ocr_columns'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Drop scanner OCR columns if they exist
    with op.get_context().autocommit_block():
        try:
            op.drop_column('scan_sessions', 'ocr_enabled')
        except Exception:
            pass
        try:
            op.drop_column('scan_sessions', 'ocr_language')
        except Exception:
            pass
        try:
            op.drop_column('scan_pages', 'ocr_text')
        except Exception:
            pass
        try:
            op.drop_column('scan_pages', 'ocr_confidence')
        except Exception:
            pass
        try:
            op.drop_column('scan_templates', 'ocr_enabled')
        except Exception:
            pass
        try:
            op.drop_column('scan_templates', 'ocr_language')
        except Exception:
            pass

    # Drop subscription feature flags
    with op.get_context().autocommit_block():
        try:
            op.drop_column('plans', 'ai_enabled')
        except Exception:
            pass
        try:
            op.drop_column('plans', 'ocr_enabled')
        except Exception:
            pass


def downgrade():
    # Recreate columns (best-effort defaults)
    with op.batch_alter_table('scan_sessions') as batch_op:
        batch_op.add_column(sa.Column(
            'ocr_enabled', sa.Boolean(), nullable=False, server_default=sa.text('0')))
        batch_op.add_column(sa.Column('ocr_language', sa.String(
            length=50), nullable=False, server_default='eng'))

    with op.batch_alter_table('scan_pages') as batch_op:
        batch_op.add_column(sa.Column('ocr_text', sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column('ocr_confidence', sa.Float(), nullable=True))

    with op.batch_alter_table('scan_templates') as batch_op:
        batch_op.add_column(sa.Column(
            'ocr_enabled', sa.Boolean(), nullable=False, server_default=sa.text('0')))
        batch_op.add_column(sa.Column('ocr_language', sa.String(
            length=50), nullable=False, server_default='eng'))

    with op.batch_alter_table('plans') as batch_op:
        batch_op.add_column(sa.Column(
            'ai_enabled', sa.Boolean(), nullable=False, server_default=sa.text('0')))
        batch_op.add_column(sa.Column(
            'ocr_enabled', sa.Boolean(), nullable=False, server_default=sa.text('0')))

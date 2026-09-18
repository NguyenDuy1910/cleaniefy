"""Create the Cleanie V1 relational schema.

Revision ID: 20260918_0001
Revises:
Create Date: 2026-09-18
"""
from alembic import op
from backend.db.session import Base
import backend.models  # noqa: F401 - ensures every table is registered

revision = "20260918_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Initial schema intentionally mirrors the SQLAlchemy models. Subsequent migrations are explicit deltas.
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())

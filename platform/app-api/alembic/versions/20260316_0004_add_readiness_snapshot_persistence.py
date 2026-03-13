"""Add bounded readiness-support snapshot persistence.

Revision ID: 20260316_0004
Revises: 20260315_0003
Create Date: 2026-03-16 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260316_0004"
down_revision: str | None = "20260315_0003"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Create one narrow table for persisted readiness-support snapshots."""
    op.create_table(
        "readiness_snapshots",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("persisted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("readiness_status", sa.String(length=64), nullable=False),
        sa.Column("planning_readiness", sa.String(length=64), nullable=False),
        sa.Column("phase_recommendation", sa.String(length=96), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("readiness_scope", sa.Text(), nullable=False),
        sa.Column("notes", sa.JSON(), nullable=False),
        sa.Column("strongest_blockers", sa.JSON(), nullable=False),
        sa.Column("bounded_next_steps", sa.JSON(), nullable=False),
        sa.Column("evidence_coverage_counts", sa.JSON(), nullable=False),
        sa.Column("support_posture_counts", sa.JSON(), nullable=False),
        sa.Column("prerequisites", sa.JSON(), nullable=False),
        sa.Column("assessment_areas", sa.JSON(), nullable=False),
        sa.Column("blockers", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_readiness_snapshots")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_readiness_snapshots_persisted_at"),
        "readiness_snapshots",
        ["persisted_at"],
        unique=False,
        schema="platform_app",
    )


def downgrade() -> None:
    """Drop the bounded readiness-support snapshot table."""
    op.drop_index(
        op.f("ix_platform_app_readiness_snapshots_persisted_at"),
        table_name="readiness_snapshots",
        schema="platform_app",
    )
    op.drop_table("readiness_snapshots", schema="platform_app")

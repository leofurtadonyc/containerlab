"""Add validation request and validation event tables (validation engine v1).

Revision ID: 20260327_0008
Revises: 20260326_0007
Create Date: 2026-03-27
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260327_0008"
down_revision: str | None = "20260326_0007"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Create durable validation backbone (backend-owned verdicts; not actuation)."""
    op.create_table(
        "validation_requests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "workflow_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.workflow_lifecycles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "preview_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.preview_requests.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
        sa.Column("validation_type", sa.String(length=128), nullable=False),
        sa.Column("validation_context", sa.String(length=32), nullable=False),
        sa.Column("target_kind", sa.String(length=64), nullable=False),
        sa.Column("target_ids", sa.JSON(), nullable=False),
        sa.Column("target_scope", sa.JSON(), nullable=True),
        sa.Column("requested_checkset", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by_actor_type", sa.String(length=32), nullable=False),
        sa.Column("created_by_actor_id", sa.String(length=255), nullable=False),
        sa.Column("created_by_actor_display_name", sa.Text(), nullable=True),
        sa.Column("validation_status", sa.String(length=32), nullable=False),
        sa.Column("capability_decision_state", sa.String(length=32), nullable=False),
        sa.Column("capability_decision_reason", sa.Text(), nullable=True),
        sa.Column("truth_scope_summary", sa.JSON(), nullable=False),
        sa.Column("truth_fingerprint", sa.String(length=64), nullable=True),
        sa.Column("overall_verdict", sa.String(length=32), nullable=True),
        sa.Column("stale_posture", sa.String(length=32), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("extension_hints", sa.JSON(), nullable=True),
        sa.Column("result_json", sa.JSON(), nullable=False),
        sa.Column("processing_duration_ms", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_validation_requests")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_validation_requests_workflow_id"),
        "validation_requests",
        ["workflow_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_validation_requests_preview_id"),
        "validation_requests",
        ["preview_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_validation_requests_validation_type"),
        "validation_requests",
        ["validation_type"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_validation_requests_created_at"),
        "validation_requests",
        ["created_at"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_validation_requests_idempotency_key"),
        "validation_requests",
        ["idempotency_key"],
        unique=True,
        schema="platform_app",
        postgresql_where=sa.text("idempotency_key IS NOT NULL"),
    )

    op.create_table(
        "validation_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "validation_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.validation_requests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actor", sa.String(length=255), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("provenance", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_validation_events")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_validation_events_validation_id"),
        "validation_events",
        ["validation_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_validation_events_occurred_at"),
        "validation_events",
        ["occurred_at"],
        unique=False,
        schema="platform_app",
    )


def downgrade() -> None:
    """Drop validation tables."""
    op.drop_index(
        op.f("ix_platform_app_validation_events_occurred_at"),
        table_name="validation_events",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_validation_events_validation_id"),
        table_name="validation_events",
        schema="platform_app",
    )
    op.drop_table("validation_events", schema="platform_app")
    op.drop_index(
        op.f("ix_platform_app_validation_requests_idempotency_key"),
        table_name="validation_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_validation_requests_created_at"),
        table_name="validation_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_validation_requests_validation_type"),
        table_name="validation_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_validation_requests_preview_id"),
        table_name="validation_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_validation_requests_workflow_id"),
        table_name="validation_requests",
        schema="platform_app",
    )
    op.drop_table("validation_requests", schema="platform_app")

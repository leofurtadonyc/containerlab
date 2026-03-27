"""Add preview request and preview event tables (dry-run / preview / diff v1).

Revision ID: 20260326_0007
Revises: 20260326_0006
Create Date: 2026-03-26 12:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260326_0007"
down_revision: str | None = "20260326_0006"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Create durable preview backbone (record management; not network actuation)."""
    op.create_table(
        "preview_requests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "workflow_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.workflow_lifecycles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
        sa.Column("preview_type", sa.String(length=128), nullable=False),
        sa.Column("target_kind", sa.String(length=64), nullable=False),
        sa.Column("target_ids", sa.JSON(), nullable=False),
        sa.Column("target_scope", sa.JSON(), nullable=True),
        sa.Column("requested_action_type", sa.String(length=96), nullable=False),
        sa.Column("requested_payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by_actor_type", sa.String(length=32), nullable=False),
        sa.Column("created_by_actor_id", sa.String(length=255), nullable=False),
        sa.Column("created_by_actor_display_name", sa.Text(), nullable=True),
        sa.Column("preview_status", sa.String(length=32), nullable=False),
        sa.Column("capability_decision_state", sa.String(length=32), nullable=False),
        sa.Column("capability_decision_reason", sa.Text(), nullable=True),
        sa.Column("capability_decision_source", sa.String(length=64), nullable=False),
        sa.Column("truth_scope_summary", sa.JSON(), nullable=False),
        sa.Column("truth_fingerprint", sa.String(length=64), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("extension_hints", sa.JSON(), nullable=True),
        sa.Column("result_json", sa.JSON(), nullable=False),
        sa.Column("processing_duration_ms", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_preview_requests")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_preview_requests_workflow_id"),
        "preview_requests",
        ["workflow_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_preview_requests_preview_type"),
        "preview_requests",
        ["preview_type"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_preview_requests_created_at"),
        "preview_requests",
        ["created_at"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_preview_requests_idempotency_key"),
        "preview_requests",
        ["idempotency_key"],
        unique=True,
        schema="platform_app",
        postgresql_where=sa.text("idempotency_key IS NOT NULL"),
    )

    op.create_table(
        "preview_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "preview_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.preview_requests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actor", sa.String(length=255), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("provenance", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_preview_events")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_preview_events_preview_id"),
        "preview_events",
        ["preview_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_preview_events_occurred_at"),
        "preview_events",
        ["occurred_at"],
        unique=False,
        schema="platform_app",
    )


def downgrade() -> None:
    """Drop preview tables."""
    op.drop_index(
        op.f("ix_platform_app_preview_events_occurred_at"),
        table_name="preview_events",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_preview_events_preview_id"),
        table_name="preview_events",
        schema="platform_app",
    )
    op.drop_table("preview_events", schema="platform_app")
    op.drop_index(
        op.f("ix_platform_app_preview_requests_idempotency_key"),
        table_name="preview_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_preview_requests_created_at"),
        table_name="preview_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_preview_requests_preview_type"),
        table_name="preview_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_preview_requests_workflow_id"),
        table_name="preview_requests",
        schema="platform_app",
    )
    op.drop_table("preview_requests", schema="platform_app")

"""Add durable workflow lifecycle records and transition events.

Revision ID: 20260326_0006
Revises: 20260318_0005
Create Date: 2026-03-26 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260326_0006"
down_revision: str | None = "20260318_0005"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Create workflow lifecycle backbone tables (record management, not actuation)."""
    op.create_table(
        "workflow_lifecycles",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("workflow_type", sa.String(length=96), nullable=False),
        sa.Column("workflow_status", sa.String(length=32), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_scope", sa.JSON(), nullable=False),
        sa.Column("capability_decision", sa.JSON(), nullable=False),
        sa.Column("actor_created", sa.String(length=255), nullable=False),
        sa.Column("actor_updated", sa.String(length=255), nullable=True),
        sa.Column("audit_attachment_hint", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_workflow_lifecycles")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_workflow_lifecycles_workflow_type"),
        "workflow_lifecycles",
        ["workflow_type"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_workflow_lifecycles_workflow_status"),
        "workflow_lifecycles",
        ["workflow_status"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_workflow_lifecycles_created_at"),
        "workflow_lifecycles",
        ["created_at"],
        unique=False,
        schema="platform_app",
    )

    op.create_table(
        "workflow_lifecycle_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "workflow_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.workflow_lifecycles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("prior_status", sa.String(length=32), nullable=True),
        sa.Column("next_status", sa.String(length=32), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actor", sa.String(length=255), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("provenance", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_workflow_lifecycle_events")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_workflow_lifecycle_events_workflow_id"),
        "workflow_lifecycle_events",
        ["workflow_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_workflow_lifecycle_events_occurred_at"),
        "workflow_lifecycle_events",
        ["occurred_at"],
        unique=False,
        schema="platform_app",
    )


def downgrade() -> None:
    """Drop workflow lifecycle tables."""
    op.drop_index(
        op.f("ix_platform_app_workflow_lifecycle_events_occurred_at"),
        table_name="workflow_lifecycle_events",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_workflow_lifecycle_events_workflow_id"),
        table_name="workflow_lifecycle_events",
        schema="platform_app",
    )
    op.drop_table("workflow_lifecycle_events", schema="platform_app")
    op.drop_index(
        op.f("ix_platform_app_workflow_lifecycles_created_at"),
        table_name="workflow_lifecycles",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_workflow_lifecycles_workflow_status"),
        table_name="workflow_lifecycles",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_workflow_lifecycles_workflow_type"),
        table_name="workflow_lifecycles",
        schema="platform_app",
    )
    op.drop_table("workflow_lifecycles", schema="platform_app")

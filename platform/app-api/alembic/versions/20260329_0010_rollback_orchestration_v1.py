"""Rollback orchestration v1 — bounded compensation for operator intent overlay.

Revision ID: 20260329_0010
Revises: 20260329_0009
Create Date: 2026-03-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260329_0010"
down_revision: str | None = "20260329_0009"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "rollback_requests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "workflow_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.workflow_lifecycles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("parent_workflow_id", sa.String(length=36), nullable=True),
        sa.Column(
            "parent_action_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.safe_actions.id", ondelete="SET NULL"),
            nullable=False,
        ),
        sa.Column("parent_preview_id", sa.String(length=36), nullable=True),
        sa.Column("parent_validation_id", sa.String(length=36), nullable=True),
        sa.Column(
            "pre_rollback_validation_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.validation_requests.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("post_rollback_validation_id", sa.String(length=36), nullable=True),
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
        sa.Column("rollback_type", sa.String(length=128), nullable=False),
        sa.Column("target_kind", sa.String(length=64), nullable=False),
        sa.Column("target_ids", sa.JSON(), nullable=False),
        sa.Column("target_scope", sa.JSON(), nullable=True),
        sa.Column("rollback_payload", sa.JSON(), nullable=False),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("requested_by_actor_type", sa.String(length=32), nullable=False),
        sa.Column("requested_by_actor_id", sa.String(length=255), nullable=False),
        sa.Column("requested_by_actor_display_name", sa.Text(), nullable=True),
        sa.Column("rollback_decision", sa.String(length=32), nullable=False),
        sa.Column("capability_decision_state", sa.String(length=32), nullable=False),
        sa.Column("capability_decision_reason", sa.Text(), nullable=True),
        sa.Column("truth_scope_summary", sa.JSON(), nullable=False),
        sa.Column("prerequisite_notes", sa.JSON(), nullable=False),
        sa.Column("restoration_semantics", sa.String(length=64), nullable=False),
        sa.Column("approval_required", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("approval_state", sa.String(length=32), nullable=False),
        sa.Column("approver_actor_id", sa.String(length=255), nullable=True),
        sa.Column("approver_actor_display_name", sa.Text(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("rollback_status", sa.String(length=32), nullable=False),
        sa.Column("execution_started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("execution_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("execution_latency_ms", sa.Float(), nullable=True),
        sa.Column("execution_error_code", sa.String(length=64), nullable=True),
        sa.Column("execution_error_detail", sa.Text(), nullable=True),
        sa.Column("result_json", sa.JSON(), nullable=False),
        sa.Column("audit_attachment_hint", sa.JSON(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rollback_requests")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_rollback_requests_workflow_id"),
        "rollback_requests",
        ["workflow_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_rollback_requests_parent_action_id"),
        "rollback_requests",
        ["parent_action_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_rollback_requests_requested_at"),
        "rollback_requests",
        ["requested_at"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_rollback_requests_rollback_type"),
        "rollback_requests",
        ["rollback_type"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_rollback_requests_rollback_status"),
        "rollback_requests",
        ["rollback_status"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_rollback_requests_idempotency_key"),
        "rollback_requests",
        ["idempotency_key"],
        unique=True,
        schema="platform_app",
        postgresql_where=sa.text("idempotency_key IS NOT NULL"),
    )

    op.create_table(
        "rollback_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "rollback_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.rollback_requests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actor", sa.String(length=255), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("provenance", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rollback_events")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_rollback_events_rollback_id"),
        "rollback_events",
        ["rollback_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_rollback_events_occurred_at"),
        "rollback_events",
        ["occurred_at"],
        unique=False,
        schema="platform_app",
    )

    op.add_column(
        "safe_actions",
        sa.Column(
            "compensated_by_rollback_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.rollback_requests.id", ondelete="SET NULL"),
            nullable=True,
        ),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_safe_actions_compensated_by_rollback_id"),
        "safe_actions",
        ["compensated_by_rollback_id"],
        unique=False,
        schema="platform_app",
    )

    op.add_column(
        "policy_operator_intent_records",
        sa.Column(
            "rollback_request_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.rollback_requests.id", ondelete="SET NULL"),
            nullable=True,
        ),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_operator_intent_records_rollback_request_id"),
        "policy_operator_intent_records",
        ["rollback_request_id"],
        unique=False,
        schema="platform_app",
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_platform_app_policy_operator_intent_records_rollback_request_id"),
        table_name="policy_operator_intent_records",
        schema="platform_app",
    )
    op.drop_column("policy_operator_intent_records", "rollback_request_id", schema="platform_app")
    op.drop_index(
        op.f("ix_platform_app_safe_actions_compensated_by_rollback_id"),
        table_name="safe_actions",
        schema="platform_app",
    )
    op.drop_column("safe_actions", "compensated_by_rollback_id", schema="platform_app")
    op.drop_index(
        op.f("ix_platform_app_rollback_events_occurred_at"),
        table_name="rollback_events",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_rollback_events_rollback_id"),
        table_name="rollback_events",
        schema="platform_app",
    )
    op.drop_table("rollback_events", schema="platform_app")
    op.drop_index(
        op.f("ix_platform_app_rollback_requests_idempotency_key"),
        table_name="rollback_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_rollback_requests_rollback_status"),
        table_name="rollback_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_rollback_requests_rollback_type"),
        table_name="rollback_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_rollback_requests_requested_at"),
        table_name="rollback_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_rollback_requests_parent_action_id"),
        table_name="rollback_requests",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_rollback_requests_workflow_id"),
        table_name="rollback_requests",
        schema="platform_app",
    )
    op.drop_table("rollback_requests", schema="platform_app")

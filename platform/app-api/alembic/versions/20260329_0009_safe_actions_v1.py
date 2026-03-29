"""Safe action workflows v1 — durable action records, events, operator intent persistence.

Revision ID: 20260329_0009
Revises: 20260327_0008
Create Date: 2026-03-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260329_0009"
down_revision: str | None = "20260327_0008"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Create bounded safe-action backbone (one v1 slice; not generic orchestration)."""
    op.create_table(
        "safe_actions",
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
        sa.Column(
            "validation_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.validation_requests.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
        sa.Column("action_type", sa.String(length=128), nullable=False),
        sa.Column("target_kind", sa.String(length=64), nullable=False),
        sa.Column("target_ids", sa.JSON(), nullable=False),
        sa.Column("target_scope", sa.JSON(), nullable=True),
        sa.Column("requested_payload", sa.JSON(), nullable=False),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("requested_by_actor_type", sa.String(length=32), nullable=False),
        sa.Column("requested_by_actor_id", sa.String(length=255), nullable=False),
        sa.Column("requested_by_actor_display_name", sa.Text(), nullable=True),
        sa.Column("action_decision", sa.String(length=32), nullable=False),
        sa.Column("capability_decision_state", sa.String(length=32), nullable=False),
        sa.Column("capability_decision_reason", sa.Text(), nullable=True),
        sa.Column("truth_scope_summary", sa.JSON(), nullable=False),
        sa.Column("prerequisite_notes", sa.JSON(), nullable=False),
        sa.Column("approval_required", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("approval_state", sa.String(length=32), nullable=False),
        sa.Column("approver_actor_id", sa.String(length=255), nullable=True),
        sa.Column("approver_actor_display_name", sa.Text(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("execution_status", sa.String(length=32), nullable=False),
        sa.Column("execution_started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("execution_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("execution_latency_ms", sa.Float(), nullable=True),
        sa.Column("execution_error_code", sa.String(length=64), nullable=True),
        sa.Column("execution_error_detail", sa.Text(), nullable=True),
        sa.Column("post_check_validation_id", sa.String(length=36), nullable=True),
        sa.Column("rollback_parent_action_id", sa.String(length=36), nullable=True),
        sa.Column("rollback_workflow_id", sa.String(length=36), nullable=True),
        sa.Column("rollback_ready_state", sa.String(length=64), nullable=True),
        sa.Column("rollback_validation_id", sa.String(length=36), nullable=True),
        sa.Column("compensation_reference", sa.Text(), nullable=True),
        sa.Column("result_json", sa.JSON(), nullable=False),
        sa.Column("audit_attachment_hint", sa.JSON(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_safe_actions")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_safe_actions_workflow_id"),
        "safe_actions",
        ["workflow_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_safe_actions_preview_id"),
        "safe_actions",
        ["preview_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_safe_actions_validation_id"),
        "safe_actions",
        ["validation_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_safe_actions_action_type"),
        "safe_actions",
        ["action_type"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_safe_actions_requested_at"),
        "safe_actions",
        ["requested_at"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_safe_actions_execution_status"),
        "safe_actions",
        ["execution_status"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_safe_actions_idempotency_key"),
        "safe_actions",
        ["idempotency_key"],
        unique=True,
        schema="platform_app",
        postgresql_where=sa.text("idempotency_key IS NOT NULL"),
    )

    op.create_table(
        "safe_action_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "action_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.safe_actions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actor", sa.String(length=255), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("provenance", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_safe_action_events")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_safe_action_events_action_id"),
        "safe_action_events",
        ["action_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_safe_action_events_occurred_at"),
        "safe_action_events",
        ["occurred_at"],
        unique=False,
        schema="platform_app",
    )

    op.create_table(
        "policy_operator_intent_records",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("policy_id", sa.String(length=255), nullable=False),
        sa.Column("intent_state", sa.String(length=32), nullable=False),
        sa.Column(
            "action_id",
            sa.String(length=36),
            sa.ForeignKey("platform_app.safe_actions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("previous_record_id", sa.String(length=36), nullable=True),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("truth_notes", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_policy_operator_intent_records")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_operator_intent_records_policy_id"),
        "policy_operator_intent_records",
        ["policy_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_operator_intent_records_action_id"),
        "policy_operator_intent_records",
        ["action_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_operator_intent_records_applied_at"),
        "policy_operator_intent_records",
        ["applied_at"],
        unique=False,
        schema="platform_app",
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_platform_app_policy_operator_intent_records_applied_at"),
        table_name="policy_operator_intent_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_operator_intent_records_action_id"),
        table_name="policy_operator_intent_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_operator_intent_records_policy_id"),
        table_name="policy_operator_intent_records",
        schema="platform_app",
    )
    op.drop_table("policy_operator_intent_records", schema="platform_app")
    op.drop_index(
        op.f("ix_platform_app_safe_action_events_occurred_at"),
        table_name="safe_action_events",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_safe_action_events_action_id"),
        table_name="safe_action_events",
        schema="platform_app",
    )
    op.drop_table("safe_action_events", schema="platform_app")
    op.drop_index(
        op.f("ix_platform_app_safe_actions_idempotency_key"),
        table_name="safe_actions",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_safe_actions_execution_status"),
        table_name="safe_actions",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_safe_actions_requested_at"),
        table_name="safe_actions",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_safe_actions_action_type"),
        table_name="safe_actions",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_safe_actions_validation_id"),
        table_name="safe_actions",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_safe_actions_preview_id"),
        table_name="safe_actions",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_safe_actions_workflow_id"),
        table_name="safe_actions",
        schema="platform_app",
    )
    op.drop_table("safe_actions", schema="platform_app")

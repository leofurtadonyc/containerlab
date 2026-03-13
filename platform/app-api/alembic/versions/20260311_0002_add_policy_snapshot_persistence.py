"""Add bounded policy snapshot persistence.

Revision ID: 20260311_0002
Revises: 20260310_0001
Create Date: 2026-03-11 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260311_0002"
down_revision: str | None = "20260310_0001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Create bounded policy snapshot, record, and candidate-path tables."""
    op.create_table(
        "policy_snapshots",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("sync_run_id", sa.String(length=36), nullable=False),
        sa.Column("data_status", sa.String(length=32), nullable=False),
        sa.Column("sync_source", sa.String(length=255), nullable=False),
        sa.Column("sync_status", sa.String(length=32), nullable=False),
        sa.Column("completeness", sa.String(length=32), nullable=False),
        sa.Column("detail_mode", sa.String(length=64), nullable=False),
        sa.Column("empty_reason", sa.String(length=64), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("persisted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("observed_target_count", sa.Integer(), nullable=False),
        sa.Column("policy_capable_target_count", sa.Integer(), nullable=False),
        sa.Column("observed_policy_count", sa.Integer(), nullable=False),
        sa.Column("active_policy_count", sa.Integer(), nullable=False),
        sa.Column("static_policy_count", sa.Integer(), nullable=False),
        sa.Column("bgp_policy_count", sa.Integer(), nullable=False),
        sa.Column("notes", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(
            ["sync_run_id"],
            ["platform_app.sync_runs.id"],
            name=op.f("fk_policy_snapshots_sync_run_id_sync_runs"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_policy_snapshots")),
        sa.UniqueConstraint("sync_run_id", name=op.f("uq_policy_snapshots_sync_run_id")),
        schema="platform_app",
    )

    op.create_table(
        "policy_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("policy_id", sa.String(length=255), nullable=False),
        sa.Column("policy_name", sa.String(length=255), nullable=False),
        sa.Column("policy_type", sa.String(length=64), nullable=False),
        sa.Column("headend", sa.String(length=255), nullable=False),
        sa.Column("endpoint", sa.String(length=255), nullable=False),
        sa.Column("color", sa.Integer(), nullable=False),
        sa.Column("source_target", sa.String(length=255), nullable=False),
        sa.Column("source_target_role", sa.String(length=64), nullable=True),
        sa.Column("intent_state", sa.String(length=32), nullable=False),
        sa.Column("observed_state", sa.String(length=32), nullable=False),
        sa.Column("support_state", sa.String(length=64), nullable=False),
        sa.Column("health_state", sa.String(length=32), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("notes", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(
            ["snapshot_id"],
            ["platform_app.policy_snapshots.id"],
            name=op.f("fk_policy_records_snapshot_id_policy_snapshots"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_policy_records")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_records_snapshot_id"),
        "policy_records",
        ["snapshot_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_records_policy_id"),
        "policy_records",
        ["policy_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_records_policy_type"),
        "policy_records",
        ["policy_type"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_records_headend"),
        "policy_records",
        ["headend"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_records_endpoint"),
        "policy_records",
        ["endpoint"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_records_color"),
        "policy_records",
        ["color"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_records_source_target"),
        "policy_records",
        ["source_target"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_records_source_target_role"),
        "policy_records",
        ["source_target_role"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_records_observed_state"),
        "policy_records",
        ["observed_state"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_records_support_state"),
        "policy_records",
        ["support_state"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_records_health_state"),
        "policy_records",
        ["health_state"],
        unique=False,
        schema="platform_app",
    )

    op.create_table(
        "policy_candidate_paths",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("policy_record_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("path_state", sa.String(length=32), nullable=False),
        sa.Column("preference", sa.Integer(), nullable=True),
        sa.Column("notes", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(
            ["policy_record_id"],
            ["platform_app.policy_records.id"],
            name=op.f("fk_policy_candidate_paths_policy_record_id_policy_records"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_policy_candidate_paths")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_candidate_paths_policy_record_id"),
        "policy_candidate_paths",
        ["policy_record_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_policy_candidate_paths_path_state"),
        "policy_candidate_paths",
        ["path_state"],
        unique=False,
        schema="platform_app",
    )


def downgrade() -> None:
    """Drop bounded policy snapshot persistence tables."""
    op.drop_index(
        op.f("ix_platform_app_policy_candidate_paths_path_state"),
        table_name="policy_candidate_paths",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_candidate_paths_policy_record_id"),
        table_name="policy_candidate_paths",
        schema="platform_app",
    )
    op.drop_table("policy_candidate_paths", schema="platform_app")

    op.drop_index(
        op.f("ix_platform_app_policy_records_health_state"),
        table_name="policy_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_records_support_state"),
        table_name="policy_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_records_observed_state"),
        table_name="policy_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_records_source_target_role"),
        table_name="policy_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_records_source_target"),
        table_name="policy_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_records_color"),
        table_name="policy_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_records_endpoint"),
        table_name="policy_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_records_headend"),
        table_name="policy_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_records_policy_type"),
        table_name="policy_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_records_policy_id"),
        table_name="policy_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_policy_records_snapshot_id"),
        table_name="policy_records",
        schema="platform_app",
    )
    op.drop_table("policy_records", schema="platform_app")
    op.drop_table("policy_snapshots", schema="platform_app")

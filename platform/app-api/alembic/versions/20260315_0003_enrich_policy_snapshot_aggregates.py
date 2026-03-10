"""Enrich bounded policy snapshot aggregates.

Revision ID: 20260315_0003
Revises: 20260311_0002
Create Date: 2026-03-15 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260315_0003"
down_revision: str | None = "20260311_0002"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Add richer bounded aggregate policy evidence columns."""
    op.add_column(
        "policy_snapshots",
        sa.Column("observed_target_role_counts", sa.JSON(), nullable=False, server_default="{}"),
        schema="platform_app",
    )
    op.add_column(
        "policy_snapshots",
        sa.Column(
            "policy_capable_target_role_counts",
            sa.JSON(),
            nullable=False,
            server_default="{}",
        ),
        schema="platform_app",
    )
    op.add_column(
        "policy_snapshots",
        sa.Column("static_local_policy_count", sa.Integer(), nullable=False, server_default="0"),
        schema="platform_app",
    )
    op.add_column(
        "policy_snapshots",
        sa.Column(
            "static_non_local_policy_count", sa.Integer(), nullable=False, server_default="0"
        ),
        schema="platform_app",
    )
    op.add_column(
        "policy_snapshots",
        sa.Column("ttm_preference_count", sa.Integer(), nullable=False, server_default="0"),
        schema="platform_app",
    )
    op.add_column(
        "policy_snapshots",
        sa.Column("binding_sid_count", sa.Integer(), nullable=False, server_default="0"),
        schema="platform_app",
    )
    op.add_column(
        "policy_snapshots",
        sa.Column("srv6_binding_sid_count", sa.Integer(), nullable=False, server_default="0"),
        schema="platform_app",
    )

    op.alter_column(
        "policy_snapshots",
        "observed_target_role_counts",
        server_default=None,
        schema="platform_app",
    )
    op.alter_column(
        "policy_snapshots",
        "policy_capable_target_role_counts",
        server_default=None,
        schema="platform_app",
    )
    op.alter_column(
        "policy_snapshots",
        "static_local_policy_count",
        server_default=None,
        schema="platform_app",
    )
    op.alter_column(
        "policy_snapshots",
        "static_non_local_policy_count",
        server_default=None,
        schema="platform_app",
    )
    op.alter_column(
        "policy_snapshots",
        "ttm_preference_count",
        server_default=None,
        schema="platform_app",
    )
    op.alter_column(
        "policy_snapshots",
        "binding_sid_count",
        server_default=None,
        schema="platform_app",
    )
    op.alter_column(
        "policy_snapshots",
        "srv6_binding_sid_count",
        server_default=None,
        schema="platform_app",
    )


def downgrade() -> None:
    """Drop richer bounded aggregate policy evidence columns."""
    op.drop_column("policy_snapshots", "srv6_binding_sid_count", schema="platform_app")
    op.drop_column("policy_snapshots", "binding_sid_count", schema="platform_app")
    op.drop_column("policy_snapshots", "ttm_preference_count", schema="platform_app")
    op.drop_column("policy_snapshots", "static_non_local_policy_count", schema="platform_app")
    op.drop_column("policy_snapshots", "static_local_policy_count", schema="platform_app")
    op.drop_column("policy_snapshots", "policy_capable_target_role_counts", schema="platform_app")
    op.drop_column("policy_snapshots", "observed_target_role_counts", schema="platform_app")

"""Add policy source-readiness history persistence.

Revision ID: 20260318_0005
Revises: 20260316_0004
Create Date: 2026-03-18 00:00:00

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260318_0005"
down_revision: str | None = "20260316_0004"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Add source-readiness columns for persisted policy history."""
    op.add_column(
        "policy_snapshots",
        sa.Column(
            "detail_source_readiness_posture",
            sa.String(length=64),
            nullable=False,
            server_default="unknown",
        ),
        schema="platform_app",
    )
    op.add_column(
        "policy_snapshots",
        sa.Column(
            "detail_ready_target_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        schema="platform_app",
    )
    op.add_column(
        "policy_snapshots",
        sa.Column(
            "no_policies_observed_target_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        schema="platform_app",
    )
    op.add_column(
        "policy_snapshots",
        sa.Column(
            "detail_unavailable_target_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        schema="platform_app",
    )
    op.add_column(
        "policy_snapshots",
        sa.Column(
            "partial_detail_target_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        schema="platform_app",
    )

    op.alter_column(
        "policy_snapshots",
        "detail_source_readiness_posture",
        server_default=None,
        schema="platform_app",
    )
    op.alter_column(
        "policy_snapshots",
        "detail_ready_target_count",
        server_default=None,
        schema="platform_app",
    )
    op.alter_column(
        "policy_snapshots",
        "no_policies_observed_target_count",
        server_default=None,
        schema="platform_app",
    )
    op.alter_column(
        "policy_snapshots",
        "detail_unavailable_target_count",
        server_default=None,
        schema="platform_app",
    )
    op.alter_column(
        "policy_snapshots",
        "partial_detail_target_count",
        server_default=None,
        schema="platform_app",
    )


def downgrade() -> None:
    """Drop source-readiness columns from policy snapshots."""
    op.drop_column(
        "policy_snapshots",
        "partial_detail_target_count",
        schema="platform_app",
    )
    op.drop_column(
        "policy_snapshots",
        "detail_unavailable_target_count",
        schema="platform_app",
    )
    op.drop_column(
        "policy_snapshots",
        "no_policies_observed_target_count",
        schema="platform_app",
    )
    op.drop_column(
        "policy_snapshots",
        "detail_ready_target_count",
        schema="platform_app",
    )
    op.drop_column(
        "policy_snapshots",
        "detail_source_readiness_posture",
        schema="platform_app",
    )

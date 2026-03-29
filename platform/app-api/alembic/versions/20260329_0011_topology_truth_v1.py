"""Deeper topology truth v1 — merged source-aware snapshots.

Revision ID: 20260329_0011
Revises: 20260329_0010
Create Date: 2026-03-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260329_0011"
down_revision: str | None = "20260329_0010"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "topology_truth_snapshots",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("persisted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("device_gnmi_fingerprint", sa.String(length=64), nullable=True),
        sa.Column("controller_bgpls_fingerprint", sa.String(length=64), nullable=True),
        sa.Column("controller_fetch_status", sa.String(length=32), nullable=False),
        sa.Column("merged_payload", sa.JSON(), nullable=False),
        sa.Column("sources_summary", sa.JSON(), nullable=False),
        sa.Column("correlation_notes", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_topology_truth_snapshots")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_topology_truth_snapshots_persisted_at"),
        "topology_truth_snapshots",
        ["persisted_at"],
        unique=False,
        schema="platform_app",
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_platform_app_topology_truth_snapshots_persisted_at"),
        table_name="topology_truth_snapshots",
        schema="platform_app",
    )
    op.drop_table("topology_truth_snapshots", schema="platform_app")

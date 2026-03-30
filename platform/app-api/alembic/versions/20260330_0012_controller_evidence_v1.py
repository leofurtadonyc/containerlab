"""Controller southbound evidence v1 — persisted lane snapshots.

Revision ID: 20260330_0012
Revises: 20260329_0011
Create Date: 2026-03-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260330_0012"
down_revision: str | None = "20260329_0011"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "controller_evidence_snapshots",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("persisted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("controller_reachability", sa.String(length=32), nullable=False),
        sa.Column("bgp_ls_fingerprint", sa.String(length=64), nullable=True),
        sa.Column("pcep_fingerprint", sa.String(length=64), nullable=True),
        sa.Column("netconf_fingerprint", sa.String(length=64), nullable=True),
        sa.Column("lanes_payload", sa.JSON(), nullable=False),
        sa.Column("aggregate_notes", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_controller_evidence_snapshots")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_controller_evidence_snapshots_persisted_at"),
        "controller_evidence_snapshots",
        ["persisted_at"],
        unique=False,
        schema="platform_app",
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_platform_app_controller_evidence_snapshots_persisted_at"),
        table_name="controller_evidence_snapshots",
        schema="platform_app",
    )
    op.drop_table("controller_evidence_snapshots", schema="platform_app")

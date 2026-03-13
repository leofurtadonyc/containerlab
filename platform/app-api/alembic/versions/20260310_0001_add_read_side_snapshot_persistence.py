"""Add bounded read-side snapshot persistence.

Revision ID: 20260310_0001
Revises:
Create Date: 2026-03-10 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260310_0001"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Create bounded inventory/topology snapshot and sync-run tables."""
    op.execute("CREATE SCHEMA IF NOT EXISTS platform_app")

    op.create_table(
        "sync_runs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("model_family", sa.String(length=32), nullable=False),
        sa.Column("source_type", sa.String(length=32), nullable=False),
        sa.Column("source_endpoint", sa.Text(), nullable=False),
        sa.Column("fetch_status", sa.String(length=32), nullable=False),
        sa.Column("record_count", sa.Integer(), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_sync_runs")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_sync_runs_model_family"),
        "sync_runs",
        ["model_family"],
        unique=False,
        schema="platform_app",
    )

    op.create_table(
        "inventory_snapshots",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("sync_run_id", sa.String(length=36), nullable=False),
        sa.Column("data_status", sa.String(length=32), nullable=False),
        sa.Column("persisted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("record_count", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["sync_run_id"],
            ["platform_app.sync_runs.id"],
            name=op.f("fk_inventory_snapshots_sync_run_id_sync_runs"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_inventory_snapshots")),
        sa.UniqueConstraint("sync_run_id", name=op.f("uq_inventory_snapshots_sync_run_id")),
        schema="platform_app",
    )

    op.create_table(
        "inventory_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("device_id", sa.String(length=255), nullable=False),
        sa.Column("vendor", sa.String(length=64), nullable=False),
        sa.Column("platform", sa.String(length=128), nullable=False),
        sa.Column("software_version", sa.String(length=128), nullable=True),
        sa.Column("role", sa.String(length=64), nullable=True),
        sa.Column("management_address", sa.String(length=128), nullable=False),
        sa.Column("collector_status", sa.String(length=32), nullable=False),
        sa.Column("capability_summary", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(
            ["snapshot_id"],
            ["platform_app.inventory_snapshots.id"],
            name=op.f("fk_inventory_records_snapshot_id_inventory_snapshots"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_inventory_records")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_inventory_records_snapshot_id"),
        "inventory_records",
        ["snapshot_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_inventory_records_device_id"),
        "inventory_records",
        ["device_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_inventory_records_role"),
        "inventory_records",
        ["role"],
        unique=False,
        schema="platform_app",
    )

    op.create_table(
        "topology_snapshots",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("sync_run_id", sa.String(length=36), nullable=False),
        sa.Column("topology_id", sa.String(length=255), nullable=False),
        sa.Column("topology_name", sa.String(length=255), nullable=False),
        sa.Column("data_status", sa.String(length=32), nullable=False),
        sa.Column("sync_source", sa.String(length=255), nullable=False),
        sa.Column("sync_status", sa.String(length=32), nullable=False),
        sa.Column("completeness", sa.String(length=32), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("persisted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("node_count", sa.Integer(), nullable=False),
        sa.Column("link_count", sa.Integer(), nullable=False),
        sa.Column("notes", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(
            ["sync_run_id"],
            ["platform_app.sync_runs.id"],
            name=op.f("fk_topology_snapshots_sync_run_id_sync_runs"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_topology_snapshots")),
        sa.UniqueConstraint("sync_run_id", name=op.f("uq_topology_snapshots_sync_run_id")),
        schema="platform_app",
    )

    op.create_table(
        "topology_nodes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("node_id", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=64), nullable=False),
        sa.Column("state", sa.String(length=32), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("device_id", sa.String(length=255), nullable=True),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(
            ["snapshot_id"],
            ["platform_app.topology_snapshots.id"],
            name=op.f("fk_topology_nodes_snapshot_id_topology_snapshots"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_topology_nodes")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_topology_nodes_snapshot_id"),
        "topology_nodes",
        ["snapshot_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_topology_nodes_node_id"),
        "topology_nodes",
        ["node_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_topology_nodes_role"),
        "topology_nodes",
        ["role"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_topology_nodes_state"),
        "topology_nodes",
        ["state"],
        unique=False,
        schema="platform_app",
    )

    op.create_table(
        "topology_links",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("link_id", sa.String(length=255), nullable=False),
        sa.Column("source_node_id", sa.String(length=255), nullable=False),
        sa.Column("target_node_id", sa.String(length=255), nullable=False),
        sa.Column("state", sa.String(length=32), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(
            ["snapshot_id"],
            ["platform_app.topology_snapshots.id"],
            name=op.f("fk_topology_links_snapshot_id_topology_snapshots"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_topology_links")),
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_topology_links_snapshot_id"),
        "topology_links",
        ["snapshot_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_topology_links_link_id"),
        "topology_links",
        ["link_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_topology_links_source_node_id"),
        "topology_links",
        ["source_node_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_topology_links_target_node_id"),
        "topology_links",
        ["target_node_id"],
        unique=False,
        schema="platform_app",
    )
    op.create_index(
        op.f("ix_platform_app_topology_links_state"),
        "topology_links",
        ["state"],
        unique=False,
        schema="platform_app",
    )


def downgrade() -> None:
    """Drop bounded read-side persistence tables."""
    op.drop_index(
        op.f("ix_platform_app_topology_links_state"),
        table_name="topology_links",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_topology_links_target_node_id"),
        table_name="topology_links",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_topology_links_source_node_id"),
        table_name="topology_links",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_topology_links_link_id"),
        table_name="topology_links",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_topology_links_snapshot_id"),
        table_name="topology_links",
        schema="platform_app",
    )
    op.drop_table("topology_links", schema="platform_app")

    op.drop_index(
        op.f("ix_platform_app_topology_nodes_state"),
        table_name="topology_nodes",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_topology_nodes_role"),
        table_name="topology_nodes",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_topology_nodes_node_id"),
        table_name="topology_nodes",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_topology_nodes_snapshot_id"),
        table_name="topology_nodes",
        schema="platform_app",
    )
    op.drop_table("topology_nodes", schema="platform_app")
    op.drop_table("topology_snapshots", schema="platform_app")

    op.drop_index(
        op.f("ix_platform_app_inventory_records_role"),
        table_name="inventory_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_inventory_records_device_id"),
        table_name="inventory_records",
        schema="platform_app",
    )
    op.drop_index(
        op.f("ix_platform_app_inventory_records_snapshot_id"),
        table_name="inventory_records",
        schema="platform_app",
    )
    op.drop_table("inventory_records", schema="platform_app")
    op.drop_table("inventory_snapshots", schema="platform_app")

    op.drop_index(
        op.f("ix_platform_app_sync_runs_model_family"),
        table_name="sync_runs",
        schema="platform_app",
    )
    op.drop_table("sync_runs", schema="platform_app")

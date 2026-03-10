"""SQLAlchemy tables for bounded read-side persistence."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app_api.models.base import Base


class SyncRunTable(Base):
    """Bounded sync-run history for persisted read-side snapshots."""

    __tablename__ = "sync_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    model_family: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    source_endpoint: Mapped[str] = mapped_column(Text, nullable=False)
    fetch_status: Mapped[str] = mapped_column(String(32), nullable=False)
    record_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    inventory_snapshot: Mapped["InventorySnapshotTable | None"] = relationship(
        back_populates="sync_run",
        cascade="all, delete-orphan",
    )
    topology_snapshot: Mapped["TopologySnapshotTable | None"] = relationship(
        back_populates="sync_run",
        cascade="all, delete-orphan",
    )


class InventorySnapshotTable(Base):
    """One persisted normalized inventory snapshot."""

    __tablename__ = "inventory_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sync_run_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.sync_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    data_status: Mapped[str] = mapped_column(String(32), nullable=False)
    persisted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    record_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    sync_run: Mapped[SyncRunTable] = relationship(back_populates="inventory_snapshot")
    records: Mapped[list["InventoryRecordTable"]] = relationship(
        back_populates="snapshot",
        cascade="all, delete-orphan",
    )


class InventoryRecordTable(Base):
    """One normalized inventory record within a persisted snapshot."""

    __tablename__ = "inventory_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.inventory_snapshots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    device_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    vendor: Mapped[str] = mapped_column(String(64), nullable=False)
    platform: Mapped[str] = mapped_column(String(128), nullable=False)
    software_version: Mapped[str | None] = mapped_column(String(128))
    role: Mapped[str | None] = mapped_column(String(64), index=True)
    management_address: Mapped[str] = mapped_column(String(128), nullable=False)
    collector_status: Mapped[str] = mapped_column(String(32), nullable=False)
    capability_summary: Mapped[str] = mapped_column(String(64), nullable=False)

    snapshot: Mapped[InventorySnapshotTable] = relationship(back_populates="records")


class TopologySnapshotTable(Base):
    """One persisted normalized topology snapshot."""

    __tablename__ = "topology_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sync_run_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.sync_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    topology_id: Mapped[str] = mapped_column(String(255), nullable=False)
    topology_name: Mapped[str] = mapped_column(String(255), nullable=False)
    data_status: Mapped[str] = mapped_column(String(32), nullable=False)
    sync_source: Mapped[str] = mapped_column(String(255), nullable=False)
    sync_status: Mapped[str] = mapped_column(String(32), nullable=False)
    completeness: Mapped[str] = mapped_column(String(32), nullable=False)
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    persisted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    node_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    link_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    sync_run: Mapped[SyncRunTable] = relationship(back_populates="topology_snapshot")
    nodes: Mapped[list["TopologyNodeTable"]] = relationship(
        back_populates="snapshot",
        cascade="all, delete-orphan",
    )
    links: Mapped[list["TopologyLinkTable"]] = relationship(
        back_populates="snapshot",
        cascade="all, delete-orphan",
    )


class TopologyNodeTable(Base):
    """One normalized topology node within a persisted snapshot."""

    __tablename__ = "topology_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.topology_snapshots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    node_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    device_id: Mapped[str | None] = mapped_column(String(255))
    attributes: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False, default=dict)

    snapshot: Mapped[TopologySnapshotTable] = relationship(back_populates="nodes")


class TopologyLinkTable(Base):
    """One normalized topology link within a persisted snapshot."""

    __tablename__ = "topology_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.topology_snapshots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    link_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    source_node_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    target_node_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    attributes: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False, default=dict)

    snapshot: Mapped[TopologySnapshotTable] = relationship(back_populates="links")

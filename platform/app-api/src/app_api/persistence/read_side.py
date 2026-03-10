"""Bounded persistence helpers for inventory and topology read-side snapshots."""

from datetime import UTC, datetime
from logging import getLogger
from uuid import uuid4

from pydantic import BaseModel, Field
from sqlalchemy import select

from app_api.integrations.collector.inventory import CollectorInventorySnapshot
from app_api.integrations.collector.topology import CollectorTopologySnapshot
from app_api.models.inventory import InventoryDevice
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot
from app_api.persistence.session import create_session
from app_api.persistence.tables import (
    InventoryRecordTable,
    InventorySnapshotTable,
    SyncRunTable,
    TopologyLinkTable,
    TopologyNodeTable,
    TopologySnapshotTable,
)

logger = getLogger(__name__)


class PersistedInventorySnapshot(BaseModel):
    """Latest persisted inventory snapshot recovered from Postgres."""

    persisted_at: datetime
    devices: list[InventoryDevice]


class PersistedTopologySnapshot(BaseModel):
    """Latest persisted topology snapshot recovered from Postgres."""

    persisted_at: datetime
    snapshot: TopologySnapshot


def persist_inventory_snapshot(
    *,
    collector_snapshot: CollectorInventorySnapshot,
    devices: list[InventoryDevice],
    data_status: str,
) -> None:
    """Persist one bounded normalized inventory snapshot and matching sync run."""
    if collector_snapshot.status == "collector_unavailable":
        return

    current_time = datetime.now(UTC)
    sync_run_id = str(uuid4())
    snapshot_id = str(uuid4())
    notes = [
        "Persisted from the bounded collector-backed inventory read path.",
        "Records remain normalized platform-owned inventory state rather than raw vendor payloads.",
    ]
    try:
        with create_session() as session:
            sync_run = SyncRunTable(
                id=sync_run_id,
                model_family="inventory",
                source_type=collector_snapshot.integration,
                source_endpoint=collector_snapshot.source_endpoint,
                fetch_status=collector_snapshot.status,
                record_count=len(devices),
                observed_at=None,
                started_at=current_time,
                finished_at=current_time,
                notes=notes,
            )
            snapshot = InventorySnapshotTable(
                id=snapshot_id,
                sync_run_id=sync_run_id,
                data_status=data_status,
                persisted_at=current_time,
                record_count=len(devices),
            )
            snapshot.records = [
                InventoryRecordTable(
                    device_id=device.device_id,
                    vendor=device.vendor,
                    platform=device.platform,
                    software_version=device.software_version,
                    role=device.role,
                    management_address=device.management_address,
                    collector_status=device.collector_status,
                    capability_summary=device.capability_summary,
                )
                for device in devices
            ]
            session.add(sync_run)
            session.add(snapshot)
            session.commit()
    except Exception:
        logger.exception("Failed to persist bounded inventory snapshot.")


def load_latest_inventory_snapshot() -> PersistedInventorySnapshot | None:
    """Load the latest persisted bounded inventory snapshot, if any."""
    try:
        with create_session() as session:
            snapshot = session.scalar(
                select(InventorySnapshotTable)
                .order_by(InventorySnapshotTable.persisted_at.desc())
                .limit(1)
            )
            if snapshot is None:
                return None
            records = session.scalars(
                select(InventoryRecordTable)
                .where(InventoryRecordTable.snapshot_id == snapshot.id)
                .order_by(InventoryRecordTable.device_id.asc())
            ).all()
            return PersistedInventorySnapshot(
                persisted_at=snapshot.persisted_at,
                devices=[
                    InventoryDevice(
                        device_id=record.device_id,
                        vendor=record.vendor,
                        platform=record.platform,
                        software_version=record.software_version,
                        role=record.role,
                        management_address=record.management_address,
                        collector_status=record.collector_status,
                        capability_summary=record.capability_summary,
                    )
                    for record in records
                ],
            )
    except Exception:
        logger.exception("Failed to load latest persisted inventory snapshot.")
        return None


def persist_topology_snapshot(
    *,
    collector_snapshot: CollectorTopologySnapshot,
    snapshot: TopologySnapshot,
    data_status: str,
) -> None:
    """Persist one bounded normalized topology snapshot and matching sync run."""
    if collector_snapshot.status == "collector_unavailable":
        return

    current_time = datetime.now(UTC)
    sync_run_id = str(uuid4())
    snapshot_id = str(uuid4())
    notes = [
        "Persisted from the bounded collector-backed topology read path.",
        "Node and link records remain normalized platform-owned topology state rather than raw vendor payloads.",
    ]
    try:
        with create_session() as session:
            sync_run = SyncRunTable(
                id=sync_run_id,
                model_family="topology",
                source_type=collector_snapshot.integration,
                source_endpoint=collector_snapshot.source_endpoint,
                fetch_status=collector_snapshot.status,
                record_count=len(snapshot.nodes) + len(snapshot.links),
                observed_at=snapshot.observed_at,
                started_at=current_time,
                finished_at=current_time,
                notes=notes,
            )
            persisted_snapshot = TopologySnapshotTable(
                id=snapshot_id,
                sync_run_id=sync_run_id,
                topology_id=snapshot.topology_id,
                topology_name=snapshot.topology_name,
                data_status=data_status,
                sync_source=snapshot.sync_source,
                sync_status=snapshot.sync_status,
                completeness=snapshot.completeness,
                observed_at=snapshot.observed_at,
                persisted_at=current_time,
                node_count=len(snapshot.nodes),
                link_count=len(snapshot.links),
                notes=snapshot.notes,
            )
            persisted_snapshot.nodes = [
                TopologyNodeTable(
                    node_id=node.node_id,
                    display_name=node.display_name,
                    role=node.role,
                    state=node.state,
                    source=node.source,
                    device_id=node.device_id,
                    attributes=node.attributes,
                )
                for node in snapshot.nodes
            ]
            persisted_snapshot.links = [
                TopologyLinkTable(
                    link_id=link.link_id,
                    source_node_id=link.source_node_id,
                    target_node_id=link.target_node_id,
                    state=link.state,
                    source=link.source,
                    attributes=link.attributes,
                )
                for link in snapshot.links
            ]
            session.add(sync_run)
            session.add(persisted_snapshot)
            session.commit()
    except Exception:
        logger.exception("Failed to persist bounded topology snapshot.")


def load_latest_topology_snapshot() -> PersistedTopologySnapshot | None:
    """Load the latest persisted bounded topology snapshot, if any."""
    try:
        with create_session() as session:
            snapshot = session.scalar(
                select(TopologySnapshotTable)
                .order_by(TopologySnapshotTable.persisted_at.desc())
                .limit(1)
            )
            if snapshot is None:
                return None
            node_rows = session.scalars(
                select(TopologyNodeTable)
                .where(TopologyNodeTable.snapshot_id == snapshot.id)
                .order_by(TopologyNodeTable.node_id.asc())
            ).all()
            link_rows = session.scalars(
                select(TopologyLinkTable)
                .where(TopologyLinkTable.snapshot_id == snapshot.id)
                .order_by(TopologyLinkTable.link_id.asc())
            ).all()
            return PersistedTopologySnapshot(
                persisted_at=snapshot.persisted_at,
                snapshot=TopologySnapshot(
                    topology_id=snapshot.topology_id,
                    topology_name=snapshot.topology_name,
                    nodes=[
                        TopologyNode(
                            node_id=node.node_id,
                            display_name=node.display_name,
                            role=node.role,
                            state=node.state,
                            source=node.source,
                            device_id=node.device_id,
                            attributes=node.attributes,
                        )
                        for node in node_rows
                    ],
                    links=[
                        TopologyLink(
                            link_id=link.link_id,
                            source_node_id=link.source_node_id,
                            target_node_id=link.target_node_id,
                            state=link.state,
                            source=link.source,
                            attributes=link.attributes,
                        )
                        for link in link_rows
                    ],
                    sync_source=snapshot.sync_source,
                    sync_status=snapshot.sync_status,
                    completeness=snapshot.completeness,
                    observed_at=snapshot.observed_at,
                    notes=snapshot.notes,
                ),
            )
    except Exception:
        logger.exception("Failed to load latest persisted topology snapshot.")
        return None

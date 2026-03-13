"""Bounded persistence helpers for inventory, topology, and policy read-side snapshots."""

from datetime import UTC, datetime
from logging import getLogger
from uuid import uuid4

from pydantic import BaseModel, Field
from sqlalchemy import func, select

from app_api.integrations.collector.inventory import CollectorInventorySnapshot
from app_api.integrations.collector.policies import CollectorPolicySnapshot
from app_api.integrations.collector.topology import CollectorTopologySnapshot
from app_api.models.inventory import InventoryDevice
from app_api.models.policy import (
    CandidatePath,
    PolicyHistorySnapshotRecord,
    PolicyInventoryRecord,
    PolicyInventorySnapshot,
)
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot
from app_api.persistence.session import create_session
from app_api.persistence.tables import (
    InventoryRecordTable,
    InventorySnapshotTable,
    PolicyCandidatePathTable,
    PolicyRecordTable,
    PolicySnapshotTable,
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


class PersistedPolicySnapshot(BaseModel):
    """Latest persisted policy snapshot recovered from Postgres."""

    persisted_at: datetime
    snapshot: PolicyInventorySnapshot


class PersistedPolicySnapshotSummary(BaseModel):
    """Bounded summary of one persisted policy snapshot."""

    persisted_at: datetime
    snapshot: PolicyHistorySnapshotRecord


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


def persist_policy_snapshot(
    *,
    collector_snapshot: CollectorPolicySnapshot,
    snapshot: PolicyInventorySnapshot,
    data_status: str,
) -> None:
    """Persist one bounded normalized policy snapshot and matching sync run."""
    if collector_snapshot.status == "collector_unavailable":
        return

    current_time = datetime.now(UTC)
    sync_run_id = str(uuid4())
    snapshot_id = str(uuid4())
    notes = [
        "Persisted from the bounded collector-backed policy read path.",
        "Policy and candidate-path records remain normalized platform-owned policy state rather than raw vendor payloads.",
    ]
    try:
        with create_session() as session:
            sync_run = SyncRunTable(
                id=sync_run_id,
                model_family="policy",
                source_type=collector_snapshot.integration,
                source_endpoint=collector_snapshot.source_endpoint,
                fetch_status=collector_snapshot.status,
                record_count=len(snapshot.records),
                observed_at=snapshot.observed_at,
                started_at=current_time,
                finished_at=current_time,
                notes=notes,
            )
            persisted_snapshot = PolicySnapshotTable(
                id=snapshot_id,
                sync_run_id=sync_run_id,
                data_status=data_status,
                sync_source=snapshot.sync_source,
                sync_status=snapshot.sync_status,
                completeness=snapshot.completeness,
                detail_mode=snapshot.detail_mode,
                empty_reason=snapshot.empty_reason,
                observed_at=snapshot.observed_at,
                persisted_at=current_time,
                observed_target_count=snapshot.observed_target_count,
                policy_capable_target_count=snapshot.policy_capable_target_count,
                observed_target_role_counts=snapshot.observed_target_role_counts,
                policy_capable_target_role_counts=snapshot.policy_capable_target_role_counts,
                observed_policy_count=snapshot.observed_policy_count,
                active_policy_count=snapshot.active_policy_count,
                static_policy_count=snapshot.static_policy_count,
                static_local_policy_count=snapshot.static_local_policy_count,
                static_non_local_policy_count=snapshot.static_non_local_policy_count,
                bgp_policy_count=snapshot.bgp_policy_count,
                ttm_preference_count=snapshot.ttm_preference_count,
                binding_sid_count=snapshot.binding_sid_count,
                srv6_binding_sid_count=snapshot.srv6_binding_sid_count,
                notes=snapshot.notes,
            )
            persisted_snapshot.records = [
                PolicyRecordTable(
                    policy_id=policy.policy_id,
                    policy_name=policy.policy_name,
                    policy_type=policy.policy_type,
                    headend=policy.headend,
                    endpoint=policy.endpoint,
                    color=policy.color,
                    source_target=policy.source_target,
                    source_target_role=policy.source_target_role,
                    intent_state=policy.intent_state,
                    observed_state=policy.observed_state,
                    support_state=policy.support_state,
                    health_state=policy.health_state,
                    source=policy.source,
                    notes=policy.notes,
                    candidate_paths=[
                        PolicyCandidatePathTable(
                            name=path.name,
                            path_state=path.path_state,
                            preference=path.preference,
                            notes=path.notes,
                        )
                        for path in policy.candidate_paths
                    ],
                )
                for policy in snapshot.records
            ]
            session.add(sync_run)
            session.add(persisted_snapshot)
            session.commit()
    except Exception:
        logger.exception("Failed to persist bounded policy snapshot.")


def _load_policy_snapshot_at_offset(offset: int) -> PersistedPolicySnapshot | None:
    """Load one persisted bounded policy snapshot at the requested recency offset."""
    try:
        with create_session() as session:
            snapshot = session.scalar(
                select(PolicySnapshotTable)
                .order_by(PolicySnapshotTable.persisted_at.desc())
                .offset(offset)
                .limit(1)
            )
            if snapshot is None:
                return None
            policy_rows = session.scalars(
                select(PolicyRecordTable)
                .where(PolicyRecordTable.snapshot_id == snapshot.id)
                .order_by(PolicyRecordTable.policy_name.asc(), PolicyRecordTable.policy_id.asc())
            ).all()
            policy_ids = [row.id for row in policy_rows]
            candidate_rows = session.scalars(
                select(PolicyCandidatePathTable)
                .where(PolicyCandidatePathTable.policy_record_id.in_(policy_ids))
                .order_by(
                    PolicyCandidatePathTable.policy_record_id.asc(),
                    PolicyCandidatePathTable.preference.desc().nullslast(),
                    PolicyCandidatePathTable.name.asc(),
                )
            ).all() if policy_ids else []
            candidates_by_policy_id: dict[int, list[PolicyCandidatePathTable]] = {}
            for row in candidate_rows:
                candidates_by_policy_id.setdefault(row.policy_record_id, []).append(row)
            return PersistedPolicySnapshot(
                persisted_at=snapshot.persisted_at,
                snapshot=PolicyInventorySnapshot(
                    sync_source=snapshot.sync_source,
                    sync_status=snapshot.sync_status,
                    completeness=snapshot.completeness,
                    detail_mode=snapshot.detail_mode,
                    empty_reason=snapshot.empty_reason,
                    observed_at=snapshot.observed_at,
                    observed_target_count=snapshot.observed_target_count,
                    policy_capable_target_count=snapshot.policy_capable_target_count,
                    observed_target_role_counts=snapshot.observed_target_role_counts,
                    policy_capable_target_role_counts=snapshot.policy_capable_target_role_counts,
                    observed_policy_count=snapshot.observed_policy_count,
                    active_policy_count=snapshot.active_policy_count,
                    static_policy_count=snapshot.static_policy_count,
                    static_local_policy_count=snapshot.static_local_policy_count,
                    static_non_local_policy_count=snapshot.static_non_local_policy_count,
                    bgp_policy_count=snapshot.bgp_policy_count,
                    ttm_preference_count=snapshot.ttm_preference_count,
                    binding_sid_count=snapshot.binding_sid_count,
                    srv6_binding_sid_count=snapshot.srv6_binding_sid_count,
                    notes=snapshot.notes,
                    records=[
                        PolicyInventoryRecord(
                            policy_id=row.policy_id,
                            policy_name=row.policy_name,
                            policy_type=row.policy_type,
                            headend=row.headend,
                            endpoint=row.endpoint,
                            color=row.color,
                            source_target=row.source_target,
                            source_target_role=row.source_target_role,
                            candidate_paths=[
                                CandidatePath(
                                    name=candidate.name,
                                    path_state=candidate.path_state,
                                    preference=candidate.preference,
                                    notes=candidate.notes,
                                )
                                for candidate in candidates_by_policy_id.get(row.id, [])
                            ],
                            intent_state=row.intent_state,
                            observed_state=row.observed_state,
                            support_state=row.support_state,
                            health_state=row.health_state,
                            source=row.source,
                            notes=row.notes,
                        )
                        for row in policy_rows
                    ],
                ),
            )
    except Exception:
        logger.exception("Failed to load latest persisted policy snapshot.")
        return None


def load_latest_policy_snapshot() -> PersistedPolicySnapshot | None:
    """Load the latest persisted bounded policy snapshot, if any."""
    return _load_policy_snapshot_at_offset(offset=0)


def load_previous_policy_snapshot() -> PersistedPolicySnapshot | None:
    """Load the previous persisted bounded policy snapshot, if any."""
    return _load_policy_snapshot_at_offset(offset=1)


def load_recent_policy_snapshot_summaries(limit: int = 3) -> list[PersistedPolicySnapshotSummary]:
    """Load a short bounded window of recent persisted policy snapshot summaries."""
    try:
        with create_session() as session:
            snapshots = session.scalars(
                select(PolicySnapshotTable)
                .order_by(PolicySnapshotTable.persisted_at.desc())
                .limit(limit)
            ).all()
            snapshot_ids = [snapshot.id for snapshot in snapshots]
            if not snapshot_ids:
                return []
            counts_by_snapshot_id = {snapshot_id: 0 for snapshot_id in snapshot_ids}
            for snapshot_id, count in session.execute(
                select(PolicyRecordTable.snapshot_id, func.count(PolicyRecordTable.id))
                .where(PolicyRecordTable.snapshot_id.in_(snapshot_ids))
                .group_by(PolicyRecordTable.snapshot_id)
            ):
                counts_by_snapshot_id[snapshot_id] = int(count)
            return [
                PersistedPolicySnapshotSummary(
                    persisted_at=snapshot.persisted_at,
                    snapshot=PolicyHistorySnapshotRecord(
                        persisted_at=snapshot.persisted_at,
                        observed_at=snapshot.observed_at,
                        data_status=snapshot.data_status,
                        sync_source=snapshot.sync_source,
                        sync_status=snapshot.sync_status,
                        completeness=snapshot.completeness,
                        detail_mode=snapshot.detail_mode,
                        empty_reason=snapshot.empty_reason,
                        observed_policy_count=snapshot.observed_policy_count,
                        active_policy_count=snapshot.active_policy_count,
                        detail_record_count=counts_by_snapshot_id.get(snapshot.id, 0),
                    ),
                )
                for snapshot in snapshots
            ]
    except Exception:
        logger.exception("Failed to load recent persisted policy snapshot summaries.")
        return []

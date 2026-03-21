"""Persistence helpers for bounded workflow and audit history reads."""

from collections import Counter, defaultdict
from datetime import datetime
from logging import getLogger
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload, selectinload

from app_api.models.inventory import InventoryDevice, InventoryHistoryChangePreview
from app_api.models.topology import build_topology_coverage_summary
from app_api.persistence.session import create_session
from app_api.persistence.tables import (
    InventoryRecordTable,
    InventorySnapshotTable,
    PolicyCandidatePathTable,
    PolicyRecordTable,
    PolicySnapshotTable,
    ReadinessSnapshotTable,
    SyncRunTable,
    TopologyLinkTable,
    TopologyNodeTable,
    TopologySnapshotTable,
)

logger = getLogger(__name__)


class PersistedSyncRun(BaseModel):
    """Bounded sync-run history record recovered from Postgres."""

    sync_run_id: str
    model_family: str
    source_type: str
    source_endpoint: str
    fetch_status: str
    record_count: int
    observed_at: datetime | None = None
    started_at: datetime
    finished_at: datetime
    persisted_artifacts: list[str] = Field(default_factory=list)
    inventory_snapshot_summary: "PersistedInventorySnapshotSummary | None" = None
    inventory_comparison_to_previous: "PersistedInventorySnapshotComparison | None" = None
    topology_snapshot_summary: "PersistedTopologySnapshotSummary | None" = None
    topology_comparison_to_previous: "PersistedTopologySnapshotComparison | None" = None
    policy_snapshot_summary: "PersistedPolicySnapshotSummary | None" = None
    policy_comparison_to_previous: "PersistedPolicySnapshotComparison | None" = None
    notes: list[str] = Field(default_factory=list)


class PersistedInventorySnapshotSummary(BaseModel):
    """Bounded persisted inventory snapshot context for history surfaces."""

    snapshot_id: str
    sync_run_id: str
    persisted_at: datetime
    observed_at: datetime | None = None
    sync_source: str
    sync_status: str
    data_status: str
    source_endpoint: str
    device_count: int
    role_counts: dict[str, int] = Field(default_factory=dict)
    collector_status_counts: dict[str, int] = Field(default_factory=dict)
    capability_summary_counts: dict[str, int] = Field(default_factory=dict)


class PersistedInventorySnapshotComparison(BaseModel):
    """Bounded current-versus-previous comparison for one persisted inventory snapshot."""

    current_snapshot_id: str
    previous_snapshot_id: str
    current_persisted_at: datetime
    previous_persisted_at: datetime
    current_observed_at: datetime | None = None
    previous_observed_at: datetime | None = None
    current_sync_status: str
    previous_sync_status: str
    current_data_status: str
    previous_data_status: str
    current_device_count: int
    previous_device_count: int
    device_count_delta: int
    added_device_count: int
    removed_device_count: int
    changed_device_count: int
    change_preview: list[InventoryHistoryChangePreview] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class PersistedTopologySnapshotSummary(BaseModel):
    """Bounded persisted topology snapshot context for history surfaces."""

    snapshot_id: str
    persisted_at: datetime
    observed_at: datetime | None = None
    topology_name: str
    sync_source: str
    sync_status: str
    completeness: str
    node_count: int
    link_count: int
    node_state_counts: dict[str, int] = Field(default_factory=dict)
    link_state_counts: dict[str, int] = Field(default_factory=dict)
    inference_posture: str = "unknown"
    endpoint_pairing_posture: str = "unknown"
    collection_posture: str = "unknown"
    node_participation_posture: str = "unknown"
    paired_link_count: int = 0
    single_sided_link_count: int = 0
    linked_node_count: int = 0
    isolated_node_count: int = 0


class PersistedTopologySnapshotComparison(BaseModel):
    """Bounded current-versus-previous comparison for one persisted topology snapshot."""

    current_snapshot_id: str
    previous_snapshot_id: str
    current_persisted_at: datetime
    previous_persisted_at: datetime
    current_node_count: int
    previous_node_count: int
    current_link_count: int
    previous_link_count: int
    node_count_delta: int
    link_count_delta: int
    added_node_count: int
    removed_node_count: int
    changed_node_count: int
    added_link_count: int
    removed_link_count: int
    changed_link_count: int
    notes: list[str] = Field(default_factory=list)
    current_inference_posture: str = "unknown"
    previous_inference_posture: str = "unknown"
    current_endpoint_pairing_posture: str = "unknown"
    previous_endpoint_pairing_posture: str = "unknown"
    current_collection_posture: str = "unknown"
    previous_collection_posture: str = "unknown"
    current_node_participation_posture: str = "unknown"
    previous_node_participation_posture: str = "unknown"
    current_paired_link_count: int = 0
    previous_paired_link_count: int = 0
    current_single_sided_link_count: int = 0
    previous_single_sided_link_count: int = 0
    current_linked_node_count: int = 0
    previous_linked_node_count: int = 0
    current_isolated_node_count: int = 0
    previous_isolated_node_count: int = 0


class PersistedPolicySnapshotSummary(BaseModel):
    """Bounded persisted policy snapshot context for history surfaces."""

    snapshot_id: str
    persisted_at: datetime
    observed_at: datetime | None = None
    sync_source: str
    sync_status: str
    completeness: str
    detail_mode: str
    empty_reason: str
    observed_policy_count: int
    active_policy_count: int
    detail_record_count: int
    detail_source_readiness_posture: str = "unknown"
    detail_ready_target_count: int = 0
    no_policies_observed_target_count: int = 0
    detail_unavailable_target_count: int = 0
    partial_detail_target_count: int = 0


class PersistedPolicySnapshotComparison(BaseModel):
    """Bounded current-versus-previous comparison for one persisted policy snapshot."""

    current_snapshot_id: str
    previous_snapshot_id: str
    current_persisted_at: datetime
    previous_persisted_at: datetime
    current_observed_policy_count: int
    previous_observed_policy_count: int
    current_detail_record_count: int
    previous_detail_record_count: int
    observed_policy_delta: int
    detail_record_delta: int
    added_policy_count: int
    removed_policy_count: int
    changed_policy_count: int
    notes: list[str] = Field(default_factory=list)
    current_detail_source_readiness_posture: str = "unknown"
    previous_detail_source_readiness_posture: str = "unknown"
    current_detail_ready_target_count: int = 0
    previous_detail_ready_target_count: int = 0
    current_no_policies_observed_target_count: int = 0
    previous_no_policies_observed_target_count: int = 0
    current_detail_unavailable_target_count: int = 0
    previous_detail_unavailable_target_count: int = 0
    current_partial_detail_target_count: int = 0
    previous_partial_detail_target_count: int = 0


class PersistedReadinessSnapshotHistoryRecord(BaseModel):
    """Bounded persisted readiness snapshot context for history surfaces."""

    snapshot_id: str
    persisted_at: datetime
    readiness_status: str
    planning_readiness: str
    phase_recommendation: str
    summary: str
    blocker_count: int
    strongest_blockers: list[str] = Field(default_factory=list)


class SyncRunHistorySummary(BaseModel):
    """Bounded summary of persisted sync-run history for observability."""

    total_count: int = 0
    counts_by_model_family: dict[str, int] = Field(default_factory=dict)
    counts_by_result: dict[str, int] = Field(default_factory=dict)
    counts_by_model_family_and_result: dict[str, dict[str, int]] = Field(
        default_factory=dict
    )
    latest_finished_at_by_model_family: dict[str, datetime] = Field(
        default_factory=dict
    )


def _map_history_result(fetch_status: str) -> str:
    """Map raw sync-run fetch status into a low-cardinality history result."""
    return {
        "live_normalized_feed": "completed",
        "partial_live_feed": "partial",
        "collector_unavailable": "failed",
    }.get(fetch_status, "unknown")


def _load_inventory_record_signatures(
    session,
    *,
    snapshot_id: str,
) -> dict[str, tuple[object, ...]]:
    """Load bounded normalized signatures for one persisted inventory snapshot."""
    rows = session.scalars(
        select(InventoryRecordTable)
        .where(InventoryRecordTable.snapshot_id == snapshot_id)
        .order_by(InventoryRecordTable.device_id.asc())
    ).all()
    return {
        row.device_id: (
            row.vendor,
            row.platform,
            row.software_version,
            row.role,
            row.management_address,
            row.collector_status,
            row.capability_summary,
        )
        for row in rows
    }


def _inventory_row_to_device(row: InventoryRecordTable) -> InventoryDevice:
    """Map one persisted inventory row to a backend-owned device model."""
    return InventoryDevice(
        device_id=row.device_id,
        vendor=row.vendor,
        platform=row.platform,
        software_version=row.software_version,
        role=row.role,
        management_address=row.management_address,
        collector_status=row.collector_status,
        capability_summary=row.capability_summary,
    )


def _inventory_changed_fields(
    current: InventoryDevice, previous: InventoryDevice
) -> list[str]:
    """List normalized inventory attribute names that differ between two devices."""
    changed: list[str] = []
    if current.vendor != previous.vendor:
        changed.append("vendor")
    if current.platform != previous.platform:
        changed.append("platform")
    if current.software_version != previous.software_version:
        changed.append("software_version")
    if current.role != previous.role:
        changed.append("role")
    if current.management_address != previous.management_address:
        changed.append("management_address")
    if current.collector_status != previous.collector_status:
        changed.append("collector_status")
    if current.capability_summary != previous.capability_summary:
        changed.append("capability_summary")
    return sorted(changed)


def _as_inventory_data_status_str(raw: str) -> str:
    """Normalize persisted snapshot data_status for API literals."""
    return raw if raw in ("live", "degraded") else "degraded"


def _build_persisted_inventory_change_preview(
    *,
    current_by_id: dict[str, InventoryDevice],
    previous_by_id: dict[str, InventoryDevice],
    added_device_ids: set[str],
    removed_device_ids: set[str],
    changed_device_ids: set[str],
    limit: int = 10,
) -> list[InventoryHistoryChangePreview]:
    """Build a bounded preview of record-level inventory changes (persisted history path)."""
    preview: list[InventoryHistoryChangePreview] = []
    for device_id in sorted(added_device_ids, key=lambda d: (current_by_id[d].vendor, d)):
        d = current_by_id[device_id]
        preview.append(
            InventoryHistoryChangePreview(
                device_id=d.device_id,
                vendor=d.vendor,
                platform=d.platform,
                role=d.role,
                change_kind="added",
                changed_fields=[],
            )
        )
    for device_id in sorted(removed_device_ids, key=lambda d: (previous_by_id[d].vendor, d)):
        d = previous_by_id[device_id]
        preview.append(
            InventoryHistoryChangePreview(
                device_id=d.device_id,
                vendor=d.vendor,
                platform=d.platform,
                role=d.role,
                change_kind="removed",
                changed_fields=[],
            )
        )
    for device_id in sorted(changed_device_ids, key=lambda d: (current_by_id[d].vendor, d)):
        cur = current_by_id[device_id]
        prev = previous_by_id[device_id]
        preview.append(
            InventoryHistoryChangePreview(
                device_id=cur.device_id,
                vendor=cur.vendor,
                platform=cur.platform,
                role=cur.role,
                change_kind="changed",
                changed_fields=_inventory_changed_fields(cur, prev),
            )
        )
    return preview[:limit]


def _load_topology_node_signatures(
    session,
    *,
    snapshot_id: str,
) -> dict[str, tuple[object, ...]]:
    """Load bounded normalized node signatures for one persisted topology snapshot."""
    rows = session.scalars(
        select(TopologyNodeTable)
        .where(TopologyNodeTable.snapshot_id == snapshot_id)
        .order_by(TopologyNodeTable.node_id.asc())
    ).all()
    return {
        row.node_id: (
            row.display_name,
            row.role,
            row.state,
            row.source,
            row.device_id,
            tuple(sorted((row.attributes or {}).items())),
        )
        for row in rows
    }


def _load_topology_link_signatures(
    session,
    *,
    snapshot_id: str,
) -> dict[str, tuple[object, ...]]:
    """Load bounded normalized link signatures for one persisted topology snapshot."""
    rows = session.scalars(
        select(TopologyLinkTable)
        .where(TopologyLinkTable.snapshot_id == snapshot_id)
        .order_by(TopologyLinkTable.link_id.asc())
    ).all()
    return {
        row.link_id: (
            row.source_node_id,
            row.target_node_id,
            row.state,
            row.source,
            tuple(sorted((row.attributes or {}).items())),
        )
        for row in rows
    }


def _build_inventory_snapshot_summary(
    session,
    *,
    snapshot: InventorySnapshotTable,
) -> PersistedInventorySnapshotSummary:
    """Build bounded persisted inventory snapshot context for one sync run."""
    role_counts: Counter[str] = Counter()
    collector_status_counts: Counter[str] = Counter()
    capability_summary_counts: Counter[str] = Counter()
    rows = session.scalars(
        select(InventoryRecordTable).where(InventoryRecordTable.snapshot_id == snapshot.id)
    ).all()
    for row in rows:
        role_counts[row.role or "unknown"] += 1
        collector_status_counts[row.collector_status] += 1
        capability_summary_counts[row.capability_summary] += 1
    return PersistedInventorySnapshotSummary(
        snapshot_id=snapshot.id,
        sync_run_id=snapshot.sync_run_id,
        persisted_at=snapshot.persisted_at,
        observed_at=snapshot.sync_run.observed_at if snapshot.sync_run is not None else None,
        sync_source=snapshot.sync_run.source_type if snapshot.sync_run is not None else "unknown",
        sync_status=snapshot.sync_run.fetch_status if snapshot.sync_run is not None else "unknown",
        data_status=snapshot.data_status,
        source_endpoint=(
            snapshot.sync_run.source_endpoint if snapshot.sync_run is not None else ""
        ),
        device_count=len(rows),
        role_counts=dict(role_counts),
        collector_status_counts=dict(collector_status_counts),
        capability_summary_counts=dict(capability_summary_counts),
    )


def _build_inventory_snapshot_comparison(
    session,
    *,
    snapshot: InventorySnapshotTable,
) -> PersistedInventorySnapshotComparison | None:
    """Build bounded comparison evidence against the immediately previous inventory snapshot."""
    previous_snapshot = session.scalar(
        select(InventorySnapshotTable)
        .options(joinedload(InventorySnapshotTable.sync_run))
        .where(InventorySnapshotTable.persisted_at < snapshot.persisted_at)
        .order_by(InventorySnapshotTable.persisted_at.desc())
        .limit(1)
    )
    if previous_snapshot is None:
        return None
    current_signatures = _load_inventory_record_signatures(session, snapshot_id=snapshot.id)
    previous_signatures = _load_inventory_record_signatures(
        session, snapshot_id=previous_snapshot.id
    )
    current_device_ids = set(current_signatures)
    previous_device_ids = set(previous_signatures)
    added_device_ids = current_device_ids - previous_device_ids
    removed_device_ids = previous_device_ids - current_device_ids
    changed_device_ids = {
        device_id
        for device_id in current_device_ids & previous_device_ids
        if current_signatures[device_id] != previous_signatures[device_id]
    }
    current_device_count = len(current_signatures)
    previous_device_count = len(previous_signatures)
    current_rows = session.scalars(
        select(InventoryRecordTable)
        .where(InventoryRecordTable.snapshot_id == snapshot.id)
        .order_by(InventoryRecordTable.device_id.asc())
    ).all()
    previous_rows = session.scalars(
        select(InventoryRecordTable)
        .where(InventoryRecordTable.snapshot_id == previous_snapshot.id)
        .order_by(InventoryRecordTable.device_id.asc())
    ).all()
    current_by_id = {row.device_id: _inventory_row_to_device(row) for row in current_rows}
    previous_by_id = {row.device_id: _inventory_row_to_device(row) for row in previous_rows}
    change_preview = _build_persisted_inventory_change_preview(
        current_by_id=current_by_id,
        previous_by_id=previous_by_id,
        added_device_ids=added_device_ids,
        removed_device_ids=removed_device_ids,
        changed_device_ids=changed_device_ids,
    )
    cur_sync = snapshot.sync_run
    prev_sync = previous_snapshot.sync_run
    current_observed_at = cur_sync.observed_at if cur_sync is not None else None
    previous_observed_at = prev_sync.observed_at if prev_sync is not None else None
    current_sync_status = cur_sync.fetch_status if cur_sync is not None else "unknown"
    previous_sync_status = prev_sync.fetch_status if prev_sync is not None else "unknown"
    current_data_status = _as_inventory_data_status_str(snapshot.data_status)
    previous_data_status = _as_inventory_data_status_str(previous_snapshot.data_status)
    comparison_notes = [
        "This comparison is derived from the current persisted normalized inventory snapshot and the immediately previous persisted normalized inventory snapshot.",
        "Changed device counts reflect device IDs present in both snapshots with changed normalized inventory attributes.",
        "This is read-side evidence only; it is not a drift verdict, validation result, or workflow outcome.",
    ]
    total_changes = len(added_device_ids) + len(removed_device_ids) + len(changed_device_ids)
    if total_changes > len(change_preview):
        comparison_notes.append(
            "Change preview is intentionally capped to a short bounded list of normalized device records."
        )
    return PersistedInventorySnapshotComparison(
        current_snapshot_id=snapshot.id,
        previous_snapshot_id=previous_snapshot.id,
        current_persisted_at=snapshot.persisted_at,
        previous_persisted_at=previous_snapshot.persisted_at,
        current_observed_at=current_observed_at,
        previous_observed_at=previous_observed_at,
        current_sync_status=current_sync_status,
        previous_sync_status=previous_sync_status,
        current_data_status=current_data_status,
        previous_data_status=previous_data_status,
        current_device_count=current_device_count,
        previous_device_count=previous_device_count,
        device_count_delta=current_device_count - previous_device_count,
        added_device_count=len(added_device_ids),
        removed_device_count=len(removed_device_ids),
        changed_device_count=len(changed_device_ids),
        change_preview=change_preview,
        notes=comparison_notes,
    )


def _build_topology_snapshot_summary(
    session,
    *,
    snapshot: TopologySnapshotTable,
) -> PersistedTopologySnapshotSummary:
    """Build bounded persisted topology snapshot context for one sync run."""
    node_state_counts: Counter[str] = Counter()
    link_state_counts: Counter[str] = Counter()
    node_rows = session.scalars(
        select(TopologyNodeTable).where(TopologyNodeTable.snapshot_id == snapshot.id)
    ).all()
    link_rows = session.scalars(
        select(TopologyLinkTable).where(TopologyLinkTable.snapshot_id == snapshot.id)
    ).all()
    for row in node_rows:
        node_state_counts[row.state] += 1
    for row in link_rows:
        link_state_counts[row.state] += 1
    coverage = build_topology_coverage_summary(nodes=node_rows, links=link_rows)
    return PersistedTopologySnapshotSummary(
        snapshot_id=snapshot.id,
        persisted_at=snapshot.persisted_at,
        observed_at=snapshot.observed_at,
        topology_name=snapshot.topology_name,
        sync_source=snapshot.sync_source,
        sync_status=snapshot.sync_status,
        completeness=snapshot.completeness,
        node_count=snapshot.node_count,
        link_count=snapshot.link_count,
        node_state_counts=dict(node_state_counts),
        link_state_counts=dict(link_state_counts),
        inference_posture=coverage.inference_posture,
        endpoint_pairing_posture=coverage.endpoint_pairing_posture,
        collection_posture=coverage.collection_posture,
        node_participation_posture=coverage.node_participation_posture,
        paired_link_count=coverage.paired_link_count,
        single_sided_link_count=coverage.single_sided_link_count,
        linked_node_count=coverage.linked_node_count,
        isolated_node_count=coverage.isolated_node_count,
    )


def _build_topology_snapshot_comparison(
    session,
    *,
    snapshot: TopologySnapshotTable,
) -> PersistedTopologySnapshotComparison | None:
    """Build bounded comparison evidence against the immediately previous topology snapshot."""
    previous_snapshot = session.scalar(
        select(TopologySnapshotTable)
        .where(TopologySnapshotTable.persisted_at < snapshot.persisted_at)
        .order_by(TopologySnapshotTable.persisted_at.desc())
        .limit(1)
    )
    if previous_snapshot is None:
        return None
    current_node_signatures = _load_topology_node_signatures(session, snapshot_id=snapshot.id)
    previous_node_signatures = _load_topology_node_signatures(
        session, snapshot_id=previous_snapshot.id
    )
    current_link_signatures = _load_topology_link_signatures(session, snapshot_id=snapshot.id)
    previous_link_signatures = _load_topology_link_signatures(
        session, snapshot_id=previous_snapshot.id
    )
    current_node_ids = set(current_node_signatures)
    previous_node_ids = set(previous_node_signatures)
    current_link_ids = set(current_link_signatures)
    previous_link_ids = set(previous_link_signatures)
    added_node_ids = current_node_ids - previous_node_ids
    removed_node_ids = previous_node_ids - current_node_ids
    changed_node_ids = {
        node_id
        for node_id in current_node_ids & previous_node_ids
        if current_node_signatures[node_id] != previous_node_signatures[node_id]
    }
    added_link_ids = current_link_ids - previous_link_ids
    removed_link_ids = previous_link_ids - current_link_ids
    changed_link_ids = {
        link_id
        for link_id in current_link_ids & previous_link_ids
        if current_link_signatures[link_id] != previous_link_signatures[link_id]
    }
    current_node_rows = session.scalars(
        select(TopologyNodeTable).where(TopologyNodeTable.snapshot_id == snapshot.id)
    ).all()
    current_link_rows = session.scalars(
        select(TopologyLinkTable).where(TopologyLinkTable.snapshot_id == snapshot.id)
    ).all()
    previous_node_rows = session.scalars(
        select(TopologyNodeTable).where(
            TopologyNodeTable.snapshot_id == previous_snapshot.id
        )
    ).all()
    previous_link_rows = session.scalars(
        select(TopologyLinkTable).where(
            TopologyLinkTable.snapshot_id == previous_snapshot.id
        )
    ).all()
    current_coverage = build_topology_coverage_summary(
        nodes=current_node_rows, links=current_link_rows
    )
    previous_coverage = build_topology_coverage_summary(
        nodes=previous_node_rows, links=previous_link_rows
    )
    return PersistedTopologySnapshotComparison(
        current_snapshot_id=snapshot.id,
        previous_snapshot_id=previous_snapshot.id,
        current_persisted_at=snapshot.persisted_at,
        previous_persisted_at=previous_snapshot.persisted_at,
        current_node_count=snapshot.node_count,
        previous_node_count=previous_snapshot.node_count,
        current_link_count=snapshot.link_count,
        previous_link_count=previous_snapshot.link_count,
        node_count_delta=snapshot.node_count - previous_snapshot.node_count,
        link_count_delta=snapshot.link_count - previous_snapshot.link_count,
        added_node_count=len(added_node_ids),
        removed_node_count=len(removed_node_ids),
        changed_node_count=len(changed_node_ids),
        added_link_count=len(added_link_ids),
        removed_link_count=len(removed_link_ids),
        changed_link_count=len(changed_link_ids),
        notes=[
            "This comparison is derived from the current persisted normalized topology snapshot and the immediately previous persisted normalized topology snapshot.",
            "Changed node and link counts reflect normalized snapshot signatures rather than protocol-derived topology truth.",
        ],
        current_inference_posture=current_coverage.inference_posture,
        previous_inference_posture=previous_coverage.inference_posture,
        current_endpoint_pairing_posture=current_coverage.endpoint_pairing_posture,
        previous_endpoint_pairing_posture=previous_coverage.endpoint_pairing_posture,
        current_collection_posture=current_coverage.collection_posture,
        previous_collection_posture=previous_coverage.collection_posture,
        current_node_participation_posture=current_coverage.node_participation_posture,
        previous_node_participation_posture=previous_coverage.node_participation_posture,
        current_paired_link_count=current_coverage.paired_link_count,
        previous_paired_link_count=previous_coverage.paired_link_count,
        current_single_sided_link_count=current_coverage.single_sided_link_count,
        previous_single_sided_link_count=previous_coverage.single_sided_link_count,
        current_linked_node_count=current_coverage.linked_node_count,
        previous_linked_node_count=previous_coverage.linked_node_count,
        current_isolated_node_count=current_coverage.isolated_node_count,
        previous_isolated_node_count=previous_coverage.isolated_node_count,
    )


def _load_policy_snapshot_record_signatures(
    session,
    *,
    snapshot_id: str,
) -> dict[str, tuple[object, ...]]:
    """Load bounded normalized signatures for one persisted policy snapshot."""
    policy_rows = session.scalars(
        select(PolicyRecordTable)
        .where(PolicyRecordTable.snapshot_id == snapshot_id)
        .order_by(PolicyRecordTable.policy_id.asc())
    ).all()
    if not policy_rows:
        return {}
    policy_record_ids = [row.id for row in policy_rows]
    candidate_rows = session.scalars(
        select(PolicyCandidatePathTable)
        .where(PolicyCandidatePathTable.policy_record_id.in_(policy_record_ids))
        .order_by(
            PolicyCandidatePathTable.policy_record_id.asc(),
            PolicyCandidatePathTable.preference.desc().nullslast(),
            PolicyCandidatePathTable.name.asc(),
        )
    ).all()
    candidates_by_policy_record_id: dict[int, list[PolicyCandidatePathTable]] = {}
    for row in candidate_rows:
        candidates_by_policy_record_id.setdefault(row.policy_record_id, []).append(row)
    signatures: dict[str, tuple[object, ...]] = {}
    for row in policy_rows:
        signatures[row.policy_id] = (
            row.policy_name,
            row.policy_type,
            row.headend,
            row.endpoint,
            row.color,
            row.source_target,
            row.source_target_role,
            row.intent_state,
            row.observed_state,
            row.support_state,
            row.health_state,
            tuple(
                (
                    candidate.name,
                    candidate.path_state,
                    candidate.preference,
                    tuple(candidate.notes),
                )
                for candidate in candidates_by_policy_record_id.get(row.id, [])
            ),
        )
    return signatures


def _build_policy_snapshot_summary(
    session,
    *,
    snapshot: PolicySnapshotTable,
) -> PersistedPolicySnapshotSummary:
    """Build bounded persisted policy snapshot context for one sync run."""
    detail_record_count = session.scalar(
        select(func.count(PolicyRecordTable.id)).where(PolicyRecordTable.snapshot_id == snapshot.id)
    )
    return PersistedPolicySnapshotSummary(
        snapshot_id=snapshot.id,
        persisted_at=snapshot.persisted_at,
        observed_at=snapshot.observed_at,
        sync_source=snapshot.sync_source,
        sync_status=snapshot.sync_status,
        completeness=snapshot.completeness,
        detail_mode=snapshot.detail_mode,
        empty_reason=snapshot.empty_reason,
        observed_policy_count=snapshot.observed_policy_count,
        active_policy_count=snapshot.active_policy_count,
        detail_record_count=int(detail_record_count or 0),
        detail_source_readiness_posture=snapshot.detail_source_readiness_posture,
        detail_ready_target_count=snapshot.detail_ready_target_count,
        no_policies_observed_target_count=snapshot.no_policies_observed_target_count,
        detail_unavailable_target_count=snapshot.detail_unavailable_target_count,
        partial_detail_target_count=snapshot.partial_detail_target_count,
    )


def _build_policy_snapshot_comparison(
    session,
    *,
    snapshot: PolicySnapshotTable,
) -> PersistedPolicySnapshotComparison | None:
    """Build bounded comparison evidence against the immediately previous snapshot."""
    previous_snapshot = session.scalar(
        select(PolicySnapshotTable)
        .where(PolicySnapshotTable.persisted_at < snapshot.persisted_at)
        .order_by(PolicySnapshotTable.persisted_at.desc())
        .limit(1)
    )
    if previous_snapshot is None:
        return None
    current_signatures = _load_policy_snapshot_record_signatures(session, snapshot_id=snapshot.id)
    previous_signatures = _load_policy_snapshot_record_signatures(
        session, snapshot_id=previous_snapshot.id
    )
    current_policy_ids = set(current_signatures)
    previous_policy_ids = set(previous_signatures)
    added_policy_ids = current_policy_ids - previous_policy_ids
    removed_policy_ids = previous_policy_ids - current_policy_ids
    changed_policy_ids = {
        policy_id
        for policy_id in current_policy_ids & previous_policy_ids
        if current_signatures[policy_id] != previous_signatures[policy_id]
    }
    current_detail_record_count = len(current_signatures)
    previous_detail_record_count = len(previous_signatures)
    notes = [
        "This comparison is derived from the current persisted normalized policy snapshot and the immediately previous persisted normalized policy snapshot.",
        "Added, removed, and changed counts only reflect policies that have bounded normalized detail records in those snapshots.",
    ]
    if (
        snapshot.observed_policy_count > current_detail_record_count
        or previous_snapshot.observed_policy_count > previous_detail_record_count
    ):
        notes.append(
            "Observed policy totals may be higher than detailed record totals when the bounded read path cannot derive per-policy detail for every observed policy type."
        )
    return PersistedPolicySnapshotComparison(
        current_snapshot_id=snapshot.id,
        previous_snapshot_id=previous_snapshot.id,
        current_persisted_at=snapshot.persisted_at,
        previous_persisted_at=previous_snapshot.persisted_at,
        current_observed_policy_count=snapshot.observed_policy_count,
        previous_observed_policy_count=previous_snapshot.observed_policy_count,
        current_detail_record_count=current_detail_record_count,
        previous_detail_record_count=previous_detail_record_count,
        observed_policy_delta=snapshot.observed_policy_count - previous_snapshot.observed_policy_count,
        detail_record_delta=current_detail_record_count - previous_detail_record_count,
        added_policy_count=len(added_policy_ids),
        removed_policy_count=len(removed_policy_ids),
        changed_policy_count=len(changed_policy_ids),
        notes=notes,
        current_detail_source_readiness_posture=snapshot.detail_source_readiness_posture,
        previous_detail_source_readiness_posture=previous_snapshot.detail_source_readiness_posture,
        current_detail_ready_target_count=snapshot.detail_ready_target_count,
        previous_detail_ready_target_count=previous_snapshot.detail_ready_target_count,
        current_no_policies_observed_target_count=snapshot.no_policies_observed_target_count,
        previous_no_policies_observed_target_count=previous_snapshot.no_policies_observed_target_count,
        current_detail_unavailable_target_count=snapshot.detail_unavailable_target_count,
        previous_detail_unavailable_target_count=previous_snapshot.detail_unavailable_target_count,
        current_partial_detail_target_count=snapshot.partial_detail_target_count,
        previous_partial_detail_target_count=previous_snapshot.partial_detail_target_count,
    )


def load_sync_runs(limit: int = 50) -> list[PersistedSyncRun]:
    """Load recent persisted sync runs for read-only history endpoints."""
    try:
        with create_session() as session:
            rows = session.scalars(
                select(SyncRunTable)
                .options(
                    selectinload(SyncRunTable.inventory_snapshot).joinedload(
                        InventorySnapshotTable.sync_run
                    ),
                    selectinload(SyncRunTable.topology_snapshot),
                    selectinload(SyncRunTable.policy_snapshot),
                )
                .order_by(SyncRunTable.finished_at.desc())
                .limit(limit)
            ).all()
            items: list[PersistedSyncRun] = []
            for row in rows:
                persisted_artifacts: list[str] = []
                if row.inventory_snapshot is not None:
                    persisted_artifacts.append("inventory_snapshot")
                if row.topology_snapshot is not None:
                    persisted_artifacts.append("topology_snapshot")
                if row.policy_snapshot is not None:
                    persisted_artifacts.append("policy_snapshot")
                inventory_snapshot_summary = None
                inventory_comparison_to_previous = None
                topology_snapshot_summary = None
                topology_comparison_to_previous = None
                policy_snapshot_summary = None
                policy_comparison_to_previous = None
                if row.inventory_snapshot is not None:
                    inventory_snapshot_summary = _build_inventory_snapshot_summary(
                        session, snapshot=row.inventory_snapshot
                    )
                    inventory_comparison_to_previous = _build_inventory_snapshot_comparison(
                        session, snapshot=row.inventory_snapshot
                    )
                if row.topology_snapshot is not None:
                    topology_snapshot_summary = _build_topology_snapshot_summary(
                        session, snapshot=row.topology_snapshot
                    )
                    topology_comparison_to_previous = _build_topology_snapshot_comparison(
                        session, snapshot=row.topology_snapshot
                    )
                if row.policy_snapshot is not None:
                    policy_snapshot_summary = _build_policy_snapshot_summary(
                        session, snapshot=row.policy_snapshot
                    )
                    policy_comparison_to_previous = _build_policy_snapshot_comparison(
                        session, snapshot=row.policy_snapshot
                    )
                items.append(
                    PersistedSyncRun(
                        sync_run_id=row.id,
                        model_family=row.model_family,
                        source_type=row.source_type,
                        source_endpoint=row.source_endpoint,
                        fetch_status=row.fetch_status,
                        record_count=row.record_count,
                        observed_at=row.observed_at,
                        started_at=row.started_at,
                        finished_at=row.finished_at,
                        persisted_artifacts=persisted_artifacts,
                        inventory_snapshot_summary=inventory_snapshot_summary,
                        inventory_comparison_to_previous=inventory_comparison_to_previous,
                        topology_snapshot_summary=topology_snapshot_summary,
                        topology_comparison_to_previous=topology_comparison_to_previous,
                        policy_snapshot_summary=policy_snapshot_summary,
                        policy_comparison_to_previous=policy_comparison_to_previous,
                        notes=row.notes,
                    )
                )
            return items
    except Exception:
        logger.exception("Failed to load bounded sync-run history.")
        return []


def load_readiness_snapshot_history(
    limit: int = 20,
) -> list[PersistedReadinessSnapshotHistoryRecord]:
    """Load recent persisted readiness snapshots for bounded history surfaces."""
    try:
        with create_session() as session:
            rows = session.scalars(
                select(ReadinessSnapshotTable)
                .order_by(ReadinessSnapshotTable.persisted_at.desc())
                .limit(limit)
            ).all()
            return [
                PersistedReadinessSnapshotHistoryRecord(
                    snapshot_id=row.id,
                    persisted_at=row.persisted_at,
                    readiness_status=row.readiness_status,
                    planning_readiness=row.planning_readiness,
                    phase_recommendation=row.phase_recommendation,
                    summary=row.summary,
                    blocker_count=len(row.blockers or []),
                    strongest_blockers=list(row.strongest_blockers or []),
                )
                for row in rows
            ]
    except Exception:
        logger.exception("Failed to load bounded readiness snapshot history.")
        return []


def summarize_sync_run_history(limit: int = 200) -> SyncRunHistorySummary:
    """Summarize persisted sync-run history for metrics and dashboards."""
    sync_runs = load_sync_runs(limit=limit)
    counts_by_model_family: Counter[str] = Counter()
    counts_by_result: Counter[str] = Counter()
    counts_by_model_family_and_result: dict[str, Counter[str]] = defaultdict(Counter)
    latest_finished_at_by_model_family: dict[str, datetime] = {}

    for sync_run in sync_runs:
        result = _map_history_result(sync_run.fetch_status)
        counts_by_model_family[sync_run.model_family] += 1
        counts_by_result[result] += 1
        counts_by_model_family_and_result[sync_run.model_family][result] += 1
        current_latest = latest_finished_at_by_model_family.get(sync_run.model_family)
        if current_latest is None or sync_run.finished_at > current_latest:
            latest_finished_at_by_model_family[sync_run.model_family] = sync_run.finished_at

    return SyncRunHistorySummary(
        total_count=len(sync_runs),
        counts_by_model_family=dict(counts_by_model_family),
        counts_by_result=dict(counts_by_result),
        counts_by_model_family_and_result={
            model_family: dict(result_counts)
            for model_family, result_counts in counts_by_model_family_and_result.items()
        },
        latest_finished_at_by_model_family=latest_finished_at_by_model_family,
    )

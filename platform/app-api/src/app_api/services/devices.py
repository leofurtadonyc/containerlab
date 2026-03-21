"""Device inventory service helpers."""

from collections import Counter
from datetime import UTC, datetime
from typing import Literal

from app_api.config.settings import get_settings
from app_api.integrations.collector.inventory import (
    CollectorInventorySnapshot,
    get_collector_inventory_client,
)
from app_api.models.inventory import (
    InventoryComparisonSummary,
    InventoryDevice,
    InventoryHistoryChangePreview,
    InventoryHistoryComparison,
    InventoryHistoryWindow,
)
from app_api.persistence.read_side import (
    load_latest_inventory_snapshot,
    load_previous_inventory_snapshot,
    load_recent_inventory_snapshot_summaries,
    persist_inventory_snapshot,
)
from app_api.schemas.devices import (
    DeviceRecord,
    DevicesListResponse,
    InventoryComparisonSummary as InventoryComparisonSummaryResponse,
    InventoryHistoryChangePreview as InventoryHistoryChangePreviewResponse,
    InventoryHistoryComparison as InventoryHistoryComparisonResponse,
    InventoryHistorySnapshotRecord as InventoryHistorySnapshotResponseRecord,
    InventoryHistoryWindow as InventoryHistoryWindowResponse,
)
from app_api.schemas.common import EvidenceConfidenceSummary


def _describe_capability_summary(value: str) -> str:
    """Explain the current device capability posture briefly."""
    return {
        "supported": "The current read-only platform slice can support this device posture without known capability gaps.",
        "partially_supported": "The platform can expose useful read-only data for this device, but some deeper semantics remain intentionally bounded.",
        "unsupported": "The current platform slice does not support this device capability posture.",
        "not_implemented_in_platform": "The platform recognizes this capability category, but does not implement it yet.",
    }.get(
        value,
        "The current platform slice does not yet have enough evidence to classify this device capability posture more precisely.",
    )


def _device_signature(device: InventoryDevice) -> tuple[object, ...]:
    """Return a stable normalized device signature for bounded comparisons."""
    return (
        device.vendor,
        device.platform,
        device.software_version,
        device.role,
        device.management_address,
        device.collector_status,
        device.capability_summary,
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


def _as_inventory_data_status(raw: str) -> Literal["live", "degraded"]:
    """Normalize persisted snapshot data_status for API literals."""
    return raw if raw in ("live", "degraded") else "degraded"


def _build_inventory_change_preview(
    *,
    current_by_id: dict[str, InventoryDevice],
    previous_by_id: dict[str, InventoryDevice],
    added_device_ids: set[str],
    removed_device_ids: set[str],
    changed_device_ids: set[str],
    limit: int = 10,
) -> list[InventoryHistoryChangePreview]:
    """Build a bounded preview of record-level inventory changes."""
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


def _role_counts(devices: list[InventoryDevice]) -> dict[str, int]:
    """Return a low-cardinality role count summary."""
    return dict(Counter(device.role or "unknown" for device in devices))


def _collector_status_counts(devices: list[InventoryDevice]) -> dict[str, int]:
    """Return a low-cardinality collector status summary."""
    return dict(Counter(device.collector_status for device in devices))


def _capability_summary_counts(devices: list[InventoryDevice]) -> dict[str, int]:
    """Return a low-cardinality capability posture summary."""
    return dict(Counter(device.capability_summary for device in devices))


def _build_inventory_comparison_summary(
    *,
    current_devices: list[InventoryDevice],
    comparison_devices: list[InventoryDevice] | None,
    comparison_snapshot_id: str | None,
    comparison_persisted_at: datetime | None,
) -> InventoryComparisonSummary:
    """Build bounded current-versus-persisted inventory comparison evidence."""
    current_role_counts = _role_counts(current_devices)
    current_collector_counts = _collector_status_counts(current_devices)
    current_capability_counts = _capability_summary_counts(current_devices)
    if comparison_devices is None or comparison_persisted_at is None:
        return InventoryComparisonSummary(
            status="unavailable",
            summary=(
                "No persisted normalized inventory snapshot is currently available for "
                "bounded comparison with the current device inventory response."
            ),
            comparison_snapshot_id=comparison_snapshot_id,
            comparison_persisted_at=None,
            current_device_count=len(current_devices),
            persisted_device_count=0,
            device_count_delta=0,
            added_device_count=0,
            removed_device_count=0,
            changed_device_count=0,
            current_role_counts=current_role_counts,
            persisted_role_counts={},
            current_collector_status_counts=current_collector_counts,
            persisted_collector_status_counts={},
            current_capability_summary_counts=current_capability_counts,
            persisted_capability_summary_counts={},
            notes=[
                "Comparison becomes available only when the backend already has a persisted normalized inventory snapshot to compare against the current response.",
            ],
        )

    persisted_role_counts = _role_counts(comparison_devices)
    persisted_collector_counts = _collector_status_counts(comparison_devices)
    persisted_capability_counts = _capability_summary_counts(comparison_devices)
    current_signatures = {
        device.device_id: _device_signature(device) for device in current_devices
    }
    persisted_signatures = {
        device.device_id: _device_signature(device) for device in comparison_devices
    }
    current_device_ids = set(current_signatures)
    persisted_device_ids = set(persisted_signatures)
    changed_device_count = sum(
        1
        for device_id in current_device_ids & persisted_device_ids
        if current_signatures[device_id] != persisted_signatures[device_id]
    )
    return InventoryComparisonSummary(
        status="live_vs_latest_persisted_ready",
        summary=(
            "Bounded comparison is available between the current device inventory "
            "response and the latest persisted normalized inventory snapshot."
        ),
        comparison_snapshot_id=comparison_snapshot_id,
        comparison_persisted_at=comparison_persisted_at,
        current_device_count=len(current_devices),
        persisted_device_count=len(comparison_devices),
        device_count_delta=len(current_devices) - len(comparison_devices),
        added_device_count=len(current_device_ids - persisted_device_ids),
        removed_device_count=len(persisted_device_ids - current_device_ids),
        changed_device_count=changed_device_count,
        current_role_counts=current_role_counts,
        persisted_role_counts=persisted_role_counts,
        current_collector_status_counts=current_collector_counts,
        persisted_collector_status_counts=persisted_collector_counts,
        current_capability_summary_counts=current_capability_counts,
        persisted_capability_summary_counts=persisted_capability_counts,
        notes=[
            "This comparison reflects the current normalized device inventory response against the latest persisted normalized inventory snapshot.",
            "Added, removed, and changed counts are based on bounded normalized device attributes rather than raw vendor payloads or workflow intent.",
        ],
    )


def _build_inventory_evidence_confidence(
    *,
    collector_snapshot: CollectorInventorySnapshot,
    persisted_at: datetime | None,
) -> EvidenceConfidenceSummary:
    """Describe how much confidence the current inventory response deserves."""
    coverage_note = (
        f"Coverage currently includes {collector_snapshot.observed_target_count} of {collector_snapshot.configured_target_count} configured inventory targets, "
        f"with {collector_snapshot.collection_partial_count} partial and {collector_snapshot.collection_failure_count} failed targets."
    )
    freshness_note = None
    if collector_snapshot.oldest_observed_at and collector_snapshot.newest_observed_at:
        freshness_note = (
            "Current collector inventory freshness window spans from "
            f"{collector_snapshot.oldest_observed_at} to {collector_snapshot.newest_observed_at}."
        )

    if collector_snapshot.status == "live_normalized_feed":
        return EvidenceConfidenceSummary(
            source_posture="live_observed",
            evidence_kind="direct_observed",
            confidence_posture="strong_for_current_slice",
            freshness_posture="current",
            blocked_reason="none",
            summary=(
                "Current device inventory is served from direct live observed collector "
                "records for the current read-only inventory slice."
            ),
            notes=[
                "This posture reflects normalized device records derived from live collector delivery rather than raw vendor payloads.",
                "Capability posture remains bounded to the currently implemented read-only platform slice.",
                coverage_note,
                *( [freshness_note] if freshness_note else [] ),
            ],
        )
    if collector_snapshot.status == "partial_live_feed":
        return EvidenceConfidenceSummary(
            source_posture="live_observed",
            evidence_kind="direct_observed",
            confidence_posture="degraded",
            freshness_posture="current",
            blocked_reason="none",
            summary=(
                "Current device inventory is still live observed, but one or more "
                "targets returned partial or degraded collector evidence."
            ),
            notes=[
                "The backend is serving live normalized device records.",
                "Confidence is degraded because the collector explicitly reported a partial live feed.",
                coverage_note,
                collector_snapshot.degraded_scope_summary,
                *( [freshness_note] if freshness_note else [] ),
            ],
        )
    if persisted_at is not None:
        return EvidenceConfidenceSummary(
            source_posture="persisted_fallback",
            evidence_kind="direct_observed",
            confidence_posture="degraded",
            freshness_posture="stale",
            blocked_reason="collector_unavailable",
            summary=(
                "Current device inventory is a persisted fallback snapshot because live "
                "collector evidence is unavailable."
            ),
            notes=[
                "The served records still come from normalized observed inventory data, but not from the current live collector read.",
                "Treat this response as stale relative to present network truth until live collection recovers.",
                collector_snapshot.degraded_scope_summary,
            ],
        )
    return EvidenceConfidenceSummary(
        source_posture="empty_scaffold",
        evidence_kind="unknown",
        confidence_posture="blocked",
        freshness_posture="unknown",
        blocked_reason="collector_unavailable_and_no_persisted_snapshot",
        summary=(
            "The inventory response is blocked from showing device truth because live "
            "collector evidence is unavailable and no persisted fallback snapshot exists."
        ),
        notes=[
            "The devices API preserves schema stability here without inventing device records.",
            "No raw vendor payloads are exposed when backend-owned evidence is missing.",
        ],
    )


def _build_inventory_history_window() -> InventoryHistoryWindow:
    """Build a bounded persisted history/comparison view for inventory snapshots."""
    recent_snapshots = load_recent_inventory_snapshot_summaries(limit=3)
    if not recent_snapshots:
        return InventoryHistoryWindow(
            status="unavailable",
            summary=(
                "No persisted normalized inventory snapshots are currently available for "
                "bounded inventory history or comparison."
            ),
        )

    if len(recent_snapshots) == 1:
        return InventoryHistoryWindow(
            status="current_only",
            summary=(
                "One persisted normalized inventory snapshot is currently available, so "
                "bounded current-versus-previous inventory comparison is not yet available."
            ),
            recent_snapshots=[entry.snapshot for entry in recent_snapshots],
        )

    current_snapshot = load_latest_inventory_snapshot()
    previous_snapshot = load_previous_inventory_snapshot()
    if current_snapshot is None or previous_snapshot is None:
        return InventoryHistoryWindow(
            status="current_only",
            summary=(
                "Recent persisted inventory snapshot summaries are available, but the "
                "bounded comparison view could not load both full snapshots."
            ),
            recent_snapshots=[entry.snapshot for entry in recent_snapshots],
        )

    current_by_id = {device.device_id: device for device in current_snapshot.devices}
    previous_by_id = {device.device_id: device for device in previous_snapshot.devices}
    current_signatures = {
        device_id: _device_signature(device) for device_id, device in current_by_id.items()
    }
    previous_signatures = {
        device_id: _device_signature(device) for device_id, device in previous_by_id.items()
    }
    current_device_ids = set(current_signatures)
    previous_device_ids = set(previous_signatures)
    added_device_ids = current_device_ids - previous_device_ids
    removed_device_ids = previous_device_ids - current_device_ids
    changed_device_ids = {
        device_id
        for device_id in current_device_ids & previous_device_ids
        if current_signatures[device_id] != previous_signatures[device_id]
    }
    change_preview = _build_inventory_change_preview(
        current_by_id=current_by_id,
        previous_by_id=previous_by_id,
        added_device_ids=added_device_ids,
        removed_device_ids=removed_device_ids,
        changed_device_ids=changed_device_ids,
    )
    comparison_notes = [
        "This comparison is derived from the latest two persisted normalized inventory snapshots.",
        "Changed device counts reflect device IDs present in both snapshots with changed normalized inventory attributes.",
        "This is read-side evidence only; it is not a drift verdict, validation result, or workflow outcome.",
    ]
    total_changes = len(added_device_ids) + len(removed_device_ids) + len(changed_device_ids)
    if total_changes > len(change_preview):
        comparison_notes.append(
            "Change preview is intentionally capped to a short bounded list of normalized device records."
        )
    return InventoryHistoryWindow(
        status="comparison_ready",
        summary=(
            "Recent persisted normalized inventory snapshots are available for bounded "
            "current-versus-previous comparison."
        ),
        recent_snapshots=[entry.snapshot for entry in recent_snapshots],
        comparison_to_previous=InventoryHistoryComparison(
            current_snapshot_id=current_snapshot.snapshot_id,
            previous_snapshot_id=previous_snapshot.snapshot_id,
            current_persisted_at=current_snapshot.persisted_at,
            previous_persisted_at=previous_snapshot.persisted_at,
            current_observed_at=current_snapshot.observed_at,
            previous_observed_at=previous_snapshot.observed_at,
            current_sync_status=current_snapshot.sync_fetch_status,
            previous_sync_status=previous_snapshot.sync_fetch_status,
            current_data_status=_as_inventory_data_status(current_snapshot.data_status),
            previous_data_status=_as_inventory_data_status(previous_snapshot.data_status),
            current_device_count=len(current_snapshot.devices),
            previous_device_count=len(previous_snapshot.devices),
            device_count_delta=len(current_snapshot.devices) - len(previous_snapshot.devices),
            added_device_count=len(added_device_ids),
            removed_device_count=len(removed_device_ids),
            changed_device_count=len(changed_device_ids),
            change_preview=change_preview,
            notes=comparison_notes,
        ),
    )


def _build_inventory_devices() -> tuple[
    CollectorInventorySnapshot,
    list[InventoryDevice],
    datetime | None,
    InventoryComparisonSummary,
]:
    """Load backend-owned inventory models from the collector boundary."""
    snapshot = get_collector_inventory_client().read_inventory_snapshot()
    if snapshot.status == "collector_unavailable":
        persisted_snapshot = load_latest_inventory_snapshot()
        if persisted_snapshot is not None:
            devices = persisted_snapshot.devices
            return snapshot, devices, persisted_snapshot.persisted_at, InventoryComparisonSummary(
                status="unavailable",
                summary=(
                    "Live collector inventory is unavailable, so the current response "
                    "already reflects the latest persisted normalized inventory snapshot."
                ),
                comparison_snapshot_id=persisted_snapshot.snapshot_id,
                comparison_persisted_at=persisted_snapshot.persisted_at,
                current_device_count=len(devices),
                persisted_device_count=len(devices),
                device_count_delta=0,
                added_device_count=0,
                removed_device_count=0,
                changed_device_count=0,
                current_role_counts=_role_counts(devices),
                persisted_role_counts=_role_counts(devices),
                current_collector_status_counts=_collector_status_counts(devices),
                persisted_collector_status_counts=_collector_status_counts(devices),
                current_capability_summary_counts=_capability_summary_counts(devices),
                persisted_capability_summary_counts=_capability_summary_counts(devices),
                notes=[
                    "Comparison is not shown here because the current inventory response is already the persisted fallback snapshot.",
                ],
            )
        return snapshot, [], None, InventoryComparisonSummary(
            status="unavailable",
            summary=(
                "No persisted inventory comparison is available because neither a live "
                "collector inventory snapshot nor a persisted fallback snapshot could be loaded."
            ),
                comparison_snapshot_id=None,
            comparison_persisted_at=None,
            current_device_count=0,
            persisted_device_count=0,
            device_count_delta=0,
            added_device_count=0,
            removed_device_count=0,
            changed_device_count=0,
            current_role_counts={},
            persisted_role_counts={},
            current_collector_status_counts={},
            persisted_collector_status_counts={},
            current_capability_summary_counts={},
            persisted_capability_summary_counts={},
            notes=[
                "Comparison requires at least one persisted normalized inventory snapshot in addition to the current device inventory response.",
            ],
        )

    inventory_devices = [
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
        for record in snapshot.records
    ]
    latest_persisted_snapshot = load_latest_inventory_snapshot()
    comparison = _build_inventory_comparison_summary(
        current_devices=inventory_devices,
        comparison_devices=(
            latest_persisted_snapshot.devices if latest_persisted_snapshot is not None else None
        ),
        comparison_snapshot_id=(
            latest_persisted_snapshot.snapshot_id
            if latest_persisted_snapshot is not None
            else None
        ),
        comparison_persisted_at=(
            latest_persisted_snapshot.persisted_at
            if latest_persisted_snapshot is not None
            else None
        ),
    )
    persist_inventory_snapshot(
        collector_snapshot=snapshot,
        devices=inventory_devices,
        data_status=(
            "live" if snapshot.status == "live_normalized_feed" else "degraded"
        ),
    )
    return snapshot, inventory_devices, None, comparison


def build_devices_list_response() -> DevicesListResponse:
    """Build the device inventory response from the live collector boundary."""
    settings = get_settings()
    snapshot, inventory_devices, persisted_at, comparison = _build_inventory_devices()
    history = _build_inventory_history_window()
    row_current_posture = (
        "stale"
        if snapshot.status == "collector_unavailable" and persisted_at is not None
        else "current"
    )
    evidence_confidence = _build_inventory_evidence_confidence(
        collector_snapshot=snapshot,
        persisted_at=persisted_at,
    )
    items = [
        DeviceRecord(
            device_id=device.device_id,
            vendor=device.vendor,
            platform=device.platform,
            software_version=device.software_version,
            role=device.role,
            management_address=device.management_address,
            current_posture=row_current_posture,
            collector_status=device.collector_status,
            last_recorded_collector_status=device.collector_status,
            capability_summary=device.capability_summary,
            capability_detail=_describe_capability_summary(device.capability_summary),
        )
        for device in inventory_devices
    ]
    if snapshot.status == "live_normalized_feed":
        data_status = "live"
        serving_mode = "live_collector"
        summary = (
            "Device inventory is backed by live read-only Nokia gNMI collection "
            "from the configured management-plane targets, with usable current evidence from "
            f"{snapshot.observed_target_count} of {snapshot.configured_target_count} configured targets."
        )
    elif snapshot.status == "partial_live_feed":
        data_status = "degraded"
        serving_mode = "live_collector"
        summary = (
            "Device inventory is backed by live Nokia gNMI collection, but one or "
            "more configured targets returned partial data. "
            f"Coverage currently includes {snapshot.observed_target_count} of {snapshot.configured_target_count} configured targets."
        )
    else:
        data_status = "degraded"
        if inventory_devices and persisted_at is not None:
            serving_mode = "persisted_fallback"
            summary = (
                "The backend could not load the live collector inventory snapshot, so "
                "the latest persisted normalized inventory snapshot is being served."
            )
        else:
            serving_mode = "empty_scaffold"
            summary = (
                "The backend could not load the live collector inventory snapshot. "
                "No raw vendor payloads are exposed through the devices API."
            )
    return DevicesListResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status=data_status,
        serving_mode=serving_mode,
        evidence_confidence=evidence_confidence,
        summary=summary,
        served_persisted_at=persisted_at,
        comparison_to_latest_persisted=InventoryComparisonSummaryResponse(
            status=comparison.status,
            summary=comparison.summary,
            comparison_snapshot_id=comparison.comparison_snapshot_id,
            comparison_persisted_at=comparison.comparison_persisted_at,
            current_device_count=comparison.current_device_count,
            persisted_device_count=comparison.persisted_device_count,
            device_count_delta=comparison.device_count_delta,
            added_device_count=comparison.added_device_count,
            removed_device_count=comparison.removed_device_count,
            changed_device_count=comparison.changed_device_count,
            current_role_counts=comparison.current_role_counts,
            persisted_role_counts=comparison.persisted_role_counts,
            current_collector_status_counts=comparison.current_collector_status_counts,
            persisted_collector_status_counts=comparison.persisted_collector_status_counts,
            current_capability_summary_counts=comparison.current_capability_summary_counts,
            persisted_capability_summary_counts=comparison.persisted_capability_summary_counts,
            notes=comparison.notes,
        ),
        history=InventoryHistoryWindowResponse(
            status=history.status,
            summary=history.summary,
            recent_snapshots=[
                InventoryHistorySnapshotResponseRecord(
                    snapshot_id=entry.snapshot_id,
                    sync_run_id=entry.sync_run_id,
                    persisted_at=entry.persisted_at,
                    observed_at=entry.observed_at,
                    sync_source=entry.sync_source,
                    sync_status=entry.sync_status,
                    data_status=entry.data_status,
                    source_endpoint=entry.source_endpoint,
                    device_count=entry.device_count,
                    role_counts=entry.role_counts,
                    collector_status_counts=entry.collector_status_counts,
                    capability_summary_counts=entry.capability_summary_counts,
                )
                for entry in history.recent_snapshots
            ],
            comparison_to_previous=(
                InventoryHistoryComparisonResponse(
                    current_snapshot_id=history.comparison_to_previous.current_snapshot_id,
                    previous_snapshot_id=history.comparison_to_previous.previous_snapshot_id,
                    current_persisted_at=history.comparison_to_previous.current_persisted_at,
                    previous_persisted_at=history.comparison_to_previous.previous_persisted_at,
                    current_observed_at=history.comparison_to_previous.current_observed_at,
                    previous_observed_at=history.comparison_to_previous.previous_observed_at,
                    current_sync_status=history.comparison_to_previous.current_sync_status,
                    previous_sync_status=history.comparison_to_previous.previous_sync_status,
                    current_data_status=history.comparison_to_previous.current_data_status,
                    previous_data_status=history.comparison_to_previous.previous_data_status,
                    current_device_count=history.comparison_to_previous.current_device_count,
                    previous_device_count=history.comparison_to_previous.previous_device_count,
                    device_count_delta=history.comparison_to_previous.device_count_delta,
                    added_device_count=history.comparison_to_previous.added_device_count,
                    removed_device_count=history.comparison_to_previous.removed_device_count,
                    changed_device_count=history.comparison_to_previous.changed_device_count,
                    change_preview=[
                        InventoryHistoryChangePreviewResponse(
                            device_id=entry.device_id,
                            vendor=entry.vendor,
                            platform=entry.platform,
                            role=entry.role,
                            change_kind=entry.change_kind,
                            changed_fields=entry.changed_fields,
                        )
                        for entry in history.comparison_to_previous.change_preview
                    ],
                    notes=history.comparison_to_previous.notes,
                )
                if history.comparison_to_previous is not None
                else None
            ),
        ),
        count=len(items),
        items=items,
    )

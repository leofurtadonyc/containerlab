"""Typed schemas for device inventory responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import (
    ApiResponseMetadata,
    ComparisonToLatestPersistedStatus,
    EvidenceConfidenceSummary,
)


CurrentRowPosture = Literal["current", "stale"]
DeviceCollectorStatus = Literal["ok", "degraded", "unreachable", "unknown"]


class DeviceRecord(BaseModel):
    """Vendor-neutral device inventory record for Phase 2 APIs."""

    device_id: str
    vendor: str
    platform: str
    software_version: str | None = None
    role: str | None = None
    management_address: str
    current_posture: CurrentRowPosture
    collector_status: DeviceCollectorStatus
    last_recorded_collector_status: DeviceCollectorStatus
    capability_summary: Literal[
        "supported",
        "partially_supported",
        "unsupported",
        "unknown",
        "not_implemented_in_platform",
    ]
    capability_detail: str


class InventoryComparisonSummary(BaseModel):
    """Bounded comparison between current inventory response and latest persisted snapshot."""

    status: ComparisonToLatestPersistedStatus
    summary: str
    comparison_snapshot_id: str | None = None
    comparison_persisted_at: datetime | None = None
    current_device_count: int
    persisted_device_count: int
    device_count_delta: int
    added_device_count: int
    removed_device_count: int
    changed_device_count: int
    current_role_counts: dict[str, int]
    persisted_role_counts: dict[str, int]
    current_collector_status_counts: dict[str, int]
    persisted_collector_status_counts: dict[str, int]
    current_capability_summary_counts: dict[str, int]
    persisted_capability_summary_counts: dict[str, int]
    notes: list[str]


class InventoryHistorySnapshotRecord(BaseModel):
    """Bounded summary of one persisted inventory snapshot."""

    snapshot_id: str
    sync_run_id: str
    persisted_at: datetime
    observed_at: datetime | None = None
    sync_source: str
    sync_status: str
    data_status: Literal["live", "degraded"]
    source_endpoint: str
    device_count: int
    role_counts: dict[str, int]
    collector_status_counts: dict[str, int]
    capability_summary_counts: dict[str, int]


class InventoryHistoryChangePreview(BaseModel):
    """Bounded preview of one normalized inventory device change between two snapshots."""

    device_id: str
    vendor: str
    platform: str
    role: str | None = None
    change_kind: Literal["added", "removed", "changed"]
    changed_fields: list[str] = Field(default_factory=list)


class InventoryHistoryComparison(BaseModel):
    """Bounded comparison of the latest two persisted inventory snapshots."""

    current_snapshot_id: str
    previous_snapshot_id: str
    current_persisted_at: datetime
    previous_persisted_at: datetime
    current_observed_at: datetime | None = None
    previous_observed_at: datetime | None = None
    current_sync_status: str
    previous_sync_status: str
    current_data_status: Literal["live", "degraded"]
    previous_data_status: Literal["live", "degraded"]
    current_device_count: int
    previous_device_count: int
    device_count_delta: int
    added_device_count: int
    removed_device_count: int
    changed_device_count: int
    change_preview: list[InventoryHistoryChangePreview]
    notes: list[str]


class InventoryHistoryWindow(BaseModel):
    """Bounded persisted history window for inventory comparison support."""

    status: Literal["unavailable", "current_only", "comparison_ready"]
    summary: str
    recent_snapshots: list[InventoryHistorySnapshotRecord]
    comparison_to_previous: InventoryHistoryComparison | None = None


class DevicesListResponse(ApiResponseMetadata):
    """Read-only device inventory list scaffold."""

    data_status: Literal["placeholder", "integration_scaffold", "live", "degraded"]
    serving_mode: Literal["live_collector", "persisted_fallback", "empty_scaffold"]
    evidence_confidence: EvidenceConfidenceSummary
    summary: str
    served_persisted_at: datetime | None = None
    comparison_to_latest_persisted: InventoryComparisonSummary
    history: InventoryHistoryWindow
    count: int
    items: list[DeviceRecord]

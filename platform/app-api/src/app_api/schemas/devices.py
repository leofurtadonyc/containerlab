"""Typed schemas for device inventory responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app_api.schemas.common import ApiResponseMetadata, EvidenceConfidenceSummary


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

    status: Literal["unavailable", "live_vs_latest_persisted_ready"]
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


class DevicesListResponse(ApiResponseMetadata):
    """Read-only device inventory list scaffold."""

    data_status: Literal["placeholder", "integration_scaffold", "live", "degraded"]
    serving_mode: Literal["live_collector", "persisted_fallback", "empty_scaffold"]
    evidence_confidence: EvidenceConfidenceSummary
    summary: str
    served_persisted_at: datetime | None = None
    comparison_to_latest_persisted: InventoryComparisonSummary
    count: int
    items: list[DeviceRecord]

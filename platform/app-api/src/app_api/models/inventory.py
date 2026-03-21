"""Backend-owned internal models for inventory reads."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class InventoryDevice(BaseModel):
    """Backend-owned normalized inventory model used before API serialization."""

    device_id: str
    vendor: str
    platform: str
    software_version: str | None = None
    role: str | None = None
    management_address: str
    collector_status: str
    capability_summary: str


class InventoryComparisonSummary(BaseModel):
    """Bounded current-versus-persisted inventory comparison evidence."""

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
    current_role_counts: dict[str, int] = Field(default_factory=dict)
    persisted_role_counts: dict[str, int] = Field(default_factory=dict)
    current_collector_status_counts: dict[str, int] = Field(default_factory=dict)
    persisted_collector_status_counts: dict[str, int] = Field(default_factory=dict)
    current_capability_summary_counts: dict[str, int] = Field(default_factory=dict)
    persisted_capability_summary_counts: dict[str, int] = Field(default_factory=dict)
    notes: list[str] = Field(default_factory=list)


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
    role_counts: dict[str, int] = Field(default_factory=dict)
    collector_status_counts: dict[str, int] = Field(default_factory=dict)
    capability_summary_counts: dict[str, int] = Field(default_factory=dict)


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
    change_preview: list[InventoryHistoryChangePreview] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class InventoryHistoryWindow(BaseModel):
    """Bounded persisted history window for inventory comparison support."""

    status: Literal["unavailable", "current_only", "comparison_ready"]
    summary: str
    recent_snapshots: list[InventoryHistorySnapshotRecord] = Field(default_factory=list)
    comparison_to_previous: InventoryHistoryComparison | None = None

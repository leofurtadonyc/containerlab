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

"""Typed internal models for the inventory collection flow."""

from typing import Literal

from pydantic import BaseModel


class InventoryCollectionPlan(BaseModel):
    """Vendor-neutral collection plan for one target."""

    target_name: str
    vendor: str
    management_address: str
    inventory_paths: list[str]


class InventoryRawRecord(BaseModel):
    """Vendor-specific raw inventory record before normalization."""

    target_name: str
    vendor: str
    platform_hint: str
    collection_status: Literal["success", "failure", "partial"]
    collection_error: str | None = None
    raw_data: dict[str, str]


class NormalizedInventoryRecord(BaseModel):
    """Vendor-neutral inventory record prepared for backend consumption."""

    device_id: str
    vendor: str
    platform: str
    software_version: str | None = None
    role: str | None = None
    management_address: str
    collector_status: Literal["ok", "degraded", "unreachable", "unknown"]
    capability_summary: Literal[
        "supported",
        "partially_supported",
        "unsupported",
        "unknown",
        "not_implemented_in_platform",
    ]
    normalization_status: Literal["normalized_live", "partial", "failed"]
    source: Literal["gnmi"]
    source_target: str
    notes: list[str]


class BackendInventoryDeliveryEnvelope(BaseModel):
    """Normalized inventory payload prepared for future backend delivery."""

    destination_service: Literal["app-api"]
    delivery_mode: Literal["backend_http_snapshot"]
    delivery_status: Literal["live_ready", "partial", "failed"]
    destination_endpoint: str
    model_family: Literal["inventory"]
    record_count: int
    records: list[NormalizedInventoryRecord]


class InventoryFlowSummary(BaseModel):
    """Summary metrics for the current inventory flow."""

    target_count: int
    planned_paths: int
    collection_success_count: int
    collection_failure_count: int
    normalization_partial_count: int
    normalization_failure_count: int
    normalized_record_count: int
    backend_ready_record_count: int
    backend_delivery_error_count: int


class InventoryFlowSnapshot(BaseModel):
    """Typed end-to-end snapshot of the current inventory collection flow."""

    mode: Literal["phase_2_live_inventory"]
    config_path: str
    plans: list[InventoryCollectionPlan]
    raw_records: list[InventoryRawRecord]
    normalized_records: list[NormalizedInventoryRecord]
    delivery: BackendInventoryDeliveryEnvelope
    summary: InventoryFlowSummary

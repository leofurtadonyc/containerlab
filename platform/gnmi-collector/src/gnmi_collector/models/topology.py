"""Typed internal models for the topology collection flow."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TopologyCollectionPlan(BaseModel):
    """Vendor-neutral collection plan for one topology target."""

    target_name: str
    vendor: str
    management_address: str
    topology_paths: list[str]


class TopologyObservedInterface(BaseModel):
    """Observed interface evidence collected from one target."""

    interface_name: str
    oper_state: str
    ipv4_address: str | None = None
    protocol: str | None = None
    down_reason: str | None = None


class TopologyRawRecord(BaseModel):
    """Vendor-specific raw topology record before normalization."""

    target_name: str
    vendor: str
    platform_hint: str
    role: str | None = None
    management_address: str
    collection_status: Literal["success", "failure", "partial"]
    collection_error: str | None = None
    observed_at: datetime | None = None
    raw_interfaces: list[TopologyObservedInterface] = Field(default_factory=list)


class NormalizedTopologyNodeRecord(BaseModel):
    """Vendor-neutral topology node record prepared for backend consumption."""

    node_id: str
    display_name: str
    role: str
    state: Literal["up", "down", "degraded", "unknown"]
    source: Literal["gnmi"]
    device_id: str | None = None
    attributes: dict[str, str] = Field(default_factory=dict)


class NormalizedTopologyLinkRecord(BaseModel):
    """Vendor-neutral topology link record prepared for backend consumption."""

    link_id: str
    source_node_id: str
    target_node_id: str
    state: Literal["up", "down", "degraded", "unknown"]
    source: Literal["gnmi"]
    attributes: dict[str, str] = Field(default_factory=dict)


class BackendTopologyDeliveryEnvelope(BaseModel):
    """Normalized topology payload prepared for backend delivery."""

    destination_service: Literal["app-api"]
    delivery_mode: Literal["backend_http_snapshot"]
    delivery_status: Literal["live_ready", "partial", "failed"]
    destination_endpoint: str
    model_family: Literal["topology"]
    configured_target_count: int
    observed_target_count: int
    collection_success_count: int
    collection_partial_count: int
    collection_failure_count: int
    oldest_observed_at: datetime | None = None
    newest_observed_at: datetime | None = None
    degraded_scope_summary: str
    topology_id: str
    topology_name: str
    node_count: int
    link_count: int
    nodes: list[NormalizedTopologyNodeRecord]
    links: list[NormalizedTopologyLinkRecord]
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    observed_at: datetime | None = None
    notes: list[str] = Field(default_factory=list)


class TopologyFlowSummary(BaseModel):
    """Summary metrics for the current topology flow."""

    target_count: int
    planned_paths: int
    observed_target_count: int
    collection_success_count: int
    collection_failure_count: int
    partial_collection_count: int
    oldest_observed_at: datetime | None = None
    newest_observed_at: datetime | None = None
    normalized_node_count: int
    normalized_link_count: int
    inferred_link_count: int
    single_sided_link_count: int
    node_state_counts: dict[str, int] = Field(default_factory=dict)
    link_state_counts: dict[str, int] = Field(default_factory=dict)
    backend_ready_node_count: int
    backend_ready_link_count: int
    backend_delivery_error_count: int


class TopologyFlowSnapshot(BaseModel):
    """Typed end-to-end snapshot of the current topology collection flow."""

    mode: Literal["phase_2_live_inventory"]
    config_path: str
    plans: list[TopologyCollectionPlan]
    raw_records: list[TopologyRawRecord]
    normalized_nodes: list[NormalizedTopologyNodeRecord]
    normalized_links: list[NormalizedTopologyLinkRecord]
    delivery: BackendTopologyDeliveryEnvelope
    summary: TopologyFlowSummary

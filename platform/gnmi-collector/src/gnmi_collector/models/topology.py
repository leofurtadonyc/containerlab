"""Typed internal models for the topology collection flow."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

IgpAdjacencyProtocol = Literal["ospf", "isis"]
IgpAdjacencyStateStrength = Literal["strong", "weak", "unknown"]
TopologyControlPlaneAdjacencyPosture = Literal[
    "not_observed",
    "ospf_observed",
    "isis_observed",
    "igp_confirmed",
    "protocol_mismatch",
    "suppressed_or_unknown",
    "unknown",
]


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


class LldpNeighborObservation(BaseModel):
    """Observed LLDP neighbor evidence collected from one target."""

    local_interface_name: str
    remote_system_name: str | None = None
    remote_chassis_id: str | None = None
    remote_port_id: str | None = None
    remote_port_description: str | None = None
    remote_interface_name: str | None = None
    remote_management_address: str | None = None
    source_path: str
    notes: list[str] = Field(default_factory=list)


class IgpAdjacencyObservation(BaseModel):
    """Observed device-native IGP adjacency evidence collected from one target."""

    protocol: IgpAdjacencyProtocol
    local_interface_name: str | None = None
    local_router_id: str | None = None
    local_area: str | None = None
    local_instance: str | None = None
    local_level: str | None = None
    local_system_id: str | None = None
    remote_router_id: str | None = None
    remote_system_id: str | None = None
    remote_hostname: str | None = None
    adjacency_state: str | None = None
    state_strength: IgpAdjacencyStateStrength = "unknown"
    last_change_at: str | None = None
    source_path: str
    notes: list[str] = Field(default_factory=list)


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
    raw_lldp_neighbors: list[LldpNeighborObservation] = Field(default_factory=list)
    raw_igp_adjacencies: list[IgpAdjacencyObservation] = Field(default_factory=list)
    lldp_collection_status: Literal[
        "neighbors_visible",
        "enabled_no_neighbors",
        "not_exposed",
        "query_failed",
        "unknown",
    ] = "unknown"
    lldp_notes: list[str] = Field(default_factory=list)
    igp_collection_status: Literal[
        "adjacencies_visible",
        "enabled_no_adjacencies",
        "not_exposed",
        "query_failed",
        "unknown",
    ] = "unknown"
    igp_notes: list[str] = Field(default_factory=list)


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
    endpoint_pairing_state: Literal["paired", "single_sided", "unknown"]
    endpoint_evidence_count: int
    physical_adjacency_posture: Literal[
        "not_observed",
        "single_sided_lldp",
        "bidirectional_lldp",
        "lldp_mismatch",
        "suppressed_or_unknown",
    ] = "suppressed_or_unknown"
    control_plane_adjacency_posture: TopologyControlPlaneAdjacencyPosture = (
        "suppressed_or_unknown"
    )
    lldp_observation_count: int = 0
    lldp_bidirectional: bool = False
    lldp_local_interfaces: list[str] = Field(default_factory=list)
    lldp_remote_systems: list[str] = Field(default_factory=list)
    lldp_remote_ports: list[str] = Field(default_factory=list)
    lldp_correlation_notes: list[str] = Field(default_factory=list)
    igp_adjacency_observation_count: int = 0
    igp_protocols_observed: list[IgpAdjacencyProtocol] = Field(default_factory=list)
    ospf_adjacency_state: str | None = None
    isis_adjacency_state: str | None = None
    igp_local_interfaces: list[str] = Field(default_factory=list)
    igp_remote_identities: list[str] = Field(default_factory=list)
    igp_correlation_notes: list[str] = Field(default_factory=list)
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
    inference_posture: Literal["inferred", "unknown"]
    collection_posture: Literal["ok", "degraded", "blocked", "unknown"]
    degraded_scope_summary: str
    endpoint_pairing_posture: Literal["paired", "partially_paired", "single_sided", "unknown"]
    node_participation_posture: Literal[
        "fully_linked", "partially_isolated", "isolated_only", "unknown"
    ]
    paired_link_count: int
    single_sided_link_count: int
    lldp_observation_count: int
    lldp_correlated_link_count: int
    lldp_single_sided_link_count: int
    lldp_bidirectional_link_count: int
    lldp_mismatch_link_count: int
    igp_adjacency_observation_count: int
    ospf_adjacency_observation_count: int
    isis_adjacency_observation_count: int
    igp_correlated_link_count: int
    igp_confirmed_link_count: int
    igp_protocol_mismatch_link_count: int
    linked_node_count: int
    isolated_node_count: int
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
    inference_posture: Literal["inferred", "unknown"]
    collection_posture: Literal["ok", "degraded", "blocked", "unknown"]
    endpoint_pairing_posture: Literal["paired", "partially_paired", "single_sided", "unknown"]
    node_participation_posture: Literal[
        "fully_linked", "partially_isolated", "isolated_only", "unknown"
    ]
    paired_link_count: int
    single_sided_link_count: int
    lldp_observation_count: int
    lldp_correlated_link_count: int
    lldp_single_sided_link_count: int
    lldp_bidirectional_link_count: int
    lldp_mismatch_link_count: int
    igp_adjacency_observation_count: int
    ospf_adjacency_observation_count: int
    isis_adjacency_observation_count: int
    igp_correlated_link_count: int
    igp_confirmed_link_count: int
    igp_protocol_mismatch_link_count: int
    linked_node_count: int
    isolated_node_count: int
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

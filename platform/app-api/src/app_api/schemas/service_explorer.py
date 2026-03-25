"""Service Explorer v1 — bounded read-side assembly over policy + topology evidence.

See ``platform/docs/service-explorer-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.degraded_policy_v1 import DegradedPolicyV1Classification, DegradedPolicyV1ReasonCode
from app_api.schemas.read_side_query import ReadSideQueryEcho

SERVICE_EXPLORER_V1_CONTRACT_ID = "service_explorer_v1"

ServiceExplorerServiceKind = Literal["policy", "color", "headend", "endpoint"]

TopologyEvidenceStatus = Literal["present", "partial", "unavailable"]


class ServiceExplorerPolicyInventoryEcho(BaseModel):
    """Honest echo of the policy inventory slice backing this Explorer response."""

    data_status: Literal["live", "degraded"]
    serving_mode: Literal["live_collector", "persisted_fallback", "empty_scaffold"]
    empty_reason: Literal[
        "none",
        "no_policies_observed",
        "per_policy_details_unavailable",
        "collector_unavailable",
    ]
    summary: str
    observed_policy_count: int
    policy_items_total: int = Field(
        description="Same logical size as ``GET /api/v1/policies`` ``count`` for this read.",
    )


class DegradedServiceRollup(BaseModel):
    """Aggregated degraded_policy_v1 posture for member policies (contract roll-up)."""

    posture: Literal["ok", "degraded", "unknown"]
    reason_codes: list[DegradedPolicyV1ReasonCode] = Field(default_factory=list)
    reason_codes_truncated: bool = False


class ServiceListRow(BaseModel):
    """One discoverable service grouping row."""

    service_id: str
    kind: ServiceExplorerServiceKind
    member_count: int = Field(ge=0)
    degraded_group_posture: Literal["ok", "degraded", "unknown"]


class ServiceTopologyLinkRecord(BaseModel):
    """Best-effort topology node match derived from normalized policy strings."""

    policy_id: str
    node_id: str
    display_name: str
    matched_on: Literal["node_id", "display_name", "device_id"]
    matched_from_policy_field: Literal["headend", "source_target", "endpoint"]


class ServiceMemberSummary(BaseModel):
    """Member policy row (subset of PolicyRecord; full degraded slice retained)."""

    policy_id: str
    policy_name: str
    policy_type: Literal["static_local", "static_non_local", "unknown"]
    headend: str
    endpoint: str
    color: int
    source_target: str
    degraded_policy_v1: DegradedPolicyV1Classification


class ServicesListResponse(ApiResponseMetadata):
    """Grouped service index over the current policy inventory."""

    contract_id: Literal["service_explorer_v1"] = SERVICE_EXPLORER_V1_CONTRACT_ID
    policy_inventory: ServiceExplorerPolicyInventoryEcho
    items: list[ServiceListRow]
    read_side_query: ReadSideQueryEcho
    caveats: list[str] = Field(default_factory=list)
    recommended_pivots: list[str] = Field(default_factory=list)


class ServiceDetailResponse(ApiResponseMetadata):
    """Detail for one ``service_id`` (atomic policy or aggregate grouping)."""

    contract_id: Literal["service_explorer_v1"] = SERVICE_EXPLORER_V1_CONTRACT_ID
    service_id: str
    kind: ServiceExplorerServiceKind
    policy_inventory: ServiceExplorerPolicyInventoryEcho
    members: list[ServiceMemberSummary]
    members_total: int = Field(ge=0)
    degraded_service: DegradedServiceRollup
    topology_evidence_status: TopologyEvidenceStatus
    topology_links: list[ServiceTopologyLinkRecord] = Field(default_factory=list)
    topology_caveats: list[str] = Field(default_factory=list)
    caveats: list[str] = Field(default_factory=list)
    recommended_pivots: list[str] = Field(default_factory=list)

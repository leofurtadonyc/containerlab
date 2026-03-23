"""Schemas for GET /api/v1/operator-search (operator_search_pivot_v1)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

OperatorSearchFamily = Literal[
    "policies",
    "topology_nodes",
    "topology_links",
    "devices",
    "capabilities",
]

ResultState = Literal["hits", "no_hits", "ambiguous"]
RankingBasis = Literal["exact_id", "multi_token_substring", "substring_match"]


class OperatorSearchPivotTarget(BaseModel):
    """Recommended shell query parameters for the primary read-only pivot."""

    view: str = Field(
        description="Product shell view (e.g. policies, topology, devices, capabilities).",
    )
    policy_id: str | None = None
    device_id: str | None = None
    topology_object: str | None = None
    topology_object_kind: Literal["node", "link"] | None = None
    readiness_capability_feature: str | None = Field(
        default=None,
        description="Optional bounded capability-matrix scroll hint (readiness decision-support).",
    )


class OperatorSearchHit(BaseModel):
    """One ranked match within a family."""

    object_kind: str = Field(
        description="Stable discriminator for the row (policy, topology_node, topology_link, device, capability).",
    )
    primary_id: str = Field(description="Canonical id for the row (policy_id, node_id, link_id, device_id, feature).")
    title: str = Field(description="Short human label for the row.")
    ranking_basis: RankingBasis
    match_reason: str = Field(
        description="Plain-language explanation of why this row matched (bounded, not a relevance score).",
    )
    pivot: OperatorSearchPivotTarget


class OperatorSearchFamilyGroup(BaseModel):
    """Grouped hits for one searchable family."""

    family: OperatorSearchFamily
    items: list[OperatorSearchHit]
    items_total_matched: int = Field(
        description="Count before per-family cap; may exceed len(items) when capped.",
    )
    capped: bool = False
    cap: int | None = Field(
        default=None,
        description="Per-family cap applied when capped is true.",
    )


class OperatorSearchResponse(ApiResponseMetadata):
    """Read-only global operator search (bounded inventory fields only)."""

    contract_id: Literal["operator_search_pivot_v1"] = "operator_search_pivot_v1"
    q: str = Field(description="Effective query after trim (echo).")
    result_state: ResultState
    guidance: str | None = Field(
        default=None,
        description="Honest operator guidance for ambiguous or empty-result states.",
    )
    groups: list[OperatorSearchFamilyGroup]
    explicit_non_claims: list[str] = Field(
        default_factory=list,
        description="Echo of contract non-claims; search is not log/metrics/Grafana search.",
    )

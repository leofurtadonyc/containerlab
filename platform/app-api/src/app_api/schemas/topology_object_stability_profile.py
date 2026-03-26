"""Topology object stability profile v1 (Phase 2, read-only).

Per ``platform/docs/topology-object-stability-profile-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.operational_stability_summary import StabilityPosture

TOPOLOGY_OBJECT_STABILITY_PROFILE_CONTRACT_ID = "topology_object_stability_profile_v1"

TopologyObjectStabilityProfileExplicitNonClaim = Literal[
    "not_blast_radius_traffic_or_dependency_simulation",
    "not_prediction_or_mtbf",
    "not_safe_to_change_approval_or_validation",
    "not_substitute_for_dossier_timeline_or_delta",
    "not_topology_pairing_or_coverage_truth",
    "not_grafana_semantics",
]

DEFAULT_TOPOLOGY_OBJECT_STABILITY_PROFILE_EXPLICIT_NON_CLAIMS: list[
    TopologyObjectStabilityProfileExplicitNonClaim
] = [
    "not_blast_radius_traffic_or_dependency_simulation",
    "not_prediction_or_mtbf",
    "not_safe_to_change_approval_or_validation",
    "not_substitute_for_dossier_timeline_or_delta",
    "not_topology_pairing_or_coverage_truth",
    "not_grafana_semantics",
]

TopologyObjectStabilityProfileAuthorityPosture = Literal[
    "interpretation_support_only",
    "read_only_assembly_non_authoritative",
]


class TopologyObjectStabilityProfileSafetyFraming(BaseModel):
    """Safety framing for topology object stability profile v1."""

    contract_id: str = Field(default=TOPOLOGY_OBJECT_STABILITY_PROFILE_CONTRACT_ID)
    authority_posture: TopologyObjectStabilityProfileAuthorityPosture = "interpretation_support_only"
    explicit_non_claims: list[TopologyObjectStabilityProfileExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_TOPOLOGY_OBJECT_STABILITY_PROFILE_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Topology object stability profile v1 summarizes bounded read-side cues for one node or link "
            "from existing evidence-timeline, evidence-delta, failure-impact, and risk-summary assemblies. "
            "It does not predict outages, assert blast radius or traffic impact, substitute dossier or "
            "timeline contracts, or authorize change."
        )
    )


class TopologyObjectStabilityPivotHint(BaseModel):
    """Stable drill-down hint (read-only route family, not a new authority)."""

    label: str
    route_family: str


class TopologyObjectStabilityProfileResponse(BaseModel):
    """Read-only stability interpretation for one topology node or link."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=TOPOLOGY_OBJECT_STABILITY_PROFILE_CONTRACT_ID)
    safety_framing: TopologyObjectStabilityProfileSafetyFraming
    object_kind: Literal["node", "link"]
    object_id: str
    profile_scope_summary: str = Field(
        ...,
        description="What anchors the profile used (timeline, delta, failure-impact, risk row)—not a unified clock.",
    )
    primary_stability_posture: StabilityPosture
    volatility_churn_cues: list[str] = Field(default_factory=list)
    recurrence_and_degraded_cues: list[str] = Field(default_factory=list)
    evidence_weakness_cues: list[str] = Field(default_factory=list)
    canonical_pivots: list[TopologyObjectStabilityPivotHint] = Field(default_factory=list)
    merged_caveats: list[str] = Field(default_factory=list)
    assembly_notes: list[str] = Field(
        default_factory=list,
        description="Nested generated_at echoes, partial assembly notes, sparse handling.",
    )

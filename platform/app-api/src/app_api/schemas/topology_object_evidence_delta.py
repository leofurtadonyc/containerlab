"""Topology object evidence delta contract types (Phase 2, read-only).

Per ``platform/docs/topology-object-evidence-delta-contract.md`` — grouped read-side difference hints only.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.service_evidence_delta import MemberPolicyEvidenceDeltaPointer

TOPOLOGY_OBJECT_EVIDENCE_DELTA_CONTRACT_ID = "topology_object_evidence_delta_v1"

TopologyObjectEvidenceDeltaCategory = Literal[
    "related_policy_set_change",
    "failure_impact_rollup_change",
    "related_member_degraded_policy_change",
    "topology_row_observation_change",
    "risk_summary_ranking_inputs_change",
    "topology_snapshot_caveat_echo_change",
    "no_comparable_fields",
    "gap_note",
]

TopologyObjectEvidenceDeltaExplicitNonClaim = Literal[
    "not_topology_drift_truth",
    "not_pairing_or_coverage_truth",
    "not_blast_radius_or_dependency_simulation",
    "not_outage_or_sla_impact",
    "not_cross_object_ranking",
    "not_policy_correctness_verdict",
    "not_workflow_validation",
    "not_dataplane_or_forwarding_verdict",
    "not_substitute_for_policy_delta",
    "not_substitute_for_service_delta",
    "not_replacement_for_topology_object_timeline",
    "not_grafana_delta",
]

DEFAULT_TOPOLOGY_OBJECT_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS: list[TopologyObjectEvidenceDeltaExplicitNonClaim] = [
    "not_topology_drift_truth",
    "not_pairing_or_coverage_truth",
    "not_blast_radius_or_dependency_simulation",
    "not_outage_or_sla_impact",
    "not_cross_object_ranking",
    "not_policy_correctness_verdict",
    "not_workflow_validation",
    "not_dataplane_or_forwarding_verdict",
    "not_substitute_for_policy_delta",
    "not_substitute_for_service_delta",
    "not_replacement_for_topology_object_timeline",
    "not_grafana_delta",
]


class TopologyObjectEvidenceDeltaSafetyFraming(BaseModel):
    contract_id: str = Field(default=TOPOLOGY_OBJECT_EVIDENCE_DELTA_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only", "read_only_assembly_non_authoritative"] = (
        "interpretation_support_only"
    )
    explicit_non_claims: list[TopologyObjectEvidenceDeltaExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_TOPOLOGY_OBJECT_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Topology object evidence delta v1 compares bounded read-side fields for one topology node or link "
            "between the current assembly and a previous persisted topology plus policy snapshot pair when "
            "history allows. It does not assert topology drift truth, pairing completeness, blast radius, or "
            "substitute for per-policy policy_evidence_delta_v1."
        )
    )


class TopologyObjectEvidenceDeltaAnchorCurrent(BaseModel):
    """Current topology-object lens (same family as related-policies / failure-impact)."""

    anchor_role: Literal["current_topology_object_assembly"] = "current_topology_object_assembly"
    generated_at: datetime
    reference: str = Field(
        default="GET /api/v1/topology/objects/{object_id}/related-policies",
        description="Primary object-scoped read surfaces family.",
    )


class TopologyObjectEvidenceDeltaAnchorPrevious(BaseModel):
    """Previous persisted normalized topology + policy snapshot pair used as anchor B."""

    anchor_role: Literal["previous_persisted_topology_and_policy_snapshots"] = (
        "previous_persisted_topology_and_policy_snapshots"
    )
    topology_snapshot_id: str
    topology_persisted_at: datetime
    policy_snapshot_id: str
    policy_persisted_at: datetime
    policy_observed_at: datetime | None = None


TopologyObjectEvidenceDeltaComparisonStatus = Literal[
    "delta_ready",
    "no_comparable_anchor",
    "insufficient_evidence",
]


class TopologyObjectEvidenceDeltaItem(BaseModel):
    category: TopologyObjectEvidenceDeltaCategory
    summary: str
    detail: str | None = None


class TopologyObjectEvidenceDeltaResponse(BaseModel):
    """Bounded topology-object-scoped evidence delta between current assembly and a persisted anchor pair."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=TOPOLOGY_OBJECT_EVIDENCE_DELTA_CONTRACT_ID)
    safety_framing: TopologyObjectEvidenceDeltaSafetyFraming
    object_kind: Literal["node", "link"]
    object_id: str
    comparison_status: TopologyObjectEvidenceDeltaComparisonStatus
    scope_summary: str
    current_anchor: TopologyObjectEvidenceDeltaAnchorCurrent
    previous_anchor: TopologyObjectEvidenceDeltaAnchorPrevious | None = None
    delta_items: list[TopologyObjectEvidenceDeltaItem] = Field(default_factory=list)
    member_policy_delta_pointers: list[MemberPolicyEvidenceDeltaPointer] = Field(default_factory=list)
    caveats: list[str] = Field(default_factory=list)

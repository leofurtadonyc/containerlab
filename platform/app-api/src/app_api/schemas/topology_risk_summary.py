"""Topology risk summary v1 read contract (Phase 2, read-only).

Cross-object attention ranking from related-policy and degraded_policy_v1 evidence.
See ``platform/docs/topology-risk-summary-contract.md``.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.failure_impact import FailureImpactDegradedPostureBreakdown

TOPOLOGY_RISK_SUMMARY_CONTRACT_ID = "topology_risk_summary_v1"

TopologyRiskSummaryExplicitNonClaim = Literal[
    "not_sla_or_service_risk_truth",
    "not_traffic_or_dataplane_risk_truth",
    "not_failure_probability",
    "not_validated_blast_radius",
    "not_optimization_engine",
    "not_global_policy_health_ranking",
    "not_validation_or_safe_change_authority",
    "not_replace_per_object_failure_impact",
]

DEFAULT_TOPOLOGY_RISK_SUMMARY_EXPLICIT_NON_CLAIMS: list[TopologyRiskSummaryExplicitNonClaim] = [
    "not_sla_or_service_risk_truth",
    "not_traffic_or_dataplane_risk_truth",
    "not_failure_probability",
    "not_validated_blast_radius",
    "not_optimization_engine",
    "not_global_policy_health_ranking",
    "not_validation_or_safe_change_authority",
    "not_replace_per_object_failure_impact",
]

TopologyRiskSummaryAuthorityPosture = Literal[
    "interpretation_support_only",
    "read_only_assembly_non_authoritative",
]

TopologyRiskSummaryAssemblyConfidence = Literal["low", "medium"]


class TopologyRiskSummarySafetyFraming(BaseModel):
    """Safety framing for topology risk summary v1."""

    contract_id: str = Field(default=TOPOLOGY_RISK_SUMMARY_CONTRACT_ID)
    authority_posture: TopologyRiskSummaryAuthorityPosture = "interpretation_support_only"
    explicit_non_claims: list[TopologyRiskSummaryExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_TOPOLOGY_RISK_SUMMARY_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Topology risk summary v1 ranks topology nodes and links using only related-policy "
            "string-equality matches and degraded_policy v1 posture counts on those related rows. "
            "It does not measure SLA risk, traffic risk, failure probability, blast radius, or "
            "safe-change authority. Ordering is subset-scoped per object, not global inventory health."
        )
    )


class TopologyRiskSummaryRankingInputs(BaseModel):
    """Transparent tuple keys used for lexicographic ordering (contract symbols D, U, R, K)."""

    degraded_related_count: int = Field(ge=0, description="D(o): related policies with posture degraded.")
    unknown_related_count: int = Field(ge=0, description="U(o): related policies with posture unknown.")
    related_policy_breadth: int = Field(ge=0, description="R(o): distinct related policy ids.")
    ok_related_count: int = Field(ge=0, description="K(o): related policies with posture ok.")


class TopologyRiskSummaryRow(BaseModel):
    """One ranked topology object with auditable inputs."""

    rank_index: int = Field(ge=1, description="1-based position after contract sort.")
    object_kind: Literal["node", "link"]
    object_id: str
    ranking_inputs: TopologyRiskSummaryRankingInputs
    degraded_posture_breakdown: FailureImpactDegradedPostureBreakdown = Field(
        description="ok/degraded/unknown counts for the related-policy set (same as failure-impact v1 semantics).",
    )


class TopologyRiskSummaryFreshness(BaseModel):
    """Assembly and snapshot provenance."""

    assembly_generated_at: datetime
    policy_inventory_observed_at: datetime | None = None
    topology_snapshot_observed_at: datetime | None = None
    policy_inventory_empty_reason: str | None = Field(
        default=None,
        description="Echo from policy inventory snapshot when not 'none'.",
    )
    policy_serving_mode_echo: str = Field(
        ...,
        description="Coarse echo: live, mixed, persisted_fallback, or unknown — not a health verdict.",
    )


class TopologyRiskSummaryResponse(BaseModel):
    """Read-only ranked list of topology objects by bounded attention inputs."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=TOPOLOGY_RISK_SUMMARY_CONTRACT_ID)
    ranking_basis: str = Field(
        ...,
        description="Stable description of lexicographic ordering (D desc, U desc, R desc, tie-breaks).",
    )
    safety_framing: TopologyRiskSummarySafetyFraming
    assembly_confidence: TopologyRiskSummaryAssemblyConfidence = Field(
        ...,
        description="Confidence in this rollup assembly only, not in network safety.",
    )
    ranked_objects: list[TopologyRiskSummaryRow] = Field(
        default_factory=list,
        description="All nodes and links on the current topology snapshot, sorted by contract.",
    )
    total_objects: int = Field(ge=0, description="Count of ranked rows (nodes + links in snapshot).")
    freshness: TopologyRiskSummaryFreshness
    caveats: list[str] = Field(
        default_factory=list,
        description="Topology/policy honesty and subset-scope reminders.",
    )
    missing_evidence_notes: list[str] = Field(
        default_factory=list,
        description="Aggregate notes when path-analysis support or inventory rows are partial.",
    )

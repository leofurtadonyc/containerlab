"""Failure impact v1 read contract (Phase 2, read-only).

Assembles relationship-derived rollups for a topology node or link from existing
inventory signals. See ``platform/docs/failure-impact-contract.md``.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

FAILURE_IMPACT_CONTRACT_ID = "failure_impact_v1"

FailureImpactExplicitNonClaim = Literal[
    "not_blast_radius_or_dependency_truth",
    "not_dataplane_or_te_impact_truth",
    "not_graph_simulation",
    "not_validation_or_safe_change_authority",
    "not_sla_or_availability_guarantee",
    "not_replace_controller_computed_truth",
    "not_global_policy_health_proxy",
]

DEFAULT_FAILURE_IMPACT_EXPLICIT_NON_CLAIMS: list[FailureImpactExplicitNonClaim] = [
    "not_blast_radius_or_dependency_truth",
    "not_dataplane_or_te_impact_truth",
    "not_graph_simulation",
    "not_validation_or_safe_change_authority",
    "not_sla_or_availability_guarantee",
    "not_replace_controller_computed_truth",
    "not_global_policy_health_proxy",
]

FailureImpactAuthorityPosture = Literal[
    "interpretation_support_only",
    "read_only_assembly_non_authoritative",
]


class FailureImpactSafetyFraming(BaseModel):
    """Safety framing for failure-impact v1."""

    contract_id: str = Field(default=FAILURE_IMPACT_CONTRACT_ID)
    authority_posture: FailureImpactAuthorityPosture = "interpretation_support_only"
    explicit_non_claims: list[FailureImpactExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_FAILURE_IMPACT_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Failure impact v1 summarizes string-aligned related policies and degraded-policy v1 "
            "signals for this topology object. It does not simulate failures, blast radius, "
            "dependencies, dataplane behavior, or safe-change authority. Counts are scoped to "
            "the related-policy set only, not global inventory health."
        )
    )


class FailureImpactSubject(BaseModel):
    """Subject topology object."""

    kind: Literal["node", "link"]
    object_id: str


class FailureImpactDegradedPostureBreakdown(BaseModel):
    """Counts of unique related policies by degraded_policy_v1.posture (subset-scoped)."""

    ok: int = Field(ge=0)
    degraded: int = Field(ge=0)
    unknown: int = Field(ge=0)


class FailureImpactRollupCounts(BaseModel):
    """Rollup counts for the related-policy identity set (unique policy_id)."""

    related_policies_total: int = Field(ge=0, description="Distinct policy_id values matching this object.")
    degraded_related_policies_total: int = Field(
        ge=0,
        description="Distinct related policies with degraded_policy_v1.posture == 'degraded'.",
    )
    non_degraded_related_policies_total: int = Field(
        ge=0,
        description="Distinct related policies with posture 'ok' or 'unknown' (not 'degraded').",
    )
    related_policies_path_analysis_supported_total: int = Field(
        ge=0,
        description=(
            "Distinct related policies where path-analysis interpretation is not blocked by "
            "support_state unsupported / not_implemented_in_platform (per path-analysis contract)."
        ),
    )


class FailureImpactFreshness(BaseModel):
    """Provenance and freshness hints for the assembly."""

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


class FailureImpactViewResponse(BaseModel):
    """Read-only failure-impact rollup for one topology node or link."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=FAILURE_IMPACT_CONTRACT_ID)
    safety_framing: FailureImpactSafetyFraming
    subject: FailureImpactSubject
    rollup_counts: FailureImpactRollupCounts
    degraded_posture_breakdown: FailureImpactDegradedPostureBreakdown
    freshness: FailureImpactFreshness
    caveats: list[str] = Field(
        default_factory=list,
        description="Includes related-policies global caveats plus assembly notes.",
    )
    missing_evidence_notes: list[str] = Field(
        default_factory=list,
        description="Explicit notes when path-analysis support is partial or inventory is incomplete.",
    )

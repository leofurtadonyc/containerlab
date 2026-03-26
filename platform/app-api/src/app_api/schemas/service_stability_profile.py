"""Service stability profile v1 (Phase 2, read-only).

Per ``platform/docs/service-stability-profile-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.operational_stability_summary import StabilityPosture

SERVICE_STABILITY_PROFILE_CONTRACT_ID = "service_stability_profile_v1"

ServiceStabilityProfileExplicitNonClaim = Literal[
    "not_sla_traffic_or_customer_impact_simulation",
    "not_prediction_or_mtbf",
    "not_safe_to_change_approval_or_validation",
    "not_substitute_for_explorer_dossier_timeline_or_delta",
    "not_service_catalog_or_entitlement_authority",
    "not_grafana_semantics",
]

DEFAULT_SERVICE_STABILITY_PROFILE_EXPLICIT_NON_CLAIMS: list[ServiceStabilityProfileExplicitNonClaim] = [
    "not_sla_traffic_or_customer_impact_simulation",
    "not_prediction_or_mtbf",
    "not_safe_to_change_approval_or_validation",
    "not_substitute_for_explorer_dossier_timeline_or_delta",
    "not_service_catalog_or_entitlement_authority",
    "not_grafana_semantics",
]

ServiceStabilityProfileAuthorityPosture = Literal[
    "interpretation_support_only",
    "read_only_assembly_non_authoritative",
]


class ServiceStabilityProfileSafetyFraming(BaseModel):
    """Safety framing for service stability profile v1."""

    contract_id: str = Field(default=SERVICE_STABILITY_PROFILE_CONTRACT_ID)
    authority_posture: ServiceStabilityProfileAuthorityPosture = "interpretation_support_only"
    explicit_non_claims: list[ServiceStabilityProfileExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_SERVICE_STABILITY_PROFILE_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Service stability profile v1 summarizes bounded read-side cues for one service_id from "
            "existing service evidence-timeline, evidence-delta, Service Explorer roll-ups, and optional "
            "dossier caveats. It does not predict customer impact, assert SLA or traffic truth, substitute "
            "Explorer or dossier contracts, or authorize change."
        )
    )


class ServiceStabilityPivotHint(BaseModel):
    """Stable drill-down hint (read-only route family, not a new authority)."""

    label: str
    route_family: str


class ServiceStabilityProfileResponse(BaseModel):
    """Read-only stability interpretation for one Service Explorer service_id."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=SERVICE_STABILITY_PROFILE_CONTRACT_ID)
    safety_framing: ServiceStabilityProfileSafetyFraming
    service_id: str
    profile_scope_summary: str = Field(
        ...,
        description="What anchors the profile used (timeline, delta, Explorer roll-up, dossier)—not a unified clock.",
    )
    primary_stability_posture: StabilityPosture
    volatility_churn_cues: list[str] = Field(default_factory=list)
    recurrence_and_degraded_cues: list[str] = Field(default_factory=list)
    evidence_weakness_cues: list[str] = Field(default_factory=list)
    canonical_pivots: list[ServiceStabilityPivotHint] = Field(default_factory=list)
    merged_caveats: list[str] = Field(default_factory=list)
    assembly_notes: list[str] = Field(
        default_factory=list,
        description="Nested generated_at echoes, partial assembly notes, sparse handling.",
    )

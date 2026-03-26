"""Service evidence delta contract types (Phase 2, read-only).

Per ``platform/docs/service-evidence-delta-contract.md`` — grouped read-side difference hints only.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

SERVICE_EVIDENCE_DELTA_CONTRACT_ID = "service_evidence_delta_v1"

ServiceEvidenceDeltaCategory = Literal[
    "service_membership_change",
    "degraded_service_roll_up_change",
    "member_degraded_policy_change",
    "topology_linkage_change",
    "policy_inventory_echo_change",
    "no_comparable_fields",
    "gap_note",
]

ServiceEvidenceDeltaExplicitNonClaim = Literal[
    "not_service_drift_truth",
    "not_sla_or_customer_impact",
    "not_cross_service_ranking",
    "not_policy_correctness_verdict",
    "not_workflow_validation",
    "not_dataplane_or_te_verdict",
    "not_substitute_for_policy_delta",
    "not_replacement_for_service_timeline",
    "not_grafana_delta",
]

DEFAULT_SERVICE_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS: list[ServiceEvidenceDeltaExplicitNonClaim] = [
    "not_service_drift_truth",
    "not_sla_or_customer_impact",
    "not_cross_service_ranking",
    "not_policy_correctness_verdict",
    "not_workflow_validation",
    "not_dataplane_or_te_verdict",
    "not_substitute_for_policy_delta",
    "not_replacement_for_service_timeline",
    "not_grafana_delta",
]


class ServiceEvidenceDeltaSafetyFraming(BaseModel):
    contract_id: str = Field(default=SERVICE_EVIDENCE_DELTA_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only", "read_only_assembly_non_authoritative"] = (
        "interpretation_support_only"
    )
    explicit_non_claims: list[ServiceEvidenceDeltaExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_SERVICE_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Service evidence delta v1 compares bounded Service Explorer–shaped fields between the current "
            "read-side detail and a single previous persisted policy snapshot anchor when available. It does "
            "not assert service drift truth, SLA or customer impact, workflow validation, or substitute for "
            "per-policy policy_evidence_delta_v1."
        )
    )


class ServiceEvidenceDeltaAnchorCurrent(BaseModel):
    """Current Explorer detail slice (same family as GET /api/v1/services/{service_id})."""

    anchor_role: Literal["current_explorer_detail"] = "current_explorer_detail"
    generated_at: datetime
    reference: str = Field(default="GET /api/v1/services/{service_id}")


class ServiceEvidenceDeltaAnchorPrevious(BaseModel):
    """Previous persisted normalized policy snapshot used as anchor B."""

    anchor_role: Literal["previous_persisted_policy_snapshot"] = "previous_persisted_policy_snapshot"
    snapshot_id: str
    persisted_at: datetime
    observed_at: datetime | None = None


ServiceEvidenceDeltaComparisonStatus = Literal[
    "delta_ready",
    "no_comparable_anchor",
    "insufficient_evidence",
]


class ServiceEvidenceDeltaItem(BaseModel):
    category: ServiceEvidenceDeltaCategory
    summary: str
    detail: str | None = None


class MemberPolicyEvidenceDeltaPointer(BaseModel):
    """Optional per-member pointer to policy evidence delta semantics (no payload duplication)."""

    policy_id: str
    comparison_status: str
    route: str = Field(
        default="GET /api/v1/policies/{policy_id}/evidence-delta",
        description="Authoritative per-policy delta path family.",
    )


class ServiceEvidenceDeltaResponse(BaseModel):
    """Bounded service-scoped evidence delta between current Explorer detail and a persisted anchor."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=SERVICE_EVIDENCE_DELTA_CONTRACT_ID)
    safety_framing: ServiceEvidenceDeltaSafetyFraming
    service_id: str
    comparison_status: ServiceEvidenceDeltaComparisonStatus
    scope_summary: str
    current_anchor: ServiceEvidenceDeltaAnchorCurrent
    previous_anchor: ServiceEvidenceDeltaAnchorPrevious | None = None
    delta_items: list[ServiceEvidenceDeltaItem] = Field(default_factory=list)
    member_policy_delta_pointers: list[MemberPolicyEvidenceDeltaPointer] = Field(default_factory=list)
    caveats: list[str] = Field(default_factory=list)

"""Policy evidence delta contract types (Phase 2, read-only).

Per ``platform/docs/policy-evidence-delta-contract.md`` — read-side difference hints only.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

POLICY_EVIDENCE_DELTA_CONTRACT_ID = "policy_evidence_delta_v1"

PolicyEvidenceDeltaCategory = Literal[
    "posture_or_state_field_change",
    "degraded_policy_v1_change",
    "candidate_path_shape_change",
    "path_analysis_availability_change",
    "serving_mode_or_freshness_change",
    "no_comparable_fields",
    "gap_note",
]

PolicyEvidenceDeltaExplicitNonClaim = Literal[
    "not_drift_truth",
    "not_config_diff_truth",
    "not_policy_correctness_verdict",
    "not_workflow_validation",
    "not_dataplane_or_te_verdict",
    "not_replacement_for_timeline",
    "not_cross_policy_ranking",
]

DEFAULT_POLICY_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS: list[PolicyEvidenceDeltaExplicitNonClaim] = [
    "not_drift_truth",
    "not_config_diff_truth",
    "not_policy_correctness_verdict",
    "not_workflow_validation",
    "not_dataplane_or_te_verdict",
    "not_replacement_for_timeline",
    "not_cross_policy_ranking",
]


class PolicyEvidenceDeltaSafetyFraming(BaseModel):
    contract_id: str = Field(default=POLICY_EVIDENCE_DELTA_CONTRACT_ID)
    authority_posture: Literal["interpretation_support_only", "read_only_assembly_non_authoritative"] = (
        "interpretation_support_only"
    )
    explicit_non_claims: list[PolicyEvidenceDeltaExplicitNonClaim] = Field(
        default_factory=lambda: list(DEFAULT_POLICY_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS)
    )
    phase: Literal["phase_2_read_only_foundation"] = "phase_2_read_only_foundation"
    summary_disclaimer: str = Field(
        default=(
            "Policy evidence delta v1 compares bounded normalized inventory fields between the current "
            "read-side policy row and a single persisted historical anchor when available. It does not "
            "assert drift truth, configuration diff authority, policy correctness, workflow validation, "
            "or dataplane outcomes."
        )
    )


class PolicyEvidenceDeltaAnchorCurrent(BaseModel):
    """Current normalized policy row (same slice as GET /api/v1/policies)."""

    anchor_role: Literal["current_inventory"] = "current_inventory"
    observed_at: datetime | None = None
    row_posture: Literal["current", "stale"] = "current"
    serving_mode: Literal["live", "partial_live", "persisted_fallback", "unknown"] = "unknown"


class PolicyEvidenceDeltaAnchorPrevious(BaseModel):
    """Previous persisted normalized snapshot row used as anchor B."""

    anchor_role: Literal["previous_persisted_snapshot"] = "previous_persisted_snapshot"
    snapshot_id: str
    persisted_at: datetime
    observed_at: datetime | None = None


PolicyEvidenceDeltaComparisonStatus = Literal[
    "delta_ready",
    "no_comparable_anchor",
    "anchor_policy_absent",
    "insufficient_evidence",
]


class PolicyEvidenceDeltaItem(BaseModel):
    category: PolicyEvidenceDeltaCategory
    summary: str
    detail: str | None = None


class PolicyEvidenceDeltaResponse(BaseModel):
    """Bounded per-policy evidence delta between current inventory and a persisted anchor."""

    metadata: ApiResponseMetadata
    contract_id: str = Field(default=POLICY_EVIDENCE_DELTA_CONTRACT_ID)
    safety_framing: PolicyEvidenceDeltaSafetyFraming
    policy_id: str
    comparison_status: PolicyEvidenceDeltaComparisonStatus
    scope_summary: str
    current_anchor: PolicyEvidenceDeltaAnchorCurrent
    previous_anchor: PolicyEvidenceDeltaAnchorPrevious | None = None
    delta_items: list[PolicyEvidenceDeltaItem] = Field(default_factory=list)
    caveats: list[str] = Field(default_factory=list)

"""Bounded degraded-policy v1 classification (Phase 2, read-only).

Derived **only** from existing normalized policy inventory fields already exposed on
``PolicyRecord``. This is interpretation support for operators—not a validation verdict,
SLA guarantee, or dataplane health engine.
"""

from typing import Literal

from pydantic import BaseModel, Field

DEGRADED_POLICY_V1_CONTRACT_ID = "degraded_policy_v1"

DegradedPolicyV1ReasonCode = Literal[
    "intent_declared_observed_not_active",
    "persisted_row_stale",
    "partial_or_unsupported_support_posture",
    "health_not_healthy",
    "no_active_candidate_path_when_paths_present",
]
"""Stable reason keys emitted when inventory signals satisfy the rule (v1 set)."""

DegradedPolicyV1Posture = Literal["ok", "degraded", "unknown"]
"""Coarse bucket: ``degraded`` means at least one v1 reason; ``unknown`` is bounded ambiguity."""

DegradedPolicyV1Confidence = Literal["low", "medium"]
"""Honest confidence in the **classification assembly** (not forwarding truth)."""


DEFAULT_DEGRADED_POLICY_V1_EXPLICIT_NON_CLAIMS: list[str] = [
    "not_sla_or_availability_guarantee",
    "not_dataplane_or_te_resolution_verdict",
    "not_validation_or_safe_to_change_authority",
    "not_replacement_for_controller_computed_policy_truth",
]


class DegradedPolicyV1Classification(BaseModel):
    """Per-policy degraded-policy v1 slice (read-only assembly)."""

    contract_id: Literal["degraded_policy_v1"] = DEGRADED_POLICY_V1_CONTRACT_ID
    posture: DegradedPolicyV1Posture
    reason_codes: list[DegradedPolicyV1ReasonCode] = Field(default_factory=list)
    confidence: DegradedPolicyV1Confidence
    summary: str = Field(
        ...,
        description="One-line operator-facing readout; repeats posture, not a verdict.",
    )
    explicit_non_claims: list[str] = Field(
        default_factory=lambda: list(DEFAULT_DEGRADED_POLICY_V1_EXPLICIT_NON_CLAIMS)
    )

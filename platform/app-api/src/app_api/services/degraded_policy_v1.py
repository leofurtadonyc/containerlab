"""Assemble degraded-policy v1 classification from normalized inventory fields only."""

from __future__ import annotations

from app_api.models.policy import PolicyInventoryRecord
from app_api.schemas.degraded_policy_v1 import (
    DEGRADED_POLICY_V1_CONTRACT_ID,
    DEFAULT_DEGRADED_POLICY_V1_EXPLICIT_NON_CLAIMS,
    DegradedPolicyV1Classification,
    DegradedPolicyV1ReasonCode,
)

_CURRENT_POSTURE = "current"
_STALE_POSTURE = "stale"


def build_degraded_policy_v1_classification(
    *,
    policy: PolicyInventoryRecord,
    row_current_posture: str,
) -> DegradedPolicyV1Classification:
    """Return v1 classification for one inventory record using only existing model fields."""
    reasons: list[DegradedPolicyV1ReasonCode] = []

    if policy.intent_state == "declared" and policy.observed_state in ("inactive", "degraded"):
        reasons.append("intent_declared_observed_not_active")

    if row_current_posture == _STALE_POSTURE:
        reasons.append("persisted_row_stale")

    if policy.support_state in ("partially_supported", "unsupported", "not_implemented_in_platform"):
        reasons.append("partial_or_unsupported_support_posture")

    if policy.health_state in ("degraded", "down"):
        reasons.append("health_not_healthy")

    if policy.candidate_paths:
        if all(path.path_state != "active" for path in policy.candidate_paths):
            reasons.append("no_active_candidate_path_when_paths_present")

    if reasons:
        posture: str = "degraded"
        confidence = "medium"
        summary = (
            "Degraded-policy v1: at least one bounded inventory signal indicates operational "
            "or interpretive limits for this record (see reason_codes)."
        )
    elif policy.support_state == "unknown" or (
        policy.intent_state == "unknown" and policy.observed_state == "unknown"
    ):
        posture = "unknown"
        confidence = "low"
        summary = (
            "Degraded-policy v1: insufficient categorical inventory signals for an ok posture; "
            "this is ambiguity in the read model, not proof of health."
        )
    else:
        posture = "ok"
        confidence = "medium"
        summary = (
            "Degraded-policy v1: no v1 reason codes triggered on this record given current "
            "normalized inventory fields."
        )

    return DegradedPolicyV1Classification(
        contract_id=DEGRADED_POLICY_V1_CONTRACT_ID,
        posture=posture,
        reason_codes=reasons,
        confidence=confidence,
        summary=summary,
        explicit_non_claims=list(DEFAULT_DEGRADED_POLICY_V1_EXPLICIT_NON_CLAIMS),
    )

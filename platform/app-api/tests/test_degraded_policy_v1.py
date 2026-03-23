"""Unit tests for degraded-policy v1 classification assembly."""

from app_api.models.policy import CandidatePath, PolicyInventoryRecord
from app_api.schemas.degraded_policy_v1 import DEFAULT_DEGRADED_POLICY_V1_EXPLICIT_NON_CLAIMS
from app_api.services.degraded_policy_v1 import build_degraded_policy_v1_classification


def _base_policy(**overrides: object) -> PolicyInventoryRecord:
    base: dict[str, object] = {
        "policy_id": "x",
        "policy_name": "n",
        "policy_type": "static_local",
        "headend": "PE1",
        "endpoint": "10.0.0.1",
        "color": 1,
        "source_target": "PE1",
        "source_target_role": "pe",
        "candidate_paths": [CandidatePath(name="p", path_state="active", preference=1, notes=[])],
        "intent_state": "declared",
        "observed_state": "active",
        "support_state": "supported",
        "health_state": "healthy",
        "source": "gnmi",
        "notes": [],
    }
    base.update(overrides)
    return PolicyInventoryRecord.model_validate(base)


def test_degraded_v1_ok_when_no_reasons_and_known_signals() -> None:
    c = build_degraded_policy_v1_classification(
        policy=_base_policy(),
        row_current_posture="current",
    )
    assert c.contract_id == "degraded_policy_v1"
    assert c.posture == "ok"
    assert c.reason_codes == []
    assert c.confidence == "medium"
    assert c.explicit_non_claims == list(DEFAULT_DEGRADED_POLICY_V1_EXPLICIT_NON_CLAIMS)


def test_degraded_v1_intent_mismatch_and_stale_row() -> None:
    c = build_degraded_policy_v1_classification(
        policy=_base_policy(
            observed_state="inactive",
            candidate_paths=[
                CandidatePath(name="p", path_state="active", preference=1, notes=[]),
            ],
        ),
        row_current_posture="stale",
    )
    assert c.posture == "degraded"
    assert "intent_declared_observed_not_active" in c.reason_codes
    assert "persisted_row_stale" in c.reason_codes


def test_degraded_v1_no_active_path_when_paths_present() -> None:
    c = build_degraded_policy_v1_classification(
        policy=_base_policy(
            candidate_paths=[
                CandidatePath(name="a", path_state="inactive", preference=1, notes=[]),
                CandidatePath(name="b", path_state="unknown", preference=2, notes=[]),
            ],
        ),
        row_current_posture="current",
    )
    assert c.posture == "degraded"
    assert "no_active_candidate_path_when_paths_present" in c.reason_codes


def test_degraded_v1_unknown_branch_support_unknown() -> None:
    c = build_degraded_policy_v1_classification(
        policy=_base_policy(support_state="unknown"),
        row_current_posture="current",
    )
    assert c.posture == "unknown"
    assert c.confidence == "low"
    assert c.reason_codes == []
    assert "not_sla" not in c.summary.lower()


def test_degraded_v1_explicit_non_claims_always_present() -> None:
    c = build_degraded_policy_v1_classification(
        policy=_base_policy(health_state="down", observed_state="degraded"),
        row_current_posture="current",
    )
    assert "not_sla_or_availability_guarantee" in c.explicit_non_claims
    assert "not_dataplane_or_te_resolution_verdict" in c.explicit_non_claims

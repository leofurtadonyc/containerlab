"""Contract tests for bounded change-intelligence vocabulary (Phase 2)."""

from typing import get_args

from app_api.schemas.change_intelligence import (
    CHANGE_INTELLIGENCE_CONTRACT_ID,
    BoundedChangeSignalFamily,
    ChangeEvidenceDomain,
    ChangeIntelligenceExplicitNonClaim,
    ChangeIntelligenceSafetyFraming,
    DEFAULT_CHANGE_INTELLIGENCE_EXPLICIT_NON_CLAIMS,
)


def test_change_intelligence_contract_id_is_stable_string() -> None:
    assert CHANGE_INTELLIGENCE_CONTRACT_ID == "change_intelligence_phase2_v1"


def test_explicit_non_claims_literal_matches_default_list() -> None:
    literal_args = set(get_args(ChangeIntelligenceExplicitNonClaim))
    default_set = set(DEFAULT_CHANGE_INTELLIGENCE_EXPLICIT_NON_CLAIMS)
    assert literal_args == default_set
    assert len(DEFAULT_CHANGE_INTELLIGENCE_EXPLICIT_NON_CLAIMS) == len(literal_args)


def test_safety_framing_round_trip() -> None:
    m = ChangeIntelligenceSafetyFraming(authority_posture="summarization_only")
    dumped = m.model_dump()
    assert dumped["contract_id"] == CHANGE_INTELLIGENCE_CONTRACT_ID
    assert dumped["phase"] == "phase_2_read_only_foundation"
    assert dumped["authority_posture"] == "summarization_only"
    assert set(dumped["explicit_non_claims"]) == set(DEFAULT_CHANGE_INTELLIGENCE_EXPLICIT_NON_CLAIMS)


def test_domain_and_signal_literals_are_non_empty() -> None:
    assert len(get_args(ChangeEvidenceDomain)) == 6
    assert len(get_args(BoundedChangeSignalFamily)) == 5

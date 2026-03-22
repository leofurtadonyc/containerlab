"""Contract tests for bounded evidence-pack vocabulary (Phase 2)."""

from typing import get_args

from app_api.schemas.evidence_pack import (
    DEFAULT_EVIDENCE_PACK_EXPLICIT_NON_CLAIMS,
    EVIDENCE_PACK_CONTRACT_ID,
    EvidencePackContentDomain,
    EvidencePackExplicitNonClaim,
    EvidencePackSafetyFraming,
)


def test_evidence_pack_contract_id_is_stable_string() -> None:
    assert EVIDENCE_PACK_CONTRACT_ID == "evidence_pack_phase2_v1"


def test_explicit_non_claims_literal_matches_default_list() -> None:
    literal_args = set(get_args(EvidencePackExplicitNonClaim))
    default_set = set(DEFAULT_EVIDENCE_PACK_EXPLICIT_NON_CLAIMS)
    assert literal_args == default_set
    assert len(DEFAULT_EVIDENCE_PACK_EXPLICIT_NON_CLAIMS) == len(literal_args)


def test_safety_framing_round_trip() -> None:
    m = EvidencePackSafetyFraming(authority_posture="interpretation_support_only")
    dumped = m.model_dump()
    assert dumped["contract_id"] == EVIDENCE_PACK_CONTRACT_ID
    assert dumped["phase"] == "phase_2_read_only_foundation"
    assert dumped["authority_posture"] == "interpretation_support_only"
    assert set(dumped["explicit_non_claims"]) == set(DEFAULT_EVIDENCE_PACK_EXPLICIT_NON_CLAIMS)


def test_content_domain_literal_count() -> None:
    assert len(get_args(EvidencePackContentDomain)) == 10

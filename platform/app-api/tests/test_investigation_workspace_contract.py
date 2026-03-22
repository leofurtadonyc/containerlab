"""Contract tests for bounded investigation-workspace vocabulary (Phase 2)."""

from typing import get_args

from app_api.schemas.investigation_workspace import (
    DEFAULT_INVESTIGATION_WORKSPACE_EXPLICIT_NON_CLAIMS,
    INVESTIGATION_WORKSPACE_CONTRACT_ID,
    InvestigationContextDomain,
    InvestigationNextInspectionSuggestion,
    InvestigationWorkspaceExplicitNonClaim,
    InvestigationWorkspaceSafetyFraming,
    NEXT_INSPECTION_FRAMING,
)


def test_investigation_workspace_contract_id_is_stable_string() -> None:
    assert INVESTIGATION_WORKSPACE_CONTRACT_ID == "investigation_workspace_phase2_v1"


def test_explicit_non_claims_literal_matches_default_list() -> None:
    literal_args = set(get_args(InvestigationWorkspaceExplicitNonClaim))
    default_set = set(DEFAULT_INVESTIGATION_WORKSPACE_EXPLICIT_NON_CLAIMS)
    assert literal_args == default_set
    assert len(DEFAULT_INVESTIGATION_WORKSPACE_EXPLICIT_NON_CLAIMS) == len(literal_args)


def test_safety_framing_round_trip() -> None:
    m = InvestigationWorkspaceSafetyFraming(authority_posture="interpretation_support_only")
    dumped = m.model_dump()
    assert dumped["contract_id"] == INVESTIGATION_WORKSPACE_CONTRACT_ID
    assert dumped["phase"] == "phase_2_read_only_foundation"
    assert dumped["authority_posture"] == "interpretation_support_only"
    assert set(dumped["explicit_non_claims"]) == set(DEFAULT_INVESTIGATION_WORKSPACE_EXPLICIT_NON_CLAIMS)


def test_context_domain_literal_count() -> None:
    assert len(get_args(InvestigationContextDomain)) == 9


def test_next_inspection_suggestion_model_dump_keys_stable() -> None:
    s = InvestigationNextInspectionSuggestion(
        suggestion_id="change-intelligence-absent-devices",
        context_domain="devices",
        headline="Inspect Devices",
        rationale="Recent change intelligence reports no evidence.",
    )
    dumped = s.model_dump()
    assert set(dumped.keys()) == {
        "suggestion_id",
        "context_domain",
        "framing_rule",
        "headline",
        "rationale",
    }
    assert dumped["framing_rule"] == "evidence_backed_read_only_surfaces_only"


def test_next_inspection_framing_constant_non_empty() -> None:
    assert isinstance(NEXT_INSPECTION_FRAMING, str)
    assert len(NEXT_INSPECTION_FRAMING) > 40
    assert "not" in NEXT_INSPECTION_FRAMING.lower() or "optional" in NEXT_INSPECTION_FRAMING.lower()

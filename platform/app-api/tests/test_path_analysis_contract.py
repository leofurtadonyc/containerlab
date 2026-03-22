"""Contract tests for bounded path-analysis vocabulary (Phase 2)."""

from datetime import UTC, datetime
from typing import get_args

from app_api.schemas.path_analysis import (
    DEFAULT_PATH_ANALYSIS_EXPLICIT_NON_CLAIMS,
    PATH_ANALYSIS_CONTRACT_ID,
    PathAnalysisExplicitNonClaim,
    PathAnalysisSafetyFraming,
    PathAnalysisSubject,
    PathAnalysisTruthAlignment,
    PathAnalysisViewResponse,
    PathEvidenceAttribution,
    PathEvidenceDomain,
)


def test_path_analysis_contract_id_is_stable_string() -> None:
    assert PATH_ANALYSIS_CONTRACT_ID == "path_analysis_phase2_v1"


def test_explicit_non_claims_literal_matches_default_list() -> None:
    literal_args = set(get_args(PathAnalysisExplicitNonClaim))
    default_set = set(DEFAULT_PATH_ANALYSIS_EXPLICIT_NON_CLAIMS)
    assert literal_args == default_set
    assert len(DEFAULT_PATH_ANALYSIS_EXPLICIT_NON_CLAIMS) == len(literal_args)


def test_safety_framing_round_trip() -> None:
    m = PathAnalysisSafetyFraming(authority_posture="interpretation_support_only")
    dumped = m.model_dump()
    assert dumped["contract_id"] == PATH_ANALYSIS_CONTRACT_ID
    assert dumped["phase"] == "phase_2_read_only_foundation"
    assert dumped["authority_posture"] == "interpretation_support_only"
    assert set(dumped["explicit_non_claims"]) == set(DEFAULT_PATH_ANALYSIS_EXPLICIT_NON_CLAIMS)
    assert "dataplane" in dumped["summary_disclaimer"].lower()


def test_path_evidence_domain_literal_count() -> None:
    assert len(get_args(PathEvidenceDomain)) == 8


def test_path_analysis_view_response_model_structure() -> None:
    """Smoke: future API response shape validates."""
    now = datetime.now(tz=UTC)
    resp = PathAnalysisViewResponse(
        metadata={
            "service": "app-api",
            "version": "1",
            "phase": "phase_2_read_only_foundation",
            "generated_at": now,
        },
        safety_framing=PathAnalysisSafetyFraming(
            authority_posture="read_only_assembly_non_authoritative"
        ),
        subject=PathAnalysisSubject(
            policy_id="p1",
            policy_name="example",
            policy_type="static_local",
            color=1,
            headend="a",
            endpoint="b",
            source_target="t1",
        ),
        evidence_sources=[
            PathEvidenceAttribution(domain="policies", reference="GET /api/v1/policies")
        ],
        freshness={
            "assembly_generated_at": now,
            "serving_mode_echo": "live",
        },
        truth_alignment=PathAnalysisTruthAlignment(
            posture="uncertain",
            summary="Intent and observed signals are both partial.",
        ),
    )
    dumped = resp.model_dump()
    assert dumped["safety_framing"]["contract_id"] == PATH_ANALYSIS_CONTRACT_ID
    assert dumped["subject"]["policy_id"] == "p1"

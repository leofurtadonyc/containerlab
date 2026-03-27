"""Contract tests for GET /api/v1/evidence-weakness-explanation (evidence_weakness_explanation_v1)."""

import pytest
from fastapi.testclient import TestClient

from app_api.main import app
from app_api.schemas.evidence_weakness_explanation import (
    DEFAULT_EVIDENCE_WEAKNESS_EXPLICIT_NON_CLAIMS,
    EVIDENCE_WEAKNESS_EXPLANATION_V1_CONTRACT_ID,
)
from app_api.services import evidence_quality_workspace as eqw_service
from app_api.services import evidence_weakness_explanation as ewe_service

client = TestClient(app)

_VALID_CATEGORIES = {
    "collection_assurance_weak",
    "fallback_or_stale_serving",
    "sparse_history_or_anchors",
    "comparison_or_scope_limited",
    "partial_or_unsupported_detail",
    "cross_surface_scope_note",
}


def test_evidence_weakness_explanation_contract_and_shape() -> None:
    r = client.get("/api/v1/evidence-weakness-explanation")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == EVIDENCE_WEAKNESS_EXPLANATION_V1_CONTRACT_ID
    assert payload["safety_framing"]["contract_id"] == EVIDENCE_WEAKNESS_EXPLANATION_V1_CONTRACT_ID
    assert isinstance(payload["blocks"], list)
    assert len(payload["blocks"]) >= 1
    assert "sync_runs_limit_applied" in payload
    for block in payload["blocks"]:
        assert block["explanation_category"] in _VALID_CATEGORIES
        assert "primary_next_best_pivot" in block
        p = block["primary_next_best_pivot"]
        assert p["pivot_id"]
        assert p["label"]
        assert p["route_family"]
        assert "explanation category" in p["rationale"].lower()
        assert block["evidence_quality_dimension"]
        assert block["evidence_subject_domain"]


def test_evidence_weakness_explanation_sync_runs_limit() -> None:
    r = client.get("/api/v1/evidence-weakness-explanation?sync_runs_limit=9")
    assert r.status_code == 200
    assert r.json()["sync_runs_limit_applied"] == 9


def test_evidence_weakness_explanation_explicit_non_claims() -> None:
    r = client.get("/api/v1/evidence-weakness-explanation")
    got = set(r.json()["safety_framing"]["explicit_non_claims"])
    assert got == set(DEFAULT_EVIDENCE_WEAKNESS_EXPLICIT_NON_CLAIMS)


def test_evidence_weakness_advisory_only_semantics() -> None:
    r = client.get("/api/v1/evidence-weakness-explanation")
    caveats = "\n".join(r.json()["caveats"]).lower()
    assert "navigation" in caveats
    assert "not" in caveats or "only" in caveats
    disclaimer = r.json()["safety_framing"]["summary_disclaimer"].lower()
    assert "remediation" in disclaimer or "approval" in disclaimer
    assert "investigation" in disclaimer or "consistency" in disclaimer


def test_evidence_weakness_blocks_align_with_workspace_rows() -> None:
    eq = client.get("/api/v1/evidence-quality-workspace")
    ew = client.get("/api/v1/evidence-weakness-explanation")
    assert eq.status_code == 200 and ew.status_code == 200
    assert len(eq.json()["rows"]) == len(ew.json()["blocks"])


def test_evidence_weakness_survives_partial_assembly_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    def _boom(**_kwargs):
        raise RuntimeError("injected policies failure")

    monkeypatch.setattr(eqw_service, "build_policies_list_response", _boom)
    r = client.get("/api/v1/evidence-weakness-explanation")
    assert r.status_code == 200
    payload = r.json()
    assert any("policies" in n.lower() for n in payload["assembly_notes"])
    assert payload["contract_id"] == EVIDENCE_WEAKNESS_EXPLANATION_V1_CONTRACT_ID


def test_comparison_limits_alternate_pivot_when_topology_or_devices(monkeypatch: pytest.MonkeyPatch) -> None:
    """Deterministic alternate for comparison_limits rows on topology or devices (bounded tie-break)."""

    from app_api.schemas.evidence_quality_workspace import EvidenceQualityRow

    fake_row_topo = EvidenceQualityRow(
        evidence_quality_dimension="comparison_limits",
        evidence_subject_domain="topology",
        summary="test",
        source_citations=["GET /api/v1/topology — comparison_to_latest_persisted.status"],
    )
    alt = ewe_service._alternate_pivot_for_row(  # noqa: SLF001 — contract tie-break helper
        fake_row_topo,
        "comparison_or_scope_limited",
    )
    assert alt is not None
    assert alt.pivot_id == "open_devices_list"

    fake_row_dev = EvidenceQualityRow(
        evidence_quality_dimension="comparison_limits",
        evidence_subject_domain="devices",
        summary="test",
        source_citations=["GET /api/v1/devices"],
    )
    alt2 = ewe_service._alternate_pivot_for_row(fake_row_dev, "comparison_or_scope_limited")  # noqa: SLF001
    assert alt2 is not None
    assert alt2.pivot_id == "open_topology_view"

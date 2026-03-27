"""Contract tests for GET /api/v1/evidence-quality-workspace (evidence_quality_workspace_v1)."""

import pytest
from fastapi.testclient import TestClient

from app_api.main import app
from app_api.schemas.evidence_quality_workspace import (
    DEFAULT_EVIDENCE_QUALITY_EXPLICIT_NON_CLAIMS,
    EVIDENCE_QUALITY_WORKSPACE_V1_CONTRACT_ID,
)
from app_api.services import evidence_quality_workspace as eqw_service

client = TestClient(app)

_VALID_POSTURES = {"bounded_ok", "mixed_degraded", "heavily_limited"}


def test_evidence_quality_workspace_contract_and_shape() -> None:
    r = client.get("/api/v1/evidence-quality-workspace")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == EVIDENCE_QUALITY_WORKSPACE_V1_CONTRACT_ID
    assert payload["safety_framing"]["contract_id"] == EVIDENCE_QUALITY_WORKSPACE_V1_CONTRACT_ID
    assert payload["read_path_reliability_posture"] in _VALID_POSTURES
    assert isinstance(payload["rows"], list)
    assert len(payload["rows"]) >= 1
    assert "collection_assurance_summary" in payload
    assert "scope_summary" in payload
    assert "sync_runs_limit_applied" in payload
    for row in payload["rows"]:
        assert "evidence_quality_dimension" in row
        assert "evidence_subject_domain" in row
        assert "summary" in row


def test_evidence_quality_workspace_sync_runs_limit() -> None:
    r = client.get("/api/v1/evidence-quality-workspace?sync_runs_limit=11")
    assert r.status_code == 200
    payload = r.json()
    assert payload["sync_runs_limit_applied"] == 11


def test_evidence_quality_explicit_non_claims() -> None:
    r = client.get("/api/v1/evidence-quality-workspace")
    got = set(r.json()["safety_framing"]["explicit_non_claims"])
    assert got == set(DEFAULT_EVIDENCE_QUALITY_EXPLICIT_NON_CLAIMS)


def test_evidence_quality_survives_partial_assembly_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    def _boom(**_kwargs):
        raise RuntimeError("injected policies failure")

    monkeypatch.setattr(eqw_service, "build_policies_list_response", _boom)
    r = client.get("/api/v1/evidence-quality-workspace")
    assert r.status_code == 200
    payload = r.json()
    assert any("policies" in n.lower() for n in payload["assembly_notes"])
    assert payload["contract_id"] == EVIDENCE_QUALITY_WORKSPACE_V1_CONTRACT_ID

"""Contract tests for GET /api/v1/evidence-consistency/summary (evidence_consistency_summary_v1)."""

import pytest
from fastapi.testclient import TestClient

from app_api.main import app
from app_api.schemas.evidence_consistency_summary import (
    DEFAULT_EVIDENCE_CONSISTENCY_EXPLICIT_NON_CLAIMS,
    EVIDENCE_CONSISTENCY_SUMMARY_CONTRACT_ID,
)
from app_api.services import evidence_consistency_summary as ecs_service

client = TestClient(app)


def test_evidence_consistency_summary_contract_and_shape() -> None:
    r = client.get("/api/v1/evidence-consistency/summary")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == EVIDENCE_CONSISTENCY_SUMMARY_CONTRACT_ID
    assert payload["safety_framing"]["contract_id"] == EVIDENCE_CONSISTENCY_SUMMARY_CONTRACT_ID
    assert isinstance(payload["items"], list)
    assert len(payload["items"]) >= 1
    assert "scope_summary" in payload
    assert "domain_freshness_echo" in payload


def test_evidence_consistency_summary_sync_runs_limit() -> None:
    r = client.get("/api/v1/evidence-consistency/summary?sync_runs_limit=7")
    assert r.status_code == 200
    payload = r.json()
    assert payload["sync_runs_limit_applied"] == 7


def test_evidence_consistency_explicit_non_claims() -> None:
    r = client.get("/api/v1/evidence-consistency/summary")
    got = set(r.json()["safety_framing"]["explicit_non_claims"])
    assert got == set(DEFAULT_EVIDENCE_CONSISTENCY_EXPLICIT_NON_CLAIMS)


def test_evidence_consistency_survives_partial_assembly_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    def _boom(**_kwargs):
        raise RuntimeError("injected policies failure")

    monkeypatch.setattr(ecs_service, "build_policies_list_response", _boom)
    r = client.get("/api/v1/evidence-consistency/summary")
    assert r.status_code == 200
    payload = r.json()
    assert any("policies" in n.lower() for n in payload["assembly_notes"])

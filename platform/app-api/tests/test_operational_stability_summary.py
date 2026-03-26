"""Contract tests for GET /api/v1/stability/summary (operational_stability_summary_v1)."""

import pytest
from fastapi.testclient import TestClient

from app_api.main import app
from app_api.schemas.operational_stability_summary import (
    DEFAULT_OPERATIONAL_STABILITY_EXPLICIT_NON_CLAIMS,
    OPERATIONAL_STABILITY_SUMMARY_CONTRACT_ID,
)
from app_api.services import operational_stability_summary as oss_service

client = TestClient(app)

_VALID_POSTURES = {
    "quiet_or_stable_evidence",
    "elevated_churn",
    "recurrence_suspected",
    "degraded_recurrence",
    "insufficient_evidence_for_stability_view",
}


def test_operational_stability_summary_contract_and_shape() -> None:
    r = client.get("/api/v1/stability/summary")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == OPERATIONAL_STABILITY_SUMMARY_CONTRACT_ID
    assert payload["safety_framing"]["contract_id"] == OPERATIONAL_STABILITY_SUMMARY_CONTRACT_ID
    assert payload["operational_stability_posture"] in _VALID_POSTURES
    assert isinstance(payload["rows"], list)
    assert len(payload["rows"]) >= 1
    assert "scope_summary" in payload
    assert "sync_runs_limit_applied" in payload


def test_operational_stability_summary_sync_runs_limit() -> None:
    r = client.get("/api/v1/stability/summary?sync_runs_limit=7")
    assert r.status_code == 200
    payload = r.json()
    assert payload["sync_runs_limit_applied"] == 7


def test_operational_stability_explicit_non_claims() -> None:
    r = client.get("/api/v1/stability/summary")
    got = set(r.json()["safety_framing"]["explicit_non_claims"])
    assert got == set(DEFAULT_OPERATIONAL_STABILITY_EXPLICIT_NON_CLAIMS)


def test_operational_stability_survives_partial_assembly_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    def _boom(**_kwargs):
        raise RuntimeError("injected policies failure")

    monkeypatch.setattr(oss_service, "build_policies_list_response", _boom)
    r = client.get("/api/v1/stability/summary")
    assert r.status_code == 200
    payload = r.json()
    assert any("policies" in n.lower() for n in payload["assembly_notes"])
    assert payload["contract_id"] == OPERATIONAL_STABILITY_SUMMARY_CONTRACT_ID

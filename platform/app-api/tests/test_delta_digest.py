"""Contract tests for GET /api/v1/delta-digest (cross_domain_delta_digest_v1)."""

import pytest
from fastapi.testclient import TestClient

from app_api.main import app
from app_api.schemas.delta_digest import (
    DELTA_DIGEST_CONTRACT_ID,
    DEFAULT_DELTA_DIGEST_EXPLICIT_NON_CLAIMS,
)
from app_api.services import delta_digest as delta_digest_service

client = TestClient(app)


def test_delta_digest_contract_id_and_section_order() -> None:
    r = client.get("/api/v1/delta-digest")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == DELTA_DIGEST_CONTRACT_ID
    assert payload["safety"]["contract_id"] == DELTA_DIGEST_CONTRACT_ID
    assert len(payload["sections"]) == 7
    keys = [s["section_key"] for s in payload["sections"]]
    assert keys == [
        "recent_sync_anchor",
        "device_inventory_delta",
        "topology_coverage_posture",
        "policy_delta_degraded",
        "change_intelligence_pointer",
        "recommended_pivots",
        "caveats_missing_evidence",
    ]
    assert payload["recent_change_summary"]["safety"]["contract_id"] == "change_intelligence_phase2_v1"


def test_delta_digest_embeds_change_intelligence_and_sync_limit_echo() -> None:
    r = client.get("/api/v1/delta-digest?sync_runs_limit=5")
    assert r.status_code == 200
    payload = r.json()
    assert payload["sync_runs_limit_applied"] == 5
    assert payload["recent_change_summary"]["sync_runs_limit_applied"] == 5


def test_delta_digest_explicit_non_claims_propagate() -> None:
    r = client.get("/api/v1/delta-digest")
    payload = r.json()
    got = set(payload["safety"]["explicit_non_claims"])
    assert got == set(DEFAULT_DELTA_DIGEST_EXPLICIT_NON_CLAIMS)


def test_delta_digest_framing_avoids_strong_validation_claims() -> None:
    r = client.get("/api/v1/delta-digest")
    text = r.json()["safety"]["summary_disclaimer"].lower()
    assert "interpretation" in text or "orientation" in text or "summar" in text
    assert "validated" not in text
    assert "approved to change" not in text


def test_delta_digest_devices_unavailable_marks_section_and_merges_caveat(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def _boom(**_kwargs):
        raise RuntimeError("injected devices failure")

    monkeypatch.setattr(delta_digest_service, "build_devices_list_response", _boom)
    r = client.get("/api/v1/delta-digest")
    assert r.status_code == 200
    payload = r.json()
    dev = next(s for s in payload["sections"] if s["section_key"] == "device_inventory_delta")
    assert dev["evidence_status"] == "unavailable"
    assert "Assembly error" in " ".join(dev["caveats"])
    caveats_section = next(s for s in payload["sections"] if s["section_key"] == "caveats_missing_evidence")
    merged = " ".join(caveats_section["detail_notes"]).lower()
    assert "devices assembly failed" in merged
    assert payload["completeness_posture"] == "bounded_partial"


def test_delta_digest_sparse_domains_still_return_digest() -> None:
    """Empty or sparse inventories still produce an honest digest (bounded partiality)."""
    r = client.get("/api/v1/delta-digest?sync_runs_limit=1")
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == DELTA_DIGEST_CONTRACT_ID
    assert payload["completeness_posture"] in ("bounded_partial", "best_effort_visible_signals_only")

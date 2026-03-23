"""Contract tests for GET /api/v1/exports/operator-briefing (briefing_export_bundle_v1)."""

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
from app_api.main import app
from app_api.schemas.briefing_export_bundle import BRIEFING_EXPORT_BUNDLE_CONTRACT_ID
from app_api.schemas.operator_briefing import OPERATOR_BRIEFING_CONTRACT_ID
import test_app as test_app_contracts

client = TestClient(app)


@pytest.fixture(autouse=True)
def _clear_caches() -> None:
    clear_policy_snapshot_cache()
    clear_topology_snapshot_cache()


def _stub_live_policy_and_topology(monkeypatch: pytest.MonkeyPatch) -> None:
    test_app_contracts._disable_read_side_persistence(monkeypatch)

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self):
            return test_app_contracts._build_live_policy_snapshot()

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self):
            return test_app_contracts._build_live_topology_snapshot()

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )


def test_export_operator_briefing_bundle_json_success(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"
    r = client.get(
        "/api/v1/exports/operator-briefing",
        params={
            "sync_runs_limit": 6,
            "policy_id": pid,
            "topology_object": "PE1",
            "topology_object_kind": "node",
        },
    )
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == BRIEFING_EXPORT_BUNDLE_CONTRACT_ID
    assert payload["briefing_subject"]["sync_runs_limit"] == 6
    assert payload["briefing_subject"]["policy_id"] == pid
    assert payload["briefing_subject"]["topology_object"] == "PE1"
    assert payload["briefing_subject"]["topology_object_kind"] == "node"
    ids = payload["source_contract_ids"]
    assert BRIEFING_EXPORT_BUNDLE_CONTRACT_ID in ids
    assert OPERATOR_BRIEFING_CONTRACT_ID in ids
    assert "evidence_export_v1" in ids
    kinds = [m["export_kind"] for m in payload["bundle_members"]]
    assert kinds == [
        "policy_dossier",
        "topology_object_dossier",
        "situation_room",
        "investigation_workspace",
    ]
    for m in payload["bundle_members"]:
        if m.get("omission_reason"):
            assert m["payload"] is None
        else:
            assert m["payload"]["contract_id"] == "evidence_export_v1"
    assert payload["explicit_non_claims"]
    assert payload["export_framing"]


def test_export_operator_briefing_bundle_sparse_no_dossiers(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No policy/topology scope: only situation + investigation members."""
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get("/api/v1/exports/operator-briefing", params={"sync_runs_limit": 8})
    assert r.status_code == 200
    payload = r.json()
    assert payload["contract_id"] == BRIEFING_EXPORT_BUNDLE_CONTRACT_ID
    kinds = [m["export_kind"] for m in payload["bundle_members"]]
    assert kinds == ["situation_room", "investigation_workspace"]
    assert payload["briefing_subject"]["policy_id"] is None
    assert payload["briefing_subject"]["topology_object"] is None


def test_export_operator_briefing_bundle_policy_unavailable_omission(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get(
        "/api/v1/exports/operator-briefing",
        params={"sync_runs_limit": 5, "policy_id": "does-not-exist"},
    )
    assert r.status_code == 200
    payload = r.json()
    assert payload["bundle_members"][0]["export_kind"] == "policy_dossier"
    assert payload["bundle_members"][0]["omission_reason"] == "policy_dossier_unavailable"
    assert payload["bundle_members"][0]["payload"] is None
    assert "partial bundle" in payload["export_framing"].lower()


def test_export_operator_briefing_bundle_topology_unavailable_omission(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get(
        "/api/v1/exports/operator-briefing",
        params={
            "sync_runs_limit": 5,
            "topology_object": "no-such",
            "topology_object_kind": "node",
        },
    )
    assert r.status_code == 200
    payload = r.json()
    assert payload["bundle_members"][0]["export_kind"] == "topology_object_dossier"
    assert payload["bundle_members"][0]["omission_reason"] == "topology_object_dossier_unavailable"
    assert "partial bundle" in payload["export_framing"].lower()


def test_export_operator_briefing_bundle_invalid_sync_runs_limit() -> None:
    r = client.get("/api/v1/exports/operator-briefing", params={"sync_runs_limit": 0})
    assert r.status_code == 422


def test_export_operator_briefing_bundle_markdown_format(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get(
        "/api/v1/exports/operator-briefing",
        params={"sync_runs_limit": 3, "format": "markdown"},
    )
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("text/markdown")
    body = r.text
    assert "briefing_export_bundle_v1" in body
    assert "lossless" in body.lower()
    assert "```json" in body


def test_export_operator_briefing_echo_hints(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    r = client.get(
        "/api/v1/exports/operator-briefing",
        params={
            "sync_runs_limit": 4,
            "inv_from": "delta-digest",
            "global_search_q": "PE1",
        },
    )
    assert r.status_code == 200
    payload = r.json()
    assert payload["briefing_subject"]["inv_from"] == "delta-digest"
    assert payload["briefing_subject"]["global_search_q"] == "PE1"

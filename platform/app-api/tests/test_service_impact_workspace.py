"""Contract tests for GET /api/v1/service-impact-workspace (Service Impact Workspace v1)."""

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import clear_policy_snapshot_cache
from app_api.integrations.collector.topology import clear_topology_snapshot_cache
from app_api.main import app
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


def test_service_impact_workspace_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get(
        "/api/v1/service-impact-workspace",
        params={"service_id": "not_a_prefix:foo"},
    )
    assert response.status_code == 404


def test_service_impact_workspace_contract_nested_and_sources(monkeypatch: pytest.MonkeyPatch) -> None:
    """Pins service_impact_workspace_v1, nested service_explorer_v1, optional failure_impact_v1."""
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"
    response = client.get(
        "/api/v1/service-impact-workspace",
        params={"service_id": f"policy:{pid}"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "service_impact_workspace_v1"
    assert payload["service_id"] == f"policy:{pid}"
    assert payload["service_explorer"]["contract_id"] == "service_explorer_v1"
    assert "service_explorer_v1" in payload["source_contract_ids"]
    if payload.get("failure_impact") is not None:
        assert payload["failure_impact"]["contract_id"] == "failure_impact_v1"
        assert "failure_impact_v1" in payload["source_contract_ids"]
    assert isinstance(payload["merged_caveats"], list)
    assert isinstance(payload["merged_evidence_gap_notes"], list)
    assert isinstance(payload["explicit_non_claims"], list)
    assert any("service_impact_workspace_v1" in x.lower() for x in payload["explicit_non_claims"])
    assert isinstance(payload["recommended_api_pivots"], list)


def test_service_impact_workspace_sparse_no_topology_links(monkeypatch: pytest.MonkeyPatch) -> None:
    """When Explorer has no topology links, failure-impact is omitted with an honest note."""
    _stub_live_policy_and_topology(monkeypatch)
    pid = "PE1:static_local:192.0.2.11:100"

    from app_api.services import service_explorer as se
    from app_api.services import service_impact_workspace as siw

    real_detail = se.build_service_detail_response

    def _detail_no_links(sid: str):
        out = real_detail(sid)
        if out is None:
            return None
        return out.model_copy(update={"topology_links": [], "topology_evidence_status": "partial"})

    # Patch the name bound in service_impact_workspace (import-by-reference).
    monkeypatch.setattr(siw, "build_service_detail_response", _detail_no_links)

    response = client.get(
        "/api/v1/service-impact-workspace",
        params={"service_id": f"policy:{pid}"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["failure_impact"] is None
    assert payload["failure_impact_topology_anchor"] is None
    note = (payload.get("failure_impact_assembly_note") or "").lower()
    assert "topology" in note or "failure-impact" in note
    merged = "\n".join(payload["merged_evidence_gap_notes"]).lower()
    assert "topology" in merged or "failure-impact" in merged

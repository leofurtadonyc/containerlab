"""Contract tests for GET /api/v1/topology/objects/{object_id}/dossier."""

import copy

import pytest
from fastapi.testclient import TestClient

from app_api.integrations.collector.policies import CollectorPolicySnapshot, clear_policy_snapshot_cache
from app_api.integrations.collector.topology import (
    CollectorTopologyNodeRecord,
    CollectorTopologySnapshot,
    clear_topology_snapshot_cache,
)
from app_api.main import app
import test_app as test_app_contracts

client = TestClient(app)


@pytest.fixture(autouse=True)
def _clear_topology_policy_caches() -> None:
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


def _topology_with_orphan_node() -> CollectorTopologySnapshot:
    base = test_app_contracts._build_live_topology_snapshot()
    extra = CollectorTopologyNodeRecord(
        node_id="ORPHAN",
        display_name="ORPHAN",
        role="pe",
        state="up",
        source="gnmi",
        device_id="ORPHAN",
        attributes={},
    )
    return base.model_copy(update={"nodes": list(base.nodes) + [extra]})


def test_dossier_unknown_object_returns_404(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/no-such-object/dossier")
    assert response.status_code == 404


def test_dossier_node_contract_and_nested_failure_impact(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/PE1/dossier")
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "topology_object_dossier_v1"
    assert payload["object_identity"]["object_kind"] == "node"
    assert payload["object_identity"]["object_id"] == "PE1"
    assert payload["failure_impact"]["contract_id"] == "failure_impact_v1"
    assert payload["failure_impact"]["subject"] == {"kind": "node", "object_id": "PE1"}
    assert payload["related_policies"]["object_id"] == "PE1"
    assert payload["risk_attention"]["ranking_basis"]
    assert payload["risk_attention"]["row"] is not None
    assert payload["risk_attention"]["row"]["object_id"] == "PE1"
    assert payload["navigation_targets"]["investigation_shell_params"]["inv_from"] == "topology"
    assert payload["freshness"]["policy_serving_mode_echo"]
    assert payload["merged_caveats"]


def test_dossier_link_unions_endpoints(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/P1--PE1/dossier")
    assert response.status_code == 200
    payload = response.json()
    assert payload["object_identity"]["object_kind"] == "link"
    assert payload["failure_impact"]["subject"] == {"kind": "link", "object_id": "P1--PE1"}
    assert len(payload["related_policies"]["items"]) >= 1


def test_dossier_no_related_policies(monkeypatch: pytest.MonkeyPatch) -> None:
    test_app_contracts._disable_read_side_persistence(monkeypatch)

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self):
            return test_app_contracts._build_live_policy_snapshot()

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self):
            return _topology_with_orphan_node()

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )

    response = client.get("/api/v1/topology/objects/ORPHAN/dossier")
    assert response.status_code == 200
    payload = response.json()
    assert payload["related_policies"]["items"] == []
    assert payload["failure_impact"]["rollup_counts"]["related_policies_total"] == 0
    assert payload["degraded_related_policies_preview"] == []
    assert payload["risk_attention"]["row"]["ranking_inputs"]["related_policy_breadth"] == 0


def test_dossier_partial_path_analysis_propagates_caveat(monkeypatch: pytest.MonkeyPatch) -> None:
    """Unsupported related policy => path-analysis caveat appears in merged caveats."""
    test_app_contracts._disable_read_side_persistence(monkeypatch)
    live = test_app_contracts._build_live_policy_snapshot()
    data = live.model_dump()
    records = copy.deepcopy(data["records"])
    records[0]["support_state"] = "unsupported"
    data["records"] = records
    stub_snapshot = CollectorPolicySnapshot(**data)

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self):
            return stub_snapshot

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

    response = client.get("/api/v1/topology/objects/PE1/dossier")
    assert response.status_code == 200
    merged = "\n".join(response.json()["merged_caveats"])
    assert "Path-analysis" in merged or "path-analysis" in merged.lower()
    fi_missing = "\n".join(response.json()["failure_impact"]["missing_evidence_notes"])
    assert "path-analysis" in fi_missing.lower()


def test_dossier_degraded_preview_matches_related_policy_ids(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/P1--PE1/dossier")
    assert response.status_code == 200
    payload = response.json()
    preview = payload["degraded_related_policies_preview"]
    related_ids = {item["policy_id"] for item in payload["related_policies"]["items"]}
    preview_ids = {item["policy_id"] for item in preview}
    assert preview_ids == related_ids
    for item in preview:
        assert item["degraded_policy_v1"]["contract_id"] == "degraded_policy_v1"
        assert item["degraded_policy_v1"]["posture"] in ("ok", "degraded", "unknown")

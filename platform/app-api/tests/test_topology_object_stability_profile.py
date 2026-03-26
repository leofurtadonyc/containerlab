"""Contract tests for GET /api/v1/topology/objects/{object_id}/stability-profile."""

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


def test_topology_object_stability_profile_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/unknown-node-xyz/stability-profile")
    assert response.status_code == 404


def test_topology_object_stability_profile_contract_and_shape(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)
    response = client.get("/api/v1/topology/objects/PE1/stability-profile")
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "topology_object_stability_profile_v1"
    assert payload["object_kind"] == "node"
    assert payload["object_id"] == "PE1"
    assert payload["primary_stability_posture"] in {
        "quiet_or_stable_evidence",
        "elevated_churn",
        "recurrence_suspected",
        "degraded_recurrence",
        "insufficient_evidence_for_stability_view",
    }
    assert "not_prediction_or_mtbf" in payload["safety_framing"]["explicit_non_claims"]
    assert "not_substitute_for_dossier_timeline_or_delta" in payload["safety_framing"]["explicit_non_claims"]
    assert isinstance(payload["volatility_churn_cues"], list)
    assert isinstance(payload["merged_caveats"], list)
    assert isinstance(payload["assembly_notes"], list)
    assert len(payload["canonical_pivots"]) >= 1


def test_topology_object_stability_profile_partial_nested_assembly(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_live_policy_and_topology(monkeypatch)

    def _boom(*_args: object, **_kwargs: object) -> None:
        raise RuntimeError("simulated timeline failure")

    monkeypatch.setattr(
        "app_api.services.topology_object_stability_profile.build_topology_object_evidence_timeline_response",
        _boom,
    )
    response = client.get("/api/v1/topology/objects/PE1/stability-profile")
    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_id"] == "topology_object_stability_profile_v1"
    notes = "\n".join(payload["assembly_notes"])
    assert "evidence_timeline" in notes.lower() or "timeline" in notes.lower()

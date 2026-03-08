from datetime import datetime

from fastapi.testclient import TestClient

from app_api.integrations.collector.inventory import (
    CollectorInventoryRecord,
    CollectorInventorySnapshot,
)
from app_api.main import app
from app_api.metrics.state import reset_metrics_registry


client = TestClient(app)


def _build_live_inventory_snapshot() -> CollectorInventorySnapshot:
    return CollectorInventorySnapshot(
        integration="gnmi_collector_inventory",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804/inventory/snapshot",
        records=[
            CollectorInventoryRecord(
                device_id="PE1",
                vendor="nokia",
                platform="7750 SR-1",
                software_version="B-25.10.R2",
                role="pe",
                management_address="172.20.20.107",
                collector_status="ok",
                capability_summary="partially_supported",
                normalization_status="normalized_live",
                source="gnmi",
                source_target="PE1",
                notes=["Collected live over gNMI."],
            ),
            CollectorInventoryRecord(
                device_id="P1",
                vendor="nokia",
                platform="7750 SR-1",
                software_version="B-25.10.R2",
                role="p",
                management_address="172.20.20.109",
                collector_status="ok",
                capability_summary="partially_supported",
                normalization_status="normalized_live",
                source="gnmi",
                source_target="P1",
                notes=["Collected live over gNMI."],
            ),
        ],
        fetch_error=None,
    )


def test_health_endpoint_returns_typed_payload() -> None:
    response = client.get("/api/v1/health", headers={"X-Request-ID": "health-test"})

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "health-test"
    assert payload["status"] == "ok"
    assert payload["service"] == "app-api"
    assert payload["version"] == "0.1.0"
    assert payload["phase"] == "phase_1_skeleton"
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_platform_status_endpoint_returns_declared_service_scaffold() -> None:
    response = client.get(
        "/api/v1/platform/status",
        headers={"X-Request-ID": "platform-status-test"},
    )

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "platform-status-test"
    assert payload["status"] == "ok"
    assert payload["service"] == "app-api"
    assert payload["topology_name"] == "platform"
    assert "live dependency checks are not implemented yet" in payload["summary"]
    assert len(payload["components"]) == 7
    assert payload["components"][0]["name"] == "app-api"
    assert payload["components"][0]["lifecycle_state"] == "declared"
    assert payload["components"][0]["observation_state"] == "not_checked"
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_devices_endpoint_returns_live_inventory(monkeypatch) -> None:
    class StubCollectorInventoryClient:
        def read_inventory_snapshot(self) -> CollectorInventorySnapshot:
            return _build_live_inventory_snapshot()

    monkeypatch.setattr(
        "app_api.services.devices.get_collector_inventory_client",
        lambda: StubCollectorInventoryClient(),
    )
    response = client.get("/api/v1/devices", headers={"X-Request-ID": "devices-test"})

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "devices-test"
    assert payload["data_status"] == "live"
    assert payload["count"] == 2
    assert "live read-only Nokia gNMI collection" in payload["summary"]
    assert payload["items"][0]["device_id"] == "PE1"
    assert payload["items"][0]["vendor"] == "nokia"
    assert payload["items"][0]["management_address"] == "172.20.20.107"
    assert payload["items"][0]["collector_status"] == "ok"
    assert payload["items"][0]["capability_summary"] == "partially_supported"
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_topology_endpoint_returns_normalized_placeholder_topology() -> None:
    response = client.get("/api/v1/topology", headers={"X-Request-ID": "topology-test"})

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "topology-test"
    assert payload["data_status"] == "normalized_scaffold"
    assert payload["topology"]["topology_id"] == "platform-observed-topology"
    assert payload["topology"]["topology_name"] == "Platform Observed Topology"
    assert payload["topology"]["sync_source"] == "normalized_platform_topology_placeholder"
    assert payload["topology"]["sync_status"] == "unknown"
    assert payload["topology"]["completeness"] == "partial"
    assert len(payload["topology"]["nodes"]) == 2
    assert len(payload["topology"]["links"]) == 1
    assert payload["topology"]["nodes"][0]["display_name"] == "Edge PE 1"
    assert payload["topology"]["nodes"][0]["state"] == "unknown"
    assert payload["topology"]["nodes"][0]["source"] == "collector_placeholder"
    assert payload["topology"]["nodes"][0]["attributes"]["vendor"] == "nokia"
    assert payload["topology"]["links"][0]["state"] == "unknown"
    assert payload["topology"]["links"][0]["source"] == "platform_placeholder"
    assert payload["topology"]["links"][0]["attributes"]["knowledge_state"] == "partial"
    assert "partial and unknown knowledge explicit" in payload["summary"]
    assert "Topology is intentionally partial in Phase 1." in payload["topology"]["notes"]
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_policies_endpoint_returns_normalized_policy_inventory() -> None:
    response = client.get("/api/v1/policies", headers={"X-Request-ID": "policies-test"})

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "policies-test"
    assert payload["data_status"] == "normalized_scaffold"
    assert payload["count"] == 2
    assert "explicit support, observed, and unknown states" in payload["summary"]
    assert payload["items"][0]["policy_id"] == "sr-policy-edge-pe-1-to-core"
    assert payload["items"][0]["intent_state"] == "declared"
    assert payload["items"][0]["observed_state"] == "unknown"
    assert payload["items"][0]["support_state"] == "not_implemented_in_platform"
    assert payload["items"][0]["health_state"] == "unknown"
    assert payload["items"][0]["candidate_paths"][0]["path_state"] == "unknown"
    assert payload["items"][1]["intent_state"] == "unknown"
    assert payload["items"][1]["support_state"] == "unknown"
    assert payload["items"][1]["health_state"] == "degraded"
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_capabilities_endpoint_returns_typed_placeholder_capabilities() -> None:
    response = client.get(
        "/api/v1/capabilities",
        headers={"X-Request-ID": "capabilities-test"},
    )

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "capabilities-test"
    assert payload["data_status"] == "placeholder"
    assert payload["count"] == 2
    assert "Unsupported, unknown, and partial states remain explicit" in payload["summary"]
    assert payload["items"][0]["feature"] == "device_inventory"
    assert payload["items"][0]["support_status"] == "unknown"
    assert payload["items"][0]["implementation_status"] == "placeholder"
    assert payload["items"][1]["feature"] == "topology_observation"
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_unknown_route_returns_consistent_error_payload() -> None:
    response = client.get(
        "/api/v1/does-not-exist",
        headers={"X-Request-ID": "not-found-test"},
    )

    assert response.status_code == 404
    assert response.headers["X-Request-ID"] == "not-found-test"
    assert response.json() == {
        "code": "http_error",
        "message": "Not Found",
        "details": [],
        "request_id": "not-found-test",
    }


def test_metrics_endpoint_returns_bounded_backend_metrics(monkeypatch) -> None:
    class StubCollectorInventoryClient:
        def read_inventory_snapshot(self) -> CollectorInventorySnapshot:
            return _build_live_inventory_snapshot()

    monkeypatch.setattr(
        "app_api.services.devices.get_collector_inventory_client",
        lambda: StubCollectorInventoryClient(),
    )
    reset_metrics_registry()
    client.get("/api/v1/health")
    client.get("/api/v1/devices")
    response = client.get("/metrics")

    assert response.status_code == 200
    assert "platform_app_api_info" in response.text
    assert "platform_app_api_http_requests_total" in response.text
    assert 'endpoint="/api/v1/health",method="GET",status_class="2xx"' in response.text
    assert 'endpoint="/api/v1/devices",method="GET",status_class="2xx"' in response.text
    assert "platform_app_api_http_request_duration_seconds_count" in response.text
    assert "platform_app_api_http_request_duration_seconds_sum" in response.text


def test_devices_endpoint_allows_webui_origin_via_cors(monkeypatch) -> None:
    class StubCollectorInventoryClient:
        def read_inventory_snapshot(self) -> CollectorInventorySnapshot:
            return _build_live_inventory_snapshot()

    monkeypatch.setattr(
        "app_api.services.devices.get_collector_inventory_client",
        lambda: StubCollectorInventoryClient(),
    )
    response = client.get(
        "/api/v1/devices",
        headers={"Origin": "http://localhost:8088"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:8088"

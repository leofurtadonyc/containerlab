from datetime import datetime

from fastapi.testclient import TestClient

from app_api.main import app


client = TestClient(app)


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


def test_devices_endpoint_returns_typed_placeholder_inventory() -> None:
    response = client.get("/api/v1/devices", headers={"X-Request-ID": "devices-test"})

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "devices-test"
    assert payload["data_status"] == "integration_scaffold"
    assert payload["count"] == 1
    assert "bounded normalized collector integration placeholder" in payload["summary"]
    assert payload["items"][0]["device_id"] == "example-nokia-router"
    assert payload["items"][0]["vendor"] == "nokia"
    assert payload["items"][0]["management_address"] == "192.0.2.10"
    assert payload["items"][0]["collector_status"] == "ok"
    assert payload["items"][0]["capability_summary"] == "not_implemented_in_platform"
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


def test_metrics_endpoint_returns_prometheus_placeholder() -> None:
    response = client.get("/metrics")

    assert response.status_code == 200
    assert "platform_app_api_info" in response.text

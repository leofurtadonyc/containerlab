from fastapi.testclient import TestClient

from app_api.main import app


client = TestClient(app)


def test_health_endpoint_returns_typed_payload() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "app-api",
        "version": "0.1.0",
        "phase": "phase_1_skeleton",
    }


def test_metrics_endpoint_returns_prometheus_placeholder() -> None:
    response = client.get("/metrics")

    assert response.status_code == 200
    assert "platform_app_api_info" in response.text

from fastapi.testclient import TestClient

from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.main import app
from gnmi_collector.mappings.inventory import map_inventory_record


client = TestClient(app)


def test_metrics_endpoint_returns_prometheus_placeholder() -> None:
    response = client.get("/metrics")

    assert response.status_code == 200
    assert "platform_gnmi_collector_info" in response.text


def test_nokia_adapter_placeholder_is_bounded() -> None:
    adapter = NokiaSrosAdapter()

    assert adapter.vendor_name == "nokia"
    assert "placeholder" in adapter.describe().lower()


def test_inventory_mapping_returns_placeholder_structure() -> None:
    result = map_inventory_record({"hostname": "r1"})

    assert result["model_family"] == "inventory"
    assert result["source"] == "gnmi"
    assert result["normalization_status"] == "placeholder"

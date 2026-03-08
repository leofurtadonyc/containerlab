from fastapi.testclient import TestClient

from gnmi_collector.config.runtime import build_runtime_config
from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.main import app
from gnmi_collector.mappings.inventory import map_inventory_record
from gnmi_collector.services.inventory import build_inventory_flow_snapshot


client = TestClient(app)


def test_metrics_endpoint_returns_inventory_operational_metrics() -> None:
    response = client.get("/metrics")

    assert response.status_code == 200
    assert "platform_gnmi_collector_info" in response.text
    assert "platform_gnmi_collector_inventory_targets" in response.text
    assert "platform_gnmi_collector_inventory_collection_success_total" in response.text
    assert "platform_gnmi_collector_inventory_normalization_failure_total" in response.text
    assert "platform_gnmi_collector_inventory_backend_ready_records" in response.text
    assert "platform_gnmi_collector_inventory_backend_delivery_error_total" in response.text


def test_nokia_adapter_inventory_scaffold_is_bounded() -> None:
    config = build_runtime_config()
    adapter = NokiaSrosAdapter()
    target = config.targets[0]

    assert adapter.vendor_name == "nokia"
    assert "inventory adapter scaffold" in adapter.describe().lower()
    plan = adapter.build_inventory_plan(target)
    raw_record = adapter.collect_inventory(target)

    assert plan.target_name == target.name
    assert plan.inventory_paths == target.inventory_paths
    assert raw_record.vendor == "nokia"
    assert raw_record.platform_hint == "sros"
    assert raw_record.collection_status == "success"


def test_inventory_mapping_returns_normalized_placeholder_record() -> None:
    raw_record = NokiaSrosAdapter().collect_inventory(build_runtime_config().targets[0])
    result = map_inventory_record(raw_record)

    assert result.source == "gnmi"
    assert result.vendor == "nokia"
    assert result.platform == "sros"
    assert result.collector_status == "ok"
    assert result.normalization_status == "normalized_placeholder"


def test_inventory_flow_snapshot_prepares_backend_delivery() -> None:
    snapshot = build_inventory_flow_snapshot()

    assert snapshot.mode == "phase_1_inventory_scaffold"
    assert snapshot.summary.target_count == 1
    assert snapshot.summary.collection_success_count == 1
    assert snapshot.summary.collection_failure_count == 0
    assert snapshot.summary.normalization_partial_count == 0
    assert snapshot.summary.normalization_failure_count == 0
    assert snapshot.summary.backend_ready_record_count == 1
    assert snapshot.summary.backend_delivery_error_count == 0
    assert snapshot.delivery.destination_service == "app-api"
    assert snapshot.delivery.delivery_status == "ready_for_backend_contract"
    assert snapshot.delivery.model_family == "inventory"

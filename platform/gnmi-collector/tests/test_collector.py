from fastapi.testclient import TestClient

from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.config.runtime import build_runtime_config
from gnmi_collector.main import app
from gnmi_collector.mappings.inventory import map_inventory_record
from gnmi_collector.services.inventory import build_inventory_flow_snapshot


client = TestClient(app)


def _target_name_by_host() -> dict[str, str]:
    return {target.management_address: target.name for target in build_runtime_config().targets}


class FakeGnmiClient:
    def __init__(self, *, target, username, password, insecure):
        self.target = target
        self.username = username
        self.password = password
        self.insecure = insecure

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def get(self, *, path, encoding):
        del path, encoding
        host = self.target[0]
        device_name = _target_name_by_host()[host]
        return {
            "notification": [
                {"update": [{"path": "state/system/oper-name", "val": device_name}]},
                {"update": [{"path": "state/system/platform", "val": "7750 SR-1"}]},
                {
                    "update": [
                        {
                            "path": "state/system/version",
                            "val": {"nokia-state:version-number": "B-25.10.R2"},
                        }
                    ]
                },
            ]
        }


def test_runtime_config_loads_live_nokia_targets() -> None:
    config = build_runtime_config()

    assert config.mode == "phase_2_live_inventory"
    assert config.delivery.mode == "backend_http_snapshot"
    assert len(config.targets) == 34
    assert {target.name for target in config.targets} >= {
        "CPE-A1",
        "PE1",
        "P1",
        "CSC2-P4",
    }
    assert config.inventory_subscriptions[0].path == "/nokia-state:state/system/oper-name"


def test_metrics_endpoint_returns_inventory_operational_metrics(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    expected_target_count = len(build_runtime_config().targets)

    response = client.get("/metrics")

    assert response.status_code == 200
    assert "platform_gnmi_collector_info" in response.text
    assert f"platform_gnmi_collector_inventory_targets {expected_target_count}" in response.text
    assert (
        f"platform_gnmi_collector_inventory_collection_success_total {expected_target_count}"
        in response.text
    )
    assert "platform_gnmi_collector_inventory_normalization_failure_total 0" in response.text
    assert (
        f"platform_gnmi_collector_inventory_backend_ready_records {expected_target_count}"
        in response.text
    )
    assert "platform_gnmi_collector_inventory_backend_delivery_error_total 0" in response.text


def test_inventory_snapshot_endpoint_returns_normalized_live_records(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    expected_target_count = len(build_runtime_config().targets)

    response = client.get("/inventory/snapshot")

    assert response.status_code == 200
    payload = response.json()
    assert payload["delivery_mode"] == "backend_http_snapshot"
    assert payload["delivery_status"] == "live_ready"
    assert payload["record_count"] == expected_target_count
    assert payload["records"][0]["source"] == "gnmi"


def test_nokia_adapter_collects_live_inventory(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    config = build_runtime_config()
    adapter = NokiaSrosAdapter()
    target = config.targets[0]

    assert adapter.vendor_name == "nokia"
    assert "live inventory adapter" in adapter.describe().lower()
    plan = adapter.build_inventory_plan(target)
    raw_record = adapter.collect_inventory(target)

    assert plan.target_name == target.name
    assert plan.inventory_paths == target.inventory_paths
    assert raw_record.vendor == "nokia"
    assert raw_record.platform_hint == "sros"
    assert raw_record.collection_status == "success"
    assert raw_record.raw_data["system_name"] == target.name


def test_inventory_mapping_returns_normalized_live_record(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    raw_record = NokiaSrosAdapter().collect_inventory(build_runtime_config().targets[0])
    result = map_inventory_record(raw_record)

    assert result.source == "gnmi"
    assert result.vendor == "nokia"
    assert result.platform == "7750 SR-1"
    assert result.collector_status == "ok"
    assert result.normalization_status == "normalized_live"
    assert result.capability_summary == "partially_supported"


def test_inventory_flow_snapshot_prepares_live_backend_delivery(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    snapshot = build_inventory_flow_snapshot()
    expected_target_count = len(build_runtime_config().targets)

    assert snapshot.mode == "phase_2_live_inventory"
    assert snapshot.summary.target_count == expected_target_count
    assert snapshot.summary.collection_success_count == expected_target_count
    assert snapshot.summary.collection_failure_count == 0
    assert snapshot.summary.normalization_partial_count == 0
    assert snapshot.summary.normalization_failure_count == 0
    assert snapshot.summary.backend_ready_record_count == expected_target_count
    assert snapshot.summary.backend_delivery_error_count == 0
    assert snapshot.delivery.destination_service == "app-api"
    assert snapshot.delivery.delivery_status == "live_ready"
    assert snapshot.delivery.model_family == "inventory"

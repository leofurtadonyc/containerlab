from fastapi.testclient import TestClient

from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.config.runtime import build_runtime_config
from gnmi_collector.main import app
from gnmi_collector.mappings.inventory import map_inventory_record
from gnmi_collector.services.inventory import build_inventory_flow_snapshot
from gnmi_collector.services.policy import build_policy_flow_snapshot
from gnmi_collector.services.topology import build_topology_flow_snapshot


client = TestClient(app)


def _targets():
    return build_runtime_config().targets


def _target_name_by_host() -> dict[str, str]:
    return {target.management_address: target.name for target in _targets()}


def _paired_peer_by_host() -> dict[str, str]:
    targets = _targets()
    peers: dict[str, str] = {}
    for index in range(0, len(targets), 2):
        left = targets[index]
        right = targets[min(index + 1, len(targets) - 1)]
        peers[left.management_address] = right.name
        peers[right.management_address] = left.name
    return peers


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
        del encoding
        host = self.target[0]
        device_name = _target_name_by_host()[host]
        if any("segment-routing/sr-policies" in item for item in path):
            static_policy_payload = []
            static_local_policies = 0
            active_static_local_policies = 0
            static_non_local_policies = 0
            if device_name == "PE1":
                static_local_policies = 1
                active_static_local_policies = 1
                static_policy_payload = [
                    {
                        "nokia-state:policy-name": "sr-static-PE1-192.0.2.11-100",
                        "nokia-state:endpoint": "192.0.2.11",
                        "nokia-state:color": 100,
                        "nokia-state:head-end": "local",
                        "nokia-state:candidate-path": [
                            {
                                "nokia-state:candidate-path-name": "primary",
                                "nokia-state:preference": 200,
                                "nokia-state:active": True,
                                "nokia-state:protocol-origin": "static",
                                "nokia-state:validation-state": "valid",
                            },
                            {
                                "nokia-state:candidate-path-name": "backup",
                                "nokia-state:preference": 100,
                                "nokia-state:active": False,
                                "nokia-state:validation-state": "valid",
                            },
                        ],
                    }
                ]
            elif device_name == "P1":
                static_non_local_policies = 1
                static_policy_payload = [
                    {
                        "nokia-state:policy-name": "sr-static-P1-198.51.100.1-200",
                        "nokia-state:endpoint": "198.51.100.1",
                        "nokia-state:color": 200,
                        "nokia-state:head-end": "100.64.0.1",
                        "nokia-state:admin-state": "enable",
                        "nokia-state:candidate-path": [
                            {
                                "nokia-state:name": "secondary",
                                "nokia-state:preference": 150,
                                "nokia-state:active": False,
                                "nokia-state:validation-state": "valid",
                            }
                        ],
                    }
                ]
            updates = [
                {
                    "path": "state/router[router-name=Base]/segment-routing/sr-policies",
                    "val": {
                        "nokia-state:ttm-preferences": 14,
                        "nokia-state:binding-sids-allocated": 0,
                        "nokia-state:srv6-binding-sids-allocated": 0,
                        "nokia-state:static-local-policies": static_local_policies,
                        "nokia-state:active-static-local-policies": active_static_local_policies,
                        "nokia-state:static-non-local-policies": static_non_local_policies,
                        "nokia-state:bgp-policies": 0,
                        "nokia-state:active-bgp-policies": 0,
                    },
                }
            ]
            if any("static-policy" in item for item in path):
                static_policy_update = {
                    "path": "state/router[router-name=Base]/segment-routing/sr-policies/static-policy"
                }
                if static_policy_payload:
                    static_policy_update["val"] = static_policy_payload
                updates.append(static_policy_update)
            return {
                "notification": [
                    {
                        "timestamp": 1773094131368820265,
                        "update": updates,
                    }
                ]
            }
        if any("router[router-name=Base]/interface" in item for item in path):
            peer_name = _paired_peer_by_host()[host]
            return {
                "notification": [
                    {
                        "timestamp": 1773094131368820265,
                        "update": [
                            {
                                "path": "state/router[router-name=Base]/interface[interface-name=system]",
                                "val": {
                                    "nokia-state:interface-name": "system",
                                    "nokia-state:oper-state": "up",
                                    "nokia-state:protocol": "ospfv2 mpls rsvp",
                                    "nokia-state:ipv4": {
                                        "primary": {
                                            "oper-address": f"10.255.255.{list(_target_name_by_host().values()).index(device_name) + 1}"
                                        }
                                    },
                                },
                            },
                            {
                                "path": (
                                    "state/router[router-name=Base]/"
                                    f"interface[interface-name=to-{peer_name}]"
                                ),
                                "val": {
                                    "nokia-state:interface-name": f"to-{peer_name}",
                                    "nokia-state:oper-state": "up",
                                    "nokia-state:protocol": "ospfv2 mpls rsvp",
                                    "nokia-state:ipv4": {
                                        "primary": {"oper-address": "192.0.2.1"}
                                    },
                                },
                            },
                        ],
                    }
                ]
            }

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
    assert config.topology_subscriptions[0].path == "/nokia-state:state/router[router-name=Base]/interface"
    assert (
        config.policy_subscriptions[0].path
        == "/nokia-state:state/router[router-name=Base]/segment-routing/sr-policies"
    )
    assert (
        config.policy_subscriptions[1].path
        == "/nokia-state:state/router[router-name=Base]/segment-routing/sr-policies/static-policy"
    )


def test_metrics_endpoint_returns_inventory_and_topology_operational_metrics(
    monkeypatch,
) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    expected_target_count = len(_targets())
    client.get("/inventory/snapshot")
    client.get("/topology/snapshot")
    client.get("/policies/snapshot")

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
    assert f"platform_gnmi_collector_topology_targets {expected_target_count}" in response.text
    assert (
        f"platform_gnmi_collector_topology_collection_success_total {expected_target_count}"
        in response.text
    )
    assert "platform_gnmi_collector_topology_normalized_nodes 34" in response.text
    assert "platform_gnmi_collector_topology_normalized_links 17" in response.text
    assert 'platform_gnmi_collector_topology_nodes_by_state{state="up"} 34' in response.text
    assert 'platform_gnmi_collector_topology_links_by_state{state="up"} 17' in response.text
    assert f"platform_gnmi_collector_policy_targets {expected_target_count}" in response.text
    assert f"platform_gnmi_collector_policy_observed_targets {expected_target_count}" in response.text
    assert f"platform_gnmi_collector_policy_capable_targets {expected_target_count}" in response.text
    assert "platform_gnmi_collector_policy_observed_policies 2" in response.text


def test_inventory_snapshot_endpoint_returns_normalized_live_records(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    expected_target_count = len(_targets())

    response = client.get("/inventory/snapshot")

    assert response.status_code == 200
    payload = response.json()
    assert payload["delivery_mode"] == "backend_http_snapshot"
    assert payload["delivery_status"] == "live_ready"
    assert payload["record_count"] == expected_target_count
    assert payload["records"][0]["source"] == "gnmi"


def test_topology_snapshot_endpoint_returns_normalized_live_records(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)

    response = client.get("/topology/snapshot")

    assert response.status_code == 200
    payload = response.json()
    assert payload["delivery_mode"] == "backend_http_snapshot"
    assert payload["delivery_status"] == "live_ready"
    assert payload["node_count"] == 34
    assert payload["link_count"] == 17
    assert payload["sync_source"] == "gnmi_collector_topology_interface_inference"
    assert payload["completeness"] == "partial"


def test_policy_snapshot_endpoint_returns_live_policy_observations(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    expected_target_count = len(_targets())

    response = client.get("/policies/snapshot")

    assert response.status_code == 200
    payload = response.json()
    assert payload["delivery_mode"] == "backend_http_snapshot"
    assert payload["delivery_status"] == "live_ready"
    assert payload["model_family"] == "policy_inventory"
    assert payload["sync_source"] == "gnmi_collector_policy_sr_counters"
    assert payload["observed_target_count"] == expected_target_count
    assert payload["policy_capable_target_count"] == expected_target_count
    assert payload["observed_target_role_counts"] == {
        "cpe": 6,
        "isp": 2,
        "noc": 2,
        "p": 16,
        "pe": 8,
    }
    assert payload["policy_count"] == 2
    assert payload["static_local_policy_count"] == 1
    assert payload["static_non_local_policy_count"] == 1
    assert payload["ttm_preference_count"] == 476
    assert payload["detail_mode"] == "static_policies_when_present"
    assert len(payload["records"]) == 2
    assert payload["records"][0]["policy_type"] == "static_local"


def test_nokia_adapter_collects_live_inventory_and_topology(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    config = build_runtime_config()
    adapter = NokiaSrosAdapter()
    target = config.targets[0]

    assert adapter.vendor_name == "nokia"
    assert "policy" in adapter.describe().lower()
    inventory_plan = adapter.build_inventory_plan(target)
    topology_plan = adapter.build_topology_plan(target)
    policy_plan = adapter.build_policy_plan(target)
    inventory_record = adapter.collect_inventory(target)
    topology_record = adapter.collect_topology(target)
    policy_record = adapter.collect_policy(target)

    assert inventory_plan.target_name == target.name
    assert topology_plan.topology_paths == target.topology_paths
    assert policy_plan.policy_paths == target.policy_paths
    assert inventory_record.vendor == "nokia"
    assert inventory_record.platform_hint == "sros"
    assert inventory_record.collection_status == "success"
    assert inventory_record.raw_data["system_name"] == target.name
    assert topology_record.collection_status == "success"
    assert topology_record.raw_interfaces[0].interface_name == "system"
    assert policy_record.collection_status == "success"
    assert policy_record.sr_policy_counts["ttm-preferences"] == 14
    if target.name == "PE1":
        assert len(policy_record.raw_policies) == 1


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
    expected_target_count = len(_targets())

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


def test_topology_flow_snapshot_prepares_live_backend_delivery(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    snapshot = build_topology_flow_snapshot()
    expected_target_count = len(_targets())

    assert snapshot.mode == "phase_2_live_inventory"
    assert snapshot.summary.target_count == expected_target_count
    assert snapshot.summary.collection_success_count == expected_target_count
    assert snapshot.summary.collection_failure_count == 0
    assert snapshot.summary.partial_collection_count == 0
    assert snapshot.summary.normalized_node_count == expected_target_count
    assert snapshot.summary.normalized_link_count == expected_target_count // 2
    assert snapshot.summary.single_sided_link_count == 0
    assert snapshot.summary.node_state_counts == {"up": expected_target_count}
    assert snapshot.summary.link_state_counts == {"up": expected_target_count // 2}
    assert snapshot.summary.backend_ready_node_count == expected_target_count
    assert snapshot.summary.backend_ready_link_count == expected_target_count // 2
    assert snapshot.delivery.destination_service == "app-api"
    assert snapshot.delivery.delivery_status == "live_ready"
    assert snapshot.delivery.model_family == "topology"


def test_policy_flow_snapshot_prepares_live_backend_delivery(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    snapshot = build_policy_flow_snapshot()
    expected_target_count = len(_targets())

    assert snapshot.mode == "phase_2_live_inventory"
    assert snapshot.summary.target_count == expected_target_count
    assert snapshot.summary.collection_success_count == expected_target_count
    assert snapshot.summary.collection_failure_count == 0
    assert snapshot.summary.partial_collection_count == 0
    assert snapshot.summary.observed_target_count == expected_target_count
    assert snapshot.summary.policy_capable_target_count == expected_target_count
    assert snapshot.summary.observed_target_role_counts == {
        "cpe": 6,
        "isp": 2,
        "noc": 2,
        "p": 16,
        "pe": 8,
    }
    assert snapshot.summary.observed_policy_count == 2
    assert snapshot.summary.active_policy_count == 1
    assert snapshot.summary.static_local_policy_count == 1
    assert snapshot.summary.static_non_local_policy_count == 1
    assert snapshot.summary.ttm_preference_count == 476
    assert snapshot.summary.normalized_policy_record_count == 2
    assert snapshot.delivery.destination_service == "app-api"
    assert snapshot.delivery.delivery_status == "live_ready"
    assert snapshot.delivery.model_family == "policy_inventory"

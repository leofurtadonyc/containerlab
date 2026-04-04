from pathlib import Path

from fastapi.testclient import TestClient

from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.config.runtime import build_runtime_config
from gnmi_collector.config.settings import get_settings
from gnmi_collector.main import app
from gnmi_collector.mappings.inventory import map_inventory_record
from gnmi_collector.mappings.policy import (
    summarize_policy_detail_source_readiness,
    summarize_policy_target_footprints,
)
from gnmi_collector.models.policy import PolicyRawRecord
from gnmi_collector.services.inventory import build_inventory_flow_snapshot
from gnmi_collector.services.policy import build_policy_flow_snapshot
from gnmi_collector.services.topology import build_topology_flow_snapshot


client = TestClient(app)


def _clear_settings_cache() -> None:
    get_settings.cache_clear()


def _targets():
    return build_runtime_config().targets


def test_runtime_config_defaults_to_repo_local_config_when_env_is_unset(
    monkeypatch,
) -> None:
    monkeypatch.delenv("GNMI_CONFIG_PATH", raising=False)
    _clear_settings_cache()

    config = build_runtime_config()
    expected_path = Path(__file__).resolve().parents[1] / "configs" / "config.example.yaml"

    assert Path(config.config_path).samefile(expected_path)

    _clear_settings_cache()


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
    def __init__(self, *, target, username, password, insecure, gnmi_timeout=None):
        self.target = target
        self.username = username
        self.password = password
        self.insecure = insecure
        self.gnmi_timeout = gnmi_timeout

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def get(self, *, path, encoding):
        del encoding
        host = self.target[0]
        device_name = _target_name_by_host()[host]
        if any("openconfig-lldp:lldp" in item for item in path):
            peer_name = _paired_peer_by_host()[host]
            return {
                "notification": [
                    {
                        "timestamp": 1773094131368820265,
                        "update": [
                            {
                                "path": "openconfig-lldp:lldp",
                                "val": {
                                    "openconfig-lldp:lldp": {
                                        "interfaces": {
                                            "interface": [
                                                {
                                                    "name": f"to-{peer_name}",
                                                    "neighbors": {
                                                        "neighbor": [
                                                            {
                                                                "id": "1",
                                                                "state": {
                                                                    "system-name": peer_name,
                                                                    "chassis-id": peer_name,
                                                                    "port-id": f"to-{device_name}",
                                                                    "port-description": f"to-{device_name}",
                                                                },
                                                            }
                                                        ]
                                                    },
                                                }
                                            ]
                                        }
                                    }
                                },
                            }
                        ],
                    }
                ]
            }
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
                        "nokia-conf:policy-name": "sr-static-PE1-192.0.2.11-100",
                        "nokia-conf:endpoint": "192.0.2.11",
                        "nokia-conf:color": 100,
                        "nokia-conf:head-end": "local",
                        "nokia-conf:binding-sid": 200011,
                        "nokia-conf:distinguisher": 100011011,
                    }
                ]
            elif device_name == "P1":
                static_non_local_policies = 1
                static_policy_payload = [
                    {
                        "nokia-conf:policy-name": "sr-static-P1-198.51.100.1-200",
                        "nokia-conf:endpoint": "198.51.100.1",
                        "nokia-conf:color": 200,
                        "nokia-conf:head-end": "100.64.0.1",
                        "nokia-conf:admin-state": "enable",
                        "nokia-conf:candidate-path": [
                            {
                                "nokia-conf:name": "secondary",
                                "nokia-conf:preference": 150,
                                "nokia-conf:active": False,
                                "nokia-conf:validation-state": "valid",
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
                        "nokia-state:sr-path": (
                            [
                                {
                                    "nokia-state:head-end": "0.0.0.0",
                                    "nokia-state:color": 100,
                                    "nokia-state:endpoint": "192.0.2.11",
                                    "nokia-state:owner": "static",
                                    "nokia-state:preference": 100,
                                    "nokia-state:distinguisher": 100011011,
                                    "nokia-state:active": True,
                                    "nokia-state:is-candidate-path-operational": True,
                                    "nokia-state:binding-sid": 200011,
                                    "nokia-state:path-age": 42,
                                    "nokia-state:sr-path-seg-list": [
                                        {
                                            "segment": [
                                                {"nokia-state:segment-state": "resolved-up"}
                                            ]
                                        }
                                    ],
                                }
                            ]
                            if device_name == "PE1"
                            else []
                        ),
                    },
                }
            ]
            if any("static-policy" in item for item in path):
                static_policy_update = {
                    "path": "configure/router[router-name=Base]/segment-routing/sr-policies/static-policy"
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
                {
                    "timestamp": 1773094131368820265,
                    "update": [{"path": "state/system/oper-name", "val": device_name}],
                },
                {
                    "timestamp": 1773094131368820265,
                    "update": [{"path": "state/system/platform", "val": "7750 SR-1"}],
                },
                {
                    "timestamp": 1773094131368820265,
                    "update": [
                        {
                            "path": "state/system/version",
                            "val": {"nokia-state:version-number": "B-25.10.R2"},
                        }
                    ]
                },
            ]
        }


class FakeSingleSidedTopologyGnmiClient(FakeGnmiClient):
    def get(self, *, path, encoding):
        del encoding
        host = self.target[0]
        device_name = _target_name_by_host()[host]
        if any("router[router-name=Base]/interface" in item for item in path) and device_name == "PE1":
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
                                        "primary": {"oper-address": "10.255.255.31"}
                                    },
                                },
                            }
                        ],
                    }
                ]
            }
        return super().get(path=path, encoding="json_ietf")


class FakeIsolatedNodeTopologyGnmiClient(FakeGnmiClient):
    def get(self, *, path, encoding):
        del encoding
        host = self.target[0]
        device_name = _target_name_by_host()[host]
        if any("openconfig-lldp:lldp" in item for item in path) and device_name in {
            "PE1",
            "PE2",
        }:
            return {
                "notification": [
                    {
                        "timestamp": 1773094131368820265,
                        "update": [
                            {
                                "path": "openconfig-lldp:lldp",
                                "val": {"openconfig-lldp:lldp": {"interfaces": {"interface": []}}},
                            }
                        ],
                    }
                ]
            }
        if any("router[router-name=Base]/interface" in item for item in path) and device_name in {
            "PE1",
            "PE2",
        }:
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
                                            "oper-address": "10.255.255.31"
                                        }
                                    },
                                },
                            }
                        ],
                    }
                ]
            }
        return super().get(path=path, encoding="json_ietf")


class FakeFullyIsolatedNodeTopologyGnmiClient(FakeGnmiClient):
    def get(self, *, path, encoding):
        del encoding
        if any("openconfig-lldp:lldp" in item for item in path):
            return {
                "notification": [
                    {
                        "timestamp": 1773094131368820265,
                        "update": [
                            {
                                "path": "openconfig-lldp:lldp",
                                "val": {"openconfig-lldp:lldp": {"interfaces": {"interface": []}}},
                            }
                        ],
                    }
                ]
            }
        if any("router[router-name=Base]/interface" in item for item in path):
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
                                        "primary": {"oper-address": "10.255.255.31"}
                                    },
                                },
                            }
                        ],
                    }
                ]
            }
        return super().get(path=path, encoding="json_ietf")


class FakeLldpDisabledGnmiClient(FakeGnmiClient):
    def get(self, *, path, encoding):
        if any("openconfig-lldp:lldp" in item for item in path):
            raise RuntimeError(
                "GRPC ERROR Host: 172.20.20.107:57400, Error: MINOR: MGMT_CORE #2201: /lldp - Unknown element - disabled by configuration"
            )
        return super().get(path=path, encoding=encoding)


class FakeNokiaNativeLldpFallbackGnmiClient(FakeGnmiClient):
    def get(self, *, path, encoding):
        del encoding
        host = self.target[0]
        device_name = _target_name_by_host()[host]
        if any("openconfig-lldp:lldp" in item for item in path):
            raise RuntimeError(
                "GRPC ERROR Host: 172.20.20.107:57400, Error: MINOR: MGMT_CORE #2201: /lldp - Unknown element - disabled by configuration"
            )
        if any("/nokia-state:state/port" in item for item in path):
            peer_name = _paired_peer_by_host()[host]
            return {
                "notification": [
                    {
                        "timestamp": 1773094131368820265,
                        "update": [
                            {
                                "path": "state/port[port-id=1/1/c2/1]",
                                "val": {
                                    "nokia-state:port-id": "1/1/c2/1",
                                    "nokia-state:ethernet": {
                                        "nokia-state:lldp": {
                                            "nokia-state:dest-mac": [
                                                {
                                                    "mac-type": "nearest-bridge",
                                                    "remote-system": [
                                                        {
                                                            "system-name": peer_name,
                                                            "chassis-id": peer_name,
                                                            "remote-port-id": f"to-{device_name}",
                                                            "port-description": f"to-{device_name}",
                                                        }
                                                    ],
                                                }
                                            ]
                                        }
                                    },
                                },
                            }
                        ],
                    }
                ]
            }
        return super().get(path=path, encoding="json_ietf")


class FakeDegradedPolicyGnmiClient(FakeGnmiClient):
    def get(self, *, path, encoding):
        del encoding
        response = super().get(path=path, encoding="json_ietf")
        host = self.target[0]
        device_name = _target_name_by_host()[host]
        if device_name != "PE1" or not any("segment-routing/sr-policies" in item for item in path):
            return response
        for notification in response.get("notification", []):
            for update in notification.get("update", []):
                if update.get("path") != "state/router[router-name=Base]/segment-routing/sr-policies":
                    continue
                runtime_paths = update.get("val", {}).get("nokia-state:sr-path", [])
                if not runtime_paths:
                    continue
                runtime_paths[0]["nokia-state:active"] = False
                runtime_paths[0]["nokia-state:is-candidate-path-operational"] = False
                runtime_paths[0]["nokia-state:sr-path-seg-list"] = [
                    {
                        "segment": [
                            {"nokia-state:segment-state": "failed"},
                        ]
                    }
                ]
        return response


class RecordingGnmiClient(FakeGnmiClient):
    last_init_kwargs: dict[str, object] | None = None

    def __init__(self, **kwargs):
        RecordingGnmiClient.last_init_kwargs = dict(kwargs)
        super().__init__(**kwargs)


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
    assert config.topology_subscriptions[1].path == "/openconfig-lldp:lldp"
    assert (
        config.policy_subscriptions[0].path
        == "/nokia-state:state/router[router-name=Base]/segment-routing/sr-policies"
    )
    assert (
        config.policy_subscriptions[1].path
        == "/nokia-conf:configure/router[router-name=Base]/segment-routing/sr-policies/static-policy"
    )
    assert all(target.gnmi_request_timeout_seconds == 2 for target in config.targets)


def test_runtime_config_honors_env_override_for_gnmi_request_timeout(monkeypatch) -> None:
    monkeypatch.setenv("COLLECTOR_GNMI_REQUEST_TIMEOUT_SECONDS", "4")
    _clear_settings_cache()

    config = build_runtime_config()

    assert all(target.gnmi_request_timeout_seconds == 4 for target in config.targets)

    _clear_settings_cache()


def test_nokia_adapter_passes_configured_gnmi_timeout(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", RecordingGnmiClient)
    RecordingGnmiClient.last_init_kwargs = None

    adapter = NokiaSrosAdapter()
    adapter.collect_inventory(_targets()[0])

    assert RecordingGnmiClient.last_init_kwargs is not None
    assert RecordingGnmiClient.last_init_kwargs["gnmi_timeout"] == 2


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
    assert "platform_gnmi_collector_inventory_collection_partial_total 0" in response.text
    assert f"platform_gnmi_collector_inventory_observed_targets {expected_target_count}" in response.text
    assert "platform_gnmi_collector_inventory_oldest_observed_timestamp_seconds " in response.text
    assert "platform_gnmi_collector_inventory_newest_observed_timestamp_seconds " in response.text
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
    assert f"platform_gnmi_collector_topology_observed_targets {expected_target_count}" in response.text
    assert "platform_gnmi_collector_topology_normalized_nodes 34" in response.text
    assert "platform_gnmi_collector_topology_normalized_links 17" in response.text
    assert "platform_gnmi_collector_topology_paired_links 17" in response.text
    assert "platform_gnmi_collector_topology_single_sided_links 0" in response.text
    assert "platform_gnmi_collector_topology_lldp_observations 34" in response.text
    assert "platform_gnmi_collector_topology_lldp_correlated_links 17" in response.text
    assert "platform_gnmi_collector_topology_lldp_single_sided_links 0" in response.text
    assert "platform_gnmi_collector_topology_lldp_bidirectional_links 17" in response.text
    assert "platform_gnmi_collector_topology_lldp_mismatch_links 0" in response.text
    assert "platform_gnmi_collector_topology_linked_nodes 34" in response.text
    assert "platform_gnmi_collector_topology_isolated_nodes 0" in response.text
    assert (
        'platform_gnmi_collector_topology_node_participation_posture{posture="fully_linked"} 1'
        in response.text
    )
    assert "platform_gnmi_collector_topology_oldest_observed_timestamp_seconds " in response.text
    assert "platform_gnmi_collector_topology_newest_observed_timestamp_seconds " in response.text
    assert 'platform_gnmi_collector_topology_nodes_by_state{state="up"} 34' in response.text
    assert 'platform_gnmi_collector_topology_links_by_state{state="up"} 17' in response.text
    assert f"platform_gnmi_collector_policy_targets {expected_target_count}" in response.text
    assert "platform_gnmi_collector_policy_oldest_observed_timestamp_seconds " in response.text
    assert "platform_gnmi_collector_policy_newest_observed_timestamp_seconds " in response.text
    assert f"platform_gnmi_collector_policy_observed_targets {expected_target_count}" in response.text
    assert f"platform_gnmi_collector_policy_capable_targets {expected_target_count}" in response.text
    assert "platform_gnmi_collector_policy_detail_ready_targets 2" in response.text
    assert (
        'platform_gnmi_collector_policy_detail_source_readiness{posture="partially_ready"} 1'
        in response.text
    )
    assert (
        'platform_gnmi_collector_policy_detail_source_targets{reason="no_policies_observed"} 32'
        in response.text
    )
    assert (
        'platform_gnmi_collector_policy_detail_source_targets{reason="detail_unavailable"} 0'
        in response.text
    )
    assert (
        'platform_gnmi_collector_policy_detail_source_targets{reason="partial_detail"} 0'
        in response.text
    )
    assert "platform_gnmi_collector_policy_observed_policies 2" in response.text
    assert "platform_gnmi_collector_metrics_cache_updated_timestamp_seconds" in response.text


def test_inventory_snapshot_endpoint_returns_normalized_live_records(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    expected_target_count = len(_targets())

    response = client.get("/inventory/snapshot")

    assert response.status_code == 200
    payload = response.json()
    assert payload["delivery_mode"] == "backend_http_snapshot"
    assert payload["delivery_status"] == "live_ready"
    assert payload["configured_target_count"] == expected_target_count
    assert payload["observed_target_count"] == expected_target_count
    assert payload["collection_partial_count"] == 0
    assert payload["collection_failure_count"] == 0
    assert payload["degraded_scope_summary"] == "All configured inventory targets returned live normalized inventory records."
    assert payload["record_count"] == expected_target_count
    assert payload["records"][0]["source"] == "gnmi"


def test_topology_snapshot_endpoint_returns_normalized_live_records(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)

    response = client.get("/topology/snapshot")

    assert response.status_code == 200
    payload = response.json()
    assert payload["delivery_mode"] == "backend_http_snapshot"
    assert payload["delivery_status"] == "live_ready"
    assert payload["configured_target_count"] == 34
    assert payload["observed_target_count"] == 34
    assert payload["collection_partial_count"] == 0
    assert payload["collection_failure_count"] == 0
    assert payload["node_count"] == 34
    assert payload["link_count"] == 17
    assert payload["inference_posture"] == "inferred"
    assert payload["collection_posture"] == "ok"
    assert payload["endpoint_pairing_posture"] == "paired"
    assert payload["node_participation_posture"] == "fully_linked"
    assert payload["paired_link_count"] == 17
    assert payload["single_sided_link_count"] == 0
    assert payload["lldp_observation_count"] == 34
    assert payload["lldp_correlated_link_count"] == 17
    assert payload["lldp_bidirectional_link_count"] == 17
    assert payload["lldp_mismatch_link_count"] == 0
    assert payload["linked_node_count"] == 34
    assert payload["isolated_node_count"] == 0
    assert payload["sync_source"] == "gnmi_collector_topology_interface_and_lldp"
    assert payload["completeness"] == "partial"
    assert payload["oldest_observed_at"] is not None
    assert payload["newest_observed_at"] is not None
    assert payload["degraded_scope_summary"] == (
        "All configured topology targets returned live evidence for the current bounded inference path, all emitted inferred links are backed by paired endpoint evidence, and all observed nodes participate in at least one emitted inferred link."
    )
    first_link = payload["links"][0]
    assert first_link["endpoint_pairing_state"] == "paired"
    assert first_link["endpoint_evidence_count"] == 2
    assert first_link["physical_adjacency_posture"] == "bidirectional_lldp"
    assert first_link["lldp_observation_count"] == 2
    assert first_link["attributes"]["endpoint_pairing_state"] == "paired"
    assert first_link["attributes"]["endpoint_evidence_count"] == "2"


def test_topology_snapshot_endpoint_marks_single_sided_coverage_explicit(monkeypatch) -> None:
    monkeypatch.setattr(
        "gnmi_collector.adapters.nokia.sros.gNMIclient",
        FakeSingleSidedTopologyGnmiClient,
    )

    response = client.get("/topology/snapshot")

    assert response.status_code == 200
    payload = response.json()
    assert payload["delivery_status"] == "live_ready"
    assert payload["collection_partial_count"] == 0
    assert payload["node_count"] == 34
    assert payload["link_count"] == 17
    assert payload["inference_posture"] == "inferred"
    assert payload["collection_posture"] == "ok"
    assert payload["endpoint_pairing_posture"] == "partially_paired"
    assert payload["node_participation_posture"] == "fully_linked"
    assert payload["paired_link_count"] == 16
    assert payload["single_sided_link_count"] == 1
    assert payload["lldp_observation_count"] == 34
    assert payload["linked_node_count"] == 34
    assert payload["isolated_node_count"] == 0
    assert payload["degraded_scope_summary"] == (
        "Topology delivery remains bounded because one or more inferred links still rely on single-sided endpoint evidence."
    )
    assert any(
        "Collector endpoint-pairing posture is partially_paired" in note
        for note in payload["notes"]
    )
    single_sided_link = next(
        link for link in payload["links"] if link["endpoint_pairing_state"] == "single_sided"
    )
    assert single_sided_link["link_id"] == "PE1--PE2"
    assert single_sided_link["endpoint_evidence_count"] == 1
    assert single_sided_link["physical_adjacency_posture"] == "bidirectional_lldp"
    assert single_sided_link["attributes"]["endpoint_pairing_state"] == "single_sided"
    assert single_sided_link["attributes"]["endpoint_evidence_count"] == "1"


def test_topology_snapshot_endpoint_marks_isolated_node_coverage_explicit(monkeypatch) -> None:
    monkeypatch.setattr(
        "gnmi_collector.adapters.nokia.sros.gNMIclient",
        FakeIsolatedNodeTopologyGnmiClient,
    )

    response = client.get("/topology/snapshot")

    assert response.status_code == 200
    payload = response.json()
    assert payload["delivery_status"] == "live_ready"
    assert payload["collection_posture"] == "ok"
    assert payload["endpoint_pairing_posture"] == "paired"
    assert payload["node_participation_posture"] == "partially_isolated"
    assert payload["paired_link_count"] == 16
    assert payload["single_sided_link_count"] == 0
    assert payload["lldp_bidirectional_link_count"] == 16
    assert payload["linked_node_count"] == 32
    assert payload["isolated_node_count"] == 2
    assert payload["node_count"] == 34
    assert payload["link_count"] == 16
    assert payload["degraded_scope_summary"] == (
        "Topology delivery remains bounded because one or more observed nodes are not represented by any emitted inferred link."
    )
    assert any(
        "Collector node-participation posture is partially_isolated" in note
        for note in payload["notes"]
    )


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
    assert payload["configured_target_count"] == expected_target_count
    assert payload["observed_target_count"] == expected_target_count
    assert payload["collection_partial_count"] == 0
    assert payload["collection_failure_count"] == 0
    assert payload["policy_capable_target_count"] == expected_target_count
    assert payload["detail_ready_target_count"] == 2
    assert payload["detail_source_readiness"] == {
        "posture": "partially_ready",
        "no_policies_observed_target_count": expected_target_count - 2,
        "detail_unavailable_target_count": 0,
        "partial_detail_target_count": 0,
    }
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
    assert payload["oldest_observed_at"] is not None
    assert payload["newest_observed_at"] is not None
    assert payload["degraded_scope_summary"] == (
        "Policy delivery remains bounded because only a subset of observed targets currently has per-target detail coverage."
    )
    assert len(payload["target_footprints"]) == expected_target_count
    pe1_footprint = next(
        item for item in payload["target_footprints"] if item["target_name"] == "PE1"
    )
    assert pe1_footprint["policy_capable"] is True
    assert pe1_footprint["observed_policy_count"] == 1
    assert pe1_footprint["detail_record_count"] == 1
    assert pe1_footprint["detail_blocker_reason"] == "none"
    cpe_a1_footprint = next(
        item for item in payload["target_footprints"] if item["target_name"] == "CPE-A1"
    )
    assert cpe_a1_footprint["detail_blocker_reason"] == "no_policies_observed"
    assert len(payload["records"]) == 2
    assert payload["records"][0]["policy_type"] == "static_local"
    pe1_record = next(item for item in payload["records"] if item["source_target"] == "PE1")
    assert pe1_record["observed_state"] == "active"
    assert pe1_record["support_state"] == "supported"
    assert pe1_record["health_state"] == "healthy"
    assert pe1_record["candidate_paths"][0]["name"] == "runtime-sr-path"
    assert any("Runtime status was correlated" in note for note in pe1_record["notes"])
    p1_record = next(item for item in payload["records"] if item["source_target"] == "P1")
    assert p1_record["support_state"] == "partially_supported"


def test_policy_snapshot_endpoint_preserves_degraded_runtime_paths_without_failing(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        "gnmi_collector.adapters.nokia.sros.gNMIclient",
        FakeDegradedPolicyGnmiClient,
    )

    response = client.get("/policies/snapshot")

    assert response.status_code == 200
    payload = response.json()
    pe1_record = next(item for item in payload["records"] if item["source_target"] == "PE1")
    assert pe1_record["observed_state"] == "degraded"
    assert pe1_record["support_state"] == "supported"
    assert pe1_record["health_state"] == "down"
    assert pe1_record["candidate_paths"][0]["name"] == "runtime-sr-path"
    assert pe1_record["candidate_paths"][0]["path_state"] == "inactive"
    assert "segment states: failed" in pe1_record["candidate_paths"][0]["notes"]


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
    assert inventory_record.observed_at is not None
    assert inventory_record.raw_data["system_name"] == target.name
    assert topology_record.collection_status == "success"
    assert topology_record.raw_interfaces[0].interface_name == "system"
    assert policy_record.collection_status == "success"
    assert policy_record.sr_policy_counts["ttm-preferences"] == 14
    if target.name == "PE1":
        assert len(policy_record.raw_policies) == 1
        assert len(policy_record.raw_runtime_paths) == 1


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
    assert snapshot.summary.partial_collection_count == 0
    assert snapshot.summary.observed_target_count == expected_target_count
    assert snapshot.summary.normalization_partial_count == 0
    assert snapshot.summary.normalization_failure_count == 0
    assert snapshot.summary.oldest_observed_at is not None
    assert snapshot.summary.newest_observed_at is not None
    assert snapshot.summary.backend_ready_record_count == expected_target_count
    assert snapshot.summary.backend_delivery_error_count == 0
    assert snapshot.delivery.destination_service == "app-api"
    assert snapshot.delivery.delivery_status == "live_ready"
    assert snapshot.delivery.model_family == "inventory"
    assert snapshot.delivery.configured_target_count == expected_target_count
    assert snapshot.delivery.observed_target_count == expected_target_count
    assert snapshot.delivery.degraded_scope_summary == "All configured inventory targets returned live normalized inventory records."


def test_topology_flow_snapshot_prepares_live_backend_delivery(monkeypatch) -> None:
    monkeypatch.setattr("gnmi_collector.adapters.nokia.sros.gNMIclient", FakeGnmiClient)
    snapshot = build_topology_flow_snapshot()
    expected_target_count = len(_targets())

    assert snapshot.mode == "phase_2_live_inventory"
    assert snapshot.summary.target_count == expected_target_count
    assert snapshot.summary.collection_success_count == expected_target_count
    assert snapshot.summary.collection_failure_count == 0
    assert snapshot.summary.partial_collection_count == 0
    assert snapshot.summary.observed_target_count == expected_target_count
    assert snapshot.summary.oldest_observed_at is not None
    assert snapshot.summary.newest_observed_at is not None
    assert snapshot.summary.normalized_node_count == expected_target_count
    assert snapshot.summary.normalized_link_count == expected_target_count // 2
    assert snapshot.summary.inference_posture == "inferred"
    assert snapshot.summary.collection_posture == "ok"
    assert snapshot.summary.endpoint_pairing_posture == "paired"
    assert snapshot.summary.node_participation_posture == "fully_linked"
    assert snapshot.summary.paired_link_count == expected_target_count // 2
    assert snapshot.summary.single_sided_link_count == 0
    assert snapshot.summary.linked_node_count == expected_target_count
    assert snapshot.summary.isolated_node_count == 0
    assert snapshot.summary.node_state_counts == {"up": expected_target_count}
    assert snapshot.summary.link_state_counts == {"up": expected_target_count // 2}
    assert snapshot.summary.backend_ready_node_count == expected_target_count
    assert snapshot.summary.backend_ready_link_count == expected_target_count // 2
    assert snapshot.delivery.destination_service == "app-api"
    assert snapshot.delivery.delivery_status == "live_ready"
    assert snapshot.delivery.model_family == "topology"
    assert snapshot.delivery.configured_target_count == expected_target_count
    assert snapshot.delivery.observed_target_count == expected_target_count
    assert snapshot.delivery.inference_posture == "inferred"
    assert snapshot.delivery.collection_posture == "ok"
    assert snapshot.delivery.endpoint_pairing_posture == "paired"
    assert snapshot.delivery.node_participation_posture == "fully_linked"
    assert snapshot.delivery.paired_link_count == expected_target_count // 2
    assert snapshot.delivery.single_sided_link_count == 0
    assert snapshot.delivery.linked_node_count == expected_target_count
    assert snapshot.delivery.isolated_node_count == 0
    assert snapshot.delivery.degraded_scope_summary == (
        "All configured topology targets returned live evidence for the current bounded inference path, all emitted inferred links are backed by paired endpoint evidence, and all observed nodes participate in at least one emitted inferred link."
    )


def test_topology_flow_snapshot_marks_single_sided_inference_explicit(monkeypatch) -> None:
    monkeypatch.setattr(
        "gnmi_collector.adapters.nokia.sros.gNMIclient",
        FakeSingleSidedTopologyGnmiClient,
    )
    snapshot = build_topology_flow_snapshot()

    assert snapshot.summary.normalized_link_count == 17
    assert snapshot.summary.inference_posture == "inferred"
    assert snapshot.summary.collection_posture == "ok"
    assert snapshot.summary.endpoint_pairing_posture == "partially_paired"
    assert snapshot.summary.node_participation_posture == "fully_linked"
    assert snapshot.summary.paired_link_count == 16
    assert snapshot.summary.single_sided_link_count == 1
    assert snapshot.summary.linked_node_count == 34
    assert snapshot.summary.isolated_node_count == 0
    assert snapshot.delivery.inference_posture == "inferred"
    assert snapshot.delivery.collection_posture == "ok"
    assert snapshot.delivery.endpoint_pairing_posture == "partially_paired"
    assert snapshot.delivery.node_participation_posture == "fully_linked"
    assert snapshot.delivery.paired_link_count == 16
    assert snapshot.delivery.single_sided_link_count == 1
    assert snapshot.delivery.linked_node_count == 34
    assert snapshot.delivery.isolated_node_count == 0
    assert snapshot.delivery.degraded_scope_summary == (
        "Topology delivery remains bounded because one or more inferred links still rely on single-sided endpoint evidence."
    )
    single_sided_link = next(
        link for link in snapshot.delivery.links if link.endpoint_pairing_state == "single_sided"
    )
    assert single_sided_link.link_id == "PE1--PE2"
    assert single_sided_link.endpoint_evidence_count == 1
    assert single_sided_link.attributes["endpoint_pairing_state"] == "single_sided"
    assert any(
        "Collector endpoint-pairing posture is partially_paired" in note
        for note in snapshot.delivery.notes
    )


def test_topology_flow_snapshot_marks_isolated_node_coverage_explicit(monkeypatch) -> None:
    monkeypatch.setattr(
        "gnmi_collector.adapters.nokia.sros.gNMIclient",
        FakeIsolatedNodeTopologyGnmiClient,
    )
    snapshot = build_topology_flow_snapshot()

    assert snapshot.summary.normalized_node_count == 34
    assert snapshot.summary.normalized_link_count == 16
    assert snapshot.summary.inference_posture == "inferred"
    assert snapshot.summary.collection_posture == "ok"
    assert snapshot.summary.endpoint_pairing_posture == "paired"
    assert snapshot.summary.node_participation_posture == "partially_isolated"
    assert snapshot.summary.paired_link_count == 16
    assert snapshot.summary.single_sided_link_count == 0
    assert snapshot.summary.linked_node_count == 32
    assert snapshot.summary.isolated_node_count == 2
    assert snapshot.delivery.node_participation_posture == "partially_isolated"
    assert snapshot.delivery.linked_node_count == 32
    assert snapshot.delivery.isolated_node_count == 2
    assert snapshot.delivery.degraded_scope_summary == (
        "Topology delivery remains bounded because one or more observed nodes are not represented by any emitted inferred link."
    )
    assert any(
        "Collector node-participation posture is partially_isolated" in note
        for note in snapshot.delivery.notes
    )


def test_collect_topology_classifies_disabled_lldp_as_not_exposed(monkeypatch) -> None:
    monkeypatch.setattr(
        "gnmi_collector.adapters.nokia.sros.gNMIclient",
        FakeLldpDisabledGnmiClient,
    )

    target = next(item for item in _targets() if item.name == "PE1")
    record = NokiaSrosAdapter().collect_topology(target)

    assert record.collection_status == "success"
    assert record.lldp_collection_status == "not_exposed"
    assert record.raw_lldp_neighbors == []
    assert any("LLDP path is not exposed on the target" in note for note in record.lldp_notes)


def test_collect_topology_falls_back_to_nokia_native_lldp_when_openconfig_is_not_exposed(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        "gnmi_collector.adapters.nokia.sros.gNMIclient",
        FakeNokiaNativeLldpFallbackGnmiClient,
    )

    target = next(item for item in _targets() if item.name == "PE1")
    record = NokiaSrosAdapter().collect_topology(target)

    assert record.collection_status == "success"
    assert record.lldp_collection_status == "neighbors_visible"
    assert len(record.raw_lldp_neighbors) == 1
    assert record.raw_lldp_neighbors[0].local_interface_name == "1/1/c2/1"
    assert record.raw_lldp_neighbors[0].remote_system_name == "PE2"
    assert record.raw_lldp_neighbors[0].remote_port_id == "to-PE1"
    assert any("Nokia native LLDP fallback returned 1 neighbor row" in note for note in record.lldp_notes)


def test_topology_snapshot_endpoint_uses_nokia_native_lldp_fallback_when_openconfig_is_not_exposed(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        "gnmi_collector.adapters.nokia.sros.gNMIclient",
        FakeNokiaNativeLldpFallbackGnmiClient,
    )

    response = client.get("/topology/snapshot")

    assert response.status_code == 200
    payload = response.json()
    assert payload["delivery_status"] == "live_ready"
    assert payload["lldp_observation_count"] == 34
    assert payload["lldp_correlated_link_count"] == 17
    assert payload["lldp_bidirectional_link_count"] == 17
    assert payload["lldp_mismatch_link_count"] == 0
    assert all(link["physical_adjacency_posture"] == "bidirectional_lldp" for link in payload["links"])
    assert any("Nokia native LLDP fallback" in note for note in payload["notes"])


def test_metrics_endpoint_surfaces_single_sided_topology_coverage_metrics(monkeypatch) -> None:
    monkeypatch.setattr(
        "gnmi_collector.adapters.nokia.sros.gNMIclient",
        FakeSingleSidedTopologyGnmiClient,
    )
    client.get("/topology/snapshot")

    response = client.get("/metrics")

    assert response.status_code == 200
    assert "platform_gnmi_collector_topology_normalized_links 17" in response.text
    assert "platform_gnmi_collector_topology_paired_links 16" in response.text
    assert "platform_gnmi_collector_topology_single_sided_links 1" in response.text
    assert "platform_gnmi_collector_topology_linked_nodes 34" in response.text
    assert "platform_gnmi_collector_topology_isolated_nodes 0" in response.text
    assert (
        'platform_gnmi_collector_topology_node_participation_posture{posture="fully_linked"} 1'
        in response.text
    )


def test_metrics_endpoint_surfaces_isolated_node_topology_coverage_metrics(monkeypatch) -> None:
    monkeypatch.setattr(
        "gnmi_collector.adapters.nokia.sros.gNMIclient",
        FakeIsolatedNodeTopologyGnmiClient,
    )
    client.get("/topology/snapshot")

    response = client.get("/metrics")

    assert response.status_code == 200
    assert "platform_gnmi_collector_topology_normalized_links 16" in response.text
    assert "platform_gnmi_collector_topology_paired_links 16" in response.text
    assert "platform_gnmi_collector_topology_single_sided_links 0" in response.text
    assert "platform_gnmi_collector_topology_linked_nodes 32" in response.text
    assert "platform_gnmi_collector_topology_isolated_nodes 2" in response.text
    assert (
        'platform_gnmi_collector_topology_node_participation_posture{posture="partially_isolated"} 1'
        in response.text
    )


def test_metrics_endpoint_surfaces_fully_isolated_node_topology_coverage_metrics(monkeypatch) -> None:
    monkeypatch.setattr(
        "gnmi_collector.adapters.nokia.sros.gNMIclient",
        FakeFullyIsolatedNodeTopologyGnmiClient,
    )
    client.get("/topology/snapshot")

    response = client.get("/metrics")

    assert response.status_code == 200
    assert "platform_gnmi_collector_topology_normalized_links 0" in response.text
    assert "platform_gnmi_collector_topology_paired_links 0" in response.text
    assert "platform_gnmi_collector_topology_single_sided_links 0" in response.text
    assert "platform_gnmi_collector_topology_linked_nodes 0" in response.text
    assert f"platform_gnmi_collector_topology_isolated_nodes {len(_targets())}" in response.text
    assert (
        'platform_gnmi_collector_topology_node_participation_posture{posture="isolated_only"} 1'
        in response.text
    )


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
    assert snapshot.summary.detail_ready_target_count == 2
    assert snapshot.summary.detail_source_readiness.posture == "partially_ready"
    assert snapshot.summary.detail_source_readiness.no_policies_observed_target_count == (
        expected_target_count - 2
    )
    assert snapshot.summary.oldest_observed_at is not None
    assert snapshot.summary.newest_observed_at is not None
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
    assert snapshot.delivery.configured_target_count == expected_target_count
    assert snapshot.delivery.detail_ready_target_count == 2
    assert snapshot.delivery.detail_source_readiness.posture == "partially_ready"
    assert snapshot.delivery.degraded_scope_summary == (
        "Policy delivery remains bounded because only a subset of observed targets currently has per-target detail coverage."
    )
    assert len(snapshot.delivery.target_footprints) == expected_target_count
    pe1_footprint = next(
        item for item in snapshot.delivery.target_footprints if item.target_name == "PE1"
    )
    assert pe1_footprint.policy_capable is True
    assert pe1_footprint.observed_policy_count == 1
    assert pe1_footprint.detail_record_count == 1
    assert pe1_footprint.detail_blocker_reason == "none"


def test_policy_target_footprints_expose_detail_blocker_reasons() -> None:
    raw_records = [
        PolicyRawRecord(
            target_name="PE1",
            vendor="nokia",
            platform_hint="sros",
            role="pe",
            management_address="172.20.20.107",
            collection_status="success",
            sr_policy_counts={
                "bgp-policies": 1,
                "active-bgp-policies": 1,
                "ttm-preferences": 14,
                "binding-sids-allocated": 0,
                "srv6-binding-sids-allocated": 0,
                "static-local-policies": 0,
                "static-non-local-policies": 0,
            },
            raw_policies=[],
        )
    ]

    footprints = summarize_policy_target_footprints(raw_records, normalized_records=[])
    detail_source_readiness = summarize_policy_detail_source_readiness(footprints)

    assert len(footprints) == 1
    assert footprints[0].observed_policy_count == 1
    assert footprints[0].detail_record_count == 0
    assert footprints[0].detail_blocker_reason == "per_policy_details_unavailable"
    assert detail_source_readiness.posture == "source_detail_unavailable"
    assert detail_source_readiness.no_policies_observed_target_count == 0
    assert detail_source_readiness.detail_unavailable_target_count == 1
    assert detail_source_readiness.partial_detail_target_count == 0

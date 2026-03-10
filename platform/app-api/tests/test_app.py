from datetime import datetime

from fastapi.testclient import TestClient

from app_api.integrations.collector.inventory import (
    CollectorInventoryRecord,
    CollectorInventorySnapshot,
)
from app_api.integrations.odl import OdlControllerObservation
from app_api.integrations.collector.policies import CollectorPolicySnapshot
from app_api.integrations.collector.topology import (
    CollectorTopologyLinkRecord,
    CollectorTopologyNodeRecord,
    CollectorTopologySnapshot,
)
from app_api.main import app
from app_api.models.inventory import InventoryDevice
from app_api.metrics.state import reset_metrics_registry
from app_api.models.policy import PolicyInventorySnapshot
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot
from app_api.persistence.history import (
    PersistedPolicySnapshotComparison,
    PersistedPolicySnapshotSummary as PersistedPolicyHistorySummary,
    PersistedSyncRun,
    SyncRunHistorySummary,
)
from app_api.persistence.read_side import (
    PersistedInventorySnapshot,
    PersistedPolicySnapshot,
    PersistedPolicySnapshotSummary,
    PersistedTopologySnapshot,
)


client = TestClient(app)


def _disable_read_side_persistence(monkeypatch) -> None:
    monkeypatch.setattr(
        "app_api.services.devices.persist_inventory_snapshot",
        lambda **kwargs: None,
    )
    monkeypatch.setattr(
        "app_api.services.devices.load_latest_inventory_snapshot",
        lambda: None,
    )
    monkeypatch.setattr(
        "app_api.services.topology.persist_topology_snapshot",
        lambda **kwargs: None,
    )
    monkeypatch.setattr(
        "app_api.services.topology.load_latest_topology_snapshot",
        lambda: None,
    )
    monkeypatch.setattr(
        "app_api.services.policies.persist_policy_snapshot",
        lambda **kwargs: None,
    )
    monkeypatch.setattr(
        "app_api.services.policies.load_latest_policy_snapshot",
        lambda: None,
    )
    monkeypatch.setattr(
        "app_api.services.policies.load_previous_policy_snapshot",
        lambda: None,
    )
    monkeypatch.setattr(
        "app_api.services.policies.load_recent_policy_snapshot_summaries",
        lambda limit=3: [],
    )


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


def _build_live_topology_snapshot() -> CollectorTopologySnapshot:
    return CollectorTopologySnapshot(
        integration="gnmi_collector_topology",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804/topology/snapshot",
        topology_id="platform-observed-topology",
        topology_name="Platform Observed Topology",
        sync_source="gnmi_collector_topology_interface_inference",
        sync_status="ok",
        completeness="partial",
        observed_at="2026-03-09T19:25:08.500000+00:00",
        notes=[
            "Topology links are inferred from live router interface names and current interface operational state.",
            "The topology slice remains intentionally partial until LLDP, IGP, or bounded controller enrichment is added.",
        ],
        nodes=[
            CollectorTopologyNodeRecord(
                node_id="PE1",
                display_name="PE1",
                role="pe",
                state="up",
                source="gnmi",
                device_id="PE1",
                attributes={
                    "vendor": "nokia",
                    "platform_hint": "sros",
                    "management_address": "172.20.20.107",
                    "loopback_ipv4": "100.65.255.11",
                },
            ),
            CollectorTopologyNodeRecord(
                node_id="P1",
                display_name="P1",
                role="p",
                state="up",
                source="gnmi",
                device_id="P1",
                attributes={
                    "vendor": "nokia",
                    "platform_hint": "sros",
                    "management_address": "172.20.20.109",
                    "loopback_ipv4": "100.65.255.1",
                },
            ),
        ],
        links=[
            CollectorTopologyLinkRecord(
                link_id="P1--PE1",
                source_node_id="P1",
                target_node_id="PE1",
                state="up",
                source="gnmi",
                attributes={
                    "knowledge_state": "partial",
                    "inference_method": "interface_name_and_oper_state",
                    "endpoint_evidence_count": "2",
                    "observed_interfaces": "PE1:to-P1, P1:to-PE1",
                },
            )
        ],
        fetch_error=None,
    )


def _build_live_policy_snapshot() -> CollectorPolicySnapshot:
    return CollectorPolicySnapshot(
        integration="gnmi_collector_policy",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804/policies/snapshot",
        sync_source="gnmi_collector_policy_sr_counters",
        sync_status="ok",
        completeness="partial",
        detail_mode="static_policies_when_present",
        observed_at="2026-03-09T19:25:08.500000+00:00",
        observed_target_count=34,
        policy_capable_target_count=34,
        observed_target_role_counts={"cpe": 6, "isp": 2, "noc": 2, "p": 16, "pe": 8},
        policy_capable_target_role_counts={"cpe": 6, "isp": 2, "noc": 2, "p": 16, "pe": 8},
        policy_count=2,
        active_policy_count=1,
        static_policy_count=2,
        static_local_policy_count=1,
        static_non_local_policy_count=1,
        bgp_policy_count=0,
        ttm_preference_count=476,
        binding_sid_count=0,
        srv6_binding_sid_count=0,
        notes=[
            "Policy inventory is currently bounded to live Nokia SR policy counters collected over gNMI.",
            "When static-policy state is exposed, the collector now derives bounded per-policy observations without claiming full SR policy truth.",
        ],
        records=[
            {
                "policy_id": "PE1:static_local:192.0.2.11:100",
                "policy_name": "sr-static-PE1-192.0.2.11-100",
                "policy_type": "static_local",
                "headend": "PE1",
                "endpoint": "192.0.2.11",
                "color": 100,
                "source_target": "PE1",
                "source_target_role": "pe",
                "candidate_paths": [
                    {
                        "name": "primary",
                        "path_state": "active",
                        "preference": 200,
                        "notes": ["protocol origin: static", "validation state: valid"],
                    }
                ],
                "intent_state": "declared",
                "observed_state": "active",
                "support_state": "partially_supported",
                "health_state": "healthy",
                "source": "gnmi",
                "notes": [
                    "Observed from Nokia static-policy state on PE1 over gNMI.",
                    "This remains a bounded static-policy read slice rather than full SR policy truth.",
                ],
            },
            {
                "policy_id": "P1:static_non_local:198.51.100.1:200",
                "policy_name": "sr-static-P1-198.51.100.1-200",
                "policy_type": "static_non_local",
                "headend": "100.64.0.1",
                "endpoint": "198.51.100.1",
                "color": 200,
                "source_target": "P1",
                "source_target_role": "p",
                "candidate_paths": [
                    {
                        "name": "secondary",
                        "path_state": "inactive",
                        "preference": 150,
                        "notes": ["validation state: valid"],
                    }
                ],
                "intent_state": "declared",
                "observed_state": "inactive",
                "support_state": "partially_supported",
                "health_state": "degraded",
                "source": "gnmi",
                "notes": [
                    "Observed from Nokia static-policy state on P1 over gNMI.",
                    "This remains a bounded static-policy read slice rather than full SR policy truth.",
                ],
            },
        ],
        fetch_error=None,
    )


def _build_live_empty_policy_snapshot() -> CollectorPolicySnapshot:
    return CollectorPolicySnapshot(
        integration="gnmi_collector_policy",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804/policies/snapshot",
        sync_source="gnmi_collector_policy_sr_counters",
        sync_status="ok",
        completeness="partial",
        detail_mode="counters_only",
        observed_at="2026-03-09T19:25:08.500000+00:00",
        observed_target_count=34,
        policy_capable_target_count=34,
        observed_target_role_counts={"cpe": 6, "isp": 2, "noc": 2, "p": 16, "pe": 8},
        policy_capable_target_role_counts={"cpe": 6, "isp": 2, "noc": 2, "p": 16, "pe": 8},
        policy_count=0,
        active_policy_count=0,
        static_policy_count=0,
        static_local_policy_count=0,
        static_non_local_policy_count=0,
        bgp_policy_count=0,
        ttm_preference_count=476,
        binding_sid_count=0,
        srv6_binding_sid_count=0,
        notes=[
            "Policy inventory is currently bounded to live Nokia SR policy counters collected over gNMI.",
            "No SR policies are currently observed across the configured Nokia targets.",
        ],
        records=[],
        fetch_error=None,
    )


def _build_persisted_inventory_snapshot() -> PersistedInventorySnapshot:
    return PersistedInventorySnapshot(
        persisted_at=datetime.fromisoformat("2026-03-10T00:00:00+00:00"),
        devices=[
            InventoryDevice(
                device_id="PE1",
                vendor="nokia",
                platform="7750 SR-1",
                software_version="B-25.10.R2",
                role="pe",
                management_address="172.20.20.107",
                collector_status="ok",
                capability_summary="partially_supported",
            )
        ],
    )


def _build_persisted_topology_snapshot() -> PersistedTopologySnapshot:
    return PersistedTopologySnapshot(
        persisted_at=datetime.fromisoformat("2026-03-10T00:00:00+00:00"),
        snapshot=TopologySnapshot(
            topology_id="platform-observed-topology",
            topology_name="Platform Observed Topology",
            nodes=[
                TopologyNode(
                    node_id="PE1",
                    display_name="PE1",
                    role="pe",
                    state="up",
                    source="gnmi",
                    device_id="PE1",
                    attributes={"vendor": "nokia"},
                )
            ],
            links=[
                TopologyLink(
                    link_id="PE1--P1",
                    source_node_id="PE1",
                    target_node_id="P1",
                    state="degraded",
                    source="gnmi",
                    attributes={"knowledge_state": "partial"},
                )
            ],
            sync_source="persisted_topology_snapshot",
            sync_status="degraded",
            completeness="partial",
            observed_at=datetime.fromisoformat("2026-03-10T00:00:00+00:00"),
            notes=["Served from the latest persisted topology snapshot."],
        ),
    )


def _build_persisted_policy_snapshot() -> PersistedPolicySnapshot:
    return PersistedPolicySnapshot(
        persisted_at=datetime.fromisoformat("2026-03-10T00:00:00+00:00"),
        snapshot=PolicyInventorySnapshot(
            sync_source="persisted_policy_snapshot",
            sync_status="degraded",
            completeness="partial",
            detail_mode="static_policies_when_present",
            empty_reason="none",
            observed_at=datetime.fromisoformat("2026-03-10T00:00:00+00:00"),
            observed_target_count=2,
            policy_capable_target_count=2,
            observed_target_role_counts={"p": 1, "pe": 1},
            policy_capable_target_role_counts={"p": 1, "pe": 1},
            observed_policy_count=1,
            active_policy_count=1,
            static_policy_count=1,
            static_local_policy_count=1,
            static_non_local_policy_count=0,
            bgp_policy_count=0,
            ttm_preference_count=28,
            binding_sid_count=0,
            srv6_binding_sid_count=0,
            notes=["Served from the latest persisted policy snapshot."],
            records=[
                {
                    "policy_id": "persisted-policy-1",
                    "policy_name": "persisted-static-policy",
                    "policy_type": "static_local",
                    "headend": "PE1",
                    "endpoint": "192.0.2.11",
                    "color": 100,
                    "source_target": "PE1",
                    "source_target_role": "pe",
                    "candidate_paths": [
                        {
                            "name": "primary",
                            "path_state": "active",
                            "preference": 200,
                            "notes": ["persisted candidate path"],
                        }
                    ],
                    "intent_state": "declared",
                    "observed_state": "active",
                    "support_state": "partially_supported",
                    "health_state": "healthy",
                    "source": "gnmi",
                    "notes": ["Persisted from the bounded policy read path."],
                }
            ],
        ),
    )


def _build_previous_persisted_policy_snapshot() -> PersistedPolicySnapshot:
    return PersistedPolicySnapshot(
        persisted_at=datetime.fromisoformat("2026-03-09T23:30:00+00:00"),
        snapshot=PolicyInventorySnapshot(
            sync_source="persisted_policy_snapshot",
            sync_status="ok",
            completeness="partial",
            detail_mode="static_policies_when_present",
            empty_reason="none",
            observed_at=datetime.fromisoformat("2026-03-09T23:29:00+00:00"),
            observed_target_count=2,
            policy_capable_target_count=2,
            observed_target_role_counts={"p": 1, "pe": 1},
            policy_capable_target_role_counts={"p": 1, "pe": 1},
            observed_policy_count=2,
            active_policy_count=1,
            static_policy_count=2,
            static_local_policy_count=1,
            static_non_local_policy_count=1,
            bgp_policy_count=0,
            ttm_preference_count=28,
            binding_sid_count=0,
            srv6_binding_sid_count=0,
            notes=["Served from the previous persisted policy snapshot."],
            records=[
                {
                    "policy_id": "persisted-policy-1",
                    "policy_name": "persisted-static-policy",
                    "policy_type": "static_local",
                    "headend": "PE1",
                    "endpoint": "192.0.2.11",
                    "color": 100,
                    "source_target": "PE1",
                    "source_target_role": "pe",
                    "candidate_paths": [
                        {
                            "name": "primary",
                            "path_state": "inactive",
                            "preference": 200,
                            "notes": ["persisted candidate path"],
                        }
                    ],
                    "intent_state": "declared",
                    "observed_state": "inactive",
                    "support_state": "partially_supported",
                    "health_state": "degraded",
                    "source": "gnmi",
                    "notes": ["Persisted from the previous bounded policy read path."],
                },
                {
                    "policy_id": "persisted-policy-2",
                    "policy_name": "persisted-static-policy-removed",
                    "policy_type": "static_non_local",
                    "headend": "P1",
                    "endpoint": "198.51.100.1",
                    "color": 200,
                    "source_target": "P1",
                    "source_target_role": "p",
                    "candidate_paths": [],
                    "intent_state": "declared",
                    "observed_state": "inactive",
                    "support_state": "partially_supported",
                    "health_state": "degraded",
                    "source": "gnmi",
                    "notes": ["Persisted from the previous bounded policy read path."],
                },
            ],
        ),
    )


def _build_recent_policy_snapshot_summaries() -> list[PersistedPolicySnapshotSummary]:
    return [
        PersistedPolicySnapshotSummary(
            persisted_at=datetime.fromisoformat("2026-03-10T00:00:00+00:00"),
            snapshot={
                "persisted_at": datetime.fromisoformat("2026-03-10T00:00:00+00:00"),
                "observed_at": datetime.fromisoformat("2026-03-10T00:00:00+00:00"),
                "data_status": "degraded",
                "sync_source": "persisted_policy_snapshot",
                "sync_status": "degraded",
                "completeness": "partial",
                "detail_mode": "static_policies_when_present",
                "empty_reason": "none",
                "observed_policy_count": 1,
                "active_policy_count": 1,
                "detail_record_count": 1,
            },
        ),
        PersistedPolicySnapshotSummary(
            persisted_at=datetime.fromisoformat("2026-03-09T23:30:00+00:00"),
            snapshot={
                "persisted_at": datetime.fromisoformat("2026-03-09T23:30:00+00:00"),
                "observed_at": datetime.fromisoformat("2026-03-09T23:29:00+00:00"),
                "data_status": "live",
                "sync_source": "persisted_policy_snapshot",
                "sync_status": "ok",
                "completeness": "partial",
                "detail_mode": "static_policies_when_present",
                "empty_reason": "none",
                "observed_policy_count": 2,
                "active_policy_count": 1,
                "detail_record_count": 2,
            },
        ),
        PersistedPolicySnapshotSummary(
            persisted_at=datetime.fromisoformat("2026-03-09T23:00:00+00:00"),
            snapshot={
                "persisted_at": datetime.fromisoformat("2026-03-09T23:00:00+00:00"),
                "observed_at": datetime.fromisoformat("2026-03-09T22:59:00+00:00"),
                "data_status": "live",
                "sync_source": "persisted_policy_snapshot",
                "sync_status": "ok",
                "completeness": "partial",
                "detail_mode": "counters_only",
                "empty_reason": "per_policy_details_unavailable",
                "observed_policy_count": 2,
                "active_policy_count": 0,
                "detail_record_count": 0,
            },
        ),
    ]


def _build_persisted_sync_runs() -> list[PersistedSyncRun]:
    return [
        PersistedSyncRun(
            sync_run_id="sync-policy-1",
            model_family="policy",
            source_type="gnmi_collector_policy",
            source_endpoint="http://gnmi-collector:9804/policies/snapshot",
            fetch_status="live_normalized_feed",
            record_count=1,
            observed_at=datetime.fromisoformat("2026-03-10T01:30:00+00:00"),
            started_at=datetime.fromisoformat("2026-03-10T01:30:00+00:00"),
            finished_at=datetime.fromisoformat("2026-03-10T01:30:04+00:00"),
            persisted_artifacts=["policy_snapshot"],
            policy_snapshot_summary=PersistedPolicyHistorySummary(
                persisted_at=datetime.fromisoformat("2026-03-10T01:30:04+00:00"),
                observed_at=datetime.fromisoformat("2026-03-10T01:30:00+00:00"),
                sync_source="persisted_policy_snapshot",
                sync_status="ok",
                completeness="partial",
                detail_mode="static_policies_when_present",
                empty_reason="none",
                observed_policy_count=1,
                active_policy_count=1,
                detail_record_count=1,
            ),
            policy_comparison_to_previous=PersistedPolicySnapshotComparison(
                current_persisted_at=datetime.fromisoformat("2026-03-10T01:30:04+00:00"),
                previous_persisted_at=datetime.fromisoformat("2026-03-10T01:00:00+00:00"),
                current_observed_policy_count=1,
                previous_observed_policy_count=2,
                current_detail_record_count=1,
                previous_detail_record_count=2,
                observed_policy_delta=-1,
                detail_record_delta=-1,
                added_policy_count=0,
                removed_policy_count=1,
                changed_policy_count=1,
                notes=[
                    "Comparison evidence remains bounded to persisted normalized policy snapshots."
                ],
            ),
            notes=["Policy sync completed from the bounded live path."],
        ),
        PersistedSyncRun(
            sync_run_id="sync-topology-1",
            model_family="topology",
            source_type="gnmi_collector_topology",
            source_endpoint="http://gnmi-collector:9804/topology/snapshot",
            fetch_status="partial_live_feed",
            record_count=3,
            observed_at=datetime.fromisoformat("2026-03-10T01:00:00+00:00"),
            started_at=datetime.fromisoformat("2026-03-10T01:00:00+00:00"),
            finished_at=datetime.fromisoformat("2026-03-10T01:00:03+00:00"),
            persisted_artifacts=["topology_snapshot"],
            notes=["Topology sync remained intentionally partial."],
        ),
        PersistedSyncRun(
            sync_run_id="sync-inventory-1",
            model_family="inventory",
            source_type="gnmi_collector_inventory",
            source_endpoint="http://gnmi-collector:9804/inventory/snapshot",
            fetch_status="live_normalized_feed",
            record_count=34,
            observed_at=None,
            started_at=datetime.fromisoformat("2026-03-10T00:30:00+00:00"),
            finished_at=datetime.fromisoformat("2026-03-10T00:30:02+00:00"),
            persisted_artifacts=["inventory_snapshot"],
            notes=["Inventory sync completed from the bounded live path."],
        ),
    ]


def _build_sync_run_history_summary() -> SyncRunHistorySummary:
    return SyncRunHistorySummary(
        total_count=3,
        counts_by_model_family={"inventory": 1, "topology": 1, "policy": 1},
        counts_by_result={"completed": 2, "partial": 1},
        counts_by_model_family_and_result={
            "inventory": {"completed": 1},
            "policy": {"completed": 1},
            "topology": {"partial": 1},
        },
        latest_finished_at_by_model_family={
            "inventory": datetime.fromisoformat("2026-03-10T00:30:02+00:00"),
            "policy": datetime.fromisoformat("2026-03-10T01:30:04+00:00"),
            "topology": datetime.fromisoformat("2026-03-10T01:00:03+00:00"),
        },
    )


def test_health_endpoint_returns_typed_payload() -> None:
    response = client.get("/api/v1/health", headers={"X-Request-ID": "health-test"})

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "health-test"
    assert payload["status"] == "ok"
    assert payload["service"] == "app-api"
    assert payload["version"] == "0.1.0"
    assert payload["phase"] == "phase_2_read_only_foundation"
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_platform_status_endpoint_returns_bounded_odl_observation(monkeypatch) -> None:
    class StubOdlClient:
        def read_controller_observation(self) -> OdlControllerObservation:
            return OdlControllerObservation(
                observation_state="ok",
                observed_source="odl_restconf_capability_probe",
                observation_summary=(
                    "ODL RESTCONF is reachable and contributes one bounded "
                    "controller capability probe."
                ),
                observed_capabilities=["restconf", "yang_library", "netconf_operations"],
                notes=[
                    "Observed 35 YANG modules and 55 RESTCONF operations from the running controller.",
                    "No bounded controller-side evidence was observed yet for controller topology models, bgp helpers, bmp helpers, pcep helpers.",
                ],
            )

    monkeypatch.setattr(
        "app_api.services.platform.get_odl_client",
        lambda: StubOdlClient(),
    )
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
    assert "bounded ODL RESTCONF capability probe" in payload["summary"]
    assert len(payload["components"]) == 7
    assert payload["components"][0]["name"] == "app-api"
    assert payload["components"][0]["lifecycle_state"] == "declared"
    assert payload["components"][0]["observation_state"] == "not_checked"
    odl_component = payload["components"][-1]
    assert odl_component["name"] == "odl"
    assert odl_component["observation_state"] == "ok"
    assert odl_component["observation_source"] == "odl_restconf_capability_probe"
    assert "bounded controller capability probe" in odl_component["observation_summary"]
    assert odl_component["observed_capabilities"] == [
        "restconf",
        "yang_library",
        "netconf_operations",
    ]
    assert len(odl_component["notes"]) == 2
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_devices_endpoint_returns_live_inventory(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

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
    assert "useful read-only data" in payload["items"][0]["capability_detail"]
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_topology_endpoint_returns_live_normalized_topology(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self) -> CollectorTopologySnapshot:
            return _build_live_topology_snapshot()

    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )
    response = client.get("/api/v1/topology", headers={"X-Request-ID": "topology-test"})

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "topology-test"
    assert payload["data_status"] == "live"
    assert payload["topology"]["topology_id"] == "platform-observed-topology"
    assert payload["topology"]["topology_name"] == "Platform Observed Topology"
    assert payload["topology"]["sync_source"] == "gnmi_collector_topology_interface_inference"
    assert payload["topology"]["sync_status"] == "ok"
    assert payload["topology"]["completeness"] == "partial"
    assert len(payload["topology"]["nodes"]) == 2
    assert len(payload["topology"]["links"]) == 1
    assert payload["topology"]["nodes"][0]["display_name"] == "PE1"
    assert payload["topology"]["nodes"][0]["state"] == "up"
    assert payload["topology"]["nodes"][0]["source"] == "gnmi"
    assert payload["topology"]["nodes"][0]["attributes"]["vendor"] == "nokia"
    assert payload["topology"]["links"][0]["state"] == "up"
    assert payload["topology"]["links"][0]["source"] == "gnmi"
    assert payload["topology"]["links"][0]["attributes"]["knowledge_state"] == "partial"
    assert "bounded interface-based link inference" in payload["summary"]
    assert "Topology links are inferred from live router interface names" in payload["topology"]["notes"][0]
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_devices_endpoint_falls_back_to_persisted_inventory(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorInventoryClient:
        def read_inventory_snapshot(self) -> CollectorInventorySnapshot:
            return CollectorInventorySnapshot(
                integration="gnmi_collector_inventory",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint="http://gnmi-collector:9804/inventory/snapshot",
                records=[],
                fetch_error="collector down",
            )

    monkeypatch.setattr(
        "app_api.services.devices.get_collector_inventory_client",
        lambda: StubCollectorInventoryClient(),
    )
    monkeypatch.setattr(
        "app_api.services.devices.load_latest_inventory_snapshot",
        _build_persisted_inventory_snapshot,
    )

    response = client.get("/api/v1/devices")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data_status"] == "degraded"
    assert payload["count"] == 1
    assert "latest persisted normalized inventory snapshot" in payload["summary"]
    assert payload["items"][0]["device_id"] == "PE1"


def test_topology_endpoint_falls_back_to_persisted_snapshot(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self) -> CollectorTopologySnapshot:
            return CollectorTopologySnapshot(
                integration="gnmi_collector_topology",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint="http://gnmi-collector:9804/topology/snapshot",
                topology_id="platform-observed-topology",
                topology_name="Platform Observed Topology",
                sync_source="gnmi_collector_topology",
                sync_status="failed",
                completeness="unknown",
                notes=[],
                nodes=[],
                links=[],
                fetch_error="collector down",
            )

    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.topology.load_latest_topology_snapshot",
        _build_persisted_topology_snapshot,
    )

    response = client.get("/api/v1/topology")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data_status"] == "degraded"
    assert payload["topology"]["sync_source"] == "persisted_topology_snapshot"
    assert len(payload["topology"]["nodes"]) == 1
    assert len(payload["topology"]["links"]) == 1
    assert "latest persisted normalized topology snapshot" in payload["summary"]


def test_policies_endpoint_returns_live_policy_inventory(monkeypatch) -> None:
    class StubCollectorPolicyClient:
        def read_policy_snapshot(self) -> CollectorPolicySnapshot:
            return _build_live_policy_snapshot()

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr("app_api.services.policies.persist_policy_snapshot", lambda **kwargs: None)
    monkeypatch.setattr(
        "app_api.services.policies.load_recent_policy_snapshot_summaries",
        lambda limit=3: _build_recent_policy_snapshot_summaries()[:limit],
    )
    monkeypatch.setattr(
        "app_api.services.policies.load_latest_policy_snapshot",
        _build_persisted_policy_snapshot,
    )
    monkeypatch.setattr(
        "app_api.services.policies.load_previous_policy_snapshot",
        _build_previous_persisted_policy_snapshot,
    )
    response = client.get("/api/v1/policies", headers={"X-Request-ID": "policies-test"})

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "policies-test"
    assert payload["data_status"] == "live"
    assert payload["count"] == 2
    assert payload["sync_source"] == "gnmi_collector_policy_sr_counters"
    assert payload["sync_status"] == "ok"
    assert payload["completeness"] == "partial"
    assert payload["detail_mode"] == "static_policies_when_present"
    assert payload["empty_reason"] == "none"
    assert payload["observed_target_count"] == 34
    assert payload["policy_capable_target_count"] == 34
    assert payload["observed_target_role_counts"] == {
        "cpe": 6,
        "isp": 2,
        "noc": 2,
        "p": 16,
        "pe": 8,
    }
    assert payload["policy_capable_target_role_counts"] == {
        "cpe": 6,
        "isp": 2,
        "noc": 2,
        "p": 16,
        "pe": 8,
    }
    assert payload["observed_policy_count"] == 2
    assert payload["static_local_policy_count"] == 1
    assert payload["static_non_local_policy_count"] == 1
    assert payload["ttm_preference_count"] == 476
    assert payload["history"]["status"] == "comparison_ready"
    assert len(payload["history"]["recent_snapshots"]) == 3
    assert payload["history"]["comparison_to_previous"]["observed_policy_delta"] == -1
    assert payload["history"]["comparison_to_previous"]["detail_record_delta"] == -1
    assert payload["history"]["comparison_to_previous"]["added_policy_count"] == 0
    assert payload["history"]["comparison_to_previous"]["removed_policy_count"] == 1
    assert payload["history"]["comparison_to_previous"]["changed_policy_count"] == 1
    assert "bounded static-policy observations" in payload["summary"]
    assert payload["items"][0]["policy_type"] == "static_local"
    assert payload["items"][0]["source_target"] == "PE1"
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_policies_endpoint_keeps_live_empty_state_explicit(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self) -> CollectorPolicySnapshot:
            return _build_live_empty_policy_snapshot()

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    response = client.get("/api/v1/policies")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data_status"] == "live"
    assert payload["count"] == 0
    assert payload["observed_policy_count"] == 0
    assert payload["empty_reason"] == "no_policies_observed"
    assert payload["ttm_preference_count"] == 476
    assert payload["observed_target_role_counts"]["p"] == 16
    assert payload["history"]["status"] == "unavailable"
    assert "stable counter footprint and target-role coverage" in payload["summary"]


def test_policies_endpoint_falls_back_to_persisted_policy_snapshot(monkeypatch) -> None:
    class StubCollectorPolicyClient:
        def read_policy_snapshot(self) -> CollectorPolicySnapshot:
            return CollectorPolicySnapshot(
                integration="gnmi_collector_policy",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint="http://gnmi-collector:9804/policies/snapshot",
                sync_source="gnmi_collector_policy",
                sync_status="failed",
                completeness="unknown",
                detail_mode="unknown",
                observed_at=None,
                observed_target_count=0,
                policy_capable_target_count=0,
                observed_target_role_counts={},
                policy_capable_target_role_counts={},
                policy_count=0,
                active_policy_count=0,
                static_policy_count=0,
                static_local_policy_count=0,
                static_non_local_policy_count=0,
                bgp_policy_count=0,
                ttm_preference_count=0,
                binding_sid_count=0,
                srv6_binding_sid_count=0,
                notes=[],
                records=[],
                fetch_error="collector down",
            )

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.policies.load_latest_policy_snapshot",
        _build_persisted_policy_snapshot,
    )
    monkeypatch.setattr(
        "app_api.services.policies.load_recent_policy_snapshot_summaries",
        lambda limit=3: _build_recent_policy_snapshot_summaries()[:limit],
    )
    monkeypatch.setattr(
        "app_api.services.policies.load_previous_policy_snapshot",
        _build_previous_persisted_policy_snapshot,
    )

    response = client.get("/api/v1/policies")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data_status"] == "degraded"
    assert payload["count"] == 1
    assert payload["sync_source"] == "persisted_policy_snapshot"
    assert payload["detail_mode"] == "static_policies_when_present"
    assert "latest persisted normalized policy snapshot" in payload["summary"]
    assert payload["history"]["status"] == "comparison_ready"
    assert payload["items"][0]["policy_id"] == "persisted-policy-1"


def test_workflow_history_endpoint_returns_persisted_sync_activity(monkeypatch) -> None:
    monkeypatch.setattr(
        "app_api.services.workflow_history.load_sync_runs",
        _build_persisted_sync_runs,
    )

    response = client.get("/api/v1/workflow-history", headers={"X-Request-ID": "workflow-test"})

    assert response.status_code == 200
    payload = response.json()
    assert response.headers["X-Request-ID"] == "workflow-test"
    assert payload["data_status"] == "persisted_activity_history"
    assert payload["count"] == 3
    assert "platform-side read-only sync activity" in payload["summary"]
    assert payload["items"][0]["workflow_type"] == "read_side_sync"
    assert payload["items"][0]["workflow_name"] == "policy_snapshot_sync"
    assert payload["items"][0]["scope"] == "policy_inventory_read_side"
    assert payload["items"][0]["persisted_artifacts"] == ["policy_snapshot"]
    assert payload["items"][0]["policy_snapshot_summary"]["observed_policy_count"] == 1
    assert payload["items"][0]["policy_comparison_to_previous"]["removed_policy_count"] == 1
    assert payload["items"][1]["workflow_name"] == "topology_snapshot_sync"
    assert payload["items"][1]["status"] == "partial"
    assert payload["items"][1]["persisted_artifacts"] == ["topology_snapshot"]
    assert payload["items"][1]["policy_snapshot_summary"] is None
    assert payload["items"][2]["workflow_name"] == "inventory_snapshot_sync"
    assert payload["items"][2]["status"] == "completed"
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_workflow_history_endpoint_handles_empty_persisted_history(monkeypatch) -> None:
    monkeypatch.setattr("app_api.services.workflow_history.load_sync_runs", lambda: [])

    response = client.get("/api/v1/workflow-history")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data_status"] == "empty"
    assert payload["count"] == 0
    assert "No persisted platform-side sync activity" in payload["summary"]


def test_audit_history_endpoint_returns_persisted_sync_events(monkeypatch) -> None:
    monkeypatch.setattr(
        "app_api.services.audit_history.load_sync_runs",
        _build_persisted_sync_runs,
    )

    response = client.get("/api/v1/audit-history", headers={"X-Request-ID": "audit-test"})

    assert response.status_code == 200
    payload = response.json()
    assert response.headers["X-Request-ID"] == "audit-test"
    assert payload["data_status"] == "persisted_activity_history"
    assert payload["count"] == 3
    assert "platform-recorded read-side sync events" in payload["summary"]
    assert payload["items"][0]["event_type"] == "read_side_sync_recorded"
    assert payload["items"][0]["source"] == "app-api"
    assert payload["items"][0]["actor"] == "platform_system"
    assert payload["items"][0]["target_scope"] == "policy_inventory_read_side"
    assert payload["items"][0]["result"] == "succeeded"
    assert payload["items"][0]["policy_snapshot_summary"]["detail_record_count"] == 1
    assert payload["items"][0]["policy_comparison_to_previous"]["changed_policy_count"] == 1
    assert payload["items"][0]["correlation_id"] == "sync-policy-1"
    assert "persisted policy_snapshot" in payload["items"][0]["message"]
    assert payload["items"][1]["policy_snapshot_summary"] is None
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_audit_history_endpoint_handles_empty_persisted_history(monkeypatch) -> None:
    monkeypatch.setattr("app_api.services.audit_history.load_sync_runs", lambda: [])

    response = client.get("/api/v1/audit-history")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data_status"] == "empty"
    assert payload["count"] == 0
    assert "No persisted platform audit-style sync events" in payload["summary"]


def test_capabilities_endpoint_returns_bounded_capability_matrix() -> None:
    response = client.get(
        "/api/v1/capabilities",
        headers={"X-Request-ID": "capabilities-test"},
    )

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "capabilities-test"
    assert payload["data_status"] == "bounded_matrix"
    assert payload["count"] == 8
    assert "not-implemented states are now explicit" in payload["summary"]
    assert payload["items"][0]["feature"] == "device_inventory"
    assert payload["items"][0]["domain"] == "inventory"
    assert payload["items"][0]["support_status"] == "supported"
    assert payload["items"][0]["implementation_status"] == "implemented"
    assert "stable backend-owned contract" in payload["items"][0]["status_detail"]
    assert payload["support_counts"]["partially_supported"] == 5
    assert payload["support_counts"]["unknown"] == 1
    assert payload["support_counts"]["not_implemented_in_platform"] == 1
    assert payload["implementation_counts"]["partial"] == 5
    assert payload["items"][1]["feature"] == "topology_observation"
    assert payload["items"][3]["feature"] == "bgp_signaled_policy_detail"
    assert payload["items"][7]["vendor"] == "juniper"
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
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorInventoryClient:
        def read_inventory_snapshot(self) -> CollectorInventorySnapshot:
            return _build_live_inventory_snapshot()

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self) -> CollectorTopologySnapshot:
            return _build_live_topology_snapshot()

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self) -> CollectorPolicySnapshot:
            return _build_live_policy_snapshot()

    monkeypatch.setattr(
        "app_api.services.devices.get_collector_inventory_client",
        lambda: StubCollectorInventoryClient(),
    )
    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr(
        "app_api.metrics.router.summarize_sync_run_history",
        _build_sync_run_history_summary,
    )
    reset_metrics_registry()
    client.get("/api/v1/health")
    client.get("/api/v1/devices")
    client.get("/api/v1/topology")
    client.get("/api/v1/policies")
    response = client.get("/metrics")

    assert response.status_code == 200
    assert "platform_app_api_info" in response.text
    assert "platform_app_api_http_requests_total" in response.text
    assert 'endpoint="/api/v1/health",method="GET",status_class="2xx"' in response.text
    assert 'endpoint="/api/v1/devices",method="GET",status_class="2xx"' in response.text
    assert 'endpoint="/api/v1/topology",method="GET",status_class="2xx"' in response.text
    assert 'endpoint="/api/v1/policies",method="GET",status_class="2xx"' in response.text
    assert "platform_app_api_http_request_duration_seconds_count" in response.text
    assert "platform_app_api_http_request_duration_seconds_sum" in response.text
    assert "platform_app_api_topology_nodes 2" in response.text
    assert "platform_app_api_topology_links 1" in response.text
    assert 'data_status="live",sync_status="ok",completeness="partial"' in response.text
    assert 'platform_app_api_topology_nodes_by_state{state="up"} 2' in response.text
    assert 'platform_app_api_topology_links_by_state{state="up"} 1' in response.text
    assert "platform_app_api_policy_records 2" in response.text
    assert "platform_app_api_policy_observed_policy_count 2" in response.text
    assert "platform_app_api_policy_observed_targets 34" in response.text
    assert "platform_app_api_policy_capable_targets 34" in response.text
    assert 'platform_app_api_policy_records_by_observed_state{state="active"} 1' in response.text
    assert 'platform_app_api_policy_records_by_type{type="static_local"} 1' in response.text
    assert "platform_app_api_sync_runs_total 3" in response.text
    assert 'platform_app_api_sync_runs_by_family{model_family="inventory"} 1' in response.text
    assert 'platform_app_api_sync_runs_by_family{model_family="policy"} 1' in response.text
    assert 'platform_app_api_sync_runs_by_family{model_family="topology"} 1' in response.text
    assert 'platform_app_api_sync_runs_by_result{result="completed"} 2' in response.text
    assert 'platform_app_api_sync_runs_by_result{result="partial"} 1' in response.text
    assert (
        'platform_app_api_sync_runs_by_family_and_result{model_family="topology",'
        'result="partial"} 1'
    ) in response.text
    assert (
        'platform_app_api_sync_run_latest_finished_at_seconds{model_family="inventory"} '
        in response.text
    )


def test_devices_endpoint_allows_webui_origin_via_cors(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

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

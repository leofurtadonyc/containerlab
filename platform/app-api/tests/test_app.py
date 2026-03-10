from datetime import datetime

from fastapi.testclient import TestClient

from app_api.integrations.collector.inventory import (
    CollectorInventoryRecord,
    CollectorInventorySnapshot,
)
from app_api.integrations.collector.policies import CollectorPolicySnapshot
from app_api.integrations.collector.topology import (
    CollectorTopologyLinkRecord,
    CollectorTopologyNodeRecord,
    CollectorTopologySnapshot,
)
from app_api.main import app
from app_api.models.inventory import InventoryDevice
from app_api.metrics.state import reset_metrics_registry
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot
from app_api.persistence.history import PersistedSyncRun, SyncRunHistorySummary
from app_api.persistence.read_side import (
    PersistedInventorySnapshot,
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
        observed_at="2026-03-09T19:25:08.500000+00:00",
        observed_target_count=34,
        policy_capable_target_count=34,
        policy_count=0,
        active_policy_count=0,
        static_policy_count=0,
        bgp_policy_count=0,
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


def _build_persisted_sync_runs() -> list[PersistedSyncRun]:
    return [
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
        total_count=2,
        counts_by_model_family={"inventory": 1, "topology": 1},
        counts_by_result={"completed": 1, "partial": 1},
        counts_by_model_family_and_result={
            "inventory": {"completed": 1},
            "topology": {"partial": 1},
        },
        latest_finished_at_by_model_family={
            "inventory": datetime.fromisoformat("2026-03-10T00:30:02+00:00"),
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
    response = client.get("/api/v1/policies", headers={"X-Request-ID": "policies-test"})

    assert response.status_code == 200
    payload = response.json()

    assert response.headers["X-Request-ID"] == "policies-test"
    assert payload["data_status"] == "live"
    assert payload["count"] == 0
    assert payload["sync_source"] == "gnmi_collector_policy_sr_counters"
    assert payload["sync_status"] == "ok"
    assert payload["completeness"] == "partial"
    assert payload["observed_target_count"] == 34
    assert payload["policy_capable_target_count"] == 34
    assert "no SR policies are currently observed" in payload["summary"]
    assert "No SR policies are currently observed" in payload["notes"][1]
    assert datetime.fromisoformat(payload["generated_at"]) is not None


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
    assert payload["count"] == 2
    assert "platform-side read-only sync activity" in payload["summary"]
    assert payload["items"][0]["workflow_type"] == "read_side_sync"
    assert payload["items"][0]["workflow_name"] == "topology_snapshot_sync"
    assert payload["items"][0]["status"] == "partial"
    assert payload["items"][0]["persisted_artifacts"] == ["topology_snapshot"]
    assert payload["items"][1]["workflow_name"] == "inventory_snapshot_sync"
    assert payload["items"][1]["status"] == "completed"
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
    assert payload["count"] == 2
    assert "platform-recorded read-side sync events" in payload["summary"]
    assert payload["items"][0]["event_type"] == "read_side_sync_recorded"
    assert payload["items"][0]["source"] == "app-api"
    assert payload["items"][0]["actor"] == "platform_system"
    assert payload["items"][0]["result"] == "partial"
    assert payload["items"][0]["correlation_id"] == "sync-topology-1"
    assert "persisted topology_snapshot" in payload["items"][0]["message"]
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_audit_history_endpoint_handles_empty_persisted_history(monkeypatch) -> None:
    monkeypatch.setattr("app_api.services.audit_history.load_sync_runs", lambda: [])

    response = client.get("/api/v1/audit-history")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data_status"] == "empty"
    assert payload["count"] == 0
    assert "No persisted platform audit-style sync events" in payload["summary"]


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
    assert "platform_app_api_policy_records 0" in response.text
    assert "platform_app_api_policy_observed_targets 34" in response.text
    assert "platform_app_api_policy_capable_targets 34" in response.text
    assert "platform_app_api_sync_runs_total 2" in response.text
    assert 'platform_app_api_sync_runs_by_family{model_family="inventory"} 1' in response.text
    assert 'platform_app_api_sync_runs_by_family{model_family="topology"} 1' in response.text
    assert 'platform_app_api_sync_runs_by_result{result="completed"} 1' in response.text
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

from datetime import datetime
from threading import Lock
from time import sleep
from types import SimpleNamespace
from urllib.error import URLError

from fastapi.testclient import TestClient

from app_api.integrations.collector.inventory import (
    CollectorInventoryRecord,
    CollectorInventorySnapshot,
    clear_inventory_snapshot_cache,
)
from app_api.integrations.collector.policies import (
    CollectorPolicySnapshot,
    clear_policy_snapshot_cache,
)
from app_api.integrations.odl import OdlControllerObservation
from app_api.integrations.collector.topology import (
    CollectorTopologyLinkRecord,
    CollectorTopologyNodeRecord,
    CollectorTopologySnapshot,
    clear_topology_snapshot_cache,
)
from app_api.main import app
from app_api.models.inventory import InventoryDevice
from app_api.metrics.state import reset_metrics_registry
from app_api.models.policy import PolicyInventorySnapshot
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot
from app_api.persistence.history import (
    PersistedInventorySnapshotComparison,
    PersistedInventorySnapshotSummary,
    PersistedPolicySnapshotComparison,
    PersistedPolicySnapshotSummary as PersistedPolicyHistorySummary,
    PersistedReadinessSnapshotHistoryRecord,
    PersistedSyncRun,
    SyncRunHistorySummary,
    PersistedTopologySnapshotComparison,
    PersistedTopologySnapshotSummary,
)
from app_api.persistence.read_side import (
    PersistedInventorySnapshot,
    PersistedPolicySnapshot,
    PersistedPolicySnapshotSummary,
    PersistedTopologySnapshot,
)
from app_api.config.settings import get_settings
from app_api.schemas.platform import PlatformReadPathStatus


client = TestClient(app)


def setup_function() -> None:
    get_settings.cache_clear()
    clear_inventory_snapshot_cache()
    clear_topology_snapshot_cache()
    clear_policy_snapshot_cache()


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
        configured_target_count=2,
        observed_target_count=2,
        collection_success_count=2,
        collection_partial_count=0,
        collection_failure_count=0,
        oldest_observed_at="2026-03-09T19:25:08.500000+00:00",
        newest_observed_at="2026-03-09T19:25:08.500000+00:00",
        degraded_scope_summary="All configured inventory targets returned normalized live inventory evidence.",
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
        notes=[
            "Inventory coverage is currently bounded to the targets that returned normalized live inventory evidence.",
        ],
        timeout_budget_seconds=3,
        fetch_duration_seconds=0.184,
        fetch_error=None,
    )


def _build_live_topology_snapshot() -> CollectorTopologySnapshot:
    return CollectorTopologySnapshot(
        integration="gnmi_collector_topology",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804/topology/snapshot",
        configured_target_count=2,
        observed_target_count=2,
        collection_success_count=2,
        collection_partial_count=0,
        collection_failure_count=0,
        oldest_observed_at="2026-03-09T19:25:08.500000+00:00",
        newest_observed_at="2026-03-09T19:25:08.500000+00:00",
        inference_posture="inferred",
        collection_posture="ok",
        degraded_scope_summary="All configured topology targets returned usable live topology evidence within the current bounded inference slice.",
        endpoint_pairing_posture="paired",
        paired_link_count=1,
        single_sided_link_count=0,
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
        timeout_budget_seconds=3,
        fetch_duration_seconds=0.228,
        links=[
            CollectorTopologyLinkRecord(
                link_id="P1--PE1",
                source_node_id="P1",
                target_node_id="PE1",
                state="up",
                source="gnmi",
                endpoint_pairing_state="paired",
                endpoint_evidence_count=2,
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


def _build_live_mixed_topology_snapshot() -> CollectorTopologySnapshot:
    return CollectorTopologySnapshot(
        integration="gnmi_collector_topology",
        status="partial_live_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804/topology/snapshot",
        configured_target_count=3,
        observed_target_count=3,
        collection_success_count=2,
        collection_partial_count=1,
        collection_failure_count=0,
        oldest_observed_at="2026-03-09T19:25:08.500000+00:00",
        newest_observed_at="2026-03-09T19:25:11.500000+00:00",
        inference_posture="inferred",
        collection_posture="degraded",
        degraded_scope_summary="Topology delivery remains bounded because one or more inferred links still rely on single-sided endpoint evidence.",
        endpoint_pairing_posture="partially_paired",
        paired_link_count=1,
        single_sided_link_count=1,
        topology_id="platform-observed-topology",
        topology_name="Platform Observed Topology",
        sync_source="gnmi_collector_topology_interface_inference",
        sync_status="degraded",
        completeness="partial",
        observed_at="2026-03-09T19:25:11.500000+00:00",
        notes=[
            "Topology links are inferred from live router interface names and current interface operational state.",
            "Collector endpoint-pairing posture is partially_paired, with 1 paired inferred links and 1 single-sided inferred links.",
        ],
        nodes=[
            CollectorTopologyNodeRecord(
                node_id="PE1",
                display_name="PE1",
                role="pe",
                state="up",
                source="gnmi",
                device_id="PE1",
                attributes={"vendor": "nokia"},
            ),
            CollectorTopologyNodeRecord(
                node_id="P1",
                display_name="P1",
                role="p",
                state="up",
                source="gnmi",
                device_id="P1",
                attributes={"vendor": "nokia"},
            ),
            CollectorTopologyNodeRecord(
                node_id="PE2",
                display_name="PE2",
                role="pe",
                state="degraded",
                source="gnmi",
                device_id="PE2",
                attributes={"vendor": "nokia"},
            ),
        ],
        links=[
            CollectorTopologyLinkRecord(
                link_id="P1--PE1",
                source_node_id="P1",
                target_node_id="PE1",
                state="up",
                source="gnmi",
                endpoint_pairing_state="paired",
                endpoint_evidence_count=2,
                attributes={
                    "knowledge_state": "partial",
                    "endpoint_pairing_state": "paired",
                    "endpoint_evidence_count": "2",
                },
            ),
            CollectorTopologyLinkRecord(
                link_id="P1--PE2",
                source_node_id="P1",
                target_node_id="PE2",
                state="degraded",
                source="gnmi",
                endpoint_pairing_state="single_sided",
                endpoint_evidence_count=1,
                attributes={
                    "knowledge_state": "partial",
                    "endpoint_pairing_state": "single_sided",
                    "endpoint_evidence_count": "1",
                },
            ),
        ],
        fetch_error=None,
    )


def _build_live_policy_snapshot() -> CollectorPolicySnapshot:
    return CollectorPolicySnapshot(
        integration="gnmi_collector_policy",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804/policies/snapshot",
        configured_target_count=34,
        collection_success_count=34,
        collection_partial_count=0,
        collection_failure_count=0,
        oldest_observed_at="2026-03-09T19:25:08.500000+00:00",
        newest_observed_at="2026-03-09T19:25:08.500000+00:00",
        detail_ready_target_count=2,
        degraded_scope_summary="All configured policy targets returned current counter evidence, but per-policy detail remains bounded to static-policy visibility.",
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
        target_footprints=[
            {
                "target_name": "PE1",
                "target_role": "pe",
                "collection_status": "success",
                "policy_capable": True,
                "observed_policy_count": 1,
                "active_policy_count": 1,
                "static_policy_count": 1,
                "static_local_policy_count": 1,
                "static_non_local_policy_count": 0,
                "bgp_policy_count": 0,
                "ttm_preference_count": 14,
                "binding_sid_count": 0,
                "srv6_binding_sid_count": 0,
                "detail_record_count": 1,
                "detail_blocker_reason": "none",
                "notes": [],
            },
            {
                "target_name": "P1",
                "target_role": "p",
                "collection_status": "success",
                "policy_capable": True,
                "observed_policy_count": 1,
                "active_policy_count": 0,
                "static_policy_count": 1,
                "static_local_policy_count": 0,
                "static_non_local_policy_count": 1,
                "bgp_policy_count": 0,
                "ttm_preference_count": 14,
                "binding_sid_count": 0,
                "srv6_binding_sid_count": 0,
                "detail_record_count": 1,
                "detail_blocker_reason": "none",
                "notes": [],
            },
        ],
        notes=[
            "Policy inventory is currently bounded to live Nokia SR policy counters collected over gNMI.",
            "When Nokia static-policy config is exposed, the collector derives bounded per-policy observations without claiming full SR policy truth.",
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
                    "Observed from Nokia static-policy config on PE1 over gNMI.",
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
                    "Observed from Nokia static-policy config on P1 over gNMI.",
                    "This remains a bounded static-policy read slice rather than full SR policy truth.",
                ],
            },
        ],
        timeout_budget_seconds=3,
        fetch_duration_seconds=0.312,
        fetch_error=None,
    )


def _build_live_empty_policy_snapshot() -> CollectorPolicySnapshot:
    return CollectorPolicySnapshot(
        integration="gnmi_collector_policy",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804/policies/snapshot",
        configured_target_count=34,
        collection_success_count=34,
        collection_partial_count=0,
        collection_failure_count=0,
        oldest_observed_at="2026-03-09T19:25:08.500000+00:00",
        newest_observed_at="2026-03-09T19:25:08.500000+00:00",
        detail_ready_target_count=0,
        degraded_scope_summary="All configured policy targets returned current counter evidence, but no per-policy detail records are presently available because no SR policies are observed.",
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
        target_footprints=[
            {
                "target_name": "PE1",
                "target_role": "pe",
                "collection_status": "success",
                "policy_capable": True,
                "observed_policy_count": 0,
                "active_policy_count": 0,
                "static_policy_count": 0,
                "static_local_policy_count": 0,
                "static_non_local_policy_count": 0,
                "bgp_policy_count": 0,
                "ttm_preference_count": 14,
                "binding_sid_count": 0,
                "srv6_binding_sid_count": 0,
                "detail_record_count": 0,
                "detail_blocker_reason": "no_policies_observed",
                "notes": [
                    "Stable SR policy resource counters are visible on this target even though no SR policies are currently observed."
                ],
            },
            {
                "target_name": "P1",
                "target_role": "p",
                "collection_status": "success",
                "policy_capable": True,
                "observed_policy_count": 0,
                "active_policy_count": 0,
                "static_policy_count": 0,
                "static_local_policy_count": 0,
                "static_non_local_policy_count": 0,
                "bgp_policy_count": 0,
                "ttm_preference_count": 14,
                "binding_sid_count": 0,
                "srv6_binding_sid_count": 0,
                "detail_record_count": 0,
                "detail_blocker_reason": "no_policies_observed",
                "notes": [
                    "Stable SR policy resource counters are visible on this target even though no SR policies are currently observed."
                ],
            },
        ],
        notes=[
            "Policy inventory is currently bounded to live Nokia SR policy counters collected over gNMI.",
            "No SR policies are currently observed across the configured Nokia targets.",
        ],
        records=[],
        fetch_error=None,
    )


def _build_live_policy_snapshot_without_detail_records() -> CollectorPolicySnapshot:
    return CollectorPolicySnapshot(
        integration="gnmi_collector_policy",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804/policies/snapshot",
        configured_target_count=34,
        collection_success_count=34,
        collection_partial_count=0,
        collection_failure_count=0,
        oldest_observed_at="2026-03-09T19:25:08.500000+00:00",
        newest_observed_at="2026-03-09T19:25:08.500000+00:00",
        detail_ready_target_count=0,
        degraded_scope_summary="All configured policy targets returned current counter evidence, but the currently observed policy types do not expose bounded per-policy detail records.",
        sync_source="gnmi_collector_policy_sr_counters",
        sync_status="ok",
        completeness="partial",
        detail_mode="counters_only",
        observed_at="2026-03-09T19:25:08.500000+00:00",
        observed_target_count=34,
        policy_capable_target_count=34,
        observed_target_role_counts={"cpe": 6, "isp": 2, "noc": 2, "p": 16, "pe": 8},
        policy_capable_target_role_counts={"cpe": 6, "isp": 2, "noc": 2, "p": 16, "pe": 8},
        policy_count=2,
        active_policy_count=1,
        static_policy_count=0,
        static_local_policy_count=0,
        static_non_local_policy_count=0,
        bgp_policy_count=2,
        ttm_preference_count=476,
        binding_sid_count=0,
        srv6_binding_sid_count=0,
        target_footprints=[
            {
                "target_name": "PE1",
                "target_role": "pe",
                "collection_status": "success",
                "policy_capable": True,
                "observed_policy_count": 1,
                "active_policy_count": 1,
                "static_policy_count": 0,
                "static_local_policy_count": 0,
                "static_non_local_policy_count": 0,
                "bgp_policy_count": 1,
                "ttm_preference_count": 14,
                "binding_sid_count": 0,
                "srv6_binding_sid_count": 0,
                "detail_record_count": 0,
                "detail_blocker_reason": "per_policy_details_unavailable",
                "notes": [
                    "Observed policy counters are present, but bounded per-policy detail records are unavailable for this target."
                ],
            },
            {
                "target_name": "P1",
                "target_role": "p",
                "collection_status": "success",
                "policy_capable": True,
                "observed_policy_count": 1,
                "active_policy_count": 0,
                "static_policy_count": 0,
                "static_local_policy_count": 0,
                "static_non_local_policy_count": 0,
                "bgp_policy_count": 1,
                "ttm_preference_count": 14,
                "binding_sid_count": 0,
                "srv6_binding_sid_count": 0,
                "detail_record_count": 0,
                "detail_blocker_reason": "per_policy_details_unavailable",
                "notes": [
                    "Observed policy counters are present, but bounded per-policy detail records are unavailable for this target."
                ],
            },
        ],
        notes=[
            "Policy inventory is currently bounded to live Nokia SR policy counters collected over gNMI.",
            "Observed policy counters indicate SR policies are present even though bounded per-policy detail records are unavailable.",
        ],
        records=[],
        fetch_error=None,
    )


def _build_persisted_inventory_snapshot() -> PersistedInventorySnapshot:
    return PersistedInventorySnapshot(
        snapshot_id="inventory-snapshot-1",
        sync_run_id="sync-inventory-0",
        persisted_at=datetime.fromisoformat("2026-03-10T00:00:00+00:00"),
        devices=[
            InventoryDevice(
                device_id="PE1",
                vendor="nokia",
                platform="7750 SR-1",
                software_version="B-25.10.R1",
                role="pe",
                management_address="172.20.20.107",
                collector_status="degraded",
                capability_summary="unknown",
            )
        ],
    )


def _build_persisted_topology_snapshot() -> PersistedTopologySnapshot:
    return PersistedTopologySnapshot(
        snapshot_id="topology-snapshot-1",
        sync_run_id="sync-topology-0",
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
        snapshot_id="policy-snapshot-1",
        sync_run_id="sync-policy-0",
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
            target_footprints=[
                {
                    "target_name": "PE1",
                    "target_role": "pe",
                    "collection_status": "partial",
                    "policy_capable": True,
                    "observed_policy_count": 1,
                    "active_policy_count": 1,
                    "static_policy_count": 1,
                    "static_local_policy_count": 1,
                    "static_non_local_policy_count": 0,
                    "bgp_policy_count": 0,
                    "ttm_preference_count": 28,
                    "binding_sid_count": 0,
                    "srv6_binding_sid_count": 0,
                    "detail_record_count": 1,
                    "detail_blocker_reason": "none",
                    "notes": ["Persisted target footprint from the bounded policy read path."],
                }
            ],
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
        snapshot_id="policy-snapshot-0",
        sync_run_id="sync-policy-previous",
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
            snapshot_id="policy-snapshot-1",
            persisted_at=datetime.fromisoformat("2026-03-10T00:00:00+00:00"),
            snapshot={
                "snapshot_id": "policy-snapshot-1",
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
            snapshot_id="policy-snapshot-0",
            persisted_at=datetime.fromisoformat("2026-03-09T23:30:00+00:00"),
            snapshot={
                "snapshot_id": "policy-snapshot-0",
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
            snapshot_id="policy-snapshot-minus-1",
            persisted_at=datetime.fromisoformat("2026-03-09T23:00:00+00:00"),
            snapshot={
                "snapshot_id": "policy-snapshot-minus-1",
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
                snapshot_id="policy-snapshot-sync-1",
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
                current_snapshot_id="policy-snapshot-sync-1",
                previous_snapshot_id="policy-snapshot-sync-0",
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
            topology_snapshot_summary=PersistedTopologySnapshotSummary(
                snapshot_id="topology-snapshot-sync-1",
                persisted_at=datetime.fromisoformat("2026-03-10T01:00:03+00:00"),
                observed_at=datetime.fromisoformat("2026-03-10T01:00:00+00:00"),
                topology_name="Platform Observed Topology",
                sync_source="gnmi_collector_topology_interface_inference",
                sync_status="degraded",
                completeness="partial",
                node_count=2,
                link_count=1,
                node_state_counts={"up": 2},
                link_state_counts={"up": 1},
            ),
            topology_comparison_to_previous=PersistedTopologySnapshotComparison(
                current_snapshot_id="topology-snapshot-sync-1",
                previous_snapshot_id="topology-snapshot-sync-0",
                current_persisted_at=datetime.fromisoformat("2026-03-10T01:00:03+00:00"),
                previous_persisted_at=datetime.fromisoformat("2026-03-10T00:30:00+00:00"),
                current_node_count=2,
                previous_node_count=1,
                current_link_count=1,
                previous_link_count=0,
                node_count_delta=1,
                link_count_delta=1,
                added_node_count=1,
                removed_node_count=0,
                changed_node_count=0,
                added_link_count=1,
                removed_link_count=0,
                changed_link_count=0,
                notes=["Topology comparison evidence remains bounded to persisted normalized snapshots."],
            ),
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
            inventory_snapshot_summary=PersistedInventorySnapshotSummary(
                snapshot_id="inventory-snapshot-sync-1",
                persisted_at=datetime.fromisoformat("2026-03-10T00:30:02+00:00"),
                observed_at=None,
                sync_source="gnmi_collector_inventory",
                sync_status="live_normalized_feed",
                data_status="live",
                device_count=34,
                role_counts={"p": 16, "pe": 8, "cpe": 6, "noc": 2, "isp": 2},
                collector_status_counts={"ok": 34},
                capability_summary_counts={"partially_supported": 34},
            ),
            inventory_comparison_to_previous=PersistedInventorySnapshotComparison(
                current_snapshot_id="inventory-snapshot-sync-1",
                previous_snapshot_id="inventory-snapshot-sync-0",
                current_persisted_at=datetime.fromisoformat("2026-03-10T00:30:02+00:00"),
                previous_persisted_at=datetime.fromisoformat("2026-03-10T00:00:00+00:00"),
                current_device_count=34,
                previous_device_count=33,
                device_count_delta=1,
                added_device_count=1,
                removed_device_count=0,
                changed_device_count=2,
                notes=["Inventory comparison evidence remains bounded to persisted normalized snapshots."],
            ),
            notes=["Inventory sync completed from the bounded live path."],
        ),
    ]


def _build_persisted_readiness_snapshot_history() -> list[PersistedReadinessSnapshotHistoryRecord]:
    return [
        PersistedReadinessSnapshotHistoryRecord(
            snapshot_id="readiness-snapshot-1",
            persisted_at=datetime.fromisoformat("2026-03-10T02:00:00+00:00"),
            readiness_status="bounded_readiness_support",
            planning_readiness="readiness_planning_supported",
            phase_recommendation="remain_phase_2_read_only_foundation",
            summary="Current bounded readiness support remains useful for planning but not for dry-run execution.",
            blocker_count=6,
            strongest_blockers=[
                "No durable workflow lifecycle model exists yet.",
                "Policy truth remains intentionally bounded.",
            ],
        )
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
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_inventory_client",
        lambda: SimpleNamespace(read_inventory_snapshot=_build_live_inventory_snapshot),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_topology_client",
        lambda: SimpleNamespace(read_topology_snapshot=_build_live_topology_snapshot),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_policy_client",
        lambda: SimpleNamespace(read_policy_snapshot=_build_live_policy_snapshot),
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
    assert "collector read-path coverage summaries" in payload["summary"]
    assert len(payload["components"]) == 7
    assert payload["components"][0]["name"] == "app-api"
    assert payload["components"][0]["lifecycle_state"] == "declared"
    assert payload["components"][0]["observation_state"] == "not_checked"
    gnmi_component = payload["components"][2]
    assert gnmi_component["name"] == "gnmi-collector"
    assert "bounded inventory, topology, and policy read-path coverage summaries" in gnmi_component["observation_summary"]
    assert len(payload["read_paths"]) == 3
    assert payload["read_paths"][0]["model_family"] == "inventory"
    assert payload["read_paths"][0]["observation_state"] == "ok"
    assert payload["read_paths"][0]["configured_target_count"] == 2
    assert payload["read_paths"][0]["observed_target_count"] == 2
    assert payload["read_paths"][0]["collection_success_count"] == 2
    assert payload["read_paths"][0]["collection_partial_count"] == 0
    assert payload["read_paths"][0]["collection_failure_count"] == 0
    assert payload["read_paths"][0]["oldest_observed_at"] == "2026-03-09T19:25:08.500000Z"
    assert payload["read_paths"][0]["newest_observed_at"] == "2026-03-09T19:25:08.500000Z"
    assert "normalized live inventory evidence" in payload["read_paths"][0]["summary"]
    assert payload["read_paths"][0]["degraded_scope_summary"] == (
        "All configured inventory targets returned normalized live inventory evidence."
    )
    assert any(
        "completed in 0.184s within the 3s latency budget" in note
        for note in payload["read_paths"][0]["notes"]
    )
    assert payload["read_paths"][1]["model_family"] == "topology"
    assert payload["read_paths"][1]["inference_posture"] == "inferred"
    assert payload["read_paths"][1]["endpoint_pairing_posture"] == "paired"
    assert payload["read_paths"][1]["collection_posture"] == "ok"
    assert any(
        "completed in 0.228s within the 3s latency budget" in note
        for note in payload["read_paths"][1]["notes"]
    )
    assert payload["read_paths"][1]["paired_link_count"] == 1
    assert payload["read_paths"][1]["single_sided_link_count"] == 0
    assert payload["read_paths"][1]["degraded_scope_summary"] == (
        "All configured topology targets returned usable live topology evidence within the current bounded inference slice."
    )
    assert "paired endpoint evidence" in payload["read_paths"][1]["summary"]
    assert payload["read_paths"][2]["model_family"] == "policy"
    assert payload["read_paths"][2]["policy_capable_target_count"] == 34
    assert payload["read_paths"][2]["detail_ready_target_count"] == 2
    assert any(
        "completed in 0.312s within the 3s latency budget" in note
        for note in payload["read_paths"][2]["notes"]
    )
    assert payload["read_paths"][2]["degraded_scope_summary"] == (
        "All configured policy targets returned current counter evidence, but per-policy detail remains bounded to static-policy visibility."
    )
    assert len(gnmi_component["notes"]) == 6
    assert "inventory: 2/2 targets, success 2, partial 0, failed 0" in gnmi_component["notes"][0]
    assert "freshness 2026-03-09T19:25:08.500000+00:00 -> 2026-03-09T19:25:08.500000+00:00" in gnmi_component["notes"][0]
    assert gnmi_component["notes"][1] == "All configured inventory targets returned normalized live inventory evidence."
    assert "inference posture inferred, collection posture ok, endpoint-pairing posture paired, paired links 1, single-sided links 0." in gnmi_component["notes"][2]
    assert "detail-ready targets 2." in gnmi_component["notes"][4]
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


def test_platform_status_endpoint_exposes_mixed_topology_pairing_coverage(monkeypatch) -> None:
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
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_inventory_client",
        lambda: SimpleNamespace(read_inventory_snapshot=_build_live_inventory_snapshot),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_topology_client",
        lambda: SimpleNamespace(read_topology_snapshot=_build_live_mixed_topology_snapshot),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_policy_client",
        lambda: SimpleNamespace(read_policy_snapshot=_build_live_policy_snapshot),
    )

    response = client.get("/api/v1/platform/status")

    assert response.status_code == 200
    payload = response.json()
    topology_read_path = payload["read_paths"][1]
    assert topology_read_path["model_family"] == "topology"
    assert topology_read_path["observation_state"] == "degraded"
    assert topology_read_path["inference_posture"] == "inferred"
    assert topology_read_path["endpoint_pairing_posture"] == "partially_paired"
    assert topology_read_path["collection_posture"] == "degraded"
    assert topology_read_path["paired_link_count"] == 1
    assert topology_read_path["single_sided_link_count"] == 1
    assert topology_read_path["degraded_scope_summary"] == (
        "Topology delivery remains bounded because one or more inferred links still rely on single-sided endpoint evidence."
    )
    assert "mix of paired and single-sided endpoint evidence" in topology_read_path["summary"]
    gnmi_component = payload["components"][2]
    assert any(
        "inference posture inferred, collection posture degraded, endpoint-pairing posture partially_paired, paired links 1, single-sided links 1."
        in note
        for note in gnmi_component["notes"]
    )
    assert any(
        note
        == "Topology delivery remains bounded because one or more inferred links still rely on single-sided endpoint evidence."
        for note in gnmi_component["notes"]
    )


def test_platform_status_endpoint_classifies_collector_boundary_failures(monkeypatch) -> None:
    class StubOdlClient:
        def read_controller_observation(self) -> OdlControllerObservation:
            return OdlControllerObservation(
                observation_state="ok",
                observed_source="odl_restconf_capability_probe",
                observation_summary="ODL probe succeeded.",
                observed_capabilities=[],
                notes=[],
            )

    monkeypatch.setattr(
        "app_api.services.platform.get_odl_client",
        lambda: StubOdlClient(),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_inventory_client",
        lambda: SimpleNamespace(
            read_inventory_snapshot=lambda: CollectorInventorySnapshot(
                integration="gnmi_collector_inventory",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint="http://gnmi-collector:9804/inventory/snapshot",
                configured_target_count=0,
                observed_target_count=0,
                collection_success_count=0,
                collection_partial_count=0,
                collection_failure_count=0,
                oldest_observed_at=None,
                newest_observed_at=None,
                degraded_scope_summary="No configured inventory targets returned usable live inventory evidence.",
                records=[],
                notes=[],
                timeout_budget_seconds=3,
                fetch_duration_seconds=3.004,
                fetch_error_kind="timeout_budget_exceeded",
                fetch_error="Collector boundary exceeded the 3s latency budget while reading inventory snapshot from http://gnmi-collector:9804/inventory/snapshot.",
            )
        ),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_topology_client",
        lambda: SimpleNamespace(
            read_topology_snapshot=lambda: CollectorTopologySnapshot(
                integration="gnmi_collector_topology",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint="http://gnmi-collector:9804/topology/snapshot",
                configured_target_count=0,
                observed_target_count=0,
                collection_success_count=0,
                collection_partial_count=0,
                collection_failure_count=0,
                oldest_observed_at=None,
                newest_observed_at=None,
                inference_posture=None,
                collection_posture="blocked",
                degraded_scope_summary="No configured topology targets returned usable live topology evidence.",
                topology_id="platform-observed-topology",
                topology_name="Platform Observed Topology",
                sync_source="gnmi_collector_topology",
                sync_status="failed",
                completeness="unknown",
                observed_at=None,
                notes=[],
                nodes=[],
                links=[],
                timeout_budget_seconds=3,
                fetch_duration_seconds=0.241,
                fetch_error_kind="invalid_response_payload",
                fetch_error="Collector boundary returned an invalid normalized payload while reading topology snapshot from http://gnmi-collector:9804/topology/snapshot.",
            )
        ),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_policy_client",
        lambda: SimpleNamespace(
            read_policy_snapshot=lambda: CollectorPolicySnapshot(
                integration="gnmi_collector_policy",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint="http://gnmi-collector:9804/policies/snapshot",
                configured_target_count=0,
                collection_success_count=0,
                collection_partial_count=0,
                collection_failure_count=0,
                oldest_observed_at=None,
                newest_observed_at=None,
                detail_ready_target_count=0,
                degraded_scope_summary="No configured policy targets returned usable live policy evidence.",
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
                target_footprints=[],
                notes=[],
                records=[],
                timeout_budget_seconds=3,
                fetch_duration_seconds=0.119,
                fetch_error_kind="collector_connection_error",
                fetch_error="Collector boundary connection failed while reading policy snapshot from http://gnmi-collector:9804/policies/snapshot: Connection refused.",
            )
        ),
    )

    response = client.get("/api/v1/platform/status")

    assert response.status_code == 200
    payload = response.json()
    assert payload["read_paths"][0]["observation_state"] == "unreachable"
    assert payload["read_paths"][1]["observation_state"] == "degraded"
    assert payload["read_paths"][2]["observation_state"] == "unreachable"
    assert any(
        "exhausted the 3s latency budget after 3.004s" in note
        for note in payload["read_paths"][0]["notes"]
    )
    assert any("3s latency budget" in note for note in payload["read_paths"][0]["notes"])
    assert any("invalid normalized payload" in note for note in payload["read_paths"][1]["notes"])
    assert any("connection failed" in note for note in payload["read_paths"][2]["notes"])


def test_platform_status_endpoint_reads_collector_paths_sequentially(monkeypatch) -> None:
    class StubOdlClient:
        def read_controller_observation(self) -> OdlControllerObservation:
            return OdlControllerObservation(
                observation_state="ok",
                observed_source="odl_restconf_capability_probe",
                observation_summary="ODL probe succeeded.",
                observed_capabilities=[],
                notes=[],
            )

    active_reads = {"count": 0, "max": 0}
    read_lock = Lock()

    def make_read_path(model_family: str) -> PlatformReadPathStatus:
        with read_lock:
            active_reads["count"] += 1
            active_reads["max"] = max(active_reads["max"], active_reads["count"])

        sleep(0.01)

        with read_lock:
            active_reads["count"] -= 1

        return PlatformReadPathStatus(
            model_family=model_family,
            observation_state="ok",
            configured_target_count=34,
            observed_target_count=34,
            collection_success_count=34,
            collection_partial_count=0,
            collection_failure_count=0,
            oldest_observed_at=None,
            newest_observed_at=None,
            degraded_scope_summary="All configured targets returned usable live evidence.",
            summary=f"{model_family} read path is healthy.",
            notes=[],
        )

    monkeypatch.setattr(
        "app_api.services.platform.get_odl_client",
        lambda: StubOdlClient(),
    )
    monkeypatch.setattr(
        "app_api.services.platform._build_inventory_read_path_status",
        lambda: make_read_path("inventory"),
    )
    monkeypatch.setattr(
        "app_api.services.platform._build_topology_read_path_status",
        lambda: make_read_path("topology"),
    )
    monkeypatch.setattr(
        "app_api.services.platform._build_policy_read_path_status",
        lambda: make_read_path("policy"),
    )

    response = client.get("/api/v1/platform/status")

    assert response.status_code == 200
    assert active_reads["max"] == 1


def test_inventory_collector_client_reuses_recent_snapshot(monkeypatch) -> None:
    class StubResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback) -> None:
            return None

        def read(self) -> bytes:
            return (
                b'{"delivery_status":"live_ready","configured_target_count":2,'
                b'"observed_target_count":2,"collection_success_count":2,'
                b'"collection_partial_count":0,"collection_failure_count":0,'
                b'"oldest_observed_at":"2026-03-09T19:25:08.500000+00:00",'
                b'"newest_observed_at":"2026-03-09T19:25:08.500000+00:00",'
                b'"degraded_scope_summary":"All configured inventory targets returned normalized live inventory evidence.",'
                b'"records":[],"notes":[]}'
            )

    call_count = {"value": 0}

    def fake_urlopen(url: str, timeout: int):
        call_count["value"] += 1
        return StubResponse()

    monkeypatch.setattr("app_api.integrations.collector.inventory.urlopen", fake_urlopen)

    from app_api.integrations.collector.inventory import CollectorInventoryClient

    client = CollectorInventoryClient(
        source_endpoint="http://gnmi-collector:9804",
        timeout_seconds=8,
        cache_ttl_seconds=15,
        unavailable_cache_ttl_seconds=2,
    )

    first_snapshot = client.read_inventory_snapshot()
    second_snapshot = client.read_inventory_snapshot()

    assert first_snapshot.status == "live_normalized_feed"
    assert second_snapshot.status == "live_normalized_feed"
    assert call_count["value"] == 1


def test_collector_timeout_settings_allow_path_specific_override(monkeypatch) -> None:
    monkeypatch.setenv("GNMI_COLLECTOR_TIMEOUT_SECONDS", "3")
    monkeypatch.setenv("GNMI_COLLECTOR_INVENTORY_TIMEOUT_SECONDS", "2")
    monkeypatch.setenv("GNMI_COLLECTOR_TOPOLOGY_TIMEOUT_SECONDS", "4")
    monkeypatch.setenv("GNMI_COLLECTOR_POLICY_TIMEOUT_SECONDS", "5")
    get_settings.cache_clear()

    from app_api.integrations.collector.inventory import get_collector_inventory_client
    from app_api.integrations.collector.policies import get_collector_policy_client
    from app_api.integrations.collector.topology import get_collector_topology_client

    assert get_collector_inventory_client().timeout_seconds == 2
    assert get_collector_topology_client().timeout_seconds == 4
    assert get_collector_policy_client().timeout_seconds == 5


def test_inventory_collector_client_classifies_timeout_budget_exceeded(monkeypatch) -> None:
    def fake_urlopen(url: str, timeout: int):
        raise TimeoutError("collector timed out")

    monkeypatch.setattr("app_api.integrations.collector.inventory.urlopen", fake_urlopen)

    from app_api.integrations.collector.inventory import CollectorInventoryClient

    inventory_client = CollectorInventoryClient(
        source_endpoint="http://gnmi-collector:9804",
        timeout_seconds=3,
        cache_ttl_seconds=0,
        unavailable_cache_ttl_seconds=0,
    )

    snapshot = inventory_client.read_inventory_snapshot()

    assert snapshot.status == "collector_unavailable"
    assert snapshot.fetch_error_kind == "timeout_budget_exceeded"
    assert snapshot.fetch_error is not None
    assert "3s latency budget" in snapshot.fetch_error


def test_policy_collector_client_can_disable_snapshot_cache(monkeypatch) -> None:
    class StubResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback) -> None:
            return None

        def read(self) -> bytes:
            return (
                b'{"delivery_status":"live_ready","configured_target_count":34,'
                b'"collection_success_count":34,"collection_partial_count":0,'
                b'"collection_failure_count":0,"oldest_observed_at":"2026-03-09T19:25:08.500000+00:00",'
                b'"newest_observed_at":"2026-03-09T19:25:08.500000+00:00",'
                b'"detail_ready_target_count":0,'
                b'"degraded_scope_summary":"Policy counters indicate observed policies, but the current bounded path could not derive per-target detail records.",'
                b'"sync_source":"gnmi_collector_policy_sr_counters","sync_status":"ok",'
                b'"completeness":"partial","detail_mode":"counters_only",'
                b'"observed_at":"2026-03-09T19:25:08.500000+00:00","observed_target_count":34,'
                b'"policy_capable_target_count":34,"observed_target_role_counts":{},'
                b'"policy_capable_target_role_counts":{},"policy_count":2,"active_policy_count":2,'
                b'"static_policy_count":2,"static_local_policy_count":1,"static_non_local_policy_count":1,'
                b'"bgp_policy_count":0,"ttm_preference_count":476,"binding_sid_count":0,'
                b'"srv6_binding_sid_count":0,"target_footprints":[],"notes":[],"records":[]}'
            )

    call_count = {"value": 0}

    def fake_urlopen(url: str, timeout: int):
        call_count["value"] += 1
        return StubResponse()

    monkeypatch.setattr("app_api.integrations.collector.policies.urlopen", fake_urlopen)

    from app_api.integrations.collector.policies import CollectorPolicyClient

    client = CollectorPolicyClient(
        source_endpoint="http://gnmi-collector:9804",
        timeout_seconds=8,
        cache_ttl_seconds=0,
        unavailable_cache_ttl_seconds=0,
    )

    client.read_policy_snapshot()
    client.read_policy_snapshot()

    assert call_count["value"] == 2


def test_topology_collector_client_uses_short_unavailable_cache_ttl(monkeypatch) -> None:
    class StubResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback) -> None:
            return None

        def read(self) -> bytes:
            return b"{}"

    call_count = {"value": 0}

    def fake_urlopen(url: str, timeout: int):
        call_count["value"] += 1
        raise TimeoutError("collector timed out")

    monkeypatch.setattr("app_api.integrations.collector.topology.urlopen", fake_urlopen)

    from app_api.integrations.collector.topology import CollectorTopologyClient

    client = CollectorTopologyClient(
        source_endpoint="http://gnmi-collector:9804",
        timeout_seconds=8,
        cache_ttl_seconds=15,
        unavailable_cache_ttl_seconds=0,
    )

    first_snapshot = client.read_topology_snapshot()
    second_snapshot = client.read_topology_snapshot()

    assert first_snapshot.status == "collector_unavailable"
    assert second_snapshot.status == "collector_unavailable"
    assert first_snapshot.fetch_error_kind == "timeout_budget_exceeded"
    assert first_snapshot.fetch_error is not None
    assert "8s latency budget" in first_snapshot.fetch_error
    assert call_count["value"] == 2


def test_policy_collector_client_classifies_connection_failure(monkeypatch) -> None:
    def fake_urlopen(url: str, timeout: int):
        raise URLError("Connection refused")

    monkeypatch.setattr("app_api.integrations.collector.policies.urlopen", fake_urlopen)

    from app_api.integrations.collector.policies import CollectorPolicyClient

    policy_client = CollectorPolicyClient(
        source_endpoint="http://gnmi-collector:9804",
        timeout_seconds=3,
        cache_ttl_seconds=0,
        unavailable_cache_ttl_seconds=0,
    )

    snapshot = policy_client.read_policy_snapshot()

    assert snapshot.status == "collector_unavailable"
    assert snapshot.fetch_error_kind == "collector_connection_error"
    assert snapshot.fetch_error is not None
    assert "connection failed" in snapshot.fetch_error


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
    assert payload["serving_mode"] == "live_collector"
    assert payload["evidence_confidence"]["source_posture"] == "live_observed"
    assert payload["evidence_confidence"]["evidence_kind"] == "direct_observed"
    assert payload["evidence_confidence"]["confidence_posture"] == "strong_for_current_slice"
    assert payload["evidence_confidence"]["freshness_posture"] == "current"
    assert payload["evidence_confidence"]["blocked_reason"] == "none"
    assert payload["served_persisted_at"] is None
    assert payload["count"] == 2
    assert "live read-only Nokia gNMI collection" in payload["summary"]
    assert payload["comparison_to_latest_persisted"]["status"] == "unavailable"
    assert payload["comparison_to_latest_persisted"]["comparison_snapshot_id"] is None
    assert payload["items"][0]["device_id"] == "PE1"
    assert payload["items"][0]["vendor"] == "nokia"
    assert payload["items"][0]["management_address"] == "172.20.20.107"
    assert payload["items"][0]["current_posture"] == "current"
    assert payload["items"][0]["collector_status"] == "ok"
    assert payload["items"][0]["last_recorded_collector_status"] == "ok"
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
    assert payload["serving_mode"] == "live_collector"
    assert payload["evidence_confidence"]["source_posture"] == "live_observed"
    assert payload["evidence_confidence"]["evidence_kind"] == "observed_plus_inferred"
    assert payload["evidence_confidence"]["confidence_posture"] == "bounded_partial"
    assert payload["evidence_confidence"]["freshness_posture"] == "current"
    assert payload["evidence_confidence"]["blocked_reason"] == "none"
    assert any("Coverage currently includes 2 of 2 configured topology targets" in note for note in payload["evidence_confidence"]["notes"])
    assert payload["served_persisted_at"] is None
    assert payload["coverage_summary"]["inference_posture"] == "inferred"
    assert payload["coverage_summary"]["endpoint_pairing_posture"] == "paired"
    assert payload["coverage_summary"]["collection_posture"] == "ok"
    assert payload["coverage_summary"]["paired_link_count"] == 1
    assert payload["coverage_summary"]["single_sided_link_count"] == 0
    assert "paired endpoint evidence" in payload["coverage_summary"]["summary"]
    assert "inference-bounded" in payload["coverage_summary"]["summary"]
    assert "collection posture is healthy" in payload["coverage_summary"]["summary"]
    assert payload["topology"]["topology_id"] == "platform-observed-topology"
    assert payload["topology"]["topology_name"] == "Platform Observed Topology"
    assert payload["topology"]["sync_source"] == "gnmi_collector_topology_interface_inference"
    assert payload["topology"]["sync_status"] == "ok"
    assert payload["topology"]["completeness"] == "partial"
    assert len(payload["topology"]["nodes"]) == 2
    assert len(payload["topology"]["links"]) == 1
    assert payload["topology"]["nodes"][0]["display_name"] == "PE1"
    assert payload["topology"]["nodes"][0]["current_posture"] == "current"
    assert payload["topology"]["nodes"][0]["state"] == "up"
    assert payload["topology"]["nodes"][0]["last_recorded_state"] == "up"
    assert payload["topology"]["nodes"][0]["source"] == "gnmi"
    assert payload["topology"]["nodes"][0]["attributes"]["vendor"] == "nokia"
    assert payload["topology"]["links"][0]["current_posture"] == "current"
    assert payload["topology"]["links"][0]["state"] == "up"
    assert payload["topology"]["links"][0]["last_recorded_state"] == "up"
    assert payload["topology"]["links"][0]["source"] == "gnmi"
    assert payload["topology"]["links"][0]["endpoint_pairing_state"] == "paired"
    assert payload["topology"]["links"][0]["endpoint_evidence_count"] == 2
    assert payload["topology"]["links"][0]["attributes"]["knowledge_state"] == "partial"
    assert "bounded interface-based link inference" in payload["summary"]
    assert "paired endpoint evidence" in payload["summary"]
    assert payload["comparison_to_latest_persisted"]["status"] == "unavailable"
    assert "Topology links are inferred from live router interface names" in payload["topology"]["notes"][0]
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_topology_endpoint_exposes_mixed_pairing_coverage_semantics(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self) -> CollectorTopologySnapshot:
            return _build_live_mixed_topology_snapshot()

    monkeypatch.setattr(
        "app_api.services.topology.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )

    response = client.get("/api/v1/topology")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data_status"] == "degraded"
    assert payload["serving_mode"] == "live_collector"
    assert payload["coverage_summary"]["inference_posture"] == "inferred"
    assert payload["coverage_summary"]["endpoint_pairing_posture"] == "partially_paired"
    assert payload["coverage_summary"]["collection_posture"] == "degraded"
    assert payload["coverage_summary"]["paired_link_count"] == 1
    assert payload["coverage_summary"]["single_sided_link_count"] == 1
    assert "mix of paired and single-sided endpoint evidence" in payload["coverage_summary"]["summary"]
    assert "collection posture is degraded" in payload["coverage_summary"]["summary"]
    assert payload["topology"]["links"][0]["endpoint_pairing_state"] == "paired"
    assert payload["topology"]["links"][1]["endpoint_pairing_state"] == "single_sided"
    assert payload["topology"]["links"][1]["endpoint_evidence_count"] == 1
    assert "mix of paired and single-sided endpoint evidence" in payload["summary"]


def test_devices_endpoint_falls_back_to_persisted_inventory(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorInventoryClient:
        def read_inventory_snapshot(self) -> CollectorInventorySnapshot:
            return CollectorInventorySnapshot(
                integration="gnmi_collector_inventory",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint="http://gnmi-collector:9804/inventory/snapshot",
                configured_target_count=0,
                observed_target_count=0,
                collection_success_count=0,
                collection_partial_count=0,
                collection_failure_count=0,
                oldest_observed_at=None,
                newest_observed_at=None,
                degraded_scope_summary="No configured inventory targets returned usable live inventory evidence.",
                records=[],
                notes=[],
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
    assert payload["serving_mode"] == "persisted_fallback"
    assert payload["evidence_confidence"]["source_posture"] == "persisted_fallback"
    assert payload["evidence_confidence"]["evidence_kind"] == "direct_observed"
    assert payload["evidence_confidence"]["confidence_posture"] == "degraded"
    assert payload["evidence_confidence"]["freshness_posture"] == "stale"
    assert payload["evidence_confidence"]["blocked_reason"] == "collector_unavailable"
    assert payload["count"] == 1
    assert datetime.fromisoformat(
        payload["served_persisted_at"].replace("Z", "+00:00")
    ) == datetime.fromisoformat("2026-03-10T00:00:00+00:00")
    assert payload["comparison_to_latest_persisted"]["status"] == "unavailable"
    assert payload["comparison_to_latest_persisted"]["current_device_count"] == 1
    assert "latest persisted normalized inventory snapshot" in payload["summary"]
    assert payload["items"][0]["device_id"] == "PE1"
    assert payload["items"][0]["current_posture"] == "stale"
    assert payload["items"][0]["collector_status"] == "degraded"
    assert payload["items"][0]["last_recorded_collector_status"] == "degraded"


def test_devices_endpoint_exposes_bounded_live_vs_persisted_comparison(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorInventoryClient:
        def read_inventory_snapshot(self) -> CollectorInventorySnapshot:
            return _build_live_inventory_snapshot()

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
    assert payload["serving_mode"] == "live_collector"
    assert payload["comparison_to_latest_persisted"]["status"] == "live_vs_latest_persisted_ready"
    assert payload["comparison_to_latest_persisted"]["comparison_snapshot_id"] == "inventory-snapshot-1"
    assert payload["comparison_to_latest_persisted"]["persisted_device_count"] == 1
    assert payload["comparison_to_latest_persisted"]["current_device_count"] == 2
    assert payload["comparison_to_latest_persisted"]["added_device_count"] == 1
    assert payload["comparison_to_latest_persisted"]["removed_device_count"] == 0
    assert payload["comparison_to_latest_persisted"]["changed_device_count"] == 1
    assert payload["comparison_to_latest_persisted"]["current_role_counts"] == {
        "p": 1,
        "pe": 1,
    }
    assert payload["comparison_to_latest_persisted"]["persisted_collector_status_counts"] == {
        "degraded": 1
    }
    assert payload["comparison_to_latest_persisted"]["persisted_capability_summary_counts"] == {
        "unknown": 1
    }


def test_topology_endpoint_falls_back_to_persisted_snapshot(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self) -> CollectorTopologySnapshot:
            return CollectorTopologySnapshot(
                integration="gnmi_collector_topology",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint="http://gnmi-collector:9804/topology/snapshot",
                configured_target_count=0,
                observed_target_count=0,
                collection_success_count=0,
                collection_partial_count=0,
                collection_failure_count=0,
                oldest_observed_at=None,
                newest_observed_at=None,
                degraded_scope_summary="No configured topology targets returned usable live topology evidence.",
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
    assert payload["serving_mode"] == "persisted_fallback"
    assert payload["evidence_confidence"]["source_posture"] == "persisted_fallback"
    assert payload["evidence_confidence"]["evidence_kind"] == "observed_plus_inferred"
    assert payload["evidence_confidence"]["confidence_posture"] == "degraded"
    assert payload["evidence_confidence"]["freshness_posture"] == "stale"
    assert payload["evidence_confidence"]["blocked_reason"] == "collector_unavailable"
    assert payload["coverage_summary"]["inference_posture"] == "inferred"
    assert payload["coverage_summary"]["endpoint_pairing_posture"] == "unknown"
    assert payload["coverage_summary"]["collection_posture"] == "blocked"
    assert payload["coverage_summary"]["paired_link_count"] == 0
    assert payload["coverage_summary"]["single_sided_link_count"] == 0
    assert payload["topology"]["sync_source"] == "persisted_topology_snapshot"
    assert len(payload["topology"]["nodes"]) == 1
    assert len(payload["topology"]["links"]) == 1
    assert payload["topology"]["nodes"][0]["current_posture"] == "stale"
    assert payload["topology"]["nodes"][0]["state"] == "up"
    assert payload["topology"]["nodes"][0]["last_recorded_state"] == "up"
    assert payload["topology"]["links"][0]["current_posture"] == "stale"
    assert payload["topology"]["links"][0]["state"] == "degraded"
    assert payload["topology"]["links"][0]["last_recorded_state"] == "degraded"
    assert datetime.fromisoformat(
        payload["served_persisted_at"].replace("Z", "+00:00")
    ) == datetime.fromisoformat("2026-03-10T00:00:00+00:00")
    assert payload["comparison_to_latest_persisted"]["status"] == "unavailable"
    assert payload["comparison_to_latest_persisted"]["comparison_snapshot_id"] == "topology-snapshot-1"
    assert "latest persisted normalized topology snapshot" in payload["summary"]


def test_topology_endpoint_exposes_bounded_live_vs_persisted_comparison(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self) -> CollectorTopologySnapshot:
            return _build_live_topology_snapshot()

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
    assert payload["serving_mode"] == "live_collector"
    assert payload["comparison_to_latest_persisted"]["status"] == "live_vs_latest_persisted_ready"
    assert payload["comparison_to_latest_persisted"]["comparison_snapshot_id"] == "topology-snapshot-1"
    assert payload["comparison_to_latest_persisted"]["persisted_node_count"] == 1
    assert payload["comparison_to_latest_persisted"]["current_node_count"] == 2
    assert payload["comparison_to_latest_persisted"]["added_node_count"] == 1
    assert payload["comparison_to_latest_persisted"]["added_link_count"] == 1
    assert payload["comparison_to_latest_persisted"]["removed_link_count"] == 1


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
    assert payload["serving_mode"] == "live_collector"
    assert payload["evidence_confidence"]["source_posture"] == "live_observed"
    assert payload["evidence_confidence"]["evidence_kind"] == "aggregate_plus_bounded_records"
    assert payload["evidence_confidence"]["confidence_posture"] == "bounded_partial"
    assert payload["evidence_confidence"]["freshness_posture"] == "current"
    assert payload["evidence_confidence"]["blocked_reason"] == "none"
    assert any("Bounded per-target detail coverage currently exists for 2 observed targets." in note for note in payload["evidence_confidence"]["notes"])
    assert payload["served_persisted_at"] is None
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
    assert payload["history"]["recent_snapshots"][0]["snapshot_id"] == "policy-snapshot-1"
    assert payload["history"]["recent_snapshots"][1]["snapshot_id"] == "policy-snapshot-0"
    assert payload["history"]["comparison_to_previous"]["current_snapshot_id"] == "policy-snapshot-1"
    assert payload["history"]["comparison_to_previous"]["previous_snapshot_id"] == "policy-snapshot-0"
    assert payload["history"]["comparison_to_previous"]["observed_policy_delta"] == -1
    assert payload["history"]["comparison_to_previous"]["detail_record_delta"] == -1
    assert payload["history"]["comparison_to_previous"]["added_policy_count"] == 0
    assert payload["history"]["comparison_to_previous"]["removed_policy_count"] == 1
    assert payload["history"]["comparison_to_previous"]["changed_policy_count"] == 1
    assert payload["history"]["comparison_to_previous"]["change_preview"][0]["policy_id"] == "persisted-policy-2"
    assert payload["history"]["comparison_to_previous"]["change_preview"][0]["change_kind"] == "removed"
    assert payload["history"]["comparison_to_previous"]["change_preview"][1]["policy_id"] == "persisted-policy-1"
    assert payload["history"]["comparison_to_previous"]["change_preview"][1]["change_kind"] == "changed"
    assert "observed_state" in payload["history"]["comparison_to_previous"]["change_preview"][1]["changed_fields"]
    assert "health_state" in payload["history"]["comparison_to_previous"]["change_preview"][1]["changed_fields"]
    assert "candidate_paths" in payload["history"]["comparison_to_previous"]["change_preview"][1]["changed_fields"]
    assert payload["comparison_to_latest_persisted"]["status"] == "current_vs_latest_persisted_ready"
    assert payload["comparison_to_latest_persisted"]["comparison_snapshot_id"] == "policy-snapshot-1"
    assert payload["comparison_to_latest_persisted"]["persisted_observed_policy_count"] == 1
    assert payload["comparison_to_latest_persisted"]["change_preview"][0]["change_kind"] == "added"
    assert payload["comparison_to_latest_persisted"]["change_preview"][1]["change_kind"] == "added"
    assert payload["comparison_to_latest_persisted"]["change_preview"][2]["change_kind"] == "removed"
    assert len(payload["target_footprints"]) == 2
    assert payload["target_footprints"][0]["target_name"] == "PE1"
    assert payload["target_footprints"][0]["current_posture"] == "current"
    assert payload["target_footprints"][0]["last_recorded_collection_status"] == "success"
    assert payload["target_footprints"][0]["detail_blocker_reason"] == "none"
    assert payload["target_footprints"][0]["observed_policy_count"] == 1
    assert payload["target_footprints"][1]["target_name"] == "P1"
    assert payload["target_footprints"][1]["detail_blocker_reason"] == "none"
    assert payload["target_footprints"][1]["static_non_local_policy_count"] == 1
    assert "bounded static-policy observations" in payload["summary"]
    assert payload["items"][0]["policy_type"] == "static_local"
    assert payload["items"][0]["source_target"] == "PE1"
    assert payload["items"][0]["current_posture"] == "current"
    assert payload["items"][0]["last_recorded_observed_state"] == "active"
    assert payload["items"][0]["last_recorded_health_state"] == "healthy"
    assert payload["items"][0]["candidate_paths"][0]["current_posture"] == "current"
    assert payload["items"][0]["candidate_paths"][0]["last_recorded_path_state"] == "active"
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
    assert payload["serving_mode"] == "live_collector"
    assert payload["evidence_confidence"]["source_posture"] == "live_observed"
    assert payload["evidence_confidence"]["evidence_kind"] == "aggregate_only"
    assert payload["evidence_confidence"]["confidence_posture"] == "bounded_partial"
    assert payload["evidence_confidence"]["freshness_posture"] == "current"
    assert payload["evidence_confidence"]["blocked_reason"] == "none"
    assert payload["count"] == 0
    assert payload["observed_policy_count"] == 0
    assert payload["empty_reason"] == "no_policies_observed"
    assert payload["ttm_preference_count"] == 476
    assert payload["observed_target_role_counts"]["p"] == 16
    assert len(payload["target_footprints"]) == 2
    assert payload["target_footprints"][0]["policy_capable"] is True
    assert payload["target_footprints"][0]["detail_record_count"] == 0
    assert payload["target_footprints"][0]["detail_blocker_reason"] == "no_policies_observed"
    assert payload["target_footprints"][1]["detail_blocker_reason"] == "no_policies_observed"
    assert payload["comparison_to_latest_persisted"]["status"] == "unavailable"
    assert payload["comparison_to_latest_persisted"]["comparison_snapshot_id"] is None
    assert payload["comparison_to_latest_persisted"]["change_preview"] == []
    assert payload["history"]["status"] == "unavailable"
    assert "stable per-target policy counter footprint and target-role coverage" in payload["summary"]


def test_policies_endpoint_keeps_detail_unavailable_state_explicit(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorPolicyClient:
        def read_policy_snapshot(self) -> CollectorPolicySnapshot:
            return _build_live_policy_snapshot_without_detail_records()

    monkeypatch.setattr(
        "app_api.services.policies.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    response = client.get("/api/v1/policies")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data_status"] == "live"
    assert payload["serving_mode"] == "live_collector"
    assert payload["evidence_confidence"]["source_posture"] == "live_observed"
    assert payload["evidence_confidence"]["evidence_kind"] == "aggregate_only"
    assert payload["evidence_confidence"]["confidence_posture"] == "blocked"
    assert payload["evidence_confidence"]["freshness_posture"] == "current"
    assert payload["evidence_confidence"]["blocked_reason"] == "per_record_detail_unavailable"
    assert payload["count"] == 0
    assert payload["observed_policy_count"] == 2
    assert payload["empty_reason"] == "per_policy_details_unavailable"
    assert payload["target_footprints"][0]["detail_blocker_reason"] == "per_policy_details_unavailable"
    assert payload["target_footprints"][1]["detail_blocker_reason"] == "per_policy_details_unavailable"
    assert payload["comparison_to_latest_persisted"]["status"] == "unavailable"
    assert payload["history"]["status"] == "unavailable"
    assert (
        "could not derive per-policy detail records" in payload["summary"]
    )
    assert (
        "Bounded per-target detail coverage currently exists for 0 observed targets."
        in payload["summary"]
    )


def test_policies_endpoint_falls_back_to_persisted_policy_snapshot(monkeypatch) -> None:
    class StubCollectorPolicyClient:
        def read_policy_snapshot(self) -> CollectorPolicySnapshot:
            return CollectorPolicySnapshot(
                integration="gnmi_collector_policy",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint="http://gnmi-collector:9804/policies/snapshot",
                configured_target_count=0,
                collection_success_count=0,
                collection_partial_count=0,
                collection_failure_count=0,
                oldest_observed_at=None,
                newest_observed_at=None,
                detail_ready_target_count=0,
                degraded_scope_summary="No configured policy targets returned usable live policy evidence.",
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
    assert payload["serving_mode"] == "persisted_fallback"
    assert payload["evidence_confidence"]["source_posture"] == "persisted_fallback"
    assert payload["evidence_confidence"]["evidence_kind"] == "aggregate_plus_bounded_records"
    assert payload["evidence_confidence"]["confidence_posture"] == "degraded"
    assert payload["evidence_confidence"]["freshness_posture"] == "stale"
    assert payload["evidence_confidence"]["blocked_reason"] == "collector_unavailable"
    assert payload["count"] == 1
    assert payload["sync_source"] == "persisted_policy_snapshot"
    assert payload["detail_mode"] == "static_policies_when_present"
    assert datetime.fromisoformat(
        payload["served_persisted_at"].replace("Z", "+00:00")
    ) == datetime.fromisoformat("2026-03-10T00:00:00+00:00")
    assert payload["comparison_to_latest_persisted"]["status"] == "unavailable"
    assert payload["comparison_to_latest_persisted"]["comparison_snapshot_id"] == "policy-snapshot-1"
    assert "latest persisted normalized policy snapshot" in payload["summary"]
    assert payload["history"]["status"] == "comparison_ready"
    assert payload["history"]["recent_snapshots"][0]["snapshot_id"] == "policy-snapshot-1"
    assert payload["history"]["comparison_to_previous"]["current_snapshot_id"] == "policy-snapshot-1"
    assert payload["history"]["comparison_to_previous"]["previous_snapshot_id"] == "policy-snapshot-0"
    assert payload["items"][0]["policy_id"] == "persisted-policy-1"
    assert payload["items"][0]["current_posture"] == "stale"
    assert payload["items"][0]["observed_state"] == "active"
    assert payload["items"][0]["last_recorded_observed_state"] == "active"
    assert payload["items"][0]["health_state"] == "healthy"
    assert payload["items"][0]["last_recorded_health_state"] == "healthy"
    assert payload["items"][0]["candidate_paths"][0]["current_posture"] == "stale"
    assert payload["items"][0]["candidate_paths"][0]["path_state"] == "active"
    assert payload["items"][0]["candidate_paths"][0]["last_recorded_path_state"] == "active"
    assert payload["target_footprints"][0]["current_posture"] == "stale"
    assert payload["target_footprints"][0]["collection_status"] == "partial"
    assert payload["target_footprints"][0]["last_recorded_collection_status"] == "partial"


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
    assert payload["items"][0]["sync_run_id"] == "sync-policy-1"
    assert payload["items"][0]["workflow_name"] == "policy_snapshot_sync"
    assert payload["items"][0]["scope"] == "policy_inventory_read_side"
    assert payload["items"][0]["persisted_artifacts"] == ["policy_snapshot"]
    assert payload["items"][0]["policy_snapshot_summary"]["snapshot_id"] == "policy-snapshot-sync-1"
    assert payload["items"][0]["policy_snapshot_summary"]["observed_policy_count"] == 1
    assert payload["items"][0]["policy_comparison_to_previous"]["current_snapshot_id"] == "policy-snapshot-sync-1"
    assert payload["items"][0]["policy_comparison_to_previous"]["previous_snapshot_id"] == "policy-snapshot-sync-0"
    assert payload["items"][0]["policy_comparison_to_previous"]["removed_policy_count"] == 1
    assert payload["items"][1]["workflow_name"] == "topology_snapshot_sync"
    assert payload["items"][1]["status"] == "partial"
    assert payload["items"][1]["persisted_artifacts"] == ["topology_snapshot"]
    assert payload["items"][1]["topology_snapshot_summary"]["snapshot_id"] == "topology-snapshot-sync-1"
    assert payload["items"][1]["topology_snapshot_summary"]["node_count"] == 2
    assert payload["items"][1]["topology_comparison_to_previous"]["current_snapshot_id"] == "topology-snapshot-sync-1"
    assert payload["items"][1]["topology_comparison_to_previous"]["previous_snapshot_id"] == "topology-snapshot-sync-0"
    assert payload["items"][1]["topology_comparison_to_previous"]["added_link_count"] == 1
    assert payload["items"][1]["policy_snapshot_summary"] is None
    assert payload["items"][2]["workflow_name"] == "inventory_snapshot_sync"
    assert payload["items"][2]["status"] == "completed"
    assert payload["items"][2]["inventory_snapshot_summary"]["snapshot_id"] == "inventory-snapshot-sync-1"
    assert payload["items"][2]["inventory_snapshot_summary"]["device_count"] == 34
    assert payload["items"][2]["inventory_snapshot_summary"]["collector_status_counts"] == {
        "ok": 34
    }
    assert payload["items"][2]["inventory_comparison_to_previous"]["current_snapshot_id"] == "inventory-snapshot-sync-1"
    assert payload["items"][2]["inventory_comparison_to_previous"]["previous_snapshot_id"] == "inventory-snapshot-sync-0"
    assert payload["items"][2]["inventory_comparison_to_previous"]["changed_device_count"] == 2
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
    monkeypatch.setattr(
        "app_api.services.audit_history.load_readiness_snapshot_history",
        _build_persisted_readiness_snapshot_history,
    )

    response = client.get("/api/v1/audit-history", headers={"X-Request-ID": "audit-test"})

    assert response.status_code == 200
    payload = response.json()
    assert response.headers["X-Request-ID"] == "audit-test"
    assert payload["data_status"] == "persisted_activity_history"
    assert payload["count"] == 4
    assert "persisted readiness-support snapshots" in payload["summary"]
    assert payload["items"][0]["event_type"] == "readiness_snapshot_recorded"
    assert payload["items"][0]["target_scope"] == "dry_run_readiness_support"
    assert payload["items"][0]["result"] == "succeeded"
    assert payload["items"][0]["sync_run_id"] is None
    assert payload["items"][0]["readiness_snapshot_id"] == "readiness-snapshot-1"
    assert payload["items"][0]["readiness_snapshot_summary"]["snapshot_id"] == "readiness-snapshot-1"
    assert payload["items"][0]["readiness_snapshot_summary"]["readiness_status"] == "bounded_readiness_support"
    assert payload["items"][0]["readiness_snapshot_summary"]["blocker_count"] == 6
    assert payload["items"][0]["policy_snapshot_summary"] is None
    assert "changed materially" in payload["items"][0]["message"]
    assert payload["items"][1]["event_type"] == "read_side_sync_recorded"
    assert payload["items"][0]["source"] == "app-api"
    assert payload["items"][1]["actor"] == "platform_system"
    assert payload["items"][1]["target_scope"] == "policy_inventory_read_side"
    assert payload["items"][1]["result"] == "succeeded"
    assert payload["items"][1]["sync_run_id"] == "sync-policy-1"
    assert payload["items"][1]["readiness_snapshot_id"] is None
    assert payload["items"][1]["policy_snapshot_summary"]["snapshot_id"] == "policy-snapshot-sync-1"
    assert payload["items"][1]["policy_snapshot_summary"]["detail_record_count"] == 1
    assert payload["items"][1]["policy_comparison_to_previous"]["current_snapshot_id"] == "policy-snapshot-sync-1"
    assert payload["items"][1]["policy_comparison_to_previous"]["previous_snapshot_id"] == "policy-snapshot-sync-0"
    assert payload["items"][1]["policy_comparison_to_previous"]["changed_policy_count"] == 1
    assert payload["items"][1]["correlation_id"] == "sync-policy-1"
    assert "persisted policy_snapshot" in payload["items"][1]["message"]
    assert payload["items"][2]["topology_snapshot_summary"]["snapshot_id"] == "topology-snapshot-sync-1"
    assert payload["items"][2]["topology_snapshot_summary"]["topology_name"] == "Platform Observed Topology"
    assert payload["items"][2]["topology_comparison_to_previous"]["current_snapshot_id"] == "topology-snapshot-sync-1"
    assert payload["items"][2]["topology_comparison_to_previous"]["previous_snapshot_id"] == "topology-snapshot-sync-0"
    assert payload["items"][2]["topology_comparison_to_previous"]["node_count_delta"] == 1
    assert payload["items"][2]["policy_snapshot_summary"] is None
    assert payload["items"][3]["inventory_snapshot_summary"]["snapshot_id"] == "inventory-snapshot-sync-1"
    assert payload["items"][3]["inventory_snapshot_summary"]["role_counts"]["pe"] == 8
    assert payload["items"][3]["inventory_comparison_to_previous"]["current_snapshot_id"] == "inventory-snapshot-sync-1"
    assert payload["items"][3]["inventory_comparison_to_previous"]["previous_snapshot_id"] == "inventory-snapshot-sync-0"
    assert payload["items"][3]["inventory_comparison_to_previous"]["added_device_count"] == 1
    assert datetime.fromisoformat(payload["generated_at"]) is not None


def test_audit_history_endpoint_handles_empty_persisted_history(monkeypatch) -> None:
    monkeypatch.setattr("app_api.services.audit_history.load_sync_runs", lambda: [])
    monkeypatch.setattr(
        "app_api.services.audit_history.load_readiness_snapshot_history",
        lambda: [],
    )

    response = client.get("/api/v1/audit-history")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data_status"] == "empty"
    assert payload["count"] == 0
    assert "No persisted platform audit-style sync events or readiness-support snapshots" in payload["summary"]


def test_capabilities_endpoint_returns_bounded_capability_matrix() -> None:
    fixed_readiness_persisted_at = datetime.fromisoformat("2026-03-16T00:00:00+00:00")
    fixed_readiness_reference = SimpleNamespace(
        snapshot_id="readiness-snapshot-current",
        persisted_at=fixed_readiness_persisted_at,
    )

    # Keep the endpoint test deterministic and avoid requiring a migrated database here.
    import app_api.services.capabilities as capabilities_service
    original_persist = capabilities_service.persist_readiness_snapshot
    original_load_reference = capabilities_service.load_latest_readiness_snapshot_reference
    capabilities_service.persist_readiness_snapshot = (
        lambda *, dry_run_readiness: fixed_readiness_persisted_at
    )
    capabilities_service.load_latest_readiness_snapshot_reference = (
        lambda: fixed_readiness_reference
    )
    try:
        response = client.get(
            "/api/v1/capabilities",
            headers={"X-Request-ID": "capabilities-test"},
        )

        assert response.status_code == 200
        payload = response.json()

        assert response.headers["X-Request-ID"] == "capabilities-test"
        assert payload["data_status"] == "bounded_matrix"
        assert payload["count"] == 13
        assert payload["readiness_snapshot_id"] == "readiness-snapshot-current"
        assert payload["readiness_persisted_at"] == "2026-03-16T00:00:00Z"
        assert "workflow-readiness interpretation are explicit" in payload["summary"]
        assert payload["items"][0]["feature"] == "device_inventory"
        assert payload["items"][0]["domain"] == "inventory"
        assert payload["items"][0]["support_status"] == "supported"
        assert payload["items"][0]["implementation_status"] == "implemented"
        assert payload["items"][0]["delivery_tier"] == "delivered_read_only"
        assert payload["items"][0]["evidence_basis"] == "live_validated"
        assert payload["items"][0]["version_scope"] == "current onboarded Nokia SR OS lab targets"
        assert payload["items"][0]["vendor_posture"] == "current_nokia_focus"
        assert payload["items"][0]["workflow_readiness_status"] == "supports_planning"
        assert payload["items"][0]["workflow_readiness_scopes"] == ["planning_depth"]
        assert "stable backend-owned contract" in payload["items"][0]["status_detail"]
        assert payload["domain_counts"]["policy"] == 5
        assert payload["domain_counts"]["topology"] == 3
        assert payload["support_counts"]["partially_supported"] == 8
        assert payload["support_counts"]["unknown"] == 1
        assert payload["support_counts"]["not_implemented_in_platform"] == 3
        assert payload["implementation_counts"]["partial"] == 8
        assert payload["implementation_counts"]["planned"] == 4
        assert payload["delivery_tier_counts"]["bounded_partial_read_only"] == 8
        assert payload["delivery_tier_counts"]["future_roadmap"] == 4
        assert payload["evidence_basis_counts"]["persisted_validated"] == 4
        assert payload["vendor_counts"]["nokia"] == 10
        assert payload["vendor_counts"]["juniper"] == 3
        assert payload["vendor_posture_counts"]["current_nokia_focus"] == 10
        assert payload["vendor_posture_counts"]["future_juniper_target"] == 3
        assert payload["workflow_readiness_counts"]["supports_planning"] == 1
        assert payload["workflow_readiness_counts"]["partial_foundation"] == 7
        assert payload["workflow_readiness_counts"]["blocked"] == 1
        assert payload["workflow_readiness_counts"]["context_only"] == 1
        assert payload["workflow_readiness_counts"]["roadmap_only"] == 3
        assert payload["workflow_readiness_scope_counts"]["planning_depth"] == 7
        assert payload["workflow_readiness_scope_counts"]["preview_contracts"] == 2
        assert payload["workflow_readiness_scope_counts"]["validation_contracts"] == 6
        assert payload["workflow_readiness_scope_counts"]["workflow_audit_relationships"] == 2
        assert payload["workflow_readiness_scope_counts"]["phase_transition"] == 4
        assert payload["dry_run_readiness"]["status"] == "bounded_readiness_support"
        assert payload["dry_run_readiness"]["planning_readiness"] == "readiness_planning_supported"
        assert payload["dry_run_readiness"]["phase_recommendation"] == "remain_phase_2_read_only_foundation"
        assert "eventual dry-run-phase planning" in payload["dry_run_readiness"]["summary"]
        assert len(payload["dry_run_readiness"]["prerequisites"]) == 5
        assert len(payload["dry_run_readiness"]["assessment_areas"]) == 5
        assert payload["dry_run_readiness"]["assessment_areas"][0]["area"] == "model_maturity"
        assert payload["dry_run_readiness"]["assessment_areas"][0]["status"] == "mixed"
        assert payload["dry_run_readiness"]["assessment_areas"][1]["status"] == "blocked"
        assert payload["dry_run_readiness"]["assessment_areas"][4]["area"] == "blocker_maturity"
        assert payload["dry_run_readiness"]["assessment_areas"][4]["status"] == "blocked"
        assert payload["dry_run_readiness"]["prerequisites"][0]["prerequisite"] == "inventory_read_model"
        assert payload["dry_run_readiness"]["prerequisites"][0]["status"] == "ready"
        assert payload["dry_run_readiness"]["prerequisites"][0]["support_posture"] == "supported"
        assert payload["dry_run_readiness"]["prerequisites"][0]["evidence_basis"] == "live_validated"
        assert payload["dry_run_readiness"]["prerequisites"][0]["evidence_coverage"] == "strong"
        assert payload["dry_run_readiness"]["prerequisites"][0]["related_capabilities"] == [
            "device_inventory"
        ]
        assert payload["dry_run_readiness"]["prerequisites"][1]["status"] == "partial"
        assert payload["dry_run_readiness"]["prerequisites"][1]["evidence_coverage"] == "bounded"
        assert payload["dry_run_readiness"]["evidence_coverage_counts"]["strong"] == 2
        assert payload["dry_run_readiness"]["evidence_coverage_counts"]["bounded"] == 2
        assert payload["dry_run_readiness"]["support_posture_counts"]["supported"] == 2
        assert payload["dry_run_readiness"]["support_posture_counts"]["partially_supported"] == 3
        assert payload["dry_run_readiness"]["blocker_category_counts"]["contract"] == 3
        assert payload["dry_run_readiness"]["blocker_category_counts"]["truth"] == 2
        assert payload["dry_run_readiness"]["blocker_category_counts"]["history"] == 1
        assert payload["dry_run_readiness"]["blocker_severity_counts"]["critical"] == 3
        assert payload["dry_run_readiness"]["blocker_severity_counts"]["major"] == 3
        assert payload["dry_run_readiness"]["blocked_scope_counts"]["phase_transition"] == 6
        assert "Readiness support is not dry-run functionality." in payload["dry_run_readiness"]["notes"]
        assert "No durable workflow lifecycle model exists yet" in payload["dry_run_readiness"]["strongest_blockers"][0]
        assert payload["dry_run_readiness"]["bounded_next_steps"][0].startswith("Define the future workflow lifecycle model")
        assert len(payload["dry_run_readiness"]["blockers"]) == 6
        assert (
            payload["dry_run_readiness"]["blockers"][0]["blocker"]
            == "workflow_lifecycle_contract_missing"
        )
        assert payload["dry_run_readiness"]["blockers"][0]["severity"] == "critical"
        assert (
            payload["dry_run_readiness"]["blockers"][0]["blocked_readiness_scopes"][0]
            == "planning_depth"
        )
        assert payload["items"][1]["feature"] == "topology_observation"
        assert payload["items"][1]["workflow_readiness_status"] == "partial_foundation"
        assert "validation_contracts" in payload["items"][1]["workflow_readiness_scopes"]
        assert payload["items"][2]["feature"] == "topology_persisted_comparison"
        assert "preview_contracts" in payload["items"][2]["workflow_readiness_scopes"]
        assert payload["items"][6]["feature"] == "bgp_signaled_policy_detail"
        assert payload["items"][6]["workflow_readiness_status"] == "blocked"
        assert payload["items"][10]["vendor"] == "juniper"
        assert payload["items"][10]["vendor_posture"] == "future_juniper_target"
        assert payload["items"][10]["delivery_tier"] == "future_roadmap"
        assert payload["items"][10]["version_scope"] == "planned next expansion"
        assert payload["items"][10]["workflow_readiness_status"] == "roadmap_only"
        assert payload["items"][11]["domain"] == "topology"
        assert payload["items"][12]["domain"] == "policy"
        assert datetime.fromisoformat(payload["generated_at"]) is not None
    finally:
        capabilities_service.persist_readiness_snapshot = original_persist
        capabilities_service.load_latest_readiness_snapshot_reference = (
            original_load_reference
        )


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

    class StubOdlClient:
        def read_controller_observation(self) -> OdlControllerObservation:
            return OdlControllerObservation(
                observation_state="ok",
                observed_source="odl_restconf_capability_probe",
                observation_summary="ODL probe succeeded.",
                observed_capabilities=[],
                notes=[],
            )

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
        "app_api.services.platform.get_collector_inventory_client",
        lambda: StubCollectorInventoryClient(),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_topology_client",
        lambda: StubCollectorTopologyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_policy_client",
        lambda: StubCollectorPolicyClient(),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_odl_client",
        lambda: StubOdlClient(),
    )
    monkeypatch.setattr(
        "app_api.metrics.router.summarize_sync_run_history",
        _build_sync_run_history_summary,
    )
    monkeypatch.setattr(
        "app_api.services.capabilities.load_latest_readiness_snapshot_reference",
        lambda: SimpleNamespace(
            snapshot_id="readiness-snapshot-metrics",
            persisted_at=datetime.fromisoformat("2026-03-16T10:15:00+00:00"),
        ),
    )
    reset_metrics_registry()
    client.get("/api/v1/health")
    client.get("/api/v1/devices")
    client.get("/api/v1/topology")
    client.get("/api/v1/policies")
    client.get("/api/v1/platform/status")
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
    assert "platform_app_api_collector_boundary_latest_fetch_duration_seconds" in response.text
    assert "platform_app_api_collector_boundary_timeout_budget_seconds" in response.text
    assert "platform_app_api_collector_boundary_latest_fetch_posture" in response.text
    assert (
        'platform_app_api_collector_boundary_latest_fetch_duration_seconds{model_family="inventory",outcome="live_normalized_feed"} 0.184000000'
        in response.text
    )
    assert (
        'platform_app_api_collector_boundary_timeout_budget_seconds{model_family="topology"}'
        in response.text
    )
    assert (
        'platform_app_api_collector_boundary_latest_fetch_posture{model_family="policy",outcome="live_normalized_feed"} 1'
        in response.text
    )
    assert "platform_app_api_topology_nodes 2" in response.text
    assert "platform_app_api_topology_links 1" in response.text
    assert "platform_app_api_topology_paired_links 1" in response.text
    assert "platform_app_api_topology_single_sided_links 0" in response.text
    assert (
        'platform_app_api_topology_coverage_posture{inference_posture="inferred",'
        'endpoint_pairing_posture="paired",collection_posture="ok"} 1'
        in response.text
    )
    assert (
        'data_status="live",serving_mode="live_collector",sync_status="ok",'
        'completeness="partial"'
    ) in response.text
    assert (
        'platform_app_api_topology_evidence_posture{source_posture="live_observed",'
        'evidence_kind="observed_plus_inferred",confidence_posture="bounded_partial",'
        'freshness_posture="current",blocked_reason="none"} 1'
    ) in response.text
    assert 'platform_app_api_topology_nodes_by_state{state="up"} 2' in response.text
    assert 'platform_app_api_topology_links_by_state{state="up"} 1' in response.text
    assert "platform_app_api_policy_records 2" in response.text
    assert "platform_app_api_policy_observed_policy_count 2" in response.text
    assert "platform_app_api_policy_observed_targets 34" in response.text
    assert "platform_app_api_policy_capable_targets 34" in response.text
    assert (
        'platform_app_api_policy_snapshot_status{data_status="live",'
        'serving_mode="live_collector",sync_status="ok",completeness="partial",'
        'detail_mode="static_policies_when_present",empty_reason="none"} 1'
    ) in response.text
    assert (
        'platform_app_api_policy_evidence_posture{source_posture="live_observed",'
        'evidence_kind="aggregate_plus_bounded_records",'
        'confidence_posture="bounded_partial",freshness_posture="current",'
        'blocked_reason="none"} 1'
    ) in response.text
    assert 'platform_app_api_policy_records_by_observed_state{state="active"} 1' in response.text
    assert 'platform_app_api_policy_records_by_type{type="static_local"} 1' in response.text
    assert (
        'platform_app_api_readiness_status{status="bounded_readiness_support",'
        'planning_readiness="readiness_planning_supported",'
        'phase_recommendation="remain_phase_2_read_only_foundation"} 1'
    ) in response.text
    assert (
        "platform_app_api_readiness_snapshot_persisted_at_seconds 1773656100.000"
        in response.text
    )
    assert (
        'platform_app_api_readiness_prerequisites_by_evidence_coverage{coverage="bounded"} 2'
        in response.text
    )
    assert (
        'platform_app_api_readiness_blockers_by_category_and_severity{category="contract",'
        'severity="critical"} 3'
    ) in response.text


def test_metrics_endpoint_exports_mixed_topology_pairing_posture(monkeypatch) -> None:
    _disable_read_side_persistence(monkeypatch)

    class StubCollectorInventoryClient:
        def read_inventory_snapshot(self) -> CollectorInventorySnapshot:
            return _build_live_inventory_snapshot()

    class StubCollectorTopologyClient:
        def read_topology_snapshot(self) -> CollectorTopologySnapshot:
            return _build_live_mixed_topology_snapshot()

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
    monkeypatch.setattr(
        "app_api.services.capabilities.load_latest_readiness_snapshot_reference",
        lambda: SimpleNamespace(
            snapshot_id="readiness-snapshot-metrics",
            persisted_at=datetime.fromisoformat("2026-03-16T10:15:00+00:00"),
        ),
    )
    reset_metrics_registry()
    client.get("/api/v1/topology")

    response = client.get("/metrics")

    assert response.status_code == 200
    assert "platform_app_api_topology_paired_links 1" in response.text
    assert "platform_app_api_topology_single_sided_links 1" in response.text
    assert (
        'platform_app_api_topology_coverage_posture{inference_posture="inferred",'
        'endpoint_pairing_posture="partially_paired",collection_posture="degraded"} 1'
        in response.text
    )
    assert 'platform_app_api_readiness_blocked_scopes{scope="phase_transition"} 6' in response.text
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


def test_metrics_endpoint_exports_timeout_boundary_posture(monkeypatch) -> None:
    class StubOdlClient:
        def read_controller_observation(self) -> OdlControllerObservation:
            return OdlControllerObservation(
                observation_state="ok",
                observed_source="odl_restconf_capability_probe",
                observation_summary="ODL probe succeeded.",
                observed_capabilities=[],
                notes=[],
            )

    monkeypatch.setattr(
        "app_api.services.platform.get_odl_client",
        lambda: StubOdlClient(),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_inventory_client",
        lambda: SimpleNamespace(
            read_inventory_snapshot=lambda: CollectorInventorySnapshot(
                integration="gnmi_collector_inventory",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint="http://gnmi-collector:9804/inventory/snapshot",
                configured_target_count=0,
                observed_target_count=0,
                collection_success_count=0,
                collection_partial_count=0,
                collection_failure_count=0,
                oldest_observed_at=None,
                newest_observed_at=None,
                degraded_scope_summary="No configured inventory targets returned usable live inventory evidence.",
                records=[],
                notes=[],
                timeout_budget_seconds=3,
                fetch_duration_seconds=3.021,
                fetch_error_kind="timeout_budget_exceeded",
                fetch_error="Collector boundary exceeded the 3s latency budget while reading inventory snapshot from http://gnmi-collector:9804/inventory/snapshot.",
            )
        ),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_topology_client",
        lambda: SimpleNamespace(read_topology_snapshot=_build_live_topology_snapshot),
    )
    monkeypatch.setattr(
        "app_api.services.platform.get_collector_policy_client",
        lambda: SimpleNamespace(read_policy_snapshot=_build_live_policy_snapshot),
    )

    reset_metrics_registry()
    client.get("/api/v1/platform/status")

    response = client.get("/metrics")

    assert response.status_code == 200
    assert (
        'platform_app_api_collector_boundary_latest_fetch_duration_seconds{model_family="inventory",outcome="timeout_budget_exceeded"} 3.021000000'
        in response.text
    )
    assert (
        'platform_app_api_collector_boundary_latest_fetch_posture{model_family="inventory",outcome="timeout_budget_exceeded"} 1'
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

"""Tests for deeper topology truth v1 (merge + correlation)."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app_api.integrations.collector.topology import CollectorTopologySnapshot
from app_api.integrations.odl.bgp_ls_topology import BgplsTopologyFetchResult
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot
from app_api.services import topology_truth as tt_mod


def _collector_live() -> CollectorTopologySnapshot:
    return CollectorTopologySnapshot(
        integration="gnmi_collector_topology",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804",
        configured_target_count=2,
        observed_target_count=2,
        collection_success_count=2,
        collection_partial_count=0,
        collection_failure_count=0,
        degraded_scope_summary="",
        inference_posture="inferred",
        endpoint_pairing_posture="paired",
        collection_posture="ok",
        node_participation_posture="fully_linked",
        paired_link_count=1,
        single_sided_link_count=0,
        linked_node_count=2,
        isolated_node_count=0,
        topology_id="c",
        topology_name="c",
        sync_source="gnmi",
        sync_status="ok",
        completeness="partial",
        observed_at=datetime.now(UTC).isoformat(),
    )


def _device_snapshot() -> TopologySnapshot:
    return TopologySnapshot(
        topology_id="lab:gnmi:1",
        topology_name="test",
        nodes=[
            TopologyNode(
                node_id="PE1",
                display_name="PE1",
                role="pe",
                state="up",
                source="gnmi",
                device_id="PE1",
                attributes={},
            ),
            TopologyNode(
                node_id="PE2",
                display_name="PE2",
                role="pe",
                state="up",
                source="gnmi",
                device_id="PE2",
                attributes={},
            ),
            TopologyNode(
                node_id="PE3",
                display_name="PE3",
                role="pe",
                state="up",
                source="gnmi",
                device_id="PE3",
                attributes={},
            ),
        ],
        links=[
            TopologyLink(
                link_id="L1",
                source_node_id="PE1",
                target_node_id="PE2",
                state="up",
                source="gnmi",
                endpoint_pairing_state="paired",
                endpoint_evidence_count=2,
                physical_adjacency_posture="bidirectional_lldp",
                lldp_observation_count=2,
                lldp_bidirectional=True,
                lldp_local_interfaces=["to-PE2", "to-PE1"],
                lldp_remote_systems=["PE1", "PE2"],
                lldp_remote_ports=["to-PE2", "to-PE1"],
                attributes={},
            ),
            TopologyLink(
                link_id="L2",
                source_node_id="PE1",
                target_node_id="PE3",
                state="up",
                source="gnmi",
                endpoint_pairing_state="single_sided",
                endpoint_evidence_count=1,
                physical_adjacency_posture="suppressed_or_unknown",
                attributes={},
            ),
        ],
        sync_source="gnmi",
        sync_status="ok",
        completeness="partial",
        observed_at=datetime.now(UTC),
        notes=[],
    )


def test_merge_multi_source_confirmed_and_inferred_only(monkeypatch: pytest.MonkeyPatch) -> None:
    ctrl = TopologySnapshot(
        topology_id="odl:x",
        topology_name="c",
        nodes=[
            TopologyNode(
                node_id="ctrl:PE1",
                display_name="PE1",
                role="controller_export",
                state="up",
                source="controller_bgpls",
                attributes={},
            ),
            TopologyNode(
                node_id="ctrl:PE2",
                display_name="PE2",
                role="controller_export",
                state="up",
                source="controller_bgpls",
                attributes={},
            ),
            TopologyNode(
                node_id="ctrl:PE3",
                display_name="PE3",
                role="controller_export",
                state="up",
                source="controller_bgpls",
                attributes={},
            ),
        ],
        links=[
            TopologyLink(
                link_id="c1",
                source_node_id="ctrl:PE1",
                target_node_id="ctrl:PE2",
                state="up",
                source="controller_bgpls",
                endpoint_pairing_state="paired",
                endpoint_evidence_count=2,
                attributes={},
            ),
        ],
        sync_source="controller_bgpls",
        sync_status="ok",
        completeness="partial",
        notes=[],
    )
    bgp = BgplsTopologyFetchResult(
        status="ok",
        observed_source="test",
        snapshot=ctrl,
        fingerprint="abc",
        notes=["test"],
    )

    monkeypatch.setattr(
        tt_mod,
        "load_topology_snapshot_for_topology_relationship_queries",
        lambda: (_collector_live(), _device_snapshot(), None),
    )
    monkeypatch.setattr(tt_mod, "fetch_bgpls_topology_via_odl", lambda: bgp)
    monkeypatch.setattr(tt_mod, "_persist_merged_snapshot", lambda **kwargs: None)

    res = tt_mod.build_topology_truth_response(truth_posture=None)
    by_id = {x.link_id: x.truth_posture for x in res.merged_topology.links}
    assert by_id.get("L1") == "multi_source_confirmed"
    assert by_id.get("L2") == "inferred_only"
    assert res.counts.multi_source_confirmed_link_count == 1
    assert res.contract_id == "topology_truth_v1"


def test_merge_promotes_igp_confirmed_link_without_controller(monkeypatch: pytest.MonkeyPatch) -> None:
    device = _device_snapshot()
    updated_links = []
    for link in device.links:
        if link.link_id == "L2":
            updated_links.append(
                link.model_copy(
                    update={
                        "control_plane_adjacency_posture": "igp_confirmed",
                        "igp_adjacency_observation_count": 1,
                        "igp_protocols_observed": ["ospf"],
                        "ospf_adjacency_state": "full",
                        "igp_local_interfaces": ["to-PE3"],
                        "igp_remote_identities": ["10.255.255.3"],
                        "igp_correlation_notes": ["OSPF remote router-id resolved cleanly to PE3."],
                    }
                )
            )
        else:
            updated_links.append(link)
    device = device.model_copy(update={"links": updated_links})

    monkeypatch.setattr(
        tt_mod,
        "load_topology_snapshot_for_topology_relationship_queries",
        lambda: (_collector_live(), device, None),
    )
    monkeypatch.setattr(
        tt_mod,
        "fetch_bgpls_topology_via_odl",
        lambda: BgplsTopologyFetchResult(
            status="ok",
            observed_source="test",
            snapshot=TopologySnapshot(
                topology_id="odl:x",
                topology_name="c",
                nodes=[],
                links=[],
                sync_source="controller_bgpls",
                sync_status="ok",
                completeness="partial",
                notes=[],
            ),
            fingerprint="abc",
            notes=[],
        ),
    )
    monkeypatch.setattr(tt_mod, "_persist_merged_snapshot", lambda **kwargs: None)

    res = tt_mod.build_topology_truth_response(truth_posture=None)
    link = next(item for item in res.merged_topology.links if item.link_id == "L2")
    assert link.truth_posture == "igp_confirmed"
    assert link.control_plane_adjacency_posture == "igp_confirmed"
    assert link.control_plane_adjacency.protocols_observed == ["ospf"]
    assert "ospf_adjacency" in link.provenance.contributing_sources
    assert res.counts.igp_confirmed_link_count >= 1


def test_merge_marks_igp_protocol_mismatch_as_conflicting(monkeypatch: pytest.MonkeyPatch) -> None:
    device = _device_snapshot()
    updated_links = []
    for link in device.links:
        if link.link_id == "L1":
            updated_links.append(
                link.model_copy(
                    update={
                        "control_plane_adjacency_posture": "protocol_mismatch",
                        "igp_adjacency_observation_count": 1,
                        "igp_protocols_observed": ["isis"],
                        "isis_adjacency_state": "up",
                        "igp_remote_identities": ["49.0001.0000.0000.9999.00"],
                        "igp_correlation_notes": ["IGP remote identity resolved to a different peer."],
                    }
                )
            )
        else:
            updated_links.append(link)
    device = device.model_copy(update={"links": updated_links})

    monkeypatch.setattr(
        tt_mod,
        "load_topology_snapshot_for_topology_relationship_queries",
        lambda: (_collector_live(), device, None),
    )
    monkeypatch.setattr(
        tt_mod,
        "fetch_bgpls_topology_via_odl",
        lambda: BgplsTopologyFetchResult(
            status="ok",
            observed_source="test",
            snapshot=TopologySnapshot(
                topology_id="odl:x",
                topology_name="c",
                nodes=[],
                links=[],
                sync_source="controller_bgpls",
                sync_status="ok",
                completeness="partial",
                notes=[],
            ),
            fingerprint="abc",
            notes=[],
        ),
    )
    monkeypatch.setattr(tt_mod, "_persist_merged_snapshot", lambda **kwargs: None)

    res = tt_mod.build_topology_truth_response(truth_posture=None)
    link = next(item for item in res.merged_topology.links if item.link_id == "L1")
    assert link.truth_posture == "conflicting"
    assert link.disagreement is not None
    assert link.disagreement.kind in {
        "igp_inference_mismatch",
        "igp_lldp_mismatch",
    }
    assert res.counts.igp_protocol_mismatch_link_count >= 1


def test_controller_only_node_partial(monkeypatch: pytest.MonkeyPatch) -> None:
    ctrl = TopologySnapshot(
        topology_id="odl:x",
        topology_name="c",
        nodes=[
            TopologyNode(
                node_id="ctrl:PE1",
                display_name="PE1",
                role="controller_export",
                state="up",
                source="controller_bgpls",
                attributes={},
            ),
            TopologyNode(
                node_id="ctrl:ORPHAN",
                display_name="ORPHAN",
                role="controller_export",
                state="up",
                source="controller_bgpls",
                attributes={},
            ),
        ],
        links=[],
        sync_source="controller_bgpls",
        sync_status="ok",
        completeness="partial",
        notes=[],
    )
    bgp = BgplsTopologyFetchResult(
        status="ok",
        observed_source="test",
        snapshot=ctrl,
        fingerprint="abc",
        notes=[],
    )
    monkeypatch.setattr(
        tt_mod,
        "load_topology_snapshot_for_topology_relationship_queries",
        lambda: (_collector_live(), _device_snapshot(), None),
    )
    monkeypatch.setattr(tt_mod, "fetch_bgpls_topology_via_odl", lambda: bgp)
    monkeypatch.setattr(tt_mod, "_persist_merged_snapshot", lambda **kwargs: None)

    res = tt_mod.build_topology_truth_response(truth_posture=None)
    partial = [n for n in res.merged_topology.nodes if n.truth_posture == "partial"]
    assert any("ORPHAN" in n.node_id for n in partial)


def test_device_controller_node_conflict(monkeypatch: pytest.MonkeyPatch) -> None:
    ctrl = TopologySnapshot(
        topology_id="odl:x",
        topology_name="c",
        nodes=[
            TopologyNode(
                node_id="ctrl:PE1",
                display_name="PE1",
                role="controller_export",
                state="down",
                source="controller_bgpls",
                attributes={},
            ),
        ],
        links=[],
        sync_source="controller_bgpls",
        sync_status="ok",
        completeness="partial",
        notes=[],
    )
    bgp = BgplsTopologyFetchResult(status="ok", observed_source="t", snapshot=ctrl, fingerprint="x", notes=[])

    monkeypatch.setattr(
        tt_mod,
        "load_topology_snapshot_for_topology_relationship_queries",
        lambda: (_collector_live(), _device_snapshot(), None),
    )
    monkeypatch.setattr(tt_mod, "fetch_bgpls_topology_via_odl", lambda: bgp)
    monkeypatch.setattr(tt_mod, "_persist_merged_snapshot", lambda **kwargs: None)

    res = tt_mod.build_topology_truth_response(truth_posture=None)
    pe1 = next(n for n in res.merged_topology.nodes if n.node_id == "PE1")
    assert pe1.truth_posture == "conflicting"


def test_topology_truth_api_route() -> None:
    from fastapi.testclient import TestClient

    from app_api.main import app

    client = TestClient(app)
    r = client.get("/api/v1/topology/truth")
    assert r.status_code == 200
    body = r.json()
    assert body["contract_id"] == "topology_truth_v1"
    assert "merged_topology" in body

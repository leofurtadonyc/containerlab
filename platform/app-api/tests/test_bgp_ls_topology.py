"""Tests for ODL network-topology RESTCONF parse (ietf-network-topology)."""

from __future__ import annotations

from io import BytesIO
from unittest.mock import patch

import pytest
from urllib.error import HTTPError

from app_api.integrations.odl import bgp_ls_topology as mod
from app_api.integrations.odl.client import OdlClient, OdlClientConfig
from app_api.models.topology import TopologyNode, TopologySnapshot


def test_parse_network_topology_payload_ietf_rfc8345_shape() -> None:
    payload = {
        "ietf-network-topology:network-topologies": {
            "topology": [
                {
                    "topology-id": "topo1",
                    "node": [{"node-id": "n1"}, {"node-id": "n2"}],
                    "link": [
                        {
                            "link-id": "n1:tp1:n2:tp2",
                            "source": {"source-node": "n1"},
                            "destination": {"dest-node": "n2"},
                        }
                    ],
                }
            ]
        }
    }
    nodes, links, notes = mod._parse_network_topology_payload(payload)
    assert len(nodes) == 2
    assert nodes[0].node_id == "ctrl:n1"
    assert len(links) == 1
    assert "Parsed" in notes[0]


def test_parse_network_topology_payload_legacy_network_topology_key() -> None:
    payload = {
        "network-topology:network-topology": {
            "topology": [
                {
                    "topology-id": "t",
                    "node": [{"node-id": "a"}],
                    "link": [],
                }
            ]
        }
    }
    nodes, links, _ = mod._parse_network_topology_payload(payload)
    assert len(nodes) == 1
    assert nodes[0].node_id == "ctrl:a"
    assert links == []


def test_is_restconf_unknown_element() -> None:
    assert mod._is_restconf_unknown_element(
        '{"errors":{"error":[{"error-tag":"unknown-element"}]}}'
    )
    assert not mod._is_restconf_unknown_element(
        '{"errors":{"error":[{"error-tag":"data-missing"}]}}'
    )
    assert not mod._is_restconf_unknown_element("")


def test_fetch_bgpls_topology_falls_back_when_ietf_returns_unknown_element() -> None:
    cfg = OdlClientConfig(
        base_url="http://odl", username="a", password="b", timeout_seconds=5
    )
    client = OdlClient(cfg)
    urls: list[str] = []

    def fake_urlopen(request: object, timeout: object = None) -> object:
        full_url = getattr(request, "full_url", "")
        urls.append(str(full_url))
        if "ietf-network-topology" in full_url:
            raise HTTPError(
                full_url,
                400,
                "Bad Request",
                {},
                BytesIO(b'{"errors":{"error":[{"error-tag":"unknown-element"}]}}'),
            )

        class OkResp:
            def __enter__(self) -> OkResp:
                return self

            def __exit__(self, *a: object) -> None:
                pass

            def read(self) -> bytes:
                return b'{"network-topology:network-topology":{"topology":[]}}'

        return OkResp()

    with patch("app_api.integrations.odl.bgp_ls_topology.urlopen", side_effect=fake_urlopen):
        res = mod.fetch_bgpls_topology_via_odl(client=client)

    assert len(urls) == 2
    assert "ietf-network-topology" in urls[0]
    assert "network-topology:network-topology" in urls[1]
    assert res.status == "empty"
    assert any("legacy network-topology" in n for n in res.snapshot.notes)


def test_lab_like_aggregate_yields_pcep_node_and_scope_markers() -> None:
    payload = {
        "network-topology:network-topology": {
            "topology": [
                {
                    "topology-id": "example-ipv6-topology",
                    "odl-bgp-topology-config:rib-id": "example-bgp-rib",
                    "server-provided": True,
                    "topology-types": {
                        "odl-bgp-topology-types:bgp-ipv6-reachability-topology": {}
                    },
                },
                {"topology-id": "topology-netconf"},
                {
                    "topology-id": "example-linkstate-topology",
                    "odl-bgp-topology-config:rib-id": "example-bgp-rib",
                    "server-provided": True,
                    "topology-types": {
                        "odl-bgp-topology-types:bgp-linkstate-topology": {}
                    },
                },
                {
                    "topology-id": "pcep-topology",
                    "node": [
                        {
                            "node-id": "43.43.43.43",
                            "network-topology-pcep:session-config": {},
                        }
                    ],
                    "topology-types": {"network-topology-pcep:topology-pcep": {}},
                },
                {
                    "topology-id": "example-ipv4-topology",
                    "odl-bgp-topology-config:rib-id": "example-bgp-rib",
                    "server-provided": True,
                    "topology-types": {
                        "odl-bgp-topology-types:bgp-ipv4-reachability-topology": {}
                    },
                },
            ]
        }
    }
    nodes, links, notes = mod._parse_network_topology_payload(payload)
    assert len(nodes) == 1
    assert nodes[0].node_id == "ctrl:43.43.43.43"
    topologies = mod._extract_topology_list(payload)
    nodes, notes = mod._append_scope_markers(topologies, nodes, links, notes)
    assert len(nodes) == 5
    assert sum(1 for n in nodes if n.role == "controller_topology_scope") == 4
    scope_kinds = {n.attributes.get("controller_topology_kind") for n in nodes if n.role == "controller_topology_scope"}
    assert "bgp_linkstate" in scope_kinds
    assert "netconf" in scope_kinds
    assert any("scope marker" in n for n in notes)


def test_topology_truth_scope_nodes_no_missing_device_disagreement(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app_api.services import topology_truth as tt_mod

    from tests.test_topology_truth import _collector_live, _device_snapshot

    ctrl = TopologySnapshot(
        topology_id="odl:x",
        topology_name="c",
        nodes=[
            TopologyNode(
                node_id="ctrl:topo:example-linkstate-topology",
                display_name="scope:example-linkstate-topology",
                role="controller_topology_scope",
                state="up",
                source="controller_bgpls",
                attributes={"controller_topology_scope": "true"},
            ),
        ],
        links=[],
        sync_source="controller_bgpls",
        sync_status="ok",
        completeness="partial",
        notes=[],
    )
    bgp = mod.BgplsTopologyFetchResult(
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
    scope_nodes = [
        n
        for n in res.merged_topology.nodes
        if n.role == "controller_topology_scope"
    ]
    assert len(scope_nodes) == 1
    assert scope_nodes[0].disagreement is None
    assert scope_nodes[0].truth_posture == "controller_correlated"
    assert not any(
        d.kind == "missing_device_evidence"
        and "topo:example-linkstate" in d.object_id
        for d in res.disagreements
    )

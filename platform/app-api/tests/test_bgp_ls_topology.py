"""Tests for ODL network-topology RESTCONF parse (ietf-network-topology)."""

from __future__ import annotations

from app_api.integrations.odl import bgp_ls_topology as mod


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

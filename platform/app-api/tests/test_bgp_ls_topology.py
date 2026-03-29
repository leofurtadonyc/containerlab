"""Tests for ODL network-topology RESTCONF parse (ietf-network-topology)."""

from __future__ import annotations

from io import BytesIO
from unittest.mock import patch

from urllib.error import HTTPError

from app_api.integrations.odl import bgp_ls_topology as mod
from app_api.integrations.odl.client import OdlClient, OdlClientConfig


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

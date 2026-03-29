"""Bounded BGP-LS / network-topology fetch through ODL RESTCONF (enrichment only, not product truth)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Literal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app_api.integrations.odl.client import OdlClient, get_odl_client
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot


ControllerFetchStatus = Literal["ok", "degraded", "unreachable", "empty"]


@dataclass(frozen=True)
class BgplsTopologyFetchResult:
    """Normalized outcome of a bounded controller topology read."""

    status: ControllerFetchStatus
    observed_source: str
    snapshot: TopologySnapshot
    fingerprint: str
    notes: list[str]


def _fingerprint_payload(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:32]


def _empty_snapshot() -> TopologySnapshot:
    return TopologySnapshot(
        topology_id="odl:bgp_ls:unavailable",
        topology_name="controller_bgpls_empty",
        nodes=[],
        links=[],
        sync_source="controller_bgpls",
        sync_status="unknown",
        completeness="partial",
        observed_at=None,
        notes=["No controller-derived topology elements were normalized in this bounded read."],
    )


def _parse_network_topology_payload(payload: dict[str, Any]) -> tuple[list[TopologyNode], list[TopologyLink], list[str]]:
    """Extract minimal node/link tuples from IETF network-topology style JSON.

    RESTCONF may return RFC 8345 ``ietf-network-topology:network-topologies`` (preferred) or
    legacy/alternate shapes (``network-topology:network-topology``) depending on controller.
    """
    notes: list[str] = []
    nodes: list[TopologyNode] = []
    links: list[TopologyLink] = []
    nt = (
        payload.get("ietf-network-topology:network-topologies")
        or payload.get("network-topology:network-topology")
        or payload.get("network-topology", {})
    )
    if isinstance(nt, dict):
        topologies = nt.get("topology", [])
    elif isinstance(nt, list):
        topologies = nt
    else:
        topologies = []
    if not isinstance(topologies, list):
        return nodes, links, ["Unexpected network-topology shape; no topology list."]

    node_ids_seen: set[str] = set()
    for topo in topologies:
        if not isinstance(topo, dict):
            continue
        tname = str(topo.get("topology-id", "default"))
        for n in topo.get("node", []) or []:
            if not isinstance(n, dict):
                continue
            nid = n.get("node-id")
            if not isinstance(nid, str) or not nid:
                continue
            if nid in node_ids_seen:
                continue
            node_ids_seen.add(nid)
            nodes.append(
                TopologyNode(
                    node_id=f"ctrl:{nid}",
                    display_name=nid,
                    role="controller_export",
                    state="up",
                    source="controller_bgpls",
                    device_id=None,
                    attributes={"topology_id": tname, "export": "odl_network_topology"},
                )
            )
        for lk in topo.get("link", []) or []:
            if not isinstance(lk, dict):
                continue
            lid = lk.get("link-id")
            src = None
            tgt = None
            if isinstance(lid, str) and ":" in lid:
                parts = lid.split(":", 2)
                if len(parts) >= 3:
                    src, tgt = parts[0], parts[2]
            # IETF link has source/destination termination points
            src_tp = lk.get("source", {}) if isinstance(lk.get("source"), dict) else {}
            dst_tp = lk.get("destination", {}) if isinstance(lk.get("destination"), dict) else {}
            if src is None and isinstance(src_tp, dict):
                src = src_tp.get("source-node") or src_tp.get("source-node-ref")
            if tgt is None and isinstance(dst_tp, dict):
                tgt = dst_tp.get("dest-node") or dst_tp.get("dest-node-ref")
            if not isinstance(src, str) or not isinstance(tgt, str):
                continue
            link_id = f"ctrl:{src}::{tgt}"
            links.append(
                TopologyLink(
                    link_id=link_id,
                    source_node_id=f"ctrl:{src}",
                    target_node_id=f"ctrl:{tgt}",
                    state="up",
                    source="controller_bgpls",
                    endpoint_pairing_state="paired",
                    endpoint_evidence_count=2,
                    attributes={"topology_id": tname, "export": "odl_network_topology"},
                )
            )

    if nodes or links:
        notes.append(
            f"Parsed {len(nodes)} controller-exported nodes and {len(links)} links from bounded network-topology JSON."
        )
    else:
        notes.append(
            "Controller returned network-topology JSON but no node/link elements were extracted by the bounded parser."
        )
    return nodes, links, notes


def fetch_bgpls_topology_via_odl(client: OdlClient | None = None) -> BgplsTopologyFetchResult:
    """Fetch and normalize a bounded controller topology view (ODL RESTCONF).

    ODL remains enrichment plumbing: the backend correlates this with gNMI-derived topology;
    this snapshot alone is not the product's sole source of truth.
    """
    observed_source = "odl_restconf_network_topology"
    c = client or get_odl_client()
    # RFC 8345 module name is ``ietf-network-topology``; top-level container is ``network-topologies``.
    path = "/rests/data/ietf-network-topology:network-topologies"
    try:
        request = Request(
            url=f"{c.config.base_url.rstrip('/')}{path}",
            headers=c._build_headers(),
        )
        with urlopen(request, timeout=c.config.timeout_seconds) as response:
            raw = response.read().decode("utf-8")
        payload = json.loads(raw)
    except HTTPError as exc:
        if exc.code in {401, 403, 404}:
            snap = _empty_snapshot()
            return BgplsTopologyFetchResult(
                status="empty",
                observed_source=observed_source,
                snapshot=snap,
                fingerprint=_fingerprint_payload({"error": exc.code}),
                notes=[
                    f"ODL returned HTTP {exc.code} for bounded network-topology read; enrichment unavailable.",
                    "gNMI-derived topology remains the baseline; controller correlation is optional.",
                ],
            )
        snap = _empty_snapshot()
        return BgplsTopologyFetchResult(
            status="degraded",
            observed_source=observed_source,
            snapshot=snap,
            fingerprint=_fingerprint_payload({"error": exc.code}),
            notes=[f"ODL HTTP {exc.code} during bounded network-topology read."],
        )
    except (URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        snap = _empty_snapshot()
        return BgplsTopologyFetchResult(
            status="unreachable",
            observed_source=observed_source,
            snapshot=snap,
            fingerprint=_fingerprint_payload({"error": str(exc)[:200]}),
            notes=[
                "The backend could not read controller network-topology over RESTCONF.",
                "Topology truth merges will use device-derived evidence only until controller data is available.",
            ],
        )

    nodes, links, parse_notes = _parse_network_topology_payload(payload if isinstance(payload, dict) else {})
    snap = TopologySnapshot(
        topology_id="odl:bgp_ls:network_topology",
        topology_name="controller_network_topology_v1",
        nodes=nodes,
        links=links,
        sync_source="controller_bgpls",
        sync_status="ok" if (nodes or links) else "degraded",
        completeness="partial",
        observed_at=None,
        notes=parse_notes,
    )
    fp = _fingerprint_payload(payload if isinstance(payload, dict) else {"raw": True})
    status: ControllerFetchStatus = "ok" if (nodes or links) else "empty"
    return BgplsTopologyFetchResult(
        status=status,
        observed_source=observed_source,
        snapshot=snap,
        fingerprint=fp,
        notes=parse_notes,
    )

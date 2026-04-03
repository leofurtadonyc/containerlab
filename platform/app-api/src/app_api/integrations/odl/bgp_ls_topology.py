"""Bounded BGP-LS / network-topology fetch through ODL RESTCONF (enrichment only, not product truth)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Literal
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from app_api.integrations.odl.client import OdlClient, get_odl_client
from app_api.integrations.odl.network_topology_common import (
    NetworkTopologyAggregateResult,
    infer_topology_scope_kind,
    is_example_bgp_topology,
)
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


def _http_error_body(exc: HTTPError) -> str:
    try:
        return exc.read().decode("utf-8", errors="replace")
    except OSError:
        return ""


def _extract_topology_list(payload: dict[str, Any]) -> list[dict[str, Any]]:
    nt = (
        payload.get("ietf-network-topology:network-topologies")
        or payload.get("network-topology:network-topology")
        or {}
    )
    if isinstance(nt, dict):
        raw = nt.get("topology", [])
    else:
        raw = []
    if not isinstance(raw, list):
        return []
    return [x for x in raw if isinstance(x, dict)]


def _topology_ids_from_parsed(nodes: list[TopologyNode], links: list[TopologyLink]) -> set[str]:
    s: set[str] = set()
    for n in nodes:
        tid = n.attributes.get("topology_id")
        if tid:
            s.add(tid)
    for lk in links:
        tid = lk.attributes.get("topology_id")
        if tid:
            s.add(tid)
    return s


def _scope_attribute_strings(topo: dict[str, Any]) -> dict[str, str]:
    tid = str(topo.get("topology-id", ""))
    tt = topo.get("topology-types")
    type_keys = ""
    if isinstance(tt, dict):
        type_keys = ";".join(sorted(tt.keys()))
    rib = ""
    for k, v in topo.items():
        if isinstance(k, str) and "rib-id" in k:
            rib = str(v) if v is not None else ""
            break
    out: dict[str, str] = {
        "topology_id": tid,
        "controller_topology_kind": infer_topology_scope_kind(topo),
        "topology_types_keys": type_keys,
        "export": "odl_network_topology_scope",
        "controller_topology_scope": "true",
    }
    if is_example_bgp_topology(topo):
        out["placeholder_example"] = "true"
    if rib:
        out["rib_id"] = rib
    sp = topo.get("server-provided")
    if sp is not None:
        out["server_provided"] = "true" if sp else "false"
    return out


def _is_bgp_linkstate_topology(topo: dict[str, Any]) -> bool:
    if infer_topology_scope_kind(topo) == "bgp_linkstate":
        return True
    topology_id = str(topo.get("topology-id", "")).lower()
    return "linkstate" in topology_id


def _normalize_subresource_payload(data: dict[str, Any]) -> dict[str, Any]:
    if (
        "network-topology:network-topology" in data
        or "ietf-network-topology:network-topologies" in data
    ):
        return data
    if "topology-id" in data:
        return {"network-topology:network-topology": {"topology": [data]}}
    return data


def _restconf_get_json(client: OdlClient, path: str) -> dict[str, Any] | None:
    try:
        request = Request(
            url=f"{client.config.base_url.rstrip('/')}{path}",
            headers=client._build_headers(),
        )
        with urlopen(request, timeout=client.config.timeout_seconds) as response:
            raw = response.read().decode("utf-8")
        out = json.loads(raw)
        return out if isinstance(out, dict) else None
    except HTTPError as exc:
        body = _http_error_body(exc)
        if exc.code in {404, 400} and (
            exc.code == 404 or _is_restconf_unknown_element(body)
        ):
            return None
        return None
    except (URLError, TimeoutError, json.JSONDecodeError, OSError):
        return None


def _enrich_linkstate_subresources(
    client: OdlClient,
    topologies: list[dict[str, Any]],
    nodes: list[TopologyNode],
    links: list[TopologyLink],
    notes: list[str],
) -> tuple[list[TopologyNode], list[TopologyLink], list[str]]:
    have = _topology_ids_from_parsed(nodes, links)
    extra: list[str] = []
    for topo in topologies:
        tid = topo.get("topology-id")
        if not isinstance(tid, str) or not tid:
            continue
        if tid in have:
            continue
        if not _is_bgp_linkstate_topology(topo):
            continue
        sub_path = f"/rests/data/network-topology:network-topology/topology/{quote(tid, safe='')}"
        sub = _restconf_get_json(client, sub_path)
        if sub is None:
            continue
        merged = _normalize_subresource_payload(sub)
        sn, sl, _ = _parse_network_topology_payload(merged)
        if not sn and not sl:
            continue
        nodes.extend(sn)
        links.extend(sl)
        have.update(_topology_ids_from_parsed(sn, sl))
        extra.append(
            f"Merged BGP-LS subtree from {sub_path} ({len(sn)} nodes, {len(sl)} links)."
        )
    return nodes, links, notes + extra


def _append_scope_markers(
    topologies: list[dict[str, Any]],
    nodes: list[TopologyNode],
    links: list[TopologyLink],
    notes: list[str],
) -> tuple[list[TopologyNode], list[str]]:
    have = _topology_ids_from_parsed(nodes, links)
    added = 0
    ignored_placeholders = 0
    for topo in topologies:
        tid = topo.get("topology-id")
        if not isinstance(tid, str) or not tid:
            continue
        if tid in have:
            continue
        if not _is_bgp_linkstate_topology(topo):
            continue
        if is_example_bgp_topology(topo):
            ignored_placeholders += 1
            continue
        n_raw = topo.get("node")
        l_raw = topo.get("link")
        if (isinstance(n_raw, list) and len(n_raw) > 0) or (
            isinstance(l_raw, list) and len(l_raw) > 0
        ):
            continue
        nodes.append(
            TopologyNode(
                node_id=f"ctrl:topo:{tid}",
                display_name=f"scope:{tid}",
                role="controller_topology_scope",
                state="up",
                source="controller_bgpls",
                device_id=None,
                attributes=_scope_attribute_strings(topo),
            )
        )
        have.add(tid)
        added += 1
    if added:
        notes.append(
            f"Added {added} BGP-LS topology scope marker(s) for live link-state topologies with no "
            "extractable node/link rows in this RESTCONF aggregate."
        )
    if ignored_placeholders:
        notes.append(
            f"Ignored {ignored_placeholders} placeholder example BGP/BGP-LS topology scope(s)."
        )
    return nodes, notes


def _is_restconf_unknown_element(body: str) -> bool:
    """True when RESTCONF rejects the request because the YANG module or node is not registered."""
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return False
    for err in data.get("errors", {}).get("error", []) or []:
        if not isinstance(err, dict):
            continue
        if err.get("error-tag") == "unknown-element":
            return True
    return False


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
    ignored_placeholders = 0
    for topo in topologies:
        if not isinstance(topo, dict):
            continue
        if not _is_bgp_linkstate_topology(topo):
            continue
        if is_example_bgp_topology(topo):
            ignored_placeholders += 1
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
            f"Parsed {len(nodes)} BGP-LS controller-exported nodes and {len(links)} links from bounded network-topology JSON."
        )
    else:
        notes.append(
            "Controller returned network-topology JSON but no live BGP-LS node/link elements were extracted by the bounded parser."
        )
    if ignored_placeholders:
        notes.append(
            f"Ignored {ignored_placeholders} placeholder example BGP/BGP-LS topology object(s)."
        )
    return nodes, links, notes


def fetch_bgpls_topology_via_odl(
    client: OdlClient | None = None,
    *,
    preloaded_aggregate: NetworkTopologyAggregateResult | None = None,
) -> BgplsTopologyFetchResult:
    """Fetch and normalize a bounded controller topology view (ODL RESTCONF).

    ODL remains enrichment plumbing: the backend correlates this with gNMI-derived topology;
    this snapshot alone is not the product's sole source of truth.

    When ``preloaded_aggregate`` is supplied (same document as ``fetch_network_topology_aggregate``),
    HTTP is skipped for the aggregate GET so multi-lane evidence can share one RESTCONF read.
    """
    observed_source = "odl_restconf_network_topology"
    c = client or get_odl_client()
    # Prefer RFC 8345 ``ietf-network-topology``; many ODL builds only register the older
    # ``network-topology`` module (draft), which returns HTTP 400 unknown-element for the IETF name.
    path_candidates = (
        "/rests/data/ietf-network-topology:network-topologies",
        "/rests/data/network-topology:network-topology",
    )
    payload: dict[str, Any] | None = None
    path_used: str | None = None

    if preloaded_aggregate is not None:
        if preloaded_aggregate.status == "unreachable":
            snap = _empty_snapshot()
            return BgplsTopologyFetchResult(
                status="unreachable",
                observed_source=observed_source,
                snapshot=snap,
                fingerprint=_fingerprint_payload({"error": "preloaded_unreachable"}),
                notes=list(preloaded_aggregate.notes)
                + [
                    "The backend could not read controller network-topology over RESTCONF.",
                    "Topology truth merges will use device-derived evidence only until controller data is available.",
                ],
            )
        if preloaded_aggregate.status in ("empty", "degraded") or not preloaded_aggregate.payload:
            snap = _empty_snapshot()
            st: ControllerFetchStatus = "empty" if preloaded_aggregate.status == "empty" else "degraded"
            return BgplsTopologyFetchResult(
                status=st,
                observed_source=observed_source,
                snapshot=snap,
                fingerprint=_fingerprint_payload({"error": "preloaded_empty"}),
                notes=list(preloaded_aggregate.notes)
                + [
                    "Preloaded network-topology aggregate was empty or degraded; BGP-LS lane has no normalized objects.",
                ],
            )
        payload = preloaded_aggregate.payload
        path_used = preloaded_aggregate.path_used
    else:
        try:
            for path in path_candidates:
                request = Request(
                    url=f"{c.config.base_url.rstrip('/')}{path}",
                    headers=c._build_headers(),
                )
                try:
                    with urlopen(request, timeout=c.config.timeout_seconds) as response:
                        raw = response.read().decode("utf-8")
                    payload = json.loads(raw)
                    path_used = path
                    break
                except HTTPError as exc:
                    body = _http_error_body(exc)
                    if exc.code in {401, 403}:
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
                    if exc.code == 404 or (
                        exc.code == 400 and _is_restconf_unknown_element(body)
                    ):
                        continue
                    snap = _empty_snapshot()
                    return BgplsTopologyFetchResult(
                        status="degraded",
                        observed_source=observed_source,
                        snapshot=snap,
                        fingerprint=_fingerprint_payload({"error": exc.code, "body": body[:500]}),
                        notes=[f"ODL HTTP {exc.code} during bounded network-topology read."],
                    )
            if payload is None:
                snap = _empty_snapshot()
                return BgplsTopologyFetchResult(
                    status="empty",
                    observed_source=observed_source,
                    snapshot=snap,
                    fingerprint=_fingerprint_payload({"error": "no_topology_path"}),
                    notes=[
                        "ODL did not expose ietf-network-topology or network-topology on RESTCONF; enrichment unavailable.",
                        "gNMI-derived topology remains the baseline; controller correlation is optional.",
                    ],
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
    if path_used == path_candidates[1]:
        parse_notes = [
            *parse_notes,
            "ODL served legacy network-topology:network-topology (ietf-network-topology was not registered on RESTCONF).",
        ]
    topologies = _extract_topology_list(payload if isinstance(payload, dict) else {})
    nodes, links, parse_notes = _enrich_linkstate_subresources(
        c, topologies, nodes, links, parse_notes
    )
    nodes, parse_notes = _append_scope_markers(topologies, nodes, links, parse_notes)
    if nodes:
        parse_notes = [
            n
            for n in parse_notes
            if "no node/link elements were extracted" not in n
        ]
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

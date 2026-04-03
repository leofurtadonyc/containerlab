"""Shared bounded RESTCONF helpers for ODL network-topology aggregates (multi-lane evidence)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Literal

from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app_api.integrations.odl.client import OdlClient, get_odl_client


def http_error_body(exc: HTTPError) -> str:
    try:
        return exc.read().decode("utf-8", errors="replace")
    except OSError:
        return ""


def is_restconf_unknown_element(body: str) -> bool:
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return False
    for err in data.get("errors", {}).get("error", []) or []:
        if isinstance(err, dict) and err.get("error-tag") == "unknown-element":
            return True
    return False


NETWORK_TOPOLOGY_PATH_CANDIDATES = (
    "/rests/data/ietf-network-topology:network-topologies",
    "/rests/data/network-topology:network-topology",
)

PLACEHOLDER_BGP_TOPOLOGY_IDS = frozenset(
    {
        "example-linkstate-topology",
        "example-ipv4-topology",
        "example-ipv6-topology",
    }
)


def extract_topology_list(payload: dict[str, Any]) -> list[dict[str, Any]]:
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


def infer_topology_scope_kind(topo: dict[str, Any]) -> str:
    tt = topo.get("topology-types")
    tid = str(topo.get("topology-id", "")).lower()
    keys = ""
    if isinstance(tt, dict):
        keys = " ".join(tt.keys()).lower()
    if "bgp-linkstate" in keys or "linkstate" in keys:
        return "bgp_linkstate"
    if "bgp-ipv4" in keys:
        return "bgp_ipv4"
    if "bgp-ipv6" in keys:
        return "bgp_ipv6"
    if "pcep" in keys or "topology-pcep" in keys:
        return "pcep"
    if "netconf" in tid:
        return "netconf"
    if "netconf" in keys:
        return "netconf"
    return "other"


def count_node_link_children(topo: dict[str, Any]) -> tuple[int, int]:
    n_raw = topo.get("node") or []
    l_raw = topo.get("link") or []
    nc = len(n_raw) if isinstance(n_raw, list) else 0
    lc = len(l_raw) if isinstance(l_raw, list) else 0
    return nc, lc


def is_example_bgp_topology(topo: dict[str, Any]) -> bool:
    """True when ODL is exposing the stock example BGP/BGP-LS topology objects."""

    topology_id = str(topo.get("topology-id", ""))
    if topology_id in PLACEHOLDER_BGP_TOPOLOGY_IDS:
        return True
    for key, value in topo.items():
        if isinstance(key, str) and "rib-id" in key and value == "example-bgp-rib":
            return True
    return False


def is_pcep_config_only_node(node: dict[str, Any]) -> bool:
    """True when a PCEP topology node only carries static session config.

    This excludes list entries like the stock `43.43.43.43` example row from being
    treated as live peer/session evidence.
    """

    if not isinstance(node, dict):
        return False
    node_keys = {str(key) for key in node.keys()}
    return node_keys.issubset({"node-id", "network-topology-pcep:session-config"})


def count_live_pcep_children(topo: dict[str, Any]) -> tuple[int, int, int]:
    """Return live-looking PCEP node/link counts and ignored config-only nodes."""

    raw_nodes = topo.get("node") or []
    raw_links = topo.get("link") or []
    nodes = [node for node in raw_nodes if isinstance(node, dict)] if isinstance(raw_nodes, list) else []
    links = [link for link in raw_links if isinstance(link, dict)] if isinstance(raw_links, list) else []
    config_only_nodes = sum(1 for node in nodes if is_pcep_config_only_node(node))
    live_nodes = len(nodes) - config_only_nodes
    return live_nodes, len(links), config_only_nodes


def is_empty_netconf_topology_placeholder(topo: dict[str, Any]) -> bool:
    """True when `topology-netconf` exists but exposes no mounted nodes yet."""

    return infer_topology_scope_kind(topo) == "netconf" and count_node_link_children(topo) == (0, 0)


AggregateFetchStatus = Literal["ok", "degraded", "empty", "unreachable"]


@dataclass(frozen=True)
class NetworkTopologyAggregateResult:
    """Raw network-topology JSON from ODL (one bounded GET family)."""

    status: AggregateFetchStatus
    payload: dict[str, Any] | None
    path_used: str | None
    notes: list[str]


def fetch_network_topology_aggregate(client: OdlClient | None = None) -> NetworkTopologyAggregateResult:
    """Fetch the network-topology aggregate once for multi-protocol lane inspection.

    Does not replace ``fetch_bgpls_topology_via_odl`` (enriched BGP-LS parse); use this for
    lane partitioning without triple-fetching the same RESTCONF document.
    """
    c = client or get_odl_client()
    notes: list[str] = []
    payload: dict[str, Any] | None = None
    path_used: str | None = None
    try:
        for path in NETWORK_TOPOLOGY_PATH_CANDIDATES:
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
                body = http_error_body(exc)
                if exc.code in {401, 403}:
                    return NetworkTopologyAggregateResult(
                        status="empty",
                        payload=None,
                        path_used=None,
                        notes=[
                            f"ODL returned HTTP {exc.code}; network-topology aggregate unavailable.",
                        ],
                    )
                if exc.code == 404 or (exc.code == 400 and is_restconf_unknown_element(body)):
                    continue
                return NetworkTopologyAggregateResult(
                    status="degraded",
                    payload=None,
                    path_used=None,
                    notes=[f"ODL HTTP {exc.code} during network-topology aggregate read."],
                )
        if payload is None:
            return NetworkTopologyAggregateResult(
                status="empty",
                payload=None,
                path_used=None,
                notes=[
                    "ODL did not expose ietf-network-topology or network-topology on RESTCONF.",
                ],
            )
    except (URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        return NetworkTopologyAggregateResult(
            status="unreachable",
            payload=None,
            path_used=None,
            notes=[f"Could not read network-topology aggregate: {str(exc)[:200]}."],
        )

    if path_used == NETWORK_TOPOLOGY_PATH_CANDIDATES[1]:
        notes.append(
            "ODL served legacy network-topology:network-topology (ietf-network-topology not registered).",
        )
    return NetworkTopologyAggregateResult(status="ok", payload=payload, path_used=path_used, notes=notes)

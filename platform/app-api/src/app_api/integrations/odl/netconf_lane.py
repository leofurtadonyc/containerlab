"""Bounded NETCONF-oriented topology / connector lane from ODL RESTCONF (management-plane hints, not gNMI replacement)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Literal

from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app_api.integrations.odl.client import OdlClient, get_odl_client
from app_api.integrations.odl.network_topology_common import (
    NetworkTopologyAggregateResult,
    count_node_link_children,
    extract_topology_list,
    http_error_body,
    infer_topology_scope_kind,
    is_restconf_unknown_element,
)


LanePosture = Literal[
    "available",
    "partial",
    "empty",
    "degraded",
    "unreachable",
    "unsupported",
    "unknown",
]


@dataclass(frozen=True)
class NetconfLaneFetchResult:
    """NETCONF-flavored evidence: aggregate partition plus optional netconf-node-topology read."""

    posture: LanePosture
    observed_source: str
    topology_ids: tuple[str, ...]
    node_count: int
    link_count: int
    netconf_connector_node_count: int | None
    fingerprint: str
    notes: list[str]


def _fp(obj: Any) -> str:
    raw = json.dumps(obj, sort_keys=True, default=str).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:32]


NETCONF_PATH_CANDIDATES = (
    "/rests/data/netconf-node-topology:netconf-node-topology",
    "/rests/data/network-topology-netconf:network-topology",
)


def _try_netconf_connector_count(client: OdlClient) -> tuple[int | None, list[str]]:
    """Optional second read for NETCONF connector / topology-netconf style modules."""
    notes: list[str] = []
    for path in NETCONF_PATH_CANDIDATES:
        request = Request(
            url=f"{client.config.base_url.rstrip('/')}{path}",
            headers=client._build_headers(),
        )
        try:
            with urlopen(request, timeout=client.config.timeout_seconds) as response:
                raw = response.read().decode("utf-8")
            payload = json.loads(raw)
        except HTTPError as exc:
            body = http_error_body(exc)
            if exc.code in {404, 400} and (exc.code == 404 or is_restconf_unknown_element(body)):
                continue
            notes.append(f"NETCONF supplemental path {path} returned HTTP {exc.code}.")
            continue
        except (URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            notes.append(f"NETCONF supplemental read failed for {path}: {str(exc)[:120]}.")
            continue
        if not isinstance(payload, dict):
            continue
        # Heuristic: count list entries under common keys
        count = 0
        for key in ("netconf-node-topology", "network-topology", "topology-node", "node"):
            blob = payload
            if ":" in key:
                # try prefixed
                for pk, val in payload.items():
                    if isinstance(val, dict) and key.split(":")[-1] in str(pk).lower():
                        blob = val
            if isinstance(blob, dict):
                for subk, subv in blob.items():
                    if isinstance(subv, list):
                        count = max(count, len(subv))
        if count == 0:
            # count top-level list-ish
            for v in payload.values():
                if isinstance(v, list):
                    count += len(v)
        notes.append(f"Supplemental NETCONF topology read succeeded via {path} (bounded list/count heuristic).")
        return count, notes
    return None, notes


def summarize_netconf_lane(
    aggregate: NetworkTopologyAggregateResult,
    *,
    client: OdlClient | None = None,
) -> NetconfLaneFetchResult:
    """Partition aggregate for NETCONF-scoped topologies; optionally probe netconf-node-topology."""
    observed_source = "odl_restconf_network_topology_netconf_lane"
    c = client or get_odl_client()
    if aggregate.status == "unreachable":
        return NetconfLaneFetchResult(
            posture="unreachable",
            observed_source=observed_source,
            topology_ids=(),
            node_count=0,
            link_count=0,
            netconf_connector_node_count=None,
            fingerprint=_fp(None),
            notes=list(aggregate.notes)
            + [
                "NETCONF lane cannot be assessed until the controller network-topology aggregate is readable.",
            ],
        )
    if aggregate.status in ("empty", "degraded") or not aggregate.payload:
        extra, extra_notes = _try_netconf_connector_count(c)
        nnotes = list(aggregate.notes) + extra_notes
        if extra is not None and extra > 0:
            return NetconfLaneFetchResult(
                posture="partial",
                observed_source=observed_source,
                topology_ids=(),
                node_count=0,
                link_count=0,
                netconf_connector_node_count=extra,
                fingerprint=_fp({"supplemental": extra}),
                notes=nnotes
                + [
                    "NETCONF lane used supplemental module read; aggregate network-topology was unavailable.",
                ],
            )
        return NetconfLaneFetchResult(
            posture="empty" if aggregate.status == "empty" else "degraded",
            observed_source=observed_source,
            topology_ids=(),
            node_count=0,
            link_count=0,
            netconf_connector_node_count=extra,
            fingerprint=_fp(aggregate.payload),
            notes=nnotes
            + [
                "No NETCONF-class topology slice is available from the aggregate read.",
            ],
        )

    topologies = extract_topology_list(aggregate.payload)
    netconf_topos = [
        t
        for t in topologies
        if infer_topology_scope_kind(t) == "netconf"
        or "netconf" in str(t.get("topology-id", "")).lower()
    ]
    node_count = 0
    link_count = 0
    tids: list[str] = []
    for topo in netconf_topos:
        tid = str(topo.get("topology-id", ""))
        if tid:
            tids.append(tid)
        n, l = count_node_link_children(topo)
        node_count += n
        link_count += l

    notes = list(aggregate.notes)
    supplemental_count, sup_notes = _try_netconf_connector_count(c)
    notes.extend(sup_notes)

    if not netconf_topos and (supplemental_count is None or supplemental_count == 0):
        notes.append(
            "No topology entries were classified as NETCONF-scoped from topology-types / topology-id heuristics.",
        )
        posture: LanePosture = "empty"
    elif node_count == 0 and link_count == 0 and (supplemental_count or 0) == 0:
        notes.append(
            "NETCONF-class topologies are listed but carried no extractable node/link rows in this bounded parse.",
        )
        posture = "partial"
    else:
        notes.append(
            f"NETCONF lane: {len(netconf_topos)} topology scope(s), {node_count} node row(s), "
            f"{link_count} link row(s) in aggregate."
            + (
                f" Supplemental connector-like count≈{supplemental_count}."
                if supplemental_count
                else ""
            ),
        )
        posture = "available"

    return NetconfLaneFetchResult(
        posture=posture,
        observed_source=observed_source,
        topology_ids=tuple(sorted(set(tids))),
        node_count=node_count,
        link_count=link_count,
        netconf_connector_node_count=supplemental_count,
        fingerprint=_fp(
            {
                "lane": "netconf",
                "tids": tids,
                "n": node_count,
                "l": link_count,
                "supp": supplemental_count,
            },
        ),
        notes=notes,
    )

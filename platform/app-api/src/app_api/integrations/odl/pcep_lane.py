"""Bounded PCEP-related topology lane from ODL network-topology (session/path visibility, not dataplane proof)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Literal

from app_api.integrations.odl.network_topology_common import (
    NetworkTopologyAggregateResult,
    count_live_pcep_children,
    extract_topology_list,
    infer_topology_scope_kind,
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
class PcepLaneFetchResult:
    """PCEP-flavored topology evidence derived from the shared aggregate payload."""

    posture: LanePosture
    observed_source: str
    topology_ids: tuple[str, ...]
    node_count: int
    link_count: int
    fingerprint: str
    notes: list[str]


def _fp(payload: dict[str, Any] | None) -> str:
    raw = json.dumps(payload or {}, sort_keys=True, default=str).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:32]


def summarize_pcep_lane(aggregate: NetworkTopologyAggregateResult) -> PcepLaneFetchResult:
    """Inspect aggregate JSON for PCEP-class topologies (topology-types / naming heuristics)."""
    observed_source = "odl_restconf_network_topology_pcep_lane"
    if aggregate.status == "unreachable":
        return PcepLaneFetchResult(
            posture="unreachable",
            observed_source=observed_source,
            topology_ids=(),
            node_count=0,
            link_count=0,
            fingerprint=_fp(None),
            notes=list(aggregate.notes)
            + [
                "PCEP lane cannot be assessed until the controller network-topology aggregate is readable.",
            ],
        )
    if aggregate.status in ("empty", "degraded") or not aggregate.payload:
        return PcepLaneFetchResult(
            posture="empty" if aggregate.status == "empty" else "degraded",
            observed_source=observed_source,
            topology_ids=(),
            node_count=0,
            link_count=0,
            fingerprint=_fp(aggregate.payload),
            notes=list(aggregate.notes)
            + [
                "No partitioned PCEP topology slice is available from the aggregate read.",
            ],
        )

    topologies = extract_topology_list(aggregate.payload)
    pcep_topos = [t for t in topologies if infer_topology_scope_kind(t) == "pcep"]
    node_count = 0
    link_count = 0
    config_only_node_count = 0
    tids: list[str] = []
    for topo in pcep_topos:
        tid = str(topo.get("topology-id", ""))
        if tid:
            tids.append(tid)
        n, l, config_only = count_live_pcep_children(topo)
        node_count += n
        link_count += l
        config_only_node_count += config_only

    notes = list(aggregate.notes)
    if not pcep_topos:
        notes.append(
            "No topology entries were classified as PCEP-scoped from topology-types / topology-id heuristics.",
        )
        posture: LanePosture = "empty"
    elif node_count == 0 and link_count == 0:
        if config_only_node_count > 0:
            notes.append(
                f"Ignored {config_only_node_count} config-only PCEP node row(s) with session-config but no live peer/session state.",
            )
        notes.append(
            "PCEP-class topologies are present in the aggregate but carried no node/link rows in this bounded parse.",
        )
        posture = "partial"
    else:
        notes.append(
            f"PCEP lane: {len(pcep_topos)} topology scope(s), {node_count} node row(s), {link_count} link row(s) in aggregate.",
        )
        posture = "available"

    return PcepLaneFetchResult(
        posture=posture,
        observed_source=observed_source,
        topology_ids=tuple(sorted(set(tids))),
        node_count=node_count,
        link_count=link_count,
        fingerprint=_fp(
            {"lane": "pcep", "tids": tids, "n": node_count, "l": link_count},
        ),
        notes=notes,
    )

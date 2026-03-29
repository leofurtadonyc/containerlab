"""Deeper topology truth v1 — correlate gNMI baseline with bounded ODL network-topology export."""

from __future__ import annotations

import time
from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from sqlalchemy.exc import OperationalError

from app_api.config.settings import get_settings
from app_api.integrations.collector.topology import CollectorTopologySnapshot
from app_api.integrations.odl.bgp_ls_topology import fetch_bgpls_topology_via_odl
from app_api.metrics.state import record_topology_truth_observation
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot
from app_api.models.topology import resolve_topology_link_endpoint_evidence
from app_api.persistence.session import create_session
from app_api.persistence.tables import TopologyTruthSnapshotTable
from app_api.schemas.topology_truth import (
    TOPOLOGY_TRUTH_V1_CONTRACT_ID,
    ControllerFetchStatus,
    TopologyDisagreementRecord,
    TopologySourceRef,
    TopologyTruthCounts,
    TopologyTruthFreshnessSummary,
    TopologyTruthLinkRecord,
    TopologyTruthMergedTopology,
    TopologyTruthNodeRecord,
    TopologyTruthProvenance,
    TopologyTruthResponse,
    TopologyTruthPosture,
)
from app_api.services.topology import load_topology_snapshot_for_topology_relationship_queries

_metadata_phase = "phase_2_read_only_foundation"


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _norm_ctrl_id(node_id: str) -> str:
    if node_id.startswith("ctrl:"):
        return node_id[5:]
    return node_id


def _link_key(a: str, b: str) -> tuple[str, str]:
    x, y = _norm_ctrl_id(a), _norm_ctrl_id(b)
    return (x, y) if x <= y else (y, x)


def _device_link_truth_base(link: TopologyLink) -> TopologyTruthPosture:
    ep, _n = resolve_topology_link_endpoint_evidence(link)
    if ep == "single_sided":
        return "inferred_only"
    return "device_observed"


def _merge_nodes_and_links(
    *,
    device: TopologySnapshot,
    controller: TopologySnapshot,
    collector: CollectorTopologySnapshot,
    ctrl_status: ControllerFetchStatus,
) -> tuple[
    list[TopologyTruthNodeRecord],
    list[TopologyTruthLinkRecord],
    list[TopologyDisagreementRecord],
    TopologyTruthCounts,
]:
    disagreements: list[TopologyDisagreementRecord] = []
    dev_node_ids = {n.node_id for n in device.nodes}
    ctrl_by_norm: dict[str, TopologyNode] = {}
    for cn in controller.nodes:
        ctrl_by_norm[_norm_ctrl_id(cn.node_id)] = cn

    device_fresh: Literal["current", "stale", "unknown"] = (
        "stale" if collector.status == "collector_unavailable" else "current"
    )
    ctrl_fresh: Literal["current", "stale", "unknown", "not_applicable"] = (
        "not_applicable"
        if ctrl_status in ("unreachable", "empty")
        else "current"
    )

    out_nodes: list[TopologyTruthNodeRecord] = []
    for dn in device.nodes:
        cn = ctrl_by_norm.get(dn.node_id)
        node_disc: TopologyDisagreementRecord | None = None
        if cn:
            posture: TopologyTruthPosture = "merged_multi_source"
            if dn.state != cn.state:
                node_disc = TopologyDisagreementRecord(
                    object_kind="node",
                    object_id=dn.node_id,
                    kind="device_controller_mismatch",
                    summary=f"Device state {dn.state} vs controller export {cn.state}.",
                    source_a="device_gnmi",
                    source_b="controller_bgpls",
                )
                disagreements.append(node_disc)
                posture = "conflicting"
        else:
            posture = "device_observed"
        prov = TopologyTruthProvenance(
            contributing_sources=["device_gnmi", "controller_bgpls"] if cn else ["device_gnmi"],
            primary_source="device_gnmi",
            freshness_posture=device_fresh,
            merged_or_correlated=cn is not None,
            missing_sources=(["controller_bgpls"] if not cn and ctrl_status == "ok" else []),
        )
        out_nodes.append(
            TopologyTruthNodeRecord(
                node_id=dn.node_id,
                display_name=dn.display_name,
                role=dn.role,
                state=dn.state,
                truth_posture=posture,
                provenance=prov,
                disagreement=node_disc,
                attributes=dict(dn.attributes),
            )
        )

    for ck, cn in ctrl_by_norm.items():
        if ck in dev_node_ids:
            continue
        if cn.role == "controller_topology_scope":
            out_nodes.append(
                TopologyTruthNodeRecord(
                    node_id=cn.node_id,
                    display_name=cn.display_name,
                    role=cn.role,
                    state=cn.state,
                    truth_posture="controller_correlated",
                    provenance=TopologyTruthProvenance(
                        contributing_sources=["controller_bgpls"],
                        primary_source="controller_bgpls",
                        freshness_posture="current" if ctrl_fresh == "current" else "unknown",
                        merged_or_correlated=False,
                        missing_sources=[],
                    ),
                    disagreement=None,
                    attributes=dict(cn.attributes),
                )
            )
            continue
        disagreements.append(
            TopologyDisagreementRecord(
                object_kind="node",
                object_id=cn.node_id,
                kind="missing_device_evidence",
                summary="Controller exported a node not present in the current gNMI-normalized device topology slice.",
                source_a="controller_bgpls",
                source_b=None,
            )
        )
        out_nodes.append(
            TopologyTruthNodeRecord(
                node_id=cn.node_id,
                display_name=cn.display_name,
                role=cn.role,
                state=cn.state,
                truth_posture="partial",
                provenance=TopologyTruthProvenance(
                    contributing_sources=["controller_bgpls"],
                    primary_source="controller_bgpls",
                    freshness_posture="current" if ctrl_fresh == "current" else "unknown",
                    missing_sources=["device_gnmi"],
                ),
                disagreement=disagreements[-1],
                attributes=dict(cn.attributes),
            )
        )

    dev_links_by_key: dict[tuple[str, str], TopologyLink] = {}
    for lk in device.links:
        dev_links_by_key[_link_key(lk.source_node_id, lk.target_node_id)] = lk
    ctrl_links_by_key: dict[tuple[str, str], TopologyLink] = {}
    for lk in controller.links:
        ctrl_links_by_key[_link_key(lk.source_node_id, lk.target_node_id)] = lk

    out_links: list[TopologyTruthLinkRecord] = []
    inferred_only = 0
    protocol_confirmed = 0
    for key, lk in dev_links_by_key.items():
        cl = ctrl_links_by_key.get(key)
        base = _device_link_truth_base(lk)
        ep, ev = resolve_topology_link_endpoint_evidence(lk)
        if cl:
            posture: TopologyTruthPosture = "protocol_confirmed" if ep == "paired" else "merged_multi_source"
            if ep == "paired":
                protocol_confirmed += 1
            prov = TopologyTruthProvenance(
                contributing_sources=["device_gnmi", "controller_bgpls"],
                primary_source="device_gnmi",
                freshness_posture=device_fresh,
                merged_or_correlated=True,
            )
        else:
            posture = base
            if base == "inferred_only":
                inferred_only += 1
            prov = TopologyTruthProvenance(
                contributing_sources=["device_gnmi"],
                primary_source="device_gnmi",
                freshness_posture=device_fresh,
                missing_sources=(["controller_bgpls"] if ctrl_status == "ok" else []),
            )
        disc = None
        if cl and lk.state != cl.state:
            disc = TopologyDisagreementRecord(
                object_kind="link",
                object_id=lk.link_id,
                kind="device_controller_mismatch",
                summary="Device-inferred link state differs from controller-exported link.",
                source_a="device_gnmi",
                source_b="controller_bgpls",
            )
            disagreements.append(disc)
            posture = "conflicting"
        out_links.append(
            TopologyTruthLinkRecord(
                link_id=lk.link_id,
                source_node_id=lk.source_node_id,
                target_node_id=lk.target_node_id,
                state=lk.state,
                truth_posture=posture,
                provenance=prov,
                endpoint_pairing_state=ep,
                endpoint_evidence_count=ev,
                disagreement=disc,
                attributes=dict(lk.attributes),
            )
        )

    for key, cl in ctrl_links_by_key.items():
        if key in dev_links_by_key:
            continue
        disagreements.append(
            TopologyDisagreementRecord(
                object_kind="link",
                object_id=cl.link_id,
                kind="missing_device_evidence",
                summary="Controller exported a link adjacency not present in the gNMI-normalized link set.",
                source_a="controller_bgpls",
                source_b=None,
            )
        )
        out_links.append(
            TopologyTruthLinkRecord(
                link_id=cl.link_id,
                source_node_id=cl.source_node_id,
                target_node_id=cl.target_node_id,
                state=cl.state,
                truth_posture="controller_correlated",
                provenance=TopologyTruthProvenance(
                    contributing_sources=["controller_bgpls"],
                    primary_source="controller_bgpls",
                    freshness_posture="current",
                    missing_sources=["device_gnmi"],
                ),
                endpoint_pairing_state="paired",
                endpoint_evidence_count=cl.endpoint_evidence_count,
                disagreement=disagreements[-1],
                attributes=dict(cl.attributes),
            )
        )

    ctrl_only_nodes = sum(
        1
        for n in out_nodes
        if n.truth_posture == "partial"
        and n.provenance.contributing_sources == ["controller_bgpls"]
    )
    dev_only_nodes = len(device.nodes)
    conflict_count = sum(1 for d in disagreements if d.kind in ("device_controller_mismatch", "identity_conflict", "attribute_conflict"))
    stale_markers = sum(1 for n in out_nodes if n.provenance.freshness_posture == "stale")
    stale_markers += sum(1 for l in out_links if l.provenance.freshness_posture == "stale")

    counts = TopologyTruthCounts(
        merged_node_count=len(out_nodes),
        merged_link_count=len(out_links),
        inferred_only_link_count=inferred_only,
        protocol_confirmed_link_count=protocol_confirmed,
        controller_only_node_count=ctrl_only_nodes,
        device_only_node_count=dev_only_nodes,
        conflicting_object_count=conflict_count,
        stale_source_marker_count=stale_markers,
    )
    return out_nodes, out_links, disagreements, counts


def _persist_merged_snapshot(
    *,
    merged: TopologyTruthMergedTopology,
    sources: list[TopologySourceRef],
    ctrl_status: str,
    device_fp: str | None,
    controller_fp: str | None,
    notes: list[str],
) -> str | None:
    row_id = str(uuid4())
    payload = merged.model_dump(mode="json")
    summary = {
        "sources": [s.model_dump(mode="json") for s in sources],
        "controller_fetch_status": ctrl_status,
    }
    try:
        with create_session() as session:
            session.add(
                TopologyTruthSnapshotTable(
                    id=row_id,
                    persisted_at=_utcnow(),
                    device_gnmi_fingerprint=device_fp,
                    controller_bgpls_fingerprint=controller_fp,
                    controller_fetch_status=ctrl_status,
                    merged_payload=payload,
                    sources_summary=summary,
                    correlation_notes=list(notes),
                )
            )
            session.commit()
    except OperationalError:
        return None
    return row_id


def build_topology_truth_response(
    *,
    truth_posture: str | None = None,
) -> TopologyTruthResponse:
    """Build merged topology truth (gNMI + optional ODL network-topology)."""
    t0 = time.perf_counter()
    settings = get_settings()
    collector_snapshot, device_snapshot, persisted_at = load_topology_snapshot_for_topology_relationship_queries()
    bgp = fetch_bgpls_topology_via_odl()
    ctrl_snap = bgp.snapshot

    device_fp = None
    if device_snapshot.nodes:
        device_fp = str(hash(tuple(sorted((n.node_id, n.state) for n in device_snapshot.nodes))))[:16]

    merged_nodes, merged_links, disagreements, counts = _merge_nodes_and_links(
        device=device_snapshot,
        controller=ctrl_snap,
        collector=collector_snapshot,
        ctrl_status=bgp.status,
    )

    dev_fresh: Literal["current", "stale", "unknown"] = (
        "stale" if collector_snapshot.status == "collector_unavailable" else "current"
    )
    ctrl_fresh: Literal["current", "stale", "unknown", "not_applicable"] = (
        "not_applicable" if bgp.status in ("unreachable", "empty") else "current"
    )
    merged_fresh: Literal["current", "stale", "unknown"] = (
        "stale" if dev_fresh == "stale" or persisted_at is not None else "current"
    )

    sources = [
        TopologySourceRef(
            source_type="device_gnmi",
            source_id=device_snapshot.topology_id,
            source_time=device_snapshot.observed_at,
            source_freshness=dev_fresh,
            source_authority_posture="observed",
            source_summary="Normalized Nokia gNMI topology baseline (interface-inference bounded).",
        ),
        TopologySourceRef(
            source_type="controller_bgpls",
            source_id=ctrl_snap.topology_id,
            source_time=None,
            source_freshness="current" if ctrl_fresh == "current" else "unknown",
            source_authority_posture="controller_export",
            source_summary="Bounded ODL RESTCONF network-topology export (enrichment only).",
        ),
    ]

    merged_topology = TopologyTruthMergedTopology(
        topology_id=f"merged:{device_snapshot.topology_id}",
        topology_name="topology_truth_merged_v1",
        nodes=merged_nodes,
        links=merged_links,
        notes=[
            "Backend-owned merge of device gNMI-normalized topology with optional controller export.",
            "This is not path-validation-grade or traffic-path truth.",
            *bgp.notes,
        ],
    )

    snap_id = _persist_merged_snapshot(
        merged=merged_topology,
        sources=sources,
        ctrl_status=bgp.status,
        device_fp=device_fp,
        controller_fp=bgp.fingerprint,
        notes=bgp.notes,
    )

    record_topology_truth_observation(
        controller_status=bgp.status,
        merged_node_count=counts.merged_node_count,
        merged_link_count=counts.merged_link_count,
        inferred_only_links=counts.inferred_only_link_count,
        protocol_confirmed_links=counts.protocol_confirmed_link_count,
        conflicts=counts.conflicting_object_count,
        duration_seconds=time.perf_counter() - t0,
    )

    if truth_posture:
        tp = truth_posture.strip()
        merged_topology = merged_topology.model_copy(
            update={
                "nodes": [n for n in merged_topology.nodes if n.truth_posture == tp],
                "links": [x for x in merged_topology.links if x.truth_posture == tp],
            }
        )

    return TopologyTruthResponse(
        service="app-api",
        version=settings.app_version,
        phase=_metadata_phase,  # type: ignore[arg-type]
        generated_at=_utcnow(),
        contract_id=TOPOLOGY_TRUTH_V1_CONTRACT_ID,
        sources=sources,
        controller_fetch_status=bgp.status,
        controller_notes=list(bgp.notes),
        freshness=TopologyTruthFreshnessSummary(
            device_gnmi=dev_fresh,
            controller_bgpls=ctrl_fresh,
            merged_view=merged_fresh,
        ),
        counts=counts,
        disagreements=disagreements,
        merged_topology=merged_topology,
        persisted_snapshot_id=snap_id,
    )

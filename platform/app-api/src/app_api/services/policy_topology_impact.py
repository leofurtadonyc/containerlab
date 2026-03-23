"""Assemble policy → topology impact read responses (Phase 2, read-only).

Uses the same string-equality semantics as ``topology_related_policies`` (see that module).
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.policy_topology_impact import PolicyTopologyImpactResponse, PolicyTopologyImpactRow
from app_api.schemas.topology_related_policies import TopologyRelatedPolicyReference
from app_api.services.policies import _build_policy_inventory
from app_api.services.topology import load_topology_snapshot_for_topology_relationship_queries
from app_api.services.topology_related_policies import (
    _emit_matches_for_node,
    _find_link,
    _find_node,
)


def _refs_to_rows_for_node(
    *,
    refs: list[TopologyRelatedPolicyReference],
    node_id: str,
) -> list[PolicyTopologyImpactRow]:
    rows: list[PolicyTopologyImpactRow] = []
    for ref in refs:
        rows.append(
            PolicyTopologyImpactRow(
                topology_object_kind="node",
                topology_object_id=node_id,
                relationship_kind=ref.relationship_kind,
                matched_field=ref.matched_field,
                matched_policy_value=ref.matched_policy_value,
                matched_topology_identifier=ref.matched_topology_identifier,
                anchor_topology_node_id=ref.anchor_topology_node_id,
                evidence_source=ref.evidence_source,
                caveats=list(ref.caveats),
            )
        )
    return rows


def _refs_to_rows_for_link(
    *,
    refs: list[TopologyRelatedPolicyReference],
    link_id: str,
    dedupe: set[tuple[str, str, str, str]],
) -> list[PolicyTopologyImpactRow]:
    rows: list[PolicyTopologyImpactRow] = []
    for ref in refs:
        key = (
            link_id,
            ref.matched_field,
            ref.matched_policy_value,
            ref.anchor_topology_node_id,
        )
        if key in dedupe:
            continue
        dedupe.add(key)
        rows.append(
            PolicyTopologyImpactRow(
                topology_object_kind="link",
                topology_object_id=link_id,
                relationship_kind=ref.relationship_kind,
                matched_field=ref.matched_field,
                matched_policy_value=ref.matched_policy_value,
                matched_topology_identifier=ref.matched_topology_identifier,
                anchor_topology_node_id=ref.anchor_topology_node_id,
                evidence_source=ref.evidence_source,
                caveats=list(ref.caveats),
            )
        )
    return rows


def build_policy_topology_impact_response(policy_id: str) -> PolicyTopologyImpactResponse | None:
    """Return topology-impact rows for ``policy_id``, or ``None`` if the policy is absent."""
    settings = get_settings()
    _, policy_snapshot, _ = _build_policy_inventory()
    record = next((r for r in policy_snapshot.records if r.policy_id == policy_id), None)
    if record is None:
        return None

    _, topo_snapshot, _ = load_topology_snapshot_for_topology_relationship_queries()
    global_caveats: list[str] = [
        "Topology impact rows use exact string equality between normalized policy "
        "headend/endpoint/source_target fields and topology node_id/display_name/device_id. "
        "This does not prove dataplane dependency, blast radius, or that the policy is "
        "operationally bound to a specific adjacency beyond naming alignment.",
    ]
    if topo_snapshot.completeness != "complete":
        global_caveats.append(
            "Topology snapshot completeness is not 'complete'; some real nodes or links may "
            "be absent from this normalized slice.",
        )
    if policy_snapshot.empty_reason != "none":
        global_caveats.append(
            f"Policy inventory slice may be incomplete (empty_reason={policy_snapshot.empty_reason}).",
        )

    rows: list[PolicyTopologyImpactRow] = []
    derivation = (
        "Lists topology nodes (and links whose endpoints match) where this policy's "
        "headend, endpoint, or source_target equals a node identifier on that object."
    )

    for node in topo_snapshot.nodes:
        refs = _emit_matches_for_node(
            policies=policy_snapshot.records,
            node=node,
            context="node",
            policy_filter=record,
        )
        rows.extend(_refs_to_rows_for_node(refs=refs, node_id=node.node_id))

    link_dedupe: set[tuple[str, str, str, str]] = set()
    for link in topo_snapshot.links:
        source_n = _find_node(topo_snapshot, link.source_node_id)
        target_n = _find_node(topo_snapshot, link.target_node_id)
        for endpoint_node in (source_n, target_n):
            if endpoint_node is None:
                continue
            refs = _emit_matches_for_node(
                policies=policy_snapshot.records,
                node=endpoint_node,
                context="link",
                policy_filter=record,
            )
            rows.extend(
                _refs_to_rows_for_link(
                    refs=refs,
                    link_id=link.link_id,
                    dedupe=link_dedupe,
                )
            )
    if any(link.endpoint_pairing_state == "single_sided" for link in topo_snapshot.links):
        global_caveats.append(
            "At least one link has single-sided endpoint pairing; endpoint identity alignment may be weaker.",
        )

    # Deterministic: kind (node before link), object id, field, anchor
    field_order = {"headend": 0, "endpoint": 1, "source_target": 2}
    rows.sort(
        key=lambda r: (
            0 if r.topology_object_kind == "node" else 1,
            r.topology_object_id,
            field_order.get(r.matched_field, 9),
            r.anchor_topology_node_id,
        ),
    )

    now = datetime.now(tz=UTC)
    return PolicyTopologyImpactResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        policy_id=record.policy_id,
        policy_name=record.policy_name,
        derivation_summary=derivation,
        global_caveats=global_caveats,
        items=rows,
    )

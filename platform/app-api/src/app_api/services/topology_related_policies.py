"""Assemble topology-object → related policies read responses (Phase 2, read-only).

Derives related policies by **exact string equality** between normalized policy fields
(``headend``, ``endpoint``, ``source_target``) and normalized topology node identifiers
(``node_id``, ``display_name``, ``device_id``). This is an inventory pivot for operators,
not a dataplane dependency graph, TE resolution, or validation verdict.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from app_api.config.settings import get_settings
from app_api.models.policy import PolicyInventoryRecord
from app_api.models.topology import TopologyLink, TopologyNode, TopologySnapshot
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.topology_related_policies import (
    RelatedPolicyRelationshipKind,
    TopologyObjectRelatedPoliciesResponse,
    TopologyRelatedPolicyReference,
)
from app_api.services.policies import _build_policy_inventory
from app_api.services.topology import load_topology_snapshot_for_topology_relationship_queries


def _node_identifier_set(node: TopologyNode) -> set[str]:
    ids: set[str] = set()
    if node.node_id:
        ids.add(node.node_id)
    if node.display_name:
        ids.add(node.display_name)
    if node.device_id:
        ids.add(node.device_id)
    return ids


def _find_node(snapshot: TopologySnapshot, node_id: str) -> TopologyNode | None:
    for node in snapshot.nodes:
        if node.node_id == node_id:
            return node
    return None


def _find_link(snapshot: TopologySnapshot, link_id: str) -> TopologyLink | None:
    for link in snapshot.links:
        if link.link_id == link_id:
            return link
    return None


def _resolve_object(
    object_id: str,
    snapshot: TopologySnapshot,
) -> tuple[Literal["node", "link"], TopologyNode | None, TopologyLink | None] | None:
    """Return (kind, node, link) or None if object_id is not a known node or link id."""
    node = _find_node(snapshot, object_id)
    if node is not None:
        return ("node", node, None)
    link = _find_link(snapshot, object_id)
    if link is not None:
        return ("link", None, link)
    return None


def _emit_matches_for_node(
    *,
    policies: list[PolicyInventoryRecord],
    node: TopologyNode,
    context: Literal["node", "link"],
    policy_filter: PolicyInventoryRecord | None = None,
) -> list[TopologyRelatedPolicyReference]:
    rel: RelatedPolicyRelationshipKind = (
        "policy_field_matches_node_identifier"
        if context == "node"
        else "policy_field_matches_link_endpoint_identifier"
    )
    nids = _node_identifier_set(node)
    items: list[TopologyRelatedPolicyReference] = []
    scoped_policies = [policy_filter] if policy_filter is not None else policies
    for policy in scoped_policies:
        per_policy_caveats: list[str] = []
        if policy.support_state in ("unsupported", "not_implemented_in_platform"):
            per_policy_caveats.append(
                "Policy support posture is limited; relationship is naming alignment only."
            )
        elif policy.support_state == "partially_supported":
            per_policy_caveats.append(
                "Policy is partially supported; relationship is naming alignment only, not operational dependency."
            )
        for fname, value in (
            ("headend", policy.headend),
            ("endpoint", policy.endpoint),
            ("source_target", policy.source_target),
        ):
            if value == "":
                continue
            if value not in nids:
                continue
            items.append(
                TopologyRelatedPolicyReference(
                    policy_id=policy.policy_id,
                    policy_name=policy.policy_name,
                    policy_type=policy.policy_type,
                    relationship_kind=rel,
                    matched_field=fname,
                    matched_policy_value=value,
                    matched_topology_identifier=value,
                    anchor_topology_node_id=node.node_id,
                    caveats=list(per_policy_caveats),
                )
            )
    return items


def build_topology_object_related_policies_response(
    object_id: str,
) -> TopologyObjectRelatedPoliciesResponse | None:
    """Return related policies for a topology node or link ``object_id``, or ``None`` if unknown."""
    settings = get_settings()
    _, policy_snapshot, _ = _build_policy_inventory()
    _, topo_snapshot, _ = load_topology_snapshot_for_topology_relationship_queries()

    resolved = _resolve_object(object_id, topo_snapshot)
    if resolved is None:
        return None

    kind, node, link = resolved
    policies = list(policy_snapshot.records)
    global_caveats: list[str] = [
        "Related policies are derived from exact string equality between normalized policy "
        "headend/endpoint/source_target fields and topology node_id/display_name/device_id. "
        "This does not prove dataplane forwarding dependency, operational impact, or that "
        "the policy is bound to a specific interface or adjacency beyond naming alignment.",
    ]
    if topo_snapshot.completeness != "complete":
        global_caveats.append(
            "Topology snapshot completeness is not 'complete'; the object set may omit "
            "nodes or links that exist outside this normalized slice."
        )
    if policy_snapshot.empty_reason != "none":
        global_caveats.append(
            f"Policy inventory slice may be incomplete (empty_reason={policy_snapshot.empty_reason})."
        )

    items: list[TopologyRelatedPolicyReference] = []
    derivation = (
        "Matches policies whose headend, endpoint, or source_target string equals one of the "
        "selected topology node's identifiers (node_id, display_name, or device_id)."
    )

    if kind == "node" and node is not None:
        items.extend(
            _emit_matches_for_node(
                policies=policies,
                node=node,
                context="node",
            )
        )
    elif kind == "link" and link is not None:
        derivation = (
            "Union of policies matching either endpoint node of this link using the same "
            "string-equality rules as for a single node. Link adjacency is not treated as "
            "policy path verification."
        )
        source_n = _find_node(topo_snapshot, link.source_node_id)
        target_n = _find_node(topo_snapshot, link.target_node_id)
        if source_n is not None:
            items.extend(
                _emit_matches_for_node(
                    policies=policies,
                    node=source_n,
                    context="link",
                )
            )
        if target_n is not None:
            items.extend(
                _emit_matches_for_node(
                    policies=policies,
                    node=target_n,
                    context="link",
                )
            )
        if link.endpoint_pairing_state == "single_sided":
            global_caveats.append(
                "This link has single-sided endpoint pairing; endpoint identity alignment may be weaker."
            )

    # Deterministic ordering: policy_id, then matched_field
    field_order = {"headend": 0, "endpoint": 1, "source_target": 2}
    items.sort(
        key=lambda r: (r.policy_id, field_order.get(r.matched_field, 9), r.anchor_topology_node_id),
    )

    now = datetime.now(tz=UTC)
    return TopologyObjectRelatedPoliciesResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        object_kind=kind,
        object_id=object_id,
        derivation_summary=derivation,
        global_caveats=global_caveats,
        items=items,
    )

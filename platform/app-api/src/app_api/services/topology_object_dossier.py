"""Assemble topology object dossier v1 read responses (Phase 2, read-only).

Composes existing bounded contracts only; no new scoring or write-side behavior.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.models.policy import PolicyInventoryRecord
from app_api.models.topology import (
    TopologySnapshot,
    build_topology_coverage_summary,
    resolve_topology_link_endpoint_evidence,
)
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.topology_object_dossier import (
    TOPOLOGY_OBJECT_DOSSIER_CONTRACT_ID,
    TopologyObjectDossierDegradedRelatedPreviewItem,
    TopologyObjectDossierFreshnessBlock,
    TopologyObjectDossierNavigationTargets,
    TopologyObjectDossierResponse,
    TopologyObjectIdentitySection,
    TopologyRiskAttentionSection,
)
from app_api.services.degraded_policy_v1 import build_degraded_policy_v1_classification
from app_api.services.failure_impact import build_failure_impact_view_response
from app_api.services.policies import _build_policy_inventory
from app_api.services.topology import load_topology_snapshot_for_topology_relationship_queries
from app_api.services.topology_related_policies import (
    _resolve_object,
    build_topology_object_related_policies_response,
)
from app_api.services.topology_risk_summary import RANKING_BASIS_V1, build_topology_risk_summary_response


def _merge_caveats_ordered(*chunks: list[str]) -> list[str]:
    """Flatten variadic ``list[str]`` chunks while preserving first-seen order."""
    seen: set[str] = set()
    out: list[str] = []
    for chunk in chunks:
        for s in chunk:
            if s not in seen:
                seen.add(s)
                out.append(s)
    return out


def _identity_section(
    *,
    object_kind: str,
    object_id: str,
    snapshot: TopologySnapshot,
) -> TopologyObjectIdentitySection:
    resolved = _resolve_object(object_id, snapshot)
    if resolved is None:
        return TopologyObjectIdentitySection(
            object_kind="node" if object_kind == "node" else "link",
            object_id=object_id,
            display_label=object_id,
            identity_detail_lines=[f"object_id={object_id} (not found in snapshot; unexpected)"],
        )
    kind, node, link = resolved
    if kind == "node" and node is not None:
        lines = [
            f"role={node.role}",
            f"state={node.state}",
            f"source={node.source}",
        ]
        if node.device_id:
            lines.append(f"device_id={node.device_id}")
        return TopologyObjectIdentitySection(
            object_kind="node",
            object_id=object_id,
            display_label=node.display_name or object_id,
            identity_detail_lines=lines,
        )

    if kind == "link" and link is not None:
        ep_state, ep_count = resolve_topology_link_endpoint_evidence(link)
        lines = [
            f"endpoints={link.source_node_id}->{link.target_node_id}",
            f"state={link.state}",
            f"source={link.source}",
            f"endpoint_pairing_state={ep_state}",
        ]
        if ep_count is not None:
            lines.append(f"endpoint_evidence_count={ep_count}")
        label = f"{link.source_node_id} ↔ {link.target_node_id}"
        return TopologyObjectIdentitySection(
            object_kind="link",
            object_id=object_id,
            display_label=label,
            identity_detail_lines=lines,
        )

    return TopologyObjectIdentitySection(
        object_kind="node",
        object_id=object_id,
        display_label=object_id,
        identity_detail_lines=[f"object_id={object_id} (unexpected resolution state)"],
    )


def _posture_summary_lines(
    *,
    snapshot: TopologySnapshot,
    collector_snapshot: object,
) -> list[str]:
    collection_posture = collector_snapshot.collection_posture
    if collection_posture is None and collector_snapshot.status == "collector_unavailable":
        collection_posture = "blocked"
    coverage = build_topology_coverage_summary(
        nodes=snapshot.nodes,
        links=snapshot.links,
        inference_posture=collector_snapshot.inference_posture,
        endpoint_pairing_posture=collector_snapshot.endpoint_pairing_posture,
        collection_posture=collection_posture,
        node_participation_posture=collector_snapshot.node_participation_posture,
        paired_link_count=collector_snapshot.paired_link_count,
        single_sided_link_count=collector_snapshot.single_sided_link_count,
        linked_node_count=collector_snapshot.linked_node_count,
        isolated_node_count=collector_snapshot.isolated_node_count,
    )
    lines = [coverage.summary]
    lines.append(f"topology_snapshot_completeness={snapshot.completeness}")
    lines.append(f"sync_status={snapshot.sync_status}")
    if snapshot.notes:
        lines.extend(snapshot.notes[:3])
    return lines


def build_topology_object_dossier_response(object_id: str) -> TopologyObjectDossierResponse | None:
    """Return dossier v1 for ``object_id``, or ``None`` if topology object unknown."""
    related = build_topology_object_related_policies_response(object_id)
    if related is None:
        return None

    fi = build_failure_impact_view_response(object_id, related_policies=related)
    if fi is None:
        return None

    risk_full = build_topology_risk_summary_response()
    row = next(
        (
            r
            for r in risk_full.ranked_objects
            if r.object_id == object_id and r.object_kind == related.object_kind
        ),
        None,
    )
    gap_note: str | None = None
    if row is None:
        gap_note = (
            "No matching row for this object was found in the current topology risk summary "
            "ranked_objects assembly; open GET /api/v1/topology/risk-summary for the full table."
        )

    risk_attention = TopologyRiskAttentionSection(
        ranking_basis=RANKING_BASIS_V1,
        row=row,
        risk_row_gap_note=gap_note,
    )

    collector_snapshot, snapshot, _persisted_at = load_topology_snapshot_for_topology_relationship_queries()
    policy_collector, policy_snapshot, _policy_persisted = _build_policy_inventory()

    row_current_posture: str = (
        "stale"
        if policy_collector.status == "collector_unavailable" and _policy_persisted is not None
        else "current"
    )
    policy_by_id: dict[str, PolicyInventoryRecord] = {p.policy_id: p for p in policy_snapshot.records}

    unique_policy_ids = sorted({item.policy_id for item in related.items})
    degraded_items: list[TopologyObjectDossierDegradedRelatedPreviewItem] = []
    for pid in unique_policy_ids:
        policy = policy_by_id.get(pid)
        if policy is None:
            continue
        name = policy.policy_name
        cls = build_degraded_policy_v1_classification(
            policy=policy,
            row_current_posture=row_current_posture,
        )
        degraded_items.append(
            TopologyObjectDossierDegradedRelatedPreviewItem(
                policy_id=pid,
                policy_name=name,
                degraded_policy_v1=cls,
            )
        )

    settings = get_settings()
    now = datetime.now(tz=UTC)

    object_identity = _identity_section(
        object_kind=related.object_kind,
        object_id=related.object_id,
        snapshot=snapshot,
    )
    posture_lines = _posture_summary_lines(snapshot=snapshot, collector_snapshot=collector_snapshot)

    dossier_preamble = (
        "Topology object dossier v1 composes existing read-only surfaces only; nested contract_id "
        "fields identify each section's source contract. This assembly is not blast radius, "
        "traffic risk, SLA, or workflow authority."
    )
    merged = _merge_caveats_ordered(
        [dossier_preamble],
        list(related.global_caveats),
        list(fi.caveats),
        list(fi.missing_evidence_notes),
    )
    if row is not None:
        merged = _merge_caveats_ordered(
            merged,
            list(risk_full.caveats),
            list(risk_full.missing_evidence_notes),
        )
    elif gap_note is not None:
        merged = _merge_caveats_ordered(merged, [gap_note])

    navigation = TopologyObjectDossierNavigationTargets(
        investigation_shell_params={
            "inv_from": "topology",
            "topology_object": related.object_id,
            "topology_object_kind": related.object_kind,
            "failure_impact_entry": "v1",
            "risk_summary_entry": "v1",
        },
        situation_room_shell_params={
            "view": "situation-room",
            "sync_runs_limit": "10",
        },
        topology_shell_params={
            "view": "topology",
            "topology_object": related.object_id,
            "topology_object_kind": related.object_kind,
        },
        related_policy_ids_for_policies_view=list(unique_policy_ids),
    )

    freshness = TopologyObjectDossierFreshnessBlock(
        dossier_assembled_at=now,
        policy_inventory_observed_at=fi.freshness.policy_inventory_observed_at,
        topology_snapshot_observed_at=fi.freshness.topology_snapshot_observed_at,
        policy_inventory_empty_reason=fi.freshness.policy_inventory_empty_reason,
        policy_serving_mode_echo=fi.freshness.policy_serving_mode_echo,
        topology_risk_summary_assembly_generated_at=risk_full.freshness.assembly_generated_at,
    )

    return TopologyObjectDossierResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=TOPOLOGY_OBJECT_DOSSIER_CONTRACT_ID,
        object_identity=object_identity,
        topology_posture_summary_lines=posture_lines,
        failure_impact=fi,
        risk_attention=risk_attention,
        related_policies=related,
        degraded_related_policies_preview=degraded_items,
        navigation_targets=navigation,
        freshness=freshness,
        merged_caveats=merged,
    )

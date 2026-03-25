"""Assemble Maintenance Preview v1 read responses (Phase 2, read-only).

Composes existing bounded assemblies only; see ``platform/docs/maintenance-preview-contract.md``.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.failure_impact import FAILURE_IMPACT_CONTRACT_ID
from app_api.schemas.maintenance_preview import (
    MAINTENANCE_PREVIEW_CONTRACT_ID,
    MaintenanceExplainabilityPointer,
    MaintenancePreviewResponse,
    MaintenancePreviewSafetyFraming,
    MaintenanceSubjectSummary,
    MaintenanceTopologyImpactSection,
)
from app_api.schemas.policies import PolicyRecord
from app_api.schemas.service_explorer import SERVICE_EXPLORER_V1_CONTRACT_ID
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.topology import TopologyResponse
from app_api.schemas.topology_related_policies import TopologyObjectRelatedPoliciesResponse
from app_api.services.failure_impact import build_failure_impact_view_response
from app_api.services.policies import build_policies_list_response
from app_api.services.service_explorer import (
    _default_pivots,
    build_service_list_rows_for_policy_subset,
)
from app_api.services.topology import build_topology_response

RELATED_SERVICES_ROW_CAP = 64
EXPLAINABILITY_POINTER_CAP = 10

_TOPOLOGY_RELATED_POLICIES_CONTRACT_LABEL = "topology_object_related_policies_v1"


def _policy_records_for_ids(
    *,
    all_items: list[PolicyRecord],
    policy_ids: set[str],
) -> list[PolicyRecord]:
    return [p for p in all_items if p.policy_id in policy_ids]


def _subject_labels(
    topo: TopologyResponse,
    *,
    object_kind: str,
    object_id: str,
) -> tuple[str, str | None, str | None]:
    """Return (display_name, source_node_id, target_node_id for links)."""
    if object_kind == "node":
        for node in topo.topology.nodes:
            if node.node_id == object_id:
                return node.display_name, None, None
        return object_id, None, None
    for link in topo.topology.links:
        if link.link_id == object_id:
            return link.link_id, link.source_node_id, link.target_node_id
    return object_id, None, None


def build_maintenance_preview_response(
    *,
    related: TopologyObjectRelatedPoliciesResponse,
    preview_context: str,
) -> MaintenancePreviewResponse:
    """Assemble maintenance preview for a topology subject (caller validates identity and kind)."""
    object_id = related.object_id
    object_kind = related.object_kind

    settings = get_settings()
    now = datetime.now(tz=UTC)

    failure = build_failure_impact_view_response(object_id, related_policies=related)
    assert failure is not None  # related exists => failure exists

    policies = build_policies_list_response(limit=None, history_recent_limit=1)
    unique_policy_ids = {item.policy_id for item in related.items}
    subset_records = _policy_records_for_ids(all_items=policies.items, policy_ids=unique_policy_ids)
    service_rows_full = build_service_list_rows_for_policy_subset(subset_records)
    related_services_total = len(service_rows_full)
    truncated = related_services_total > RELATED_SERVICES_ROW_CAP
    service_rows = service_rows_full[:RELATED_SERVICES_ROW_CAP]

    topology = build_topology_response()

    sparse_reasons: list[str] = []
    if not related.items:
        sparse_reasons.append(
            "no_related_policies_in_slice: string-equality related set is empty for this subject "
            "(not 'no operational impact'—only that this read path found no aligned policy rows)."
        )
    if policies.empty_reason != "none":
        sparse_reasons.append(
            f"policy_inventory_empty_reason={policies.empty_reason}; service groupings may be empty.",
        )
    if truncated:
        sparse_reasons.append(
            f"related_services_truncated: showing {len(service_rows)} of {related_services_total} "
            "Service Explorer–style rows derived from the related-policy subset.",
        )
    sparse_preview = bool(sparse_reasons)

    display_name, src_n, tgt_n = _subject_labels(
        topology,
        object_kind=object_kind,
        object_id=object_id,
    )
    subject = MaintenanceSubjectSummary(
        object_kind=object_kind,  # type: ignore[arg-type]
        object_id=object_id,
        display_name=display_name,
        source_node_id=src_n,
        target_node_id=tgt_n,
    )

    sorted_unique_policy_ids = sorted(unique_policy_ids)
    explain_policy_ids = sorted_unique_policy_ids[:EXPLAINABILITY_POINTER_CAP]
    explain_pointers = [
        MaintenanceExplainabilityPointer(
            policy_id=pid,
            policies_explainability_path=f"/api/v1/policies/{pid}/explainability",
            policies_path_analysis_path=f"/api/v1/policies/{pid}/path-analysis",
        )
        for pid in explain_policy_ids
    ]
    if len(unique_policy_ids) > EXPLAINABILITY_POINTER_CAP:
        sparse_reasons.append(
            f"explainability_pointers_capped: showing {EXPLAINABILITY_POINTER_CAP} of "
            f"{len(unique_policy_ids)} distinct related policy_ids.",
        )

    pivots = list(
        _default_pivots(
            policy_id=sorted_unique_policy_ids[0] if sorted_unique_policy_ids else None,
            topology_node_id=object_id if object_kind == "node" else (src_n or tgt_n),
        )
    )
    pivots.append(
        f"{MAINTENANCE_PREVIEW_CONTRACT_ID}: GET /api/v1/topology/objects/{object_id}/dossier — "
        "object briefing (breadth).",
    )
    pivots.append(
        f"{MAINTENANCE_PREVIEW_CONTRACT_ID}: GET /api/v1/topology/objects/{object_id}/failure-impact — "
        "failure-impact v1 authority for rollups on this subject.",
    )

    assembly_caveats: list[str] = [
        "Maintenance Preview v1 is planning support only: it reuses related-policies, failure-impact, "
        "Service Explorer grouping math over the related-policy subset, and topology coverage signals. "
        "It does not simulate maintenance outcomes or score safe-to-change.",
    ]

    topo_section = MaintenanceTopologyImpactSection(
        coverage_summary=topology.coverage_summary,
        topology_snapshot_observed_at=(
            topology.topology.observed_at.isoformat() if topology.topology.observed_at else None
        ),
        dossier_path=f"/api/v1/topology/objects/{object_id}/dossier",
    )

    source_contract_ids = [
        MAINTENANCE_PREVIEW_CONTRACT_ID,
        _TOPOLOGY_RELATED_POLICIES_CONTRACT_LABEL,
        FAILURE_IMPACT_CONTRACT_ID,
        SERVICE_EXPLORER_V1_CONTRACT_ID,
    ]

    return MaintenancePreviewResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=MAINTENANCE_PREVIEW_CONTRACT_ID,
        safety_framing=MaintenancePreviewSafetyFraming(),
        preview_context=preview_context,  # type: ignore[arg-type]
        source_contract_ids=source_contract_ids,
        subject=subject,
        sparse_preview=sparse_preview,
        sparse_reasons=sparse_reasons,
        related_policies=related,
        failure_impact=failure,
        related_services=service_rows,
        related_services_total=related_services_total,
        related_services_truncated=truncated,
        topology_impact=topo_section,
        explainability_pointers=explain_pointers,
        recommended_pivots=pivots[:16],
        assembly_caveats=assembly_caveats,
    )

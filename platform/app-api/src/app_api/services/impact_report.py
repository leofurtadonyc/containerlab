"""Impact Report v1 — compose existing Phase 2 assemblies only.

See ``platform/docs/impact-report-contract.md``.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.impact_report import (
    IMPACT_REPORT_CONTRACT_ID,
    ImpactReportResponse,
    ImpactReportSafetyFraming,
)
from app_api.schemas.maintenance_preview import MaintenanceSubjectSummary
from app_api.services.evidence_export import collect_contract_ids_depth_first
from app_api.schemas.topology_related_policies import TopologyObjectRelatedPoliciesResponse
from app_api.services.maintenance_preview import build_maintenance_preview_response
from app_api.services.policy_dossier import build_policy_dossier_response
from app_api.services.service_explorer import build_service_detail_response


def _metadata() -> ApiResponseMetadata:
    settings = get_settings()
    return ApiResponseMetadata(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(tz=UTC),
    )


def _merge_source_ids(tree: Any) -> list[str]:
    ids = collect_contract_ids_depth_first(tree)
    out: list[str] = [IMPACT_REPORT_CONTRACT_ID]
    for cid in ids:
        if cid not in out:
            out.append(cid)
    return out


def build_service_impact_report(service_id: str) -> ImpactReportResponse | None:
    detail = build_service_detail_response(service_id)
    if detail is None:
        return None
    sparse = detail.members_total == 0 or detail.policy_inventory.empty_reason != "none"
    reasons: list[str] = []
    if detail.members_total == 0:
        reasons.append("Service has zero member policies in this inventory slice.")
    if detail.policy_inventory.empty_reason != "none":
        reasons.append(f"Policy inventory echo: empty_reason={detail.policy_inventory.empty_reason!r}.")
    if detail.topology_evidence_status in ("partial", "unavailable"):
        reasons.append(f"Topology evidence status is {detail.topology_evidence_status!r} (bounded linkage).")
    tree = detail.model_dump(mode="json")
    return ImpactReportResponse(
        metadata=_metadata(),
        report_context="service_impact",
        safety_framing=ImpactReportSafetyFraming(),
        source_contract_ids=_merge_source_ids(tree),
        scope_summary=(
            "Service-centric impact report: Service Explorer grouping and member policies for operator "
            "communication. Relationships are inventory-aligned only—not exhaustive dependency proof."
        ),
        sparse_report=sparse,
        sparse_reasons=reasons,
        recommended_api_pivots=[
            f"/api/v1/services/{service_id}",
            "/api/v1/policies",
            "/api/v1/topology",
        ],
        anchor_service_id=service_id,
        service_detail=detail,
    )


def build_policy_impact_report(policy_id: str) -> ImpactReportResponse | None:
    dossier = build_policy_dossier_response(policy_id)
    if dossier is None:
        return None
    sparse = len(dossier.topology_impact.items) == 0 or dossier.path_analysis.truth_alignment.posture == "uncertain"
    reasons: list[str] = []
    if len(dossier.topology_impact.items) == 0:
        reasons.append("Topology impact rows are empty for this policy in the current slice.")
    if dossier.merged_caveats:
        reasons.extend(dossier.merged_caveats[:5])
    tree = dossier.model_dump(mode="json")
    return ImpactReportResponse(
        metadata=_metadata(),
        report_context="policy_impact",
        safety_framing=ImpactReportSafetyFraming(),
        source_contract_ids=_merge_source_ids(tree),
        scope_summary=(
            "Policy-centric impact report: composed dossier sections (path analysis, topology impact, "
            "evidence timeline/delta) for operator communication—not dataplane proof or validation."
        ),
        sparse_report=sparse,
        sparse_reasons=reasons,
        recommended_api_pivots=[
            f"/api/v1/policies/{policy_id}/dossier",
            f"/api/v1/policies/{policy_id}/explainability",
            "/api/v1/topology",
        ],
        anchor_policy_id=policy_id,
        policy_dossier=dossier,
    )


def build_maintenance_impact_report_from_related(
    *,
    related: TopologyObjectRelatedPoliciesResponse,
    preview_context: str,
) -> ImpactReportResponse:
    """Caller validates topology identity and object_kind match (same rules as maintenance-preview)."""
    preview = build_maintenance_preview_response(related=related, preview_context=preview_context)
    subj = MaintenanceSubjectSummary(
        object_kind=preview.subject.object_kind,
        object_id=preview.subject.object_id,
        display_name=preview.subject.display_name,
        source_node_id=preview.subject.source_node_id,
        target_node_id=preview.subject.target_node_id,
    )
    tree = preview.model_dump(mode="json")
    oid = preview.subject.object_id
    return ImpactReportResponse(
        metadata=_metadata(),
        report_context="maintenance_impact",
        safety_framing=ImpactReportSafetyFraming(),
        source_contract_ids=_merge_source_ids(tree),
        scope_summary=(
            "Maintenance-oriented impact report: reuses Maintenance Preview v1 assembly for bounded "
            "read-side relationships and posture signals—not maintenance approval or blast-radius truth."
        ),
        sparse_report=preview.sparse_preview,
        sparse_reasons=list(preview.sparse_reasons),
        recommended_api_pivots=[
            "/api/v1/maintenance-preview",
            f"/api/v1/topology/objects/{oid}/dossier",
            "/api/v1/policies",
        ],
        anchor_maintenance=subj,
        maintenance_preview=preview,
    )


def impact_report_response_to_markdown(body: ImpactReportResponse) -> str:
    """Human-readable Markdown companion: metadata + non-claims + nested JSON (same pattern as evidence export)."""
    dumped = body.model_dump(mode="json")
    nested_json = json.dumps(dumped, indent=2, ensure_ascii=False)
    lines: list[str] = [
        f"# Impact report: {body.report_context}",
        "",
        "## Report metadata",
        "",
        f"- **contract_id:** `{body.contract_id}`",
        f"- **generated_at:** {body.metadata.generated_at.isoformat()}",
    ]
    if body.anchor_service_id:
        lines.append(f"- **anchor service_id:** `{body.anchor_service_id}`")
    if body.anchor_policy_id:
        lines.append(f"- **anchor policy_id:** `{body.anchor_policy_id}`")
    if body.anchor_maintenance:
        am = body.anchor_maintenance
        lines.append(
            f"- **anchor maintenance:** `{am.object_kind}` `{am.object_id}` ({am.display_name})",
        )
    lines.extend(
        [
            "",
            "## Source contract ids",
            "",
        ]
    )
    for cid in body.source_contract_ids:
        lines.append(f"- `{cid}`")
    lines.extend(["", "## Scope summary", "", body.scope_summary, "", "## Explicit excluded concerns", ""])
    for ex in body.explicit_excluded_concerns:
        lines.append(f"- {ex}")
    lines.extend(["", "## Explicit non-claims", ""])
    for claim in body.safety_framing.explicit_non_claims:
        lines.append(f"- {claim}")
    if body.sparse_report:
        lines.extend(["", "## Sparse / partial", "", f"- **sparse_report:** {body.sparse_report}"])
        for r in body.sparse_reasons:
            lines.append(f"- {r}")
    lines.extend(
        [
            "",
            "## Full payload (JSON)",
            "",
            "```json",
            nested_json,
            "```",
            "",
        ]
    )
    return "\n".join(lines)

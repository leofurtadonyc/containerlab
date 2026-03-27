"""Evidence weakness explanation + next-best pivot from evidence-quality workspace rows only."""

from __future__ import annotations

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.evidence_quality_workspace import EvidenceQualityRow
from app_api.schemas.evidence_weakness_explanation import (
    DEFAULT_EVIDENCE_WEAKNESS_EXPLICIT_NON_CLAIMS,
    EVIDENCE_WEAKNESS_EXPLANATION_V1_CONTRACT_ID,
    EvidenceWeaknessExplanationBlock,
    EvidenceWeaknessExplanationResponse,
    EvidenceWeaknessExplanationSafetyFraming,
    EvidenceWeaknessExplanationCategory,
    NextBestPivot,
)
from app_api.services.change_intelligence import RECENT_CHANGE_SYNC_RUNS_DEFAULT, RECENT_CHANGE_SYNC_RUNS_MAX
from app_api.services.evidence_quality_workspace import build_evidence_quality_workspace_response


def _dimension_to_category(row: EvidenceQualityRow) -> EvidenceWeaknessExplanationCategory:
    dim = row.evidence_quality_dimension
    if dim == "collection_assurance":
        return "collection_assurance_weak"
    if dim in ("read_path_fragility", "fallback_conditions"):
        return "fallback_or_stale_serving"
    if dim == "sparse_history_anchors":
        return "sparse_history_or_anchors"
    if dim == "comparison_limits":
        return "comparison_or_scope_limited"
    if dim == "unsupported_partial_detail":
        return "partial_or_unsupported_detail"
    return "cross_surface_scope_note"


def _pivot_devices(row: EvidenceQualityRow, cat: EvidenceWeaknessExplanationCategory) -> NextBestPivot:
    return NextBestPivot(
        pivot_id="open_devices_list",
        label="Devices list",
        route_family="GET /api/v1/devices; view=devices",
        rationale=(
            f"Advisory read-only pivot for explanation category {cat} on devices evidence; "
            "deepens inventory context per cited fields; not remediation or approval."
        ),
        cited_evidence_fields=row.source_citations or None,
    )


def _pivot_policies(row: EvidenceQualityRow, cat: EvidenceWeaknessExplanationCategory) -> NextBestPivot:
    return NextBestPivot(
        pivot_id="open_policies_list",
        label="Policies list",
        route_family="GET /api/v1/policies; view=policies",
        rationale=(
            f"Advisory read-only pivot for explanation category {cat} on policies evidence; "
            "deepens policy list context per cited fields; not remediation or approval."
        ),
        cited_evidence_fields=row.source_citations or None,
    )


def _pivot_topology(row: EvidenceQualityRow, cat: EvidenceWeaknessExplanationCategory) -> NextBestPivot:
    return NextBestPivot(
        pivot_id="open_topology_view",
        label="Topology",
        route_family="GET /api/v1/topology; view=topology",
        rationale=(
            f"Advisory read-only pivot for explanation category {cat} on topology evidence; "
            "deepens topology context per cited fields; not remediation or approval."
        ),
        cited_evidence_fields=row.source_citations or None,
    )


def _pivot_capabilities(row: EvidenceQualityRow, cat: EvidenceWeaknessExplanationCategory) -> NextBestPivot:
    return NextBestPivot(
        pivot_id="open_capabilities",
        label="Capabilities",
        route_family="GET /api/v1/capabilities; view=capabilities",
        rationale=(
            f"Advisory read-only pivot for explanation category {cat} on capabilities evidence; "
            "reviews matrix honesty per cited fields; not remediation or approval."
        ),
        cited_evidence_fields=row.source_citations or None,
    )


def _pivot_platform(row: EvidenceQualityRow, cat: EvidenceWeaknessExplanationCategory) -> NextBestPivot:
    return NextBestPivot(
        pivot_id="open_platform_health",
        label="Platform status",
        route_family="GET /api/v1/platform/status; view=platform-health",
        rationale=(
            f"Advisory read-only pivot for explanation category {cat} on platform read-path evidence; "
            "reviews collector-to-backend posture per cited fields; not remediation or approval."
        ),
        cited_evidence_fields=row.source_citations or None,
    )


def _pivot_global(row: EvidenceQualityRow, cat: EvidenceWeaknessExplanationCategory) -> NextBestPivot:
    return NextBestPivot(
        pivot_id="open_platform_health",
        label="Platform status",
        route_family="GET /api/v1/platform/status; view=platform-health",
        rationale=(
            f"Advisory read-only pivot for explanation category {cat} on cross-cutting evidence; "
            "start from platform read-path context; not remediation, approval, or consistency verdict."
        ),
        cited_evidence_fields=row.source_citations or None,
    )


def _primary_pivot_for_row(row: EvidenceQualityRow, cat: EvidenceWeaknessExplanationCategory) -> NextBestPivot:
    dom = row.evidence_subject_domain
    if dom == "devices":
        return _pivot_devices(row, cat)
    if dom == "policies":
        return _pivot_policies(row, cat)
    if dom == "topology":
        return _pivot_topology(row, cat)
    if dom == "capabilities":
        return _pivot_capabilities(row, cat)
    if dom in ("platform_read_paths", "platform_recovery"):
        return _pivot_platform(row, cat)
    return _pivot_global(row, cat)


def _alternate_pivot_for_row(row: EvidenceQualityRow, cat: EvidenceWeaknessExplanationCategory) -> NextBestPivot | None:
    """Optional secondary pivot: deterministic tie-break for comparison_limits across inventory vs topology."""

    if row.evidence_quality_dimension != "comparison_limits":
        return None
    if row.evidence_subject_domain == "topology":
        return NextBestPivot(
            pivot_id="open_devices_list",
            label="Devices list",
            route_family="GET /api/v1/devices; view=devices",
            rationale=(
                f"Alternate advisory read-only pivot for explanation category {cat} when comparison limits "
                "may span inventory; use with topology; not a ranking score and not remediation."
            ),
            cited_evidence_fields=row.source_citations or None,
        )
    if row.evidence_subject_domain == "devices":
        return NextBestPivot(
            pivot_id="open_topology_view",
            label="Topology",
            route_family="GET /api/v1/topology; view=topology",
            rationale=(
                f"Alternate advisory read-only pivot for explanation category {cat} when comparison limits "
                "may span topology; use with devices; not a ranking score and not remediation."
            ),
            cited_evidence_fields=row.source_citations or None,
        )
    return None


def build_evidence_weakness_explanation_response(
    *,
    sync_runs_limit: int = RECENT_CHANGE_SYNC_RUNS_DEFAULT,
) -> EvidenceWeaknessExplanationResponse:
    """Map evidence-quality workspace rows to explanation categories and bounded next-best pivots."""

    bounded = max(1, min(int(sync_runs_limit), RECENT_CHANGE_SYNC_RUNS_MAX))
    eq = build_evidence_quality_workspace_response(sync_runs_limit=bounded)
    settings = get_settings()
    blocks: list[EvidenceWeaknessExplanationBlock] = []
    for row in eq.rows:
        cat = _dimension_to_category(row)
        primary = _primary_pivot_for_row(row, cat)
        alternate = _alternate_pivot_for_row(row, cat)
        blocks.append(
            EvidenceWeaknessExplanationBlock(
                explanation_category=cat,
                evidence_quality_dimension=row.evidence_quality_dimension,
                evidence_subject_domain=row.evidence_subject_domain,
                row_summary=row.summary[:2000],
                primary_next_best_pivot=primary,
                alternate_next_best_pivot=alternate,
            )
        )

    caveats: list[str] = [
        "Next-best pivots are navigation recommendations only; they do not execute changes, open tickets, or "
        "substitute stability, consistency, or investigation workspaces unless you explicitly navigate there.",
        "Explanation categories derive from evidence_quality_workspace_v1 dimensions; no ML scoring or "
        "cross-operator urgency rank.",
    ]

    return EvidenceWeaknessExplanationResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=eq.metadata.generated_at,
        ),
        contract_id=EVIDENCE_WEAKNESS_EXPLANATION_V1_CONTRACT_ID,
        safety_framing=EvidenceWeaknessExplanationSafetyFraming(
            explicit_non_claims=list(DEFAULT_EVIDENCE_WEAKNESS_EXPLICIT_NON_CLAIMS),
        ),
        sync_runs_limit_applied=bounded,
        blocks=blocks,
        caveats=caveats,
        assembly_notes=list(eq.assembly_notes),
    )

"""Assemble topology-object stability profile read responses (Phase 2, read-only).

Composes evidence-timeline, evidence-delta, failure-impact, and topology risk summary row
excerpts only — see ``platform/docs/topology-object-stability-profile-contract.md``.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from typing import TypeVar

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.failure_impact import FailureImpactViewResponse
from app_api.schemas.operational_stability_summary import StabilityPosture
from app_api.schemas.topology_object_evidence_delta import TopologyObjectEvidenceDeltaResponse
from app_api.schemas.topology_object_evidence_timeline import TopologyObjectEvidenceTimelineResponse
from app_api.schemas.topology_object_stability_profile import (
    TOPOLOGY_OBJECT_STABILITY_PROFILE_CONTRACT_ID,
    TopologyObjectStabilityPivotHint,
    TopologyObjectStabilityProfileResponse,
    TopologyObjectStabilityProfileSafetyFraming,
)
from app_api.services.failure_impact import build_failure_impact_view_response
from app_api.services.topology_object_evidence_delta import build_topology_object_evidence_delta_response
from app_api.services.topology_object_evidence_timeline import build_topology_object_evidence_timeline_response
from app_api.services.topology_related_policies import build_topology_object_related_policies_response
from app_api.services.topology_risk_summary import build_topology_risk_summary_response

T = TypeVar("T")


def _safe_call(
    label: str,
    fn: Callable[..., T],
    *args: object,
    **kwargs: object,
) -> tuple[T | None, str | None]:
    try:
        return fn(*args, **kwargs), None
    except Exception as exc:  # noqa: BLE001 - bounded assembly surface
        return None, f"{label} assembly failed: {exc!s}"


def _merge_caveats_ordered(*chunks: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for chunk in chunks:
        for s in chunk:
            if s not in seen:
                seen.add(s)
                out.append(s)
    return out


def _canonical_pivots() -> list[TopologyObjectStabilityPivotHint]:
    return [
        TopologyObjectStabilityPivotHint(
            label="Evidence timeline",
            route_family="GET /api/v1/topology/objects/{object_id}/evidence-timeline",
        ),
        TopologyObjectStabilityPivotHint(
            label="Evidence delta",
            route_family="GET /api/v1/topology/objects/{object_id}/evidence-delta",
        ),
        TopologyObjectStabilityPivotHint(
            label="Topology object dossier",
            route_family="GET /api/v1/topology/objects/{object_id}/dossier",
        ),
        TopologyObjectStabilityPivotHint(
            label="Failure impact",
            route_family="GET /api/v1/topology/objects/{object_id}/failure-impact",
        ),
        TopologyObjectStabilityPivotHint(
            label="Maintenance evidence workspace",
            route_family="GET /api/v1/maintenance-evidence-workspace (topology subject selectors)",
        ),
        TopologyObjectStabilityPivotHint(
            label="Change safety case (topology anchor)",
            route_family="GET /api/v1/reports/change-safety-case/...",
        ),
    ]


def _derive_posture_and_cues(
    *,
    timeline: TopologyObjectEvidenceTimelineResponse | None,
    timeline_err: str | None,
    delta: TopologyObjectEvidenceDeltaResponse | None,
    delta_err: str | None,
    fi: FailureImpactViewResponse | None,
    fi_err: str | None,
    risk_rank: int | None,
) -> tuple[StabilityPosture, list[str], list[str], list[str]]:
    volatility: list[str] = []
    recurrence: list[str] = []
    weakness: list[str] = []

    has_tl = timeline is not None and timeline_err is None
    has_delta = delta is not None and delta_err is None
    has_fi = fi is not None and fi_err is None

    entry_count = len(timeline.entries) if has_tl else 0
    non_gap_items: list = []
    if has_delta:
        non_gap_items = [i for i in delta.delta_items if i.category != "gap_note"]

    if has_delta:
        volatility.append(f"comparison_status={delta.comparison_status}")
        if non_gap_items:
            volatility.append(f"delta_items_non_gap_count={len(non_gap_items)}")
    elif delta_err:
        weakness.append(f"evidence_delta_unavailable: {delta_err}")

    if has_tl:
        volatility.append(f"timeline_entry_count={entry_count}")
        if timeline.missing_evidence_notes:
            for n in timeline.missing_evidence_notes[:5]:
                weakness.append(f"timeline_missing_evidence: {n}")

    if has_fi:
        deg = fi.rollup_counts.degraded_related_policies_total
        recurrence.append(
            f"failure_impact_degraded_related_policies_total={deg} "
            f"(ok={fi.degraded_posture_breakdown.ok}, "
            f"degraded={fi.degraded_posture_breakdown.degraded}, "
            f"unknown={fi.degraded_posture_breakdown.unknown})"
        )
    elif fi_err:
        weakness.append(f"failure_impact_unavailable: {fi_err}")

    if timeline_err:
        weakness.append(f"evidence_timeline_unavailable: {timeline_err}")

    if risk_rank is not None:
        recurrence.append(f"topology_risk_summary_rank_index={risk_rank} (current-snapshot attention cue)")

    deg_total = fi.rollup_counts.degraded_related_policies_total if has_fi else 0

    # Evidence weakness from delta status
    delta_weak = (
        has_delta
        and delta.comparison_status in ("no_comparable_anchor", "insufficient_evidence")
    )
    if delta_weak:
        weakness.append(f"delta_scope: {delta.scope_summary[:200]}")

    # Elevated churn: delta_ready with multiple substantive items
    if has_delta and delta.comparison_status == "delta_ready" and len(non_gap_items) >= 2:
        return "elevated_churn", volatility[:12], recurrence[:12], weakness[:12]

    # Degraded recurrence
    if deg_total > 0 and (entry_count >= 2 or (has_delta and len(non_gap_items) >= 1)):
        return "degraded_recurrence", volatility[:12], recurrence[:12], weakness[:12]
    if deg_total > 0:
        return "degraded_recurrence", volatility[:12], recurrence[:12], weakness[:12]

    if delta_weak:
        return "insufficient_evidence_for_stability_view", volatility[:12], recurrence[:12], weakness[:12]

    # Recurrence from timeline density (threshold documented here)
    if entry_count >= 5:
        return "recurrence_suspected", volatility[:12], recurrence[:12], weakness[:12]

    # Silent emptiness — do not emit quiet_or_stable_evidence
    silent = (
        entry_count == 0
        and (not has_delta or (delta.comparison_status == "delta_ready" and len(non_gap_items) == 0))
        and deg_total == 0
    )
    if silent and not (timeline_err or delta_err or fi_err):
        return "insufficient_evidence_for_stability_view", volatility[:12], recurrence[:12], weakness[:12]

    if timeline_err and delta_err and fi_err:
        return "insufficient_evidence_for_stability_view", volatility[:12], recurrence[:12], weakness[:12]

    # Quiet / stable: low churn signals, no degraded mass
    if (
        has_delta
        and delta.comparison_status == "delta_ready"
        and len(non_gap_items) <= 1
        and entry_count <= 3
        and deg_total == 0
    ):
        return "quiet_or_stable_evidence", volatility[:12], recurrence[:12], weakness[:12]

    if not has_delta and entry_count <= 2 and deg_total == 0 and not delta_err:
        return "insufficient_evidence_for_stability_view", volatility[:12], recurrence[:12], weakness[:12]

    return "insufficient_evidence_for_stability_view", volatility[:12], recurrence[:12], weakness[:12]


def build_topology_object_stability_profile_response(
    object_id: str,
) -> TopologyObjectStabilityProfileResponse | None:
    """Return stability profile for ``object_id``, or ``None`` when the topology object is unknown."""
    related = build_topology_object_related_policies_response(object_id)
    if related is None:
        return None

    timeline, timeline_err = _safe_call(
        "evidence_timeline",
        build_topology_object_evidence_timeline_response,
        object_id,
        related_policies=related,
    )
    delta, delta_err = _safe_call(
        "evidence_delta",
        build_topology_object_evidence_delta_response,
        object_id,
    )
    fi, fi_err = _safe_call(
        "failure_impact",
        build_failure_impact_view_response,
        object_id,
        related_policies=related,
    )

    risk_rank: int | None = None
    risk_summary, risk_err = _safe_call("topology_risk_summary", build_topology_risk_summary_response)
    if risk_summary is not None and risk_err is None:
        for row in risk_summary.ranked_objects:
            if row.object_id == object_id and row.object_kind == related.object_kind:
                risk_rank = row.rank_index
                break

    posture, vol_cues, rec_cues, weak_cues = _derive_posture_and_cues(
        timeline=timeline,
        timeline_err=timeline_err,
        delta=delta,
        delta_err=delta_err,
        fi=fi,
        fi_err=fi_err,
        risk_rank=risk_rank,
    )

    caveats_chunks: list[list[str]] = []
    if timeline is not None and timeline.missing_evidence_notes:
        caveats_chunks.extend([[n] for n in timeline.missing_evidence_notes])
    if delta is not None:
        caveats_chunks.append(delta.caveats)
    if fi is not None:
        caveats_chunks.append(fi.caveats)
        caveats_chunks.append(fi.missing_evidence_notes)
    if risk_summary is not None and risk_err is None:
        caveats_chunks.append(risk_summary.caveats)
        caveats_chunks.append(risk_summary.missing_evidence_notes)

    merged = _merge_caveats_ordered(*caveats_chunks)

    assembly_notes: list[str] = []
    if timeline is not None:
        assembly_notes.append(
            f"evidence_timeline.metadata.generated_at={timeline.metadata.generated_at.isoformat()}"
        )
    if delta is not None:
        assembly_notes.append(
            f"evidence_delta.current_anchor.generated_at={delta.current_anchor.generated_at.isoformat()}"
        )
    if fi is not None:
        assembly_notes.append(
            f"failure_impact.freshness.assembly_generated_at={fi.freshness.assembly_generated_at.isoformat()}"
        )
    if timeline_err:
        assembly_notes.append(timeline_err)
    if delta_err:
        assembly_notes.append(delta_err)
    if fi_err:
        assembly_notes.append(fi_err)
    if risk_err:
        assembly_notes.append(risk_err)

    scope_parts = [
        "Uses nested assemblies: topology object evidence timeline, evidence delta, failure impact, "
        "and topology risk summary row excerpt when available.",
        "Not a single unified event clock; timestamps are echoes from nested contracts.",
    ]
    profile_scope_summary = " ".join(scope_parts)

    settings = get_settings()
    now = datetime.now(tz=UTC)

    return TopologyObjectStabilityProfileResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=TOPOLOGY_OBJECT_STABILITY_PROFILE_CONTRACT_ID,
        safety_framing=TopologyObjectStabilityProfileSafetyFraming(),
        object_kind=related.object_kind,
        object_id=object_id,
        profile_scope_summary=profile_scope_summary,
        primary_stability_posture=posture,
        volatility_churn_cues=vol_cues,
        recurrence_and_degraded_cues=rec_cues,
        evidence_weakness_cues=weak_cues,
        canonical_pivots=_canonical_pivots(),
        merged_caveats=merged[:40],
        assembly_notes=assembly_notes[:30],
    )

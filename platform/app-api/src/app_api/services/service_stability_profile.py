"""Assemble service stability profile read responses (Phase 2, read-only).

Composes service evidence-timeline, evidence-delta, Service Explorer roll-up, and optional dossier
caveats only — see ``platform/docs/service-stability-profile-contract.md``.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from typing import Literal, TypeVar

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.operational_stability_summary import StabilityPosture
from app_api.schemas.service_evidence_delta import ServiceEvidenceDeltaResponse
from app_api.schemas.service_evidence_timeline import ServiceEvidenceTimelineResponse
from app_api.schemas.service_stability_profile import (
    SERVICE_STABILITY_PROFILE_CONTRACT_ID,
    ServiceStabilityPivotHint,
    ServiceStabilityProfileResponse,
    ServiceStabilityProfileSafetyFraming,
)
from app_api.services.service_dossier import build_service_dossier_response
from app_api.services.service_evidence_delta import build_service_evidence_delta_response
from app_api.services.service_evidence_timeline import build_service_evidence_timeline_response
from app_api.services.service_explorer import build_service_detail_response

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


def _canonical_pivots() -> list[ServiceStabilityPivotHint]:
    return [
        ServiceStabilityPivotHint(
            label="Service evidence timeline",
            route_family="GET /api/v1/services/{service_id}/evidence-timeline",
        ),
        ServiceStabilityPivotHint(
            label="Service evidence delta",
            route_family="GET /api/v1/services/{service_id}/evidence-delta",
        ),
        ServiceStabilityPivotHint(
            label="Service dossier",
            route_family="GET /api/v1/services/{service_id}/dossier",
        ),
        ServiceStabilityPivotHint(
            label="Service Explorer detail",
            route_family="GET /api/v1/services/{service_id}",
        ),
        ServiceStabilityPivotHint(
            label="Service Impact workspace",
            route_family="GET /api/v1/service-impact-workspace (service subject)",
        ),
        ServiceStabilityPivotHint(
            label="Change safety case (service)",
            route_family="GET /api/v1/reports/change-safety-case/service?...",
        ),
    ]


def _derive_service_posture_and_cues(
    *,
    timeline: ServiceEvidenceTimelineResponse | None,
    timeline_err: str | None,
    delta: ServiceEvidenceDeltaResponse | None,
    delta_err: str | None,
    degraded_service_posture: Literal["ok", "degraded", "unknown"],
) -> tuple[StabilityPosture, list[str], list[str], list[str]]:
    volatility: list[str] = []
    recurrence: list[str] = []
    weakness: list[str] = []

    has_tl = timeline is not None and timeline_err is None
    has_delta = delta is not None and delta_err is None

    entry_count = len(timeline.entries) if has_tl else 0
    non_gap_items: list = []
    if has_delta:
        non_gap_items = [i for i in delta.delta_items if i.category != "gap_note"]

    degraded_mass = degraded_service_posture == "degraded"
    if degraded_service_posture == "unknown":
        weakness.append("degraded_service_roll_up_posture=unknown")

    recurrence.append(f"degraded_service_roll_up_posture={degraded_service_posture}")

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

    if timeline_err:
        weakness.append(f"evidence_timeline_unavailable: {timeline_err}")

    delta_weak = (
        has_delta
        and delta.comparison_status in ("no_comparable_anchor", "insufficient_evidence")
    )
    if delta_weak:
        weakness.append(f"delta_scope: {delta.scope_summary[:200]}")

    # Elevated churn
    if has_delta and delta.comparison_status == "delta_ready" and len(non_gap_items) >= 2:
        return "elevated_churn", volatility[:12], recurrence[:12], weakness[:12]

    # Degraded recurrence (Explorer roll-up + timeline/delta cues)
    if degraded_mass and (entry_count >= 2 or (has_delta and len(non_gap_items) >= 1)):
        return "degraded_recurrence", volatility[:12], recurrence[:12], weakness[:12]
    if degraded_mass:
        return "degraded_recurrence", volatility[:12], recurrence[:12], weakness[:12]

    if delta_weak:
        return "insufficient_evidence_for_stability_view", volatility[:12], recurrence[:12], weakness[:12]

    if entry_count >= 5:
        return "recurrence_suspected", volatility[:12], recurrence[:12], weakness[:12]

    silent = (
        entry_count == 0
        and (not has_delta or (delta.comparison_status == "delta_ready" and len(non_gap_items) == 0))
        and not degraded_mass
    )
    if silent and not (timeline_err or delta_err):
        return "insufficient_evidence_for_stability_view", volatility[:12], recurrence[:12], weakness[:12]

    if timeline_err and delta_err:
        return "insufficient_evidence_for_stability_view", volatility[:12], recurrence[:12], weakness[:12]

    if (
        has_delta
        and delta.comparison_status == "delta_ready"
        and len(non_gap_items) <= 1
        and entry_count <= 3
        and not degraded_mass
    ):
        return "quiet_or_stable_evidence", volatility[:12], recurrence[:12], weakness[:12]

    if not has_delta and entry_count <= 2 and not degraded_mass and not delta_err:
        return "insufficient_evidence_for_stability_view", volatility[:12], recurrence[:12], weakness[:12]

    return "insufficient_evidence_for_stability_view", volatility[:12], recurrence[:12], weakness[:12]


def build_service_stability_profile_response(service_id: str) -> ServiceStabilityProfileResponse | None:
    """Return stability profile for ``service_id``, or ``None`` when the service is unknown (404 family)."""
    detail = build_service_detail_response(service_id)
    if detail is None:
        return None

    degraded_service_posture = detail.degraded_service.posture

    timeline, timeline_err = _safe_call(
        "service_evidence_timeline",
        build_service_evidence_timeline_response,
        service_id,
    )
    delta, delta_err = _safe_call(
        "service_evidence_delta",
        build_service_evidence_delta_response,
        service_id,
    )
    dossier, dossier_err = _safe_call(
        "service_dossier",
        build_service_dossier_response,
        service_id,
    )

    posture, vol_cues, rec_cues, weak_cues = _derive_service_posture_and_cues(
        timeline=timeline,
        timeline_err=timeline_err,
        delta=delta,
        delta_err=delta_err,
        degraded_service_posture=degraded_service_posture,
    )

    caveats_chunks: list[list[str]] = []
    if timeline is not None and timeline.missing_evidence_notes:
        caveats_chunks.extend([[n] for n in timeline.missing_evidence_notes])
    if delta is not None:
        caveats_chunks.append(delta.caveats)
    if dossier is not None:
        caveats_chunks.append(dossier.merged_caveats)

    merged = _merge_caveats_ordered(*caveats_chunks)

    assembly_notes: list[str] = []
    if timeline is not None:
        assembly_notes.append(
            f"service_evidence_timeline.metadata.generated_at={timeline.metadata.generated_at.isoformat()}"
        )
    if delta is not None:
        assembly_notes.append(
            f"service_evidence_delta.current_anchor.generated_at={delta.current_anchor.generated_at.isoformat()}"
        )
    if dossier is not None:
        assembly_notes.append(
            f"service_dossier.generated_at={dossier.generated_at.isoformat()}"
        )
    if timeline_err:
        assembly_notes.append(timeline_err)
    if delta_err:
        assembly_notes.append(delta_err)
    if dossier_err:
        assembly_notes.append(dossier_err)

    profile_scope_summary = (
        "Uses nested assemblies: service evidence timeline, service evidence delta, Service Explorer "
        "degraded_service roll-up, and optional service dossier merged caveats when available. "
        "Not a single unified event clock; timestamps are echoes from nested contracts."
    )

    settings = get_settings()
    now = datetime.now(tz=UTC)

    return ServiceStabilityProfileResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=SERVICE_STABILITY_PROFILE_CONTRACT_ID,
        safety_framing=ServiceStabilityProfileSafetyFraming(),
        service_id=service_id,
        profile_scope_summary=profile_scope_summary,
        primary_stability_posture=posture,
        volatility_churn_cues=vol_cues,
        recurrence_and_degraded_cues=rec_cues,
        evidence_weakness_cues=weak_cues,
        canonical_pivots=_canonical_pivots(),
        merged_caveats=merged[:40],
        assembly_notes=assembly_notes[:30],
    )

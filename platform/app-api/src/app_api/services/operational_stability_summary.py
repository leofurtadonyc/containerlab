"""Assemble operational stability summary from existing read responses only."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.operational_stability_summary import (
    OPERATIONAL_STABILITY_SUMMARY_CONTRACT_ID,
    OperationalStabilityRow,
    OperationalStabilitySafetyFraming,
    OperationalStabilitySummaryResponse,
    StabilityPosture,
)
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
    build_recent_change_summary_response,
)
from app_api.services.devices import build_devices_list_response
from app_api.services.policies import build_policies_list_response
from app_api.services.topology import build_topology_response

logger = logging.getLogger(__name__)

_CORE_DOMAINS = ("devices", "topology", "policies")


def _safe_call(label: str, fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs), None
    except Exception as exc:  # noqa: BLE001 — summary must survive partial failures
        logger.warning("operational_stability_summary: %s assembly failed: %s", label, exc)
        return None, f"{type(exc).__name__}: {exc}"


def _count_degraded_policies(policies) -> int:
    return sum(1 for it in policies.items if it.degraded_policy_v1.posture == "degraded")


def _primary_posture_from_rows(
    rows: list[OperationalStabilityRow],
    *,
    recent_domains_absent: bool,
) -> StabilityPosture:
    """Single roll-up posture; row hints are ordered by operational severity."""
    hints = [r.stability_posture_hint for r in rows if r.stability_posture_hint]
    if "elevated_churn" in hints:
        return "elevated_churn"
    if "degraded_recurrence" in hints:
        return "degraded_recurrence"
    if "recurrence_suspected" in hints:
        return "recurrence_suspected"
    if recent_domains_absent or "insufficient_evidence_for_stability_view" in hints:
        return "insufficient_evidence_for_stability_view"
    if any(r.row_type == "evidence_weakness_signal" for r in rows):
        return "insufficient_evidence_for_stability_view"
    if any(r.row_type == "quiet_signal" for r in rows):
        return "quiet_or_stable_evidence"
    return "insufficient_evidence_for_stability_view"


def build_operational_stability_summary_response(
    *,
    sync_runs_limit: int = RECENT_CHANGE_SYNC_RUNS_DEFAULT,
) -> OperationalStabilitySummaryResponse:
    """Compose bounded stability observations; no new collector, persistence, or scoring engines."""
    settings = get_settings()
    bounded = max(1, min(int(sync_runs_limit), RECENT_CHANGE_SYNC_RUNS_MAX))
    now = datetime.now(tz=UTC)

    policies, policies_err = _safe_call("policies", build_policies_list_response)
    devices, devices_err = _safe_call("devices", build_devices_list_response)
    topology, topology_err = _safe_call("topology", build_topology_response)
    recent_change, recent_err = _safe_call(
        "change_intelligence",
        build_recent_change_summary_response,
        sync_runs_limit=bounded,
    )

    assembly_notes: list[str] = []
    if policies_err:
        assembly_notes.append(f"policies: {policies_err}")
    if devices_err:
        assembly_notes.append(f"devices: {devices_err}")
    if topology_err:
        assembly_notes.append(f"topology: {topology_err}")
    if recent_err:
        assembly_notes.append(f"change_intelligence: {recent_err}")

    rows: list[OperationalStabilityRow] = []
    caveats: list[str] = [
        "Stability posture cites existing response fields and change-intelligence slices only; it is not a health "
        "score, SLA, or prediction.",
    ]

    all_core_failed = policies is None and devices is None and topology is None
    recent_domains_absent = True
    if recent_change is not None:
        core_slices = [d for d in recent_change.domains if d.domain in _CORE_DOMAINS]
        recent_domains_absent = len(core_slices) > 0 and all(d.evidence_status == "absent" for d in core_slices)

    # --- Churn (change intelligence) ---
    if recent_change is not None:
        present = [d for d in recent_change.domains if d.domain in _CORE_DOMAINS and d.evidence_status == "present"]
        partial = [d for d in recent_change.domains if d.domain in _CORE_DOMAINS and d.evidence_status == "partial"]
        if len(present) >= 3:
            rows.append(
                OperationalStabilityRow(
                    subject_family="global_window",
                    row_type="churn_signal",
                    stability_posture_hint="elevated_churn",
                    summary=(
                        "Multiple core domains report present recent-activity signals in the bounded change-intelligence "
                        "window."
                    ),
                    detail=f"present_core_domains={len(present)} sync_runs_limit_applied={bounded}",
                    source_citations=["GET /api/v1/change-intelligence/recent-summary"],
                )
            )
        elif len(present) + len(partial) >= 2:
            rows.append(
                OperationalStabilityRow(
                    subject_family="global_window",
                    row_type="churn_signal",
                    stability_posture_hint="elevated_churn",
                    summary=(
                        "Core domains show mixed present/partial recent-activity signals—stability is not uniform across "
                        "inventory, topology, and policy views."
                    ),
                    detail=f"present={len(present)} partial={len(partial)} sync_runs_limit_applied={bounded}",
                    source_citations=["GET /api/v1/change-intelligence/recent-summary"],
                )
            )

    # --- History / degraded recurrence (policies) ---
    if policies is not None:
        deg = _count_degraded_policies(policies)
        n_snap = len(policies.history.recent_snapshots) if policies.history else 0
        if n_snap >= 2 and deg > 0:
            rows.append(
                OperationalStabilityRow(
                    subject_family="global_window",
                    row_type="degraded_recurrence_signal",
                    stability_posture_hint="degraded_recurrence",
                    summary=(
                        "Policy inventory shows degraded_policy_v1 rows with multiple persisted history snapshots—"
                        "review degraded posture over time; not a blast-radius or root-cause verdict."
                    ),
                    detail=f"degraded_policy_rows={deg} history_snapshot_count={n_snap}",
                    source_citations=["GET /api/v1/policies"],
                )
            )
        elif n_snap >= 2 and policies.history.status == "comparison_ready":
            rows.append(
                OperationalStabilityRow(
                    subject_family="global_window",
                    row_type="recurrence_signal",
                    stability_posture_hint="recurrence_suspected",
                    summary=(
                        "Policy history exposes comparison-ready anchors across multiple snapshots—recurrence analysis "
                        "is bounded to cited history only."
                    ),
                    detail=f"policies.history.status={policies.history.status}",
                    source_citations=["GET /api/v1/policies"],
                )
            )

    # --- Evidence weakness: assembly failures or absent core signals (not “quiet”) ---
    if all_core_failed and recent_change is None:
        rows.append(
            OperationalStabilityRow(
                subject_family="global_window",
                row_type="evidence_weakness_signal",
                stability_posture_hint="insufficient_evidence_for_stability_view",
                summary="Core list assemblies and change-intelligence summary were unavailable for this response.",
                detail="See assembly_notes for bounded failure reasons.",
                source_citations=[],
            )
        )
    elif recent_domains_absent and recent_change is not None:
        rows.append(
            OperationalStabilityRow(
                subject_family="global_window",
                row_type="evidence_weakness_signal",
                stability_posture_hint="insufficient_evidence_for_stability_view",
                summary=(
                    "Change intelligence reports absent evidence for core domains in the bounded window—absence is not "
                    "proof of operational quiet."
                ),
                detail="devices/topology/policies slices evidence_status=absent",
                source_citations=["GET /api/v1/change-intelligence/recent-summary"],
            )
        )

    if not rows:
        if recent_change is not None:
            core = [d for d in recent_change.domains if d.domain in _CORE_DOMAINS]
            present_n = sum(1 for d in core if d.evidence_status == "present")
            partial_n = sum(1 for d in core if d.evidence_status == "partial")
            if present_n + partial_n <= 1:
                rows.append(
                    OperationalStabilityRow(
                        subject_family="global_window",
                        row_type="quiet_signal",
                        stability_posture_hint="quiet_or_stable_evidence",
                        summary=(
                            "Bounded change-intelligence window shows low core-domain activity signals for current "
                            "heuristics—still not proof of network-wide quiet."
                        ),
                        detail=f"present_core={present_n} partial_core={partial_n} sync_runs_limit_applied={bounded}",
                        source_citations=["GET /api/v1/change-intelligence/recent-summary"],
                    )
                )
            else:
                rows.append(
                    OperationalStabilityRow(
                        subject_family="global_window",
                        row_type="evidence_weakness_signal",
                        stability_posture_hint="insufficient_evidence_for_stability_view",
                        summary=(
                            "No stability row kind matched current heuristics; see change-intelligence and list "
                            "endpoints for raw evidence."
                        ),
                        detail=None,
                        source_citations=[
                            "GET /api/v1/change-intelligence/recent-summary",
                            "GET /api/v1/policies",
                            "GET /api/v1/devices",
                            "GET /api/v1/topology",
                        ],
                    )
                )
        else:
            rows.append(
                OperationalStabilityRow(
                    subject_family="global_window",
                    row_type="evidence_weakness_signal",
                    stability_posture_hint="insufficient_evidence_for_stability_view",
                    summary=(
                        "Change-intelligence summary was unavailable; cannot classify bounded churn vs quiet for this "
                        "assembly."
                    ),
                    detail="See assembly_notes when present.",
                    source_citations=[],
                )
            )

    primary = _primary_posture_from_rows(rows, recent_domains_absent=recent_domains_absent)

    churn_rows = sum(1 for r in rows if r.row_type == "churn_signal")
    if primary == "elevated_churn":
        scope_summary = (
            f"Operational stability (bounded): elevated churn signals from existing read-side activity cues "
            f"(sync_runs_limit_applied={bounded}; churn-oriented rows={churn_rows})."
        )
    elif primary == "degraded_recurrence":
        scope_summary = (
            f"Operational stability (bounded): degraded-policy recurrence cues from persisted policy history "
            f"(sync_runs_limit_applied={bounded})."
        )
    elif primary == "recurrence_suspected":
        scope_summary = (
            f"Operational stability (bounded): recurrence-suspected cues from policy history gates "
            f"(sync_runs_limit_applied={bounded})."
        )
    elif primary == "insufficient_evidence_for_stability_view":
        scope_summary = (
            f"Operational stability (bounded): insufficient evidence for a full stability read at this assembly—"
            f"sync_runs_limit_applied={bounded}."
        )
    else:
        scope_summary = (
            f"Operational stability (bounded): low churn heuristics from current inputs; not proof of network-wide "
            f"quiet (sync_runs_limit_applied={bounded})."
        )

    return OperationalStabilitySummaryResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=OPERATIONAL_STABILITY_SUMMARY_CONTRACT_ID,
        safety_framing=OperationalStabilitySafetyFraming(),
        operational_stability_posture=primary,
        scope_summary=scope_summary,
        sync_runs_limit_applied=bounded,
        rows=rows,
        caveats=caveats,
        assembly_notes=assembly_notes,
    )

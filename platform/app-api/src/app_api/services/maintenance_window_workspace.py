"""Maintenance Window Workspace v1 — multi-subject maintenance preview rollups (Phase 2, read-only).

Composes ``build_maintenance_preview_response`` per resolved subject plus optional stability/consistency cues.
See ``platform/docs/maintenance-window-workspace-contract.md``.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from urllib.parse import quote

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.maintenance_preview import (
    MAINTENANCE_PREVIEW_CONTRACT_ID,
    MaintenancePreviewResponse,
)
from app_api.schemas.maintenance_window_workspace import (
    DEFAULT_MAINTENANCE_WINDOW_WORKSPACE_EXPLICIT_NON_CLAIMS,
    MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS,
    MAINTENANCE_WINDOW_WORKSPACE_V1_CONTRACT_ID,
    MaintenanceWindowAffectedServiceRollupRow,
    MaintenanceWindowPolicyRollupRow,
    MaintenanceWindowSubjectResolutionFailure,
    MaintenanceWindowSubjectStripRow,
    MaintenanceWindowTensionCueRow,
    MaintenanceWindowWorkspaceResponse,
)
from app_api.schemas.service_explorer import ServiceListRow
from app_api.schemas.topology_related_policies import TopologyObjectRelatedPoliciesResponse
from app_api.services.change_intelligence import RECENT_CHANGE_SYNC_RUNS_MAX, RECENT_CHANGE_SYNC_RUNS_DEFAULT
from app_api.services.evidence_consistency_summary import build_evidence_consistency_summary_response
from app_api.services.maintenance_preview import build_maintenance_preview_response
from app_api.services.operational_stability_summary import build_operational_stability_summary_response
from app_api.services.topology_related_policies import build_topology_object_related_policies_response

logger = logging.getLogger(__name__)

_DEG_RANK = {"ok": 0, "unknown": 1, "degraded": 2}


def subject_label(object_kind: str, object_id: str) -> str:
    """Stable ``kind:id`` label for provenance lists."""
    return f"{object_kind}:{object_id}"


def parse_subject_tokens(raw: list[str]) -> list[tuple[str, str]]:
    """Parse ``node:{id}`` / ``link:{id}`` tokens; raises ValueError with message on bad input."""
    out: list[tuple[str, str]] = []
    for i, token in enumerate(raw):
        t = token.strip()
        if not t:
            raise ValueError(f"subject[{i}] is empty")
        parts = t.split(":", 1)
        if len(parts) != 2 or not parts[1]:
            raise ValueError(
                f"subject[{i}] must be node:{{node_id}} or link:{{link_id}} (got {token!r})",
            )
        kind, oid = parts[0].strip(), parts[1].strip()
        if kind not in ("node", "link"):
            raise ValueError(
                f"subject[{i}] must start with node: or link: (got {token!r})",
            )
        out.append((kind, oid))
    return out


def dedupe_subjects(pairs: list[tuple[str, str]]) -> list[tuple[str, str]]:
    """Deterministic dedupe and sort: by kind then object_id."""
    seen: set[tuple[str, str]] = set()
    for k, oid in pairs:
        seen.add((k, oid))
    return sorted(seen, key=lambda x: (x[0], x[1]))


def _merge_degraded(a: str, b: str) -> str:
    if _DEG_RANK.get(a, 0) >= _DEG_RANK.get(b, 0):
        return a
    return b


def _dedupe_lines(lines: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in lines:
        line = raw.strip()
        if line and line not in seen:
            seen.add(line)
            out.append(line)
    return out


def _merge_service_rows(
    acc: dict[str, MaintenanceWindowAffectedServiceRollupRow],
    row: ServiceListRow,
    subj: str,
) -> None:
    if row.service_id not in acc:
        acc[row.service_id] = MaintenanceWindowAffectedServiceRollupRow(
            service_id=row.service_id,
            kind=row.kind,
            member_count=row.member_count,
            degraded_group_posture=row.degraded_group_posture,
            touched_by_subjects=[subj],
        )
        return
    cur = acc[row.service_id]
    merged_deg = _merge_degraded(cur.degraded_group_posture, row.degraded_group_posture)
    member = max(cur.member_count, row.member_count)
    touched = _dedupe_lines([*cur.touched_by_subjects, subj])
    acc[row.service_id] = MaintenanceWindowAffectedServiceRollupRow(
        service_id=row.service_id,
        kind=row.kind,
        member_count=member,
        degraded_group_posture=merged_deg,  # type: ignore[arg-type]
        touched_by_subjects=touched,
    )


def _merge_policy_rows(
    acc: dict[str, MaintenanceWindowPolicyRollupRow],
    related: TopologyObjectRelatedPoliciesResponse,
    subj: str,
) -> None:
    for ref in related.items:
        pid = ref.policy_id
        if pid not in acc:
            acc[pid] = MaintenanceWindowPolicyRollupRow(
                policy_id=pid,
                policy_name=ref.policy_name,
                touched_by_subjects=[subj],
            )
        else:
            cur = acc[pid]
            acc[pid] = MaintenanceWindowPolicyRollupRow(
                policy_id=pid,
                policy_name=cur.policy_name or ref.policy_name,
                touched_by_subjects=_dedupe_lines([*cur.touched_by_subjects, subj]),
            )


def _merge_source_ids(chunks: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = [MAINTENANCE_WINDOW_WORKSPACE_V1_CONTRACT_ID]
    for cid in chunks:
        if cid and cid not in seen:
            seen.add(cid)
            out.append(cid)
    return out


def build_maintenance_window_workspace_response(
    *,
    subject_pairs: list[tuple[str, str]],
    preview_context: str,
    sync_runs_limit: int = RECENT_CHANGE_SYNC_RUNS_DEFAULT,
) -> MaintenanceWindowWorkspaceResponse:
    """Assemble maintenance window workspace from normalized distinct subject pairs."""
    settings = get_settings()
    now = datetime.now(tz=UTC)
    bounded_sync = max(1, min(int(sync_runs_limit), RECENT_CHANGE_SYNC_RUNS_MAX))

    distinct = dedupe_subjects(subject_pairs)
    requested_n = len(distinct)

    framing = (
        "Maintenance window workspace v1 aggregates maintenance preview v1 assemblies across a bounded list of "
        "topology subjects. It supports multi-subject planning review only; it does not approve work, simulate "
        "impact, or assert safe-to-change authority."
    )

    failures: list[MaintenanceWindowSubjectResolutionFailure] = []
    previews: list[tuple[str, MaintenancePreviewResponse, TopologyObjectRelatedPoliciesResponse]] = []

    for kind, oid in distinct:
        related = build_topology_object_related_policies_response(oid)
        if related is None:
            failures.append(
                MaintenanceWindowSubjectResolutionFailure(
                    object_kind=kind,  # type: ignore[arg-type]
                    object_id=oid,
                    reason=(
                        "Topology object not found in the current normalized topology snapshot "
                        "(no related-policies anchor)."
                    ),
                ),
            )
            continue
        if related.object_kind != kind:
            failures.append(
                MaintenanceWindowSubjectResolutionFailure(
                    object_kind=kind,  # type: ignore[arg-type]
                    object_id=oid,
                    reason=(
                        f"object_kind={kind!r} does not match topology identity "
                        f"(expected object_kind={related.object_kind!r})."
                    ),
                ),
            )
            continue
        preview = build_maintenance_preview_response(related=related, preview_context=preview_context)
        previews.append((subject_label(kind, oid), preview, related))

    if not previews:
        # Caller should translate to HTTP 422 when no successful assemblies.
        return MaintenanceWindowWorkspaceResponse(
            metadata=ApiResponseMetadata(
                service="app-api",
                version=settings.app_version,
                phase="phase_2_read_only_foundation",
                generated_at=now,
            ),
            window_framing_summary=framing,
            preview_context=preview_context,
            subject_cap_applied=MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS,
            subjects_requested=requested_n,
            subjects_resolved=0,
            selected_subjects=[],
            subject_resolution_failures=failures,
            sync_runs_limit_applied=bounded_sync,
            explicit_non_claims=list(DEFAULT_MAINTENANCE_WINDOW_WORKSPACE_EXPLICIT_NON_CLAIMS),
            source_contract_ids=[MAINTENANCE_WINDOW_WORKSPACE_V1_CONTRACT_ID],
        )

    svc_map: dict[str, MaintenanceWindowAffectedServiceRollupRow] = {}
    pol_map: dict[str, MaintenanceWindowPolicyRollupRow] = {}
    strip: list[MaintenanceWindowSubjectStripRow] = []
    caveats: list[str] = []
    gaps: list[str] = []

    for subj, preview, related in previews:
        strip.append(
            MaintenanceWindowSubjectStripRow(
                object_kind=preview.subject.object_kind,
                object_id=preview.subject.object_id,
                display_name=preview.subject.display_name,
                sparse_preview=preview.sparse_preview,
                related_policy_count=len(related.items),
                related_services_total=preview.related_services_total,
            ),
        )
        caveats.extend(preview.assembly_caveats)
        caveats.extend(preview.sparse_reasons)
        for svc_row in preview.related_services:
            _merge_service_rows(svc_map, svc_row, subj)
        _merge_policy_rows(pol_map, related, subj)

    caveats = _dedupe_lines(caveats)
    if failures:
        gaps.append(
            f"{len(failures)} subject(s) did not resolve; see subject_resolution_failures "
            "(partial workspace).",
        )

    # Optional global cues (reuse existing summaries; failures are non-fatal).
    stability_line: str | None = None
    stability_note: str | None = None
    try:
        stability = build_operational_stability_summary_response(sync_runs_limit=bounded_sync)
        stability_line = (
            f"operational_stability_posture={stability.operational_stability_posture!r} — "
            f"{stability.scope_summary[:400]}"
        )
        if len(stability.scope_summary) > 400:
            stability_line += "…"
    except Exception as exc:  # noqa: BLE001
        logger.warning("maintenance_window_workspace: stability summary failed: %s", exc)
        stability_note = f"operational_stability_summary_v1 assembly unavailable ({type(exc).__name__})."

    tension_rows: list[MaintenanceWindowTensionCueRow] = []
    consistency_note: str | None = None
    consistency_included = False
    try:
        consistency = build_evidence_consistency_summary_response(sync_runs_limit=bounded_sync)
        consistency_included = True
        seen_t: set[str] = set()
        for item in consistency.items:
            if item.consistency_signal != "appears_in_tension":
                continue
            key = item.summary.strip()
            if not key or key in seen_t:
                continue
            seen_t.add(key)
            tension_rows.append(
                MaintenanceWindowTensionCueRow(
                    summary=item.summary,
                    detail=item.detail,
                    category=item.category,
                ),
            )
            if len(tension_rows) >= 16:
                break
    except Exception as exc:  # noqa: BLE001
        logger.warning("maintenance_window_workspace: evidence consistency failed: %s", exc)
        consistency_note = f"evidence_consistency_summary_v1 assembly unavailable ({type(exc).__name__})."

    if stability_note:
        gaps.append(stability_note)
    if consistency_note:
        gaps.append(consistency_note)
    gaps = _dedupe_lines(gaps)

    services_sorted = sorted(svc_map.values(), key=lambda r: r.service_id)
    policies_sorted = sorted(pol_map.values(), key=lambda r: r.policy_id)

    selected = sorted({subject_label(p.subject.object_kind, p.subject.object_id) for _, p, _ in previews})

    sources = _merge_source_ids(
        [MAINTENANCE_PREVIEW_CONTRACT_ID] * len(previews)
        + (["operational_stability_summary_v1"] if stability_line else [])
        + (["evidence_consistency_summary_v1"] if consistency_included else []),
    )

    pivots: list[str] = [
        "GET /api/v1/maintenance-preview — per-subject maintenance_preview_v1 (authoritative touch-set).",
        "GET /api/v1/maintenance-evidence-workspace — single-subject composed workspace.",
        "GET /api/v1/stability/summary — operational_stability_summary_v1 (global cue).",
        "GET /api/v1/evidence-consistency/summary — evidence_consistency_summary_v1 (tension cues).",
    ]
    for subj, _, _ in previews[:12]:
        kind, _, oid = subj.partition(":")
        enc = quote(oid, safe="")
        pivots.append(
            f"GET /api/v1/maintenance-evidence-workspace?object_kind={kind}&object_id={enc} — drill-down.",
        )
    for svc in services_sorted[:8]:
        pivots.append(
            f"GET /api/v1/service-impact-workspace?service_id={quote(svc.service_id, safe='')} — service anchor.",
        )
    pivots.append("GET /api/v1/exports/... — evidence_export_v1 (not this workspace JSON).")

    return MaintenanceWindowWorkspaceResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        window_framing_summary=framing,
        preview_context=preview_context,
        subject_cap_applied=MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS,
        subjects_requested=requested_n,
        subjects_resolved=len(previews),
        selected_subjects=selected,
        subject_strip=strip,
        subject_resolution_failures=failures,
        deduped_affected_services=services_sorted,
        deduped_related_policies=policies_sorted,
        merged_assembly_caveats=caveats,
        merged_evidence_gap_notes=gaps,
        stability_cue_summary=stability_line,
        stability_summary_unavailable_note=stability_note,
        tension_cue_rows=tension_rows,
        evidence_consistency_unavailable_note=consistency_note,
        explicit_non_claims=list(DEFAULT_MAINTENANCE_WINDOW_WORKSPACE_EXPLICIT_NON_CLAIMS),
        source_contract_ids=sources,
        sync_runs_limit_applied=bounded_sync,
        recommended_api_pivots=pivots[:48],
    )

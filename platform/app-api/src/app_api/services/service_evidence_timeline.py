"""Assemble service-scoped evidence timeline read responses (Phase 2, read-only).

Reuses ``build_policy_evidence_timeline_response`` per member and Service Explorer detail
for membership context — see ``platform/docs/service-evidence-timeline-contract.md``.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.policy_evidence_timeline import PolicyEvidenceTimelineEntry
from app_api.schemas.service_evidence_timeline import (
    SERVICE_EVIDENCE_TIMELINE_CONTRACT_ID,
    DEFAULT_SERVICE_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS,
    ServiceEvidenceTimelineEntry,
    ServiceEvidenceTimelineResponse,
    ServiceEvidenceTimelineSafetyFraming,
)
from app_api.services.policy_evidence_timeline import build_policy_evidence_timeline_response
from app_api.services.service_explorer import build_service_detail_response

# Tie-break bands (lower first after newest-first datetime sort).
_TB_SERVICE_MEMBERSHIP = 0
_TB_SERVICE_DEGRADED_ROLLUP = 1
_TB_MEMBER_POLICY_BASE = 10

_MAX_ENTRIES = 400


def _member_tie_break(member_index: int, inner: int) -> int:
    return _TB_MEMBER_POLICY_BASE + member_index * 1000 + inner


def _project_policy_entries(
    *,
    policy_id: str,
    member_index: int,
    policy_entries: list[PolicyEvidenceTimelineEntry],
) -> list[ServiceEvidenceTimelineEntry]:
    out: list[ServiceEvidenceTimelineEntry] = []
    for pe in policy_entries:
        out.append(
            ServiceEvidenceTimelineEntry(
                entry_kind="member_policy_timeline_entry",
                sort_key=pe.sort_key,
                tie_break=_member_tie_break(member_index, pe.tie_break),
                summary=f"[{policy_id}] {pe.summary}",
                provenance="policy_evidence_timeline_v1",
                reference=f"GET /api/v1/policies/{policy_id}/evidence-timeline — {pe.reference}",
                policy_id=policy_id,
                source_policy_entry_kind=pe.entry_kind,
            )
        )
    return out


def build_service_evidence_timeline_response(service_id: str) -> ServiceEvidenceTimelineResponse | None:
    """Return evidence timeline for ``service_id``, or ``None`` if Explorer detail is absent."""
    detail = build_service_detail_response(service_id)
    if detail is None:
        return None

    settings = get_settings()
    now = datetime.now(tz=UTC)
    missing: list[str] = []
    merged: list[ServiceEvidenceTimelineEntry] = []

    merged.append(
        ServiceEvidenceTimelineEntry(
            entry_kind="service_membership_snapshot_anchor",
            sort_key=detail.generated_at,
            tie_break=_TB_SERVICE_MEMBERSHIP,
            summary=(
                f"Service Explorer detail assembly for service_id={service_id!r} "
                f"(members_total={detail.members_total}, kind={detail.kind})."
            ),
            provenance="service_explorer_v1",
            reference="GET /api/v1/services/{service_id}",
            policy_id=None,
            source_policy_entry_kind=None,
        )
    )
    merged.append(
        ServiceEvidenceTimelineEntry(
            entry_kind="service_degraded_roll_up_context",
            sort_key=detail.generated_at,
            tie_break=_TB_SERVICE_DEGRADED_ROLLUP,
            summary=(
                "Degraded service roll-up posture="
                f"{detail.degraded_service.posture} (aggregated from member degraded_policy_v1; interpretation only)."
            ),
            provenance="service_explorer_v1",
            reference="GET /api/v1/services/{service_id} (degraded_service)",
            policy_id=None,
            source_policy_entry_kind=None,
        )
    )

    for idx, m in enumerate(detail.members):
        pt = build_policy_evidence_timeline_response(m.policy_id)
        if pt is None:
            missing.append(f"No normalized inventory row for member policy_id={m.policy_id!r}; timeline skipped.")
            continue
        merged.extend(
            _project_policy_entries(
                policy_id=m.policy_id,
                member_index=idx,
                policy_entries=pt.entries,
            )
        )
        missing.extend(f"[{m.policy_id}] {n}" for n in pt.missing_evidence_notes)

    merged.sort(
        key=lambda e: (-e.sort_key.timestamp(), e.tie_break, e.policy_id or ""),
    )

    truncated = False
    if len(merged) > _MAX_ENTRIES:
        truncated = True
        merged = merged[:_MAX_ENTRIES]
        missing.append(
            f"Service evidence timeline truncated to {_MAX_ENTRIES} entries; open per-policy "
            "GET /api/v1/policies/<policy_id>/evidence-timeline for full depth."
        )

    scope = (
        "Bounded evidence window from Service Explorer membership and per-member policy evidence timelines "
        "(policy_evidence_timeline_v1 projections)."
    )
    if not any(e.entry_kind == "member_policy_timeline_entry" for e in merged):
        scope = "Partial evidence window — member policy timeline entries are empty or unavailable; see notes."
    if truncated:
        scope = "Partial evidence window — entries truncated; see missing_evidence_notes."

    return ServiceEvidenceTimelineResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=SERVICE_EVIDENCE_TIMELINE_CONTRACT_ID,
        safety_framing=ServiceEvidenceTimelineSafetyFraming(
            explicit_non_claims=list(DEFAULT_SERVICE_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS),
        ),
        service_id=detail.service_id,
        scope_summary=scope,
        entries=merged,
        missing_evidence_notes=missing,
    )

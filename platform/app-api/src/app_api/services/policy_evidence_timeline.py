"""Assemble per-policy evidence timeline read responses (Phase 2, read-only).

Uses existing policy inventory, bounded persisted history summaries, and path-analysis
assembly only — no invented timestamps. See ``platform/docs/policy-evidence-timeline-contract.md``.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.persistence.read_side import (
    load_latest_policy_snapshot,
    load_previous_policy_snapshot,
    load_recent_policy_snapshot_summaries,
    policy_record_exists_in_policy_snapshot,
)
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.policy_evidence_timeline import (
    POLICY_EVIDENCE_TIMELINE_CONTRACT_ID,
    DEFAULT_POLICY_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS,
    PolicyEvidenceTimelineEntry,
    PolicyEvidenceTimelineResponse,
    PolicyEvidenceTimelineSafetyFraming,
)
from app_api.schemas.read_side_query import READ_SIDE_HISTORY_RECENT_LIMIT_DEFAULT
from app_api.services.degraded_policy_v1 import build_degraded_policy_v1_classification
from app_api.services.path_analysis import build_policy_path_analysis_response
from app_api.services.policies import _build_policy_history_window, _build_policy_inventory

# Tie-break when sort_key is equal (lower first after newest-first datetime sort).
_TB_PATH_ANALYSIS = 0
_TB_INVENTORY = 1
_TB_DEGRADED = 2
_TB_COMPARISON = 3
_TB_HISTORY_CHECKPOINT = 4


def _row_posture(collector_status: str, persisted_at: datetime | None) -> str:
    return (
        "stale"
        if collector_status == "collector_unavailable" and persisted_at is not None
        else "current"
    )


def build_policy_evidence_timeline_response(policy_id: str) -> PolicyEvidenceTimelineResponse | None:
    """Return evidence timeline for ``policy_id``, or ``None`` if the policy row is absent."""
    settings = get_settings()
    collector_snapshot, policy_snapshot, persisted_at = _build_policy_inventory()
    record = next((r for r in policy_snapshot.records if r.policy_id == policy_id), None)
    if record is None:
        return None

    now = datetime.now(tz=UTC)
    row_current_posture = _row_posture(collector_snapshot.status, persisted_at)

    history = _build_policy_history_window(history_recent_limit=READ_SIDE_HISTORY_RECENT_LIMIT_DEFAULT)
    path_view = build_policy_path_analysis_response(policy_id)
    degraded = build_degraded_policy_v1_classification(
        policy=record,
        row_current_posture=row_current_posture,
    )

    missing: list[str] = []
    if history.status == "unavailable":
        missing.append(
            "No persisted normalized policy snapshot history is available; timeline anchors are "
            "limited to the current inventory response and path-analysis assembly."
        )
    elif history.status == "current_only":
        missing.append(
            "Only one persisted policy snapshot window is available; bounded snapshot-to-snapshot "
            "comparison anchors are omitted."
        )

    if collector_snapshot.status == "collector_unavailable" and persisted_at is not None:
        missing.append(
            "Policy inventory is served from persisted fallback; timestamps reflect the latest "
            "persisted snapshot, not a live collector observation."
        )

    entries: list[PolicyEvidenceTimelineEntry] = []

    inv_observed = policy_snapshot.observed_at
    inv_sort = inv_observed if inv_observed is not None else now
    entries.append(
        PolicyEvidenceTimelineEntry(
            entry_kind="policy_inventory_snapshot_anchor",
            sort_key=inv_sort,
            tie_break=_TB_INVENTORY,
            summary=(
                f"Current normalized policy inventory snapshot (observed_at={inv_observed.isoformat() if inv_observed else 'none'})."
            ),
            provenance="policy_inventory_list",
            reference="GET /api/v1/policies",
        )
    )
    entries.append(
        PolicyEvidenceTimelineEntry(
            entry_kind="degraded_policy_v1_signal_anchor",
            sort_key=inv_sort,
            tie_break=_TB_DEGRADED,
            summary=f"Degraded policy v1 posture={degraded.posture} on this inventory row (interpretation only).",
            provenance="degraded_policy_v1",
            reference="GET /api/v1/policies (PolicyRecord.degraded_policy_v1)",
        )
    )

    if path_view is not None:
        pa_sort = path_view.metadata.generated_at
        entries.append(
            PolicyEvidenceTimelineEntry(
                entry_kind="path_analysis_assembly_anchor",
                sort_key=pa_sort,
                tie_break=_TB_PATH_ANALYSIS,
                summary="Path-analysis assembly timestamp for this policy (interpretation support only).",
                provenance="path_analysis",
                reference="GET /api/v1/policies/{policy_id}/path-analysis",
            )
        )

    recent = load_recent_policy_snapshot_summaries(limit=READ_SIDE_HISTORY_RECENT_LIMIT_DEFAULT)
    for summary in recent:
        if not policy_record_exists_in_policy_snapshot(summary.snapshot_id, policy_id):
            continue
        snap = summary.snapshot
        cp_sort = snap.persisted_at
        entries.append(
            PolicyEvidenceTimelineEntry(
                entry_kind="policy_history_persisted_checkpoint",
                sort_key=cp_sort,
                tie_break=_TB_HISTORY_CHECKPOINT,
                summary=(
                    f"Persisted policy snapshot checkpoint (persisted_at={snap.persisted_at.isoformat()}, "
                    f"observed_at={snap.observed_at.isoformat() if snap.observed_at else 'none'})."
                ),
                provenance="persisted_policy_snapshot",
                reference=f"snapshot_id={summary.snapshot_id}",
            )
        )

    latest_full = load_latest_policy_snapshot()
    previous_full = load_previous_policy_snapshot()
    if (
        history.status == "comparison_ready"
        and history.comparison_to_previous is not None
        and latest_full is not None
        and previous_full is not None
    ):
        cur_ids = {r.policy_id for r in latest_full.snapshot.records}
        prev_ids = {r.policy_id for r in previous_full.snapshot.records}
        if policy_id in cur_ids and policy_id in prev_ids:
            cp = history.comparison_to_previous
            span_sort = max(cp.current_persisted_at, cp.previous_persisted_at)
            entries.append(
                PolicyEvidenceTimelineEntry(
                    entry_kind="policy_history_comparison_span",
                    sort_key=span_sort,
                    tie_break=_TB_COMPARISON,
                    summary=(
                        "Bounded comparison span between the latest two persisted normalized policy "
                        f"snapshots (current={cp.current_snapshot_id}, previous={cp.previous_snapshot_id}); "
                        "not a drift verdict."
                    ),
                    provenance="policy_history_comparison",
                    reference="GET /api/v1/policies history.comparison_to_previous",
                )
            )

    # Newest first: descending sort_key, then ascending tie_break for stable ordering.
    entries.sort(
        key=lambda e: (-e.sort_key.timestamp(), e.tie_break),
    )

    if not recent and history.status != "unavailable":
        missing.append(
            "No per-snapshot persisted checkpoints were emitted for this policy in the recent window "
            "(either no persisted rows or this policy was not present in those snapshots)."
        )

    scope = "Partial evidence window — see missing_evidence_notes when history or checkpoints are sparse."
    if history.status == "comparison_ready" and any(
        e.entry_kind == "policy_history_persisted_checkpoint" for e in entries
    ):
        scope = "Bounded evidence window from current inventory, path-analysis, and persisted policy snapshots."

    return PolicyEvidenceTimelineResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=POLICY_EVIDENCE_TIMELINE_CONTRACT_ID,
        safety_framing=PolicyEvidenceTimelineSafetyFraming(
            explicit_non_claims=list(DEFAULT_POLICY_EVIDENCE_TIMELINE_EXPLICIT_NON_CLAIMS),
        ),
        policy_id=policy_id,
        scope_summary=scope,
        entries=entries,
        missing_evidence_notes=missing,
    )

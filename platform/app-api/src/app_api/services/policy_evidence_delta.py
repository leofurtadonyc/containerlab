"""Assemble per-policy evidence delta read responses (Phase 2, read-only).

Compares the current normalized policy inventory row to the **previous** persisted
normalized snapshot row for the same ``policy_id`` when policy history exposes a
latest-two persisted comparison (aligned with ``GET /api/v1/policies`` history).
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.integrations.collector.policies import CollectorPolicySnapshot
from app_api.models.policy import PolicyInventoryRecord
from app_api.persistence.read_side import load_previous_policy_snapshot
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.policy_evidence_delta import (
    POLICY_EVIDENCE_DELTA_CONTRACT_ID,
    DEFAULT_POLICY_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS,
    PolicyEvidenceDeltaAnchorCurrent,
    PolicyEvidenceDeltaAnchorPrevious,
    PolicyEvidenceDeltaComparisonStatus,
    PolicyEvidenceDeltaItem,
    PolicyEvidenceDeltaResponse,
    PolicyEvidenceDeltaSafetyFraming,
)
from app_api.schemas.read_side_query import READ_SIDE_HISTORY_RECENT_LIMIT_DEFAULT
from app_api.services.degraded_policy_v1 import build_degraded_policy_v1_classification
from app_api.services.policies import (
    _build_policy_history_window,
    _build_policy_inventory,
    _policy_changed_fields,
)


def _row_posture(collector_status: str, persisted_at: datetime | None) -> str:
    return (
        "stale"
        if collector_status == "collector_unavailable" and persisted_at is not None
        else "current"
    )


def _serving_mode(collector_snapshot: CollectorPolicySnapshot) -> str:
    if collector_snapshot.status == "collector_unavailable":
        return "persisted_fallback"
    if collector_snapshot.status == "partial_live_feed":
        return "partial_live"
    if collector_snapshot.status == "live_normalized_feed":
        return "live"
    return "unknown"


def _compare_degraded(
    *,
    current: PolicyInventoryRecord,
    anchor: PolicyInventoryRecord,
    row_posture_current: str,
) -> bool:
    cur = build_degraded_policy_v1_classification(
        policy=current,
        row_current_posture=row_posture_current,
    )
    anc = build_degraded_policy_v1_classification(
        policy=anchor,
        row_current_posture="current",
    )
    if cur.posture != anc.posture:
        return True
    return sorted(cur.reason_codes) != sorted(anc.reason_codes)


def build_policy_evidence_delta_response(policy_id: str) -> PolicyEvidenceDeltaResponse | None:
    """Return evidence delta for ``policy_id``, or ``None`` if the policy row is absent."""
    settings = get_settings()
    now = datetime.now(tz=UTC)
    collector_snapshot, policy_snapshot, persisted_at = _build_policy_inventory()
    record = next((r for r in policy_snapshot.records if r.policy_id == policy_id), None)
    if record is None:
        return None

    row_posture_current = _row_posture(collector_snapshot.status, persisted_at)
    current_anchor = PolicyEvidenceDeltaAnchorCurrent(
        observed_at=policy_snapshot.observed_at,
        row_posture=row_posture_current,  # type: ignore[arg-type]
        serving_mode=_serving_mode(collector_snapshot),  # type: ignore[arg-type]
    )

    history = _build_policy_history_window(history_recent_limit=READ_SIDE_HISTORY_RECENT_LIMIT_DEFAULT)
    caveats: list[str] = [
        "Delta aligns with the latest-two persisted snapshot comparison family used by policy history "
        "(current inventory row versus the **previous** persisted snapshot row for this policy_id).",
        "Path-analysis interpretation is only assembled for the current inventory row; the persisted "
        "anchor does not carry a historical path-analysis assembly for comparison.",
    ]

    if history.status != "comparison_ready":
        status: PolicyEvidenceDeltaComparisonStatus = "no_comparable_anchor"
        scope = (
            "No comparable persisted anchor: policy history does not yet expose a bounded latest-two "
            "snapshot comparison."
        )
        if history.status == "unavailable":
            scope = (
                "No comparable persisted anchor: no normalized policy snapshot history is available for "
                "bounded comparison."
            )
        elif history.status == "current_only":
            scope = (
                "No comparable persisted anchor: only one persisted policy snapshot exists, so a "
                "previous-snapshot row is not available."
            )
        caveats.append(history.summary)
        return PolicyEvidenceDeltaResponse(
            metadata=ApiResponseMetadata(
                service="app-api",
                version=settings.app_version,
                phase="phase_2_read_only_foundation",
                generated_at=now,
            ),
            contract_id=POLICY_EVIDENCE_DELTA_CONTRACT_ID,
            safety_framing=PolicyEvidenceDeltaSafetyFraming(
                explicit_non_claims=list(DEFAULT_POLICY_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS),
            ),
            policy_id=policy_id,
            comparison_status=status,
            scope_summary=scope,
            current_anchor=current_anchor,
            previous_anchor=None,
            delta_items=[
                PolicyEvidenceDeltaItem(
                    category="gap_note",
                    summary="No delta between anchors: a previous persisted snapshot row is required.",
                    detail=None,
                )
            ],
            caveats=caveats,
        )

    previous_ps = load_previous_policy_snapshot()
    if previous_ps is None:
        return PolicyEvidenceDeltaResponse(
            metadata=ApiResponseMetadata(
                service="app-api",
                version=settings.app_version,
                phase="phase_2_read_only_foundation",
                generated_at=now,
            ),
            contract_id=POLICY_EVIDENCE_DELTA_CONTRACT_ID,
            safety_framing=PolicyEvidenceDeltaSafetyFraming(
                explicit_non_claims=list(DEFAULT_POLICY_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS),
            ),
            policy_id=policy_id,
            comparison_status="insufficient_evidence",
            scope_summary=(
                "Insufficient evidence: policy history indicated comparison readiness, but the previous "
                "persisted snapshot could not be loaded."
            ),
            current_anchor=current_anchor,
            previous_anchor=None,
            delta_items=[
                PolicyEvidenceDeltaItem(
                    category="gap_note",
                    summary="Previous persisted snapshot missing while assembling delta.",
                    detail=None,
                )
            ],
            caveats=caveats
            + [
                "This is an internal consistency edge case between history summaries and full snapshot loads.",
            ],
        )

    anchor_record = next(
        (r for r in previous_ps.snapshot.records if r.policy_id == policy_id),
        None,
    )
    prev_anchor = PolicyEvidenceDeltaAnchorPrevious(
        snapshot_id=previous_ps.snapshot_id,
        persisted_at=previous_ps.persisted_at,
        observed_at=previous_ps.snapshot.observed_at,
    )

    if anchor_record is None:
        return PolicyEvidenceDeltaResponse(
            metadata=ApiResponseMetadata(
                service="app-api",
                version=settings.app_version,
                phase="phase_2_read_only_foundation",
                generated_at=now,
            ),
            contract_id=POLICY_EVIDENCE_DELTA_CONTRACT_ID,
            safety_framing=PolicyEvidenceDeltaSafetyFraming(
                explicit_non_claims=list(DEFAULT_POLICY_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS),
            ),
            policy_id=policy_id,
            comparison_status="anchor_policy_absent",
            scope_summary=(
                "The previous persisted snapshot does not include a normalized row for this policy_id; "
                "field-level delta is not supported for this anchor pair."
            ),
            current_anchor=current_anchor,
            previous_anchor=prev_anchor,
            delta_items=[
                PolicyEvidenceDeltaItem(
                    category="gap_note",
                    summary=(
                        "This policy_id is absent from the previous persisted snapshot records, so "
                        "current-versus-previous normalized comparison is not defined here."
                    ),
                    detail=None,
                )
            ],
            caveats=caveats,
        )

    changed = _policy_changed_fields(record, anchor_record)
    delta_items: list[PolicyEvidenceDeltaItem] = []

    posture_fields = [f for f in changed if f != "candidate_paths"]
    if posture_fields:
        delta_items.append(
            PolicyEvidenceDeltaItem(
                category="posture_or_state_field_change",
                summary="One or more normalized inventory posture fields differ between anchors.",
                detail=f"changed_fields={','.join(posture_fields)}",
            )
        )

    if "candidate_paths" in changed:
        delta_items.append(
            PolicyEvidenceDeltaItem(
                category="candidate_path_shape_change",
                summary="Candidate path rows or bounded path fields differ between anchors.",
                detail=None,
            )
        )

    if _compare_degraded(
        current=record,
        anchor=anchor_record,
        row_posture_current=row_posture_current,
    ):
        delta_items.append(
            PolicyEvidenceDeltaItem(
                category="degraded_policy_v1_change",
                summary="degraded_policy_v1 posture or reason_codes differ between anchors (classification only).",
                detail=None,
            )
        )

    obs_cur = policy_snapshot.observed_at
    obs_prev = previous_ps.snapshot.observed_at
    if obs_cur != obs_prev and (obs_cur is not None or obs_prev is not None):
        delta_items.append(
            PolicyEvidenceDeltaItem(
                category="serving_mode_or_freshness_change",
                summary="Inventory observed_at differs between the current response and the anchor snapshot.",
                detail=None,
            )
        )
    elif row_posture_current == "stale":
        delta_items.append(
            PolicyEvidenceDeltaItem(
                category="serving_mode_or_freshness_change",
                summary="Current policy row is served as stale persisted fallback while the anchor is a "
                "historical persisted snapshot row.",
                detail=None,
            )
        )

    if delta_items:
        scope = (
            "Bounded delta between the current inventory row and the previous persisted snapshot row for this "
            "policy_id."
        )
    else:
        scope = (
            "No normalized differences detected between the current inventory row and the previous persisted "
            "snapshot row for this policy_id."
        )

    return PolicyEvidenceDeltaResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=POLICY_EVIDENCE_DELTA_CONTRACT_ID,
        safety_framing=PolicyEvidenceDeltaSafetyFraming(
            explicit_non_claims=list(DEFAULT_POLICY_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS),
        ),
        policy_id=policy_id,
        comparison_status="delta_ready",
        scope_summary=scope,
        current_anchor=current_anchor,
        previous_anchor=prev_anchor,
        delta_items=delta_items,
        caveats=caveats,
    )

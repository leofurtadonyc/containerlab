"""Assemble service-scoped evidence delta read responses (Phase 2, read-only).

Compares current Service Explorer detail to a **previous** persisted normalized policy snapshot
intersected with membership — see ``platform/docs/service-evidence-delta-contract.md``.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from app_api.config.settings import get_settings
from app_api.persistence.read_side import PersistedPolicySnapshot, load_previous_policy_snapshot
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.service_evidence_delta import (
    SERVICE_EVIDENCE_DELTA_CONTRACT_ID,
    DEFAULT_SERVICE_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS,
    MemberPolicyEvidenceDeltaPointer,
    ServiceEvidenceDeltaAnchorCurrent,
    ServiceEvidenceDeltaAnchorPrevious,
    ServiceEvidenceDeltaComparisonStatus,
    ServiceEvidenceDeltaItem,
    ServiceEvidenceDeltaResponse,
    ServiceEvidenceDeltaSafetyFraming,
)
from app_api.schemas.service_explorer import (
    DegradedServiceRollup,
    ServiceExplorerPolicyInventoryEcho,
    ServiceMemberSummary,
    ServiceTopologyLinkRecord,
)
from app_api.schemas.policies import PolicyRecord
from app_api.schemas.read_side_query import READ_SIDE_HISTORY_RECENT_LIMIT_DEFAULT
from app_api.services.policies import build_policy_records_from_inventory_records, _build_policy_history_window
from app_api.services.policy_evidence_delta import build_policy_evidence_delta_response
from app_api.services.service_explorer import (
    build_service_detail_response,
    degraded_service_rollup_for_members,
    list_policy_records_for_service_id,
    topology_links_for_member_policies,
)

_MAX_MEMBER_POLICY_POINTERS = 20


def _policy_inventory_echo_from_previous_snapshot(ps: PersistedPolicySnapshot) -> ServiceExplorerPolicyInventoryEcho:
    snap = ps.snapshot
    data_status: Literal["live", "degraded"] = "live" if ps.data_status == "live" else "degraded"
    return ServiceExplorerPolicyInventoryEcho(
        data_status=data_status,
        serving_mode="persisted_fallback",
        empty_reason=snap.empty_reason,
        summary=(
            f"Previous persisted normalized policy snapshot {ps.snapshot_id} "
            f"(persisted_at={ps.persisted_at.isoformat()})."
        ),
        observed_policy_count=snap.observed_policy_count,
        policy_items_total=len(snap.records),
    )


def _rollup_equal(a: DegradedServiceRollup, b: DegradedServiceRollup) -> bool:
    if a.posture != b.posture:
        return False
    return sorted(a.reason_codes) == sorted(b.reason_codes)


def _member_degraded_changed(cur: ServiceMemberSummary, prev: ServiceMemberSummary) -> bool:
    if cur.degraded_policy_v1.posture != prev.degraded_policy_v1.posture:
        return True
    return sorted(cur.degraded_policy_v1.reason_codes) != sorted(prev.degraded_policy_v1.reason_codes)


def _link_keyset(links: list[ServiceTopologyLinkRecord]) -> set[tuple[str, str, str, str]]:
    return {(l.policy_id, l.node_id, l.matched_on, l.matched_from_policy_field) for l in links}


def _echo_changed(cur: ServiceExplorerPolicyInventoryEcho, prev: ServiceExplorerPolicyInventoryEcho) -> bool:
    """Compare inventory echo fields that are meaningful across live vs historical anchors.

    ``serving_mode`` is intentionally ignored: the previous anchor is always labeled persisted snapshot
    semantics, while the current detail may reflect live collector—difference there is expected, not a
    product delta signal.
    """
    return cur.data_status != prev.data_status or cur.empty_reason != prev.empty_reason


def _no_anchor_response(
    *,
    service_id: str,
    now: datetime,
    status: ServiceEvidenceDeltaComparisonStatus,
    scope: str,
    current_anchor: ServiceEvidenceDeltaAnchorCurrent,
    caveats: list[str],
) -> ServiceEvidenceDeltaResponse:
    settings = get_settings()
    return ServiceEvidenceDeltaResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=SERVICE_EVIDENCE_DELTA_CONTRACT_ID,
        safety_framing=ServiceEvidenceDeltaSafetyFraming(
            explicit_non_claims=list(DEFAULT_SERVICE_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS),
        ),
        service_id=service_id,
        comparison_status=status,
        scope_summary=scope,
        current_anchor=current_anchor,
        previous_anchor=None,
        delta_items=[
            ServiceEvidenceDeltaItem(
                category="gap_note",
                summary="No delta between anchors: a comparable previous persisted snapshot is required.",
                detail=None,
            )
        ],
        caveats=caveats,
    )


def build_service_evidence_delta_response(service_id: str) -> ServiceEvidenceDeltaResponse | None:
    """Return evidence delta for ``service_id``, or ``None`` when Explorer detail is absent (404 family)."""
    current = build_service_detail_response(service_id)
    if current is None:
        return None

    settings = get_settings()
    now = datetime.now(tz=UTC)
    current_anchor = ServiceEvidenceDeltaAnchorCurrent(generated_at=current.generated_at)

    caveats: list[str] = [
        "Delta aligns with the latest-two persisted snapshot comparison family used by policy history "
        "(current inventory versus the **previous** persisted snapshot row set).",
        "Previous-side topology linkage uses the same topology assembly as the current detail; this is a "
        "bounded comparison caveat, not graph equality proof.",
    ]

    history = _build_policy_history_window(history_recent_limit=READ_SIDE_HISTORY_RECENT_LIMIT_DEFAULT)
    if history.status != "comparison_ready":
        status: ServiceEvidenceDeltaComparisonStatus = "no_comparable_anchor"
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
                "previous-snapshot row set is not available."
            )
        caveats.append(history.summary)
        return _no_anchor_response(
            service_id=service_id,
            now=now,
            status=status,
            scope=scope,
            current_anchor=current_anchor,
            caveats=caveats,
        )

    previous_ps = load_previous_policy_snapshot()
    if previous_ps is None:
        return _no_anchor_response(
            service_id=service_id,
            now=now,
            status="insufficient_evidence",
            scope=(
                "Insufficient evidence: policy history indicated comparison readiness, but the previous "
                "persisted snapshot could not be loaded."
            ),
            current_anchor=current_anchor,
            caveats=caveats
            + [
                "This is an internal consistency edge case between history summaries and full snapshot loads.",
            ],
        )

    prev_records = build_policy_records_from_inventory_records(previous_ps.snapshot.records)
    prev_member_list = list_policy_records_for_service_id(service_id, prev_records)
    if prev_member_list is None:
        return None

    prev_echo = _policy_inventory_echo_from_previous_snapshot(previous_ps)
    prev_prev_anchor = ServiceEvidenceDeltaAnchorPrevious(
        snapshot_id=previous_ps.snapshot_id,
        persisted_at=previous_ps.persisted_at,
        observed_at=previous_ps.snapshot.observed_at,
    )

    cur_ids = {m.policy_id for m in current.members}
    prev_ids = {p.policy_id for p in prev_member_list}
    prev_by_id = {p.policy_id: p for p in prev_member_list}
    cur_by_id = {m.policy_id: m for m in current.members}

    prev_topo_links, _, _ = topology_links_for_member_policies(prev_member_list)
    cur_topo_links = current.topology_links

    prev_rollup = degraded_service_rollup_for_members(prev_member_list)

    delta_items: list[ServiceEvidenceDeltaItem] = []

    if cur_ids != prev_ids:
        added = sorted(cur_ids - prev_ids)
        removed = sorted(prev_ids - cur_ids)
        delta_items.append(
            ServiceEvidenceDeltaItem(
                category="service_membership_change",
                summary="Member policy_id set differs between current Explorer detail and the previous snapshot.",
                detail=f"added={added} removed={removed}",
            )
        )

    if not _rollup_equal(current.degraded_service, prev_rollup):
        delta_items.append(
            ServiceEvidenceDeltaItem(
                category="degraded_service_roll_up_change",
                summary="Aggregated degraded_service roll-up differs between anchors (classification only).",
                detail=None,
            )
        )

    member_changed: list[str] = []
    for pid in sorted(cur_ids & prev_ids):
        if _member_degraded_changed(cur_by_id[pid], _to_prev_summary(prev_by_id[pid])):
            member_changed.append(pid)
    if member_changed:
        delta_items.append(
            ServiceEvidenceDeltaItem(
                category="member_degraded_policy_change",
                summary="One or more members changed degraded_policy_v1 posture or reason_codes between anchors.",
                detail=f"policy_ids={member_changed}",
            )
        )

    if _link_keyset(cur_topo_links) != _link_keyset(prev_topo_links):
        delta_items.append(
            ServiceEvidenceDeltaItem(
                category="topology_linkage_change",
                summary="Topology linkage rows differ between anchors under the same matching rules.",
                detail=None,
            )
        )

    if _echo_changed(current.policy_inventory, prev_echo):
        delta_items.append(
            ServiceEvidenceDeltaItem(
                category="policy_inventory_echo_change",
                summary="Echoed policy_inventory fields differ between current detail and the previous snapshot.",
                detail=None,
            )
        )

    if not delta_items:
        delta_items.append(
            ServiceEvidenceDeltaItem(
                category="no_comparable_fields",
                summary="No observable differences in compared service-shaped fields between anchors.",
                detail=None,
            )
        )

    pointers: list[MemberPolicyEvidenceDeltaPointer] = []
    for pid in member_changed[:_MAX_MEMBER_POLICY_POINTERS]:
        pr = build_policy_evidence_delta_response(pid)
        if pr is None:
            continue
        pointers.append(
            MemberPolicyEvidenceDeltaPointer(
                policy_id=pid,
                comparison_status=pr.comparison_status,
            )
        )

    if len(delta_items) == 1 and delta_items[0].category == "no_comparable_fields":
        scope = (
            "No normalized differences detected in compared Service Explorer–shaped fields between the current "
            "detail and the previous persisted snapshot membership slice."
        )
    else:
        scope = (
            "Bounded delta between current Explorer detail and the previous persisted normalized policy snapshot "
            "for this service_id membership slice."
        )

    return ServiceEvidenceDeltaResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=SERVICE_EVIDENCE_DELTA_CONTRACT_ID,
        safety_framing=ServiceEvidenceDeltaSafetyFraming(
            explicit_non_claims=list(DEFAULT_SERVICE_EVIDENCE_DELTA_EXPLICIT_NON_CLAIMS),
        ),
        service_id=service_id,
        comparison_status="delta_ready",
        scope_summary=scope,
        current_anchor=current_anchor,
        previous_anchor=prev_prev_anchor,
        delta_items=delta_items,
        member_policy_delta_pointers=pointers,
        caveats=caveats,
    )


def _to_prev_summary(rec: PolicyRecord) -> ServiceMemberSummary:
    """Mirror ``ServiceMemberSummary`` from a ``PolicyRecord`` (same fields as Explorer detail)."""
    return ServiceMemberSummary(
        policy_id=rec.policy_id,
        policy_name=rec.policy_name,
        policy_type=rec.policy_type,
        headend=rec.headend,
        endpoint=rec.endpoint,
        color=rec.color,
        source_target=rec.source_target,
        degraded_policy_v1=rec.degraded_policy_v1,
    )

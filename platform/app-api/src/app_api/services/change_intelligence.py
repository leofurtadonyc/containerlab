"""Aggregate bounded recent-change summaries from existing persisted evidence only."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.persistence.history import (
    count_readiness_snapshots_matching,
    load_readiness_snapshot_history,
    load_sync_runs,
    summarize_inventory_snapshot_metrics,
    summarize_policy_snapshot_metrics,
    summarize_topology_snapshot_metrics,
)
from app_api.schemas.change_intelligence import (
    CHANGE_INTELLIGENCE_CONTRACT_ID,
    ChangeIntelligenceSafetyFraming,
    DomainEvidenceStatus,
    RecentChangeCompletenessPosture,
    RecentChangeDomainSlice,
    RecentChangeSummaryResponse,
)
from app_api.schemas.common import ApiResponseMetadata

RECENT_CHANGE_READINESS_HISTORY_LIMIT = 5
RECENT_CHANGE_SYNC_RUNS_DEFAULT = 20
RECENT_CHANGE_SYNC_RUNS_MAX = 100


def build_recent_change_summary_response(
    *,
    sync_runs_limit: int = RECENT_CHANGE_SYNC_RUNS_DEFAULT,
) -> RecentChangeSummaryResponse:
    """Assemble a cross-domain recent-change summary from existing tables and sync runs.

    This does not introduce new collection, validation, or workflow semantics; it only
    surfaces counts and timestamps already derivable from persisted snapshot tables and
    ``load_sync_runs``.
    """
    settings = get_settings()
    bounded = max(1, min(int(sync_runs_limit), RECENT_CHANGE_SYNC_RUNS_MAX))

    inv = summarize_inventory_snapshot_metrics()
    topo = summarize_topology_snapshot_metrics()
    pol = summarize_policy_snapshot_metrics()
    readiness_total = count_readiness_snapshots_matching()
    readiness_recent = load_readiness_snapshot_history(
        limit=RECENT_CHANGE_READINESS_HISTORY_LIMIT
    )
    sync_runs = load_sync_runs(limit=bounded)

    latest_sync_finish: datetime | None = None
    per_family_latest: dict[str, datetime] = {}
    for run in sync_runs:
        if latest_sync_finish is None or run.finished_at > latest_sync_finish:
            latest_sync_finish = run.finished_at
        prev = per_family_latest.get(run.model_family)
        if prev is None or run.finished_at > prev:
            per_family_latest[run.model_family] = run.finished_at

    domains: list[RecentChangeDomainSlice] = []

    # devices
    if inv.persisted_row_count <= 0:
        domains.append(
            RecentChangeDomainSlice(
                domain="devices",
                signal_families=["persisted_history_anchor"],
                evidence_status="absent",
                headline="No persisted inventory snapshots in this workspace baseline.",
                detail_notes=[
                    "Inventory history and comparison views require persisted snapshot rows.",
                ],
            )
        )
    else:
        domains.append(
            RecentChangeDomainSlice(
                domain="devices",
                signal_families=[
                    "persisted_snapshot_delta",
                    "persisted_history_anchor",
                ],
                evidence_status="present",
                headline=(
                    f"Inventory snapshots persisted: {inv.persisted_row_count} total; "
                    f"latest at {inv.latest_persisted_at.isoformat() if inv.latest_persisted_at else 'unknown'}."
                ),
                detail_notes=[
                    "Per-device deltas remain on Devices and workflow/audit history—not expanded here.",
                ],
                persisted_snapshot_count=inv.persisted_row_count,
                latest_persisted_at=inv.latest_persisted_at,
            )
        )

    # topology
    if topo.persisted_row_count <= 0:
        domains.append(
            RecentChangeDomainSlice(
                domain="topology",
                signal_families=["persisted_history_anchor"],
                evidence_status="absent",
                headline="No persisted topology snapshots in this workspace baseline.",
                detail_notes=[
                    "Topology remains partiality-bounded when snapshots exist; see topology read contract.",
                ],
            )
        )
    else:
        domains.append(
            RecentChangeDomainSlice(
                domain="topology",
                signal_families=[
                    "persisted_snapshot_delta",
                    "persisted_history_anchor",
                ],
                evidence_status="present",
                headline=(
                    f"Topology snapshots persisted: {topo.persisted_row_count} total; "
                    f"latest at {topo.latest_persisted_at.isoformat() if topo.latest_persisted_at else 'unknown'}."
                ),
                detail_notes=[
                    "Inference, pairing, and collection postures remain per the topology contract.",
                ],
                persisted_snapshot_count=topo.persisted_row_count,
                latest_persisted_at=topo.latest_persisted_at,
            )
        )

    # policies
    if pol.persisted_row_count <= 0:
        domains.append(
            RecentChangeDomainSlice(
                domain="policies",
                signal_families=["persisted_history_anchor"],
                evidence_status="absent",
                headline="No persisted policy snapshots in this workspace baseline.",
                detail_notes=[
                    "Policy detail depth stays bounded to proven collector-backed slices (e.g. static_local) when present.",
                ],
            )
        )
    else:
        domains.append(
            RecentChangeDomainSlice(
                domain="policies",
                signal_families=[
                    "persisted_snapshot_delta",
                    "persisted_history_anchor",
                ],
                evidence_status="present",
                headline=(
                    f"Policy snapshots persisted: {pol.persisted_row_count} total; "
                    f"latest at {pol.latest_persisted_at.isoformat() if pol.latest_persisted_at else 'unknown'}."
                ),
                detail_notes=[
                    "Broader policy families remain off-claims until independently proven.",
                ],
                persisted_snapshot_count=pol.persisted_row_count,
                latest_persisted_at=pol.latest_persisted_at,
            )
        )

    # readiness
    if readiness_total <= 0:
        domains.append(
            RecentChangeDomainSlice(
                domain="readiness",
                signal_families=["readiness_snapshot_sequence"],
                evidence_status="absent",
                headline="No persisted readiness-support snapshots.",
                detail_notes=[
                    "Readiness remains planning-support interpretation only when snapshots exist.",
                ],
            )
        )
    else:
        latest_rs = readiness_recent[0] if readiness_recent else None
        domains.append(
            RecentChangeDomainSlice(
                domain="readiness",
                signal_families=["readiness_snapshot_sequence"],
                evidence_status="partial" if len(readiness_recent) < readiness_total else "present",
                headline=(
                    f"Readiness snapshots persisted: {readiness_total} total; "
                    f"latest planning posture '{latest_rs.planning_readiness if latest_rs else 'unknown'}' "
                    f"at {latest_rs.persisted_at.isoformat() if latest_rs else 'unknown'}."
                ),
                detail_notes=[
                    f"Recent window lists up to {RECENT_CHANGE_READINESS_HISTORY_LIMIT} snapshots for recency context.",
                    "Not workflow execution, dry-run, or validation authority.",
                ],
                persisted_snapshot_count=readiness_total,
                latest_persisted_at=latest_rs.persisted_at if latest_rs else None,
            )
        )

    # workflow-history (sync runs)
    if not sync_runs:
        domains.append(
            RecentChangeDomainSlice(
                domain="workflow_history",
                signal_families=["read_side_sync_derived"],
                evidence_status="absent",
                headline="No persisted read-side sync runs in the requested window.",
                detail_notes=[
                    "Workflow-history views are sync-derived read-side records, not workflow execution lifecycle.",
                ],
                sync_runs_in_window=0,
            )
        )
    else:
        families = ", ".join(sorted(per_family_latest.keys())) or "none"
        domains.append(
            RecentChangeDomainSlice(
                domain="workflow_history",
                signal_families=["read_side_sync_derived"],
                evidence_status="present",
                headline=(
                    f"Read-side sync runs loaded: {len(sync_runs)} (limit {bounded}); "
                    f"latest finish {latest_sync_finish.isoformat() if latest_sync_finish else 'unknown'}; "
                    f"families: {families}."
                ),
                detail_notes=[
                    "Each run may attach inventory/topology/policy snapshot context when persisted.",
                ],
                sync_runs_in_window=len(sync_runs),
                latest_sync_finished_at=latest_sync_finish,
            )
        )

    # audit-history (same sync substrate + readiness audit events in product)
    audit_extra = readiness_total if readiness_total > 0 else 0
    audit_evidence: DomainEvidenceStatus = "absent"
    if sync_runs and readiness_total > 0:
        audit_evidence = "present"
    elif sync_runs or readiness_total > 0:
        audit_evidence = "partial"
    domains.append(
        RecentChangeDomainSlice(
            domain="audit_history",
            signal_families=["read_side_sync_derived", "audit_event_sequence"],
            evidence_status=audit_evidence,
            headline=(
                "Audit-style history is built from the same persisted sync runs as workflow-history "
                f"({len(sync_runs)} in window)"
                + (
                    f" plus up to {audit_extra} readiness snapshot materializations for audit narration."
                    if readiness_total
                    else "."
                )
            ),
            detail_notes=[
                "Not operator change-control or SOC audit completeness; bounded platform events only.",
            ],
            sync_runs_in_window=len(sync_runs),
            latest_sync_finished_at=latest_sync_finish,
        )
    )

    completeness: RecentChangeCompletenessPosture = "bounded_partial"

    aggregation_notes = [
        f"Contract {CHANGE_INTELLIGENCE_CONTRACT_ID}; sync_runs_limit={bounded}.",
        "Window semantics: backend-defined bounded lookback over persisted rows and sync-run list load.",
        "No cross-domain score or safe-to-change recommendation is computed.",
    ]

    now = datetime.now(UTC)
    return RecentChangeSummaryResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        safety=ChangeIntelligenceSafetyFraming(
            authority_posture="evidence_aggregated_non_authoritative",
        ),
        window_semantics="backend_defined_bounded_lookback",
        completeness_posture=completeness,
        sync_runs_limit_applied=bounded,
        readiness_snapshots_considered=len(readiness_recent),
        domains=domains,
        aggregation_notes=aggregation_notes,
    )

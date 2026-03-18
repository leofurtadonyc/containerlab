"""Shared baseline summary derivation for workflow and audit history responses."""

from app_api.persistence.history import summarize_sync_run_history
from app_api.persistence.read_side import (
    load_latest_inventory_snapshot,
    load_latest_policy_snapshot,
    load_latest_topology_snapshot,
)
from app_api.persistence.readiness import load_latest_readiness_snapshot_reference
from app_api.schemas.common import HistoryBaselineSummary


def build_history_baseline_summary(
    data_status: str,
    count: int,
) -> HistoryBaselineSummary:
    """Build bounded baseline summary from persisted artifact presence and current response posture.

    Derives baseline_posture from sync-run, readiness-snapshot, and other persisted artifact
    presence. Helps operators interpret whether the history view reflects preserved sync-derived
    history from the current workspace baseline or is effectively starting from a new baseline
    after restart or redeploy.
    """
    sync_history = summarize_sync_run_history()
    has_preserved_baseline = (
        load_latest_inventory_snapshot() is not None
        or load_latest_topology_snapshot() is not None
        or load_latest_policy_snapshot() is not None
        or sync_history.total_count > 0
        or load_latest_readiness_snapshot_reference() is not None
    )
    baseline_posture = (
        "preserved_same_workspace_baseline" if has_preserved_baseline else "new_baseline"
    )

    if baseline_posture == "preserved_same_workspace_baseline":
        if data_status == "persisted_activity_history" and count > 0:
            summary = (
                "This view reflects preserved sync-derived history from the current workspace baseline. "
                "History items are from persisted sync runs and readiness snapshots."
            )
        else:
            summary = (
                "Same-workspace persisted baseline is present, but no sync-derived history items "
                "are currently available for this view."
            )
    else:
        summary = (
            "This view is effectively starting from a new baseline. No bounded persisted application "
            "artifacts are currently present in Postgres; history will appear as sync runs and "
            "readiness snapshots are recorded."
        )

    notes = [
        "Baseline summary is derived from persisted sync-run and readiness-snapshot presence plus current response posture.",
        "These remain sync-derived and readiness-derived Phase 2 history views, not workflow-grade lifecycle or audit history.",
    ]
    return HistoryBaselineSummary(
        baseline_posture=baseline_posture,
        summary=summary,
        notes=notes,
    )

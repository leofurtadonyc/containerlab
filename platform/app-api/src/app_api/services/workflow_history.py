"""Workflow-style history service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.models.workflow import (
    WorkflowHistoryRecord,
    WorkflowPolicySnapshotComparison,
    WorkflowPolicySnapshotSummary,
)
from app_api.persistence.history import load_sync_runs
from app_api.schemas.workflow_history import (
    WorkflowHistoryItem,
    WorkflowPolicySnapshotComparison as WorkflowPolicySnapshotComparisonResponse,
    WorkflowPolicySnapshotSummary as WorkflowPolicySnapshotSummaryResponse,
    WorkflowHistoryResponse,
)


def _map_sync_status(fetch_status: str) -> str:
    """Map persisted sync-run status into the bounded workflow-history contract."""
    return {
        "live_normalized_feed": "completed",
        "partial_live_feed": "partial",
        "collector_unavailable": "failed",
    }.get(fetch_status, "unknown")


def _map_scope(model_family: str) -> str:
    """Return the current product scope for one persisted sync-run family."""
    return {
        "inventory": "device_inventory_read_side",
        "topology": "topology_read_side",
        "policy": "policy_inventory_read_side",
    }.get(model_family, "platform_read_side")


def build_workflow_history_response() -> WorkflowHistoryResponse:
    """Build the bounded workflow-style history response from persisted sync runs."""
    settings = get_settings()
    records = [
        WorkflowHistoryRecord(
            workflow_id=sync_run.sync_run_id,
            workflow_type="read_side_sync",
            workflow_name=f"{sync_run.model_family}_snapshot_sync",
            scope=_map_scope(sync_run.model_family),
            status=_map_sync_status(sync_run.fetch_status),
            source_type=sync_run.source_type,
            source_endpoint=sync_run.source_endpoint,
            record_count=sync_run.record_count,
            observed_at=sync_run.observed_at,
            started_at=sync_run.started_at,
            finished_at=sync_run.finished_at,
            persisted_artifacts=sync_run.persisted_artifacts,
            policy_snapshot_summary=(
                WorkflowPolicySnapshotSummary(
                    persisted_at=sync_run.policy_snapshot_summary.persisted_at,
                    observed_at=sync_run.policy_snapshot_summary.observed_at,
                    sync_source=sync_run.policy_snapshot_summary.sync_source,
                    sync_status=sync_run.policy_snapshot_summary.sync_status,
                    completeness=sync_run.policy_snapshot_summary.completeness,
                    detail_mode=sync_run.policy_snapshot_summary.detail_mode,
                    empty_reason=sync_run.policy_snapshot_summary.empty_reason,
                    observed_policy_count=sync_run.policy_snapshot_summary.observed_policy_count,
                    active_policy_count=sync_run.policy_snapshot_summary.active_policy_count,
                    detail_record_count=sync_run.policy_snapshot_summary.detail_record_count,
                )
                if sync_run.policy_snapshot_summary is not None
                else None
            ),
            policy_comparison_to_previous=(
                WorkflowPolicySnapshotComparison(
                    current_persisted_at=sync_run.policy_comparison_to_previous.current_persisted_at,
                    previous_persisted_at=sync_run.policy_comparison_to_previous.previous_persisted_at,
                    current_observed_policy_count=sync_run.policy_comparison_to_previous.current_observed_policy_count,
                    previous_observed_policy_count=sync_run.policy_comparison_to_previous.previous_observed_policy_count,
                    current_detail_record_count=sync_run.policy_comparison_to_previous.current_detail_record_count,
                    previous_detail_record_count=sync_run.policy_comparison_to_previous.previous_detail_record_count,
                    observed_policy_delta=sync_run.policy_comparison_to_previous.observed_policy_delta,
                    detail_record_delta=sync_run.policy_comparison_to_previous.detail_record_delta,
                    added_policy_count=sync_run.policy_comparison_to_previous.added_policy_count,
                    removed_policy_count=sync_run.policy_comparison_to_previous.removed_policy_count,
                    changed_policy_count=sync_run.policy_comparison_to_previous.changed_policy_count,
                    notes=sync_run.policy_comparison_to_previous.notes,
                )
                if sync_run.policy_comparison_to_previous is not None
                else None
            ),
            notes=sync_run.notes,
        )
        for sync_run in load_sync_runs()
    ]
    if records:
        data_status = "persisted_activity_history"
        summary = (
            "Workflow history currently reflects platform-side read-only sync activity "
            "derived from persisted inventory, topology, and policy sync runs. It does not "
            "represent operator-submitted change workflows."
        )
    else:
        data_status = "empty"
        summary = (
            "No persisted platform-side sync activity is currently available for the "
            "workflow-history view."
        )
    return WorkflowHistoryResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status=data_status,
        summary=summary,
        count=len(records),
        items=[
            WorkflowHistoryItem(
                workflow_id=record.workflow_id,
                workflow_type=record.workflow_type,
                workflow_name=record.workflow_name,
                scope=record.scope,
                status=record.status,
                source_type=record.source_type,
                source_endpoint=record.source_endpoint,
                record_count=record.record_count,
                observed_at=record.observed_at,
                started_at=record.started_at,
                finished_at=record.finished_at,
                persisted_artifacts=record.persisted_artifacts,
                policy_snapshot_summary=(
                    WorkflowPolicySnapshotSummaryResponse(
                        persisted_at=record.policy_snapshot_summary.persisted_at,
                        observed_at=record.policy_snapshot_summary.observed_at,
                        sync_source=record.policy_snapshot_summary.sync_source,
                        sync_status=record.policy_snapshot_summary.sync_status,
                        completeness=record.policy_snapshot_summary.completeness,
                        detail_mode=record.policy_snapshot_summary.detail_mode,
                        empty_reason=record.policy_snapshot_summary.empty_reason,
                        observed_policy_count=record.policy_snapshot_summary.observed_policy_count,
                        active_policy_count=record.policy_snapshot_summary.active_policy_count,
                        detail_record_count=record.policy_snapshot_summary.detail_record_count,
                    )
                    if record.policy_snapshot_summary is not None
                    else None
                ),
                policy_comparison_to_previous=(
                    WorkflowPolicySnapshotComparisonResponse(
                        current_persisted_at=record.policy_comparison_to_previous.current_persisted_at,
                        previous_persisted_at=record.policy_comparison_to_previous.previous_persisted_at,
                        current_observed_policy_count=record.policy_comparison_to_previous.current_observed_policy_count,
                        previous_observed_policy_count=record.policy_comparison_to_previous.previous_observed_policy_count,
                        current_detail_record_count=record.policy_comparison_to_previous.current_detail_record_count,
                        previous_detail_record_count=record.policy_comparison_to_previous.previous_detail_record_count,
                        observed_policy_delta=record.policy_comparison_to_previous.observed_policy_delta,
                        detail_record_delta=record.policy_comparison_to_previous.detail_record_delta,
                        added_policy_count=record.policy_comparison_to_previous.added_policy_count,
                        removed_policy_count=record.policy_comparison_to_previous.removed_policy_count,
                        changed_policy_count=record.policy_comparison_to_previous.changed_policy_count,
                        notes=record.policy_comparison_to_previous.notes,
                    )
                    if record.policy_comparison_to_previous is not None
                    else None
                ),
                notes=record.notes,
            )
            for record in records
        ],
    )

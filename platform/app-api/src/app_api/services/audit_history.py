"""Audit-style history service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.models.audit import (
    AuditEventRecord,
    AuditPolicySnapshotComparison,
    AuditPolicySnapshotSummary,
)
from app_api.persistence.history import load_sync_runs
from app_api.schemas.audit_history import (
    AuditHistoryItem,
    AuditHistoryResponse,
    AuditPolicySnapshotComparison as AuditPolicySnapshotComparisonResponse,
    AuditPolicySnapshotSummary as AuditPolicySnapshotSummaryResponse,
)


def _map_result(fetch_status: str) -> str:
    """Map persisted sync-run status into the bounded audit-history contract."""
    return {
        "live_normalized_feed": "succeeded",
        "partial_live_feed": "partial",
        "collector_unavailable": "failed",
    }.get(fetch_status, "unknown")


def _map_scope(model_family: str) -> str:
    """Return the current audit target scope for one persisted sync-run family."""
    return {
        "inventory": "device_inventory_read_side",
        "topology": "topology_read_side",
        "policy": "policy_inventory_read_side",
    }.get(model_family, "platform_read_side")


def _build_message(model_family: str, fetch_status: str, persisted_artifacts: list[str]) -> str:
    """Build an honest audit-style message for one persisted sync run."""
    result = _map_result(fetch_status)
    if persisted_artifacts:
        artifacts = ", ".join(persisted_artifacts)
        return (
            f"Platform recorded a {result} {model_family} read-side sync and persisted "
            f"{artifacts}."
        )
    return f"Platform recorded a {result} {model_family} read-side sync."


def _build_policy_snapshot_note(
    sync_run,
) -> list[str]:
    """Return bounded policy snapshot context notes for one audit event."""
    if sync_run.policy_snapshot_summary is None:
        return []
    notes = [
        (
            "Policy snapshot context reflects the normalized snapshot persisted by this "
            "sync run, not operator intent or execution semantics."
        )
    ]
    if sync_run.policy_comparison_to_previous is not None:
        notes.append(
            "Comparison evidence reflects the current persisted policy snapshot against the immediately previous persisted policy snapshot."
        )
    return notes


def build_audit_history_response() -> AuditHistoryResponse:
    """Build the bounded audit-style history response from persisted sync runs."""
    settings = get_settings()
    records = [
        AuditEventRecord(
            event_id=f"sync-run:{sync_run.sync_run_id}",
            event_type="read_side_sync_recorded",
            source="app-api",
            actor="platform_system",
            target_scope=_map_scope(sync_run.model_family),
            result=_map_result(sync_run.fetch_status),
            correlation_id=sync_run.sync_run_id,
            occurred_at=sync_run.finished_at,
            message=_build_message(
                sync_run.model_family,
                sync_run.fetch_status,
                sync_run.persisted_artifacts,
            ),
            policy_snapshot_summary=(
                AuditPolicySnapshotSummary(
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
                AuditPolicySnapshotComparison(
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
            notes=[*sync_run.notes, *_build_policy_snapshot_note(sync_run)],
        )
        for sync_run in load_sync_runs()
    ]
    if records:
        data_status = "persisted_activity_history"
        summary = (
            "Audit history currently reflects platform-recorded read-side sync events "
            "derived from persisted inventory, topology, and policy activity. It does not yet "
            "represent full operator workflow or approval history."
        )
    else:
        data_status = "empty"
        summary = (
            "No persisted platform audit-style sync events are currently available."
        )
    return AuditHistoryResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status=data_status,
        summary=summary,
        count=len(records),
        items=[
            AuditHistoryItem(
                event_id=record.event_id,
                event_type=record.event_type,
                source=record.source,
                actor=record.actor,
                target_scope=record.target_scope,
                result=record.result,
                correlation_id=record.correlation_id,
                occurred_at=record.occurred_at,
                message=record.message,
                policy_snapshot_summary=(
                    AuditPolicySnapshotSummaryResponse(
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
                    AuditPolicySnapshotComparisonResponse(
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

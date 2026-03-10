"""Workflow-style history service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.models.workflow import WorkflowHistoryRecord
from app_api.persistence.history import load_sync_runs
from app_api.schemas.workflow_history import WorkflowHistoryItem, WorkflowHistoryResponse


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
                notes=record.notes,
            )
            for record in records
        ],
    )

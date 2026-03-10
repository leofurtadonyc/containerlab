"""Audit-style history service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.models.audit import AuditEventRecord
from app_api.persistence.history import load_sync_runs
from app_api.schemas.audit_history import AuditHistoryItem, AuditHistoryResponse


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
            notes=sync_run.notes,
        )
        for sync_run in load_sync_runs()
    ]
    if records:
        data_status = "persisted_activity_history"
        summary = (
            "Audit history currently reflects platform-recorded read-side sync events "
            "derived from persisted inventory and topology activity. It does not yet "
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
        phase="phase_1_skeleton",
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
                notes=record.notes,
            )
            for record in records
        ],
    )

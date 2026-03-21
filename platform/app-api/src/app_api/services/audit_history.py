"""Audit-style history service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.models.audit import (
    AuditEventRecord,
    AuditInventorySnapshotComparison,
    AuditInventorySnapshotSummary,
    AuditPolicySnapshotComparison,
    AuditPolicySnapshotSummary,
    AuditReadinessSnapshotSummary,
    AuditTopologySnapshotComparison,
    AuditTopologySnapshotSummary,
)
from app_api.persistence.history import load_readiness_snapshot_history, load_sync_runs
from app_api.services.history_baseline import build_history_baseline_summary
from app_api.schemas.devices import InventoryHistoryChangePreview as InventoryHistoryChangePreviewSchema
from app_api.schemas.audit_history import (
    AuditHistoryItem,
    AuditHistoryResponse,
    AuditInventorySnapshotComparison as AuditInventorySnapshotComparisonResponse,
    AuditInventorySnapshotSummary as AuditInventorySnapshotSummaryResponse,
    AuditPolicySnapshotComparison as AuditPolicySnapshotComparisonResponse,
    AuditPolicySnapshotSummary as AuditPolicySnapshotSummaryResponse,
    AuditReadinessSnapshotSummary as AuditReadinessSnapshotSummaryResponse,
    AuditTopologySnapshotComparison as AuditTopologySnapshotComparisonResponse,
    AuditTopologySnapshotSummary as AuditTopologySnapshotSummaryResponse,
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


def _build_inventory_snapshot_note(
    sync_run,
) -> list[str]:
    """Return bounded inventory snapshot context notes for one audit event."""
    if sync_run.inventory_snapshot_summary is None:
        return []
    notes = [
        (
            "Inventory snapshot context reflects the normalized inventory snapshot persisted "
            "by this sync run, not raw vendor payloads or operator intent."
        )
    ]
    if sync_run.inventory_comparison_to_previous is not None:
        notes.append(
            "Comparison evidence reflects the current persisted inventory snapshot against the immediately previous persisted inventory snapshot."
        )
    return notes


def _build_topology_snapshot_note(
    sync_run,
) -> list[str]:
    """Return bounded topology snapshot context notes for one audit event."""
    if sync_run.topology_snapshot_summary is None:
        return []
    notes = [
        (
            "Topology snapshot context reflects the normalized topology snapshot persisted "
            "by this sync run, not controller topology truth or a drift engine."
        )
    ]
    if sync_run.topology_comparison_to_previous is not None:
        notes.append(
            "Comparison evidence reflects the current persisted topology snapshot against the immediately previous persisted topology snapshot."
        )
    return notes


def build_audit_history_response() -> AuditHistoryResponse:
    """Build the bounded audit-style history response from persisted sync runs."""
    settings = get_settings()
    sync_run_records = [
        AuditEventRecord(
            event_id=f"sync-run:{sync_run.sync_run_id}",
            event_type="read_side_sync_recorded",
            source="app-api",
            actor="platform_system",
            target_scope=_map_scope(sync_run.model_family),
            result=_map_result(sync_run.fetch_status),
            correlation_id=sync_run.sync_run_id,
            sync_run_id=sync_run.sync_run_id,
            readiness_snapshot_id=None,
            occurred_at=sync_run.finished_at,
            message=_build_message(
                sync_run.model_family,
                sync_run.fetch_status,
                sync_run.persisted_artifacts,
            ),
            inventory_snapshot_summary=(
                AuditInventorySnapshotSummary(
                    snapshot_id=sync_run.inventory_snapshot_summary.snapshot_id,
                    sync_run_id=sync_run.inventory_snapshot_summary.sync_run_id,
                    persisted_at=sync_run.inventory_snapshot_summary.persisted_at,
                    observed_at=sync_run.inventory_snapshot_summary.observed_at,
                    sync_source=sync_run.inventory_snapshot_summary.sync_source,
                    sync_status=sync_run.inventory_snapshot_summary.sync_status,
                    data_status=sync_run.inventory_snapshot_summary.data_status,
                    source_endpoint=sync_run.inventory_snapshot_summary.source_endpoint,
                    device_count=sync_run.inventory_snapshot_summary.device_count,
                    role_counts=sync_run.inventory_snapshot_summary.role_counts,
                    collector_status_counts=sync_run.inventory_snapshot_summary.collector_status_counts,
                    capability_summary_counts=sync_run.inventory_snapshot_summary.capability_summary_counts,
                )
                if sync_run.inventory_snapshot_summary is not None
                else None
            ),
            inventory_comparison_to_previous=(
                AuditInventorySnapshotComparison(
                    current_snapshot_id=sync_run.inventory_comparison_to_previous.current_snapshot_id,
                    previous_snapshot_id=sync_run.inventory_comparison_to_previous.previous_snapshot_id,
                    current_persisted_at=sync_run.inventory_comparison_to_previous.current_persisted_at,
                    previous_persisted_at=sync_run.inventory_comparison_to_previous.previous_persisted_at,
                    current_observed_at=sync_run.inventory_comparison_to_previous.current_observed_at,
                    previous_observed_at=sync_run.inventory_comparison_to_previous.previous_observed_at,
                    current_sync_status=sync_run.inventory_comparison_to_previous.current_sync_status,
                    previous_sync_status=sync_run.inventory_comparison_to_previous.previous_sync_status,
                    current_data_status=sync_run.inventory_comparison_to_previous.current_data_status,
                    previous_data_status=sync_run.inventory_comparison_to_previous.previous_data_status,
                    current_device_count=sync_run.inventory_comparison_to_previous.current_device_count,
                    previous_device_count=sync_run.inventory_comparison_to_previous.previous_device_count,
                    device_count_delta=sync_run.inventory_comparison_to_previous.device_count_delta,
                    added_device_count=sync_run.inventory_comparison_to_previous.added_device_count,
                    removed_device_count=sync_run.inventory_comparison_to_previous.removed_device_count,
                    changed_device_count=sync_run.inventory_comparison_to_previous.changed_device_count,
                    change_preview=sync_run.inventory_comparison_to_previous.change_preview,
                    notes=sync_run.inventory_comparison_to_previous.notes,
                )
                if sync_run.inventory_comparison_to_previous is not None
                else None
            ),
            topology_snapshot_summary=(
                AuditTopologySnapshotSummary(
                    snapshot_id=sync_run.topology_snapshot_summary.snapshot_id,
                    persisted_at=sync_run.topology_snapshot_summary.persisted_at,
                    observed_at=sync_run.topology_snapshot_summary.observed_at,
                    topology_name=sync_run.topology_snapshot_summary.topology_name,
                    sync_source=sync_run.topology_snapshot_summary.sync_source,
                    sync_status=sync_run.topology_snapshot_summary.sync_status,
                    completeness=sync_run.topology_snapshot_summary.completeness,
                    node_count=sync_run.topology_snapshot_summary.node_count,
                    link_count=sync_run.topology_snapshot_summary.link_count,
                    node_state_counts=sync_run.topology_snapshot_summary.node_state_counts,
                    link_state_counts=sync_run.topology_snapshot_summary.link_state_counts,
                    inference_posture=sync_run.topology_snapshot_summary.inference_posture,
                    endpoint_pairing_posture=sync_run.topology_snapshot_summary.endpoint_pairing_posture,
                    collection_posture=sync_run.topology_snapshot_summary.collection_posture,
                    node_participation_posture=sync_run.topology_snapshot_summary.node_participation_posture,
                    paired_link_count=sync_run.topology_snapshot_summary.paired_link_count,
                    single_sided_link_count=sync_run.topology_snapshot_summary.single_sided_link_count,
                    linked_node_count=sync_run.topology_snapshot_summary.linked_node_count,
                    isolated_node_count=sync_run.topology_snapshot_summary.isolated_node_count,
                )
                if sync_run.topology_snapshot_summary is not None
                else None
            ),
            topology_comparison_to_previous=(
                AuditTopologySnapshotComparison(
                    current_snapshot_id=sync_run.topology_comparison_to_previous.current_snapshot_id,
                    previous_snapshot_id=sync_run.topology_comparison_to_previous.previous_snapshot_id,
                    current_persisted_at=sync_run.topology_comparison_to_previous.current_persisted_at,
                    previous_persisted_at=sync_run.topology_comparison_to_previous.previous_persisted_at,
                    current_node_count=sync_run.topology_comparison_to_previous.current_node_count,
                    previous_node_count=sync_run.topology_comparison_to_previous.previous_node_count,
                    current_link_count=sync_run.topology_comparison_to_previous.current_link_count,
                    previous_link_count=sync_run.topology_comparison_to_previous.previous_link_count,
                    node_count_delta=sync_run.topology_comparison_to_previous.node_count_delta,
                    link_count_delta=sync_run.topology_comparison_to_previous.link_count_delta,
                    added_node_count=sync_run.topology_comparison_to_previous.added_node_count,
                    removed_node_count=sync_run.topology_comparison_to_previous.removed_node_count,
                    changed_node_count=sync_run.topology_comparison_to_previous.changed_node_count,
                    added_link_count=sync_run.topology_comparison_to_previous.added_link_count,
                    removed_link_count=sync_run.topology_comparison_to_previous.removed_link_count,
                    changed_link_count=sync_run.topology_comparison_to_previous.changed_link_count,
                    notes=sync_run.topology_comparison_to_previous.notes,
                    current_inference_posture=sync_run.topology_comparison_to_previous.current_inference_posture,
                    previous_inference_posture=sync_run.topology_comparison_to_previous.previous_inference_posture,
                    current_endpoint_pairing_posture=sync_run.topology_comparison_to_previous.current_endpoint_pairing_posture,
                    previous_endpoint_pairing_posture=sync_run.topology_comparison_to_previous.previous_endpoint_pairing_posture,
                    current_collection_posture=sync_run.topology_comparison_to_previous.current_collection_posture,
                    previous_collection_posture=sync_run.topology_comparison_to_previous.previous_collection_posture,
                    current_node_participation_posture=sync_run.topology_comparison_to_previous.current_node_participation_posture,
                    previous_node_participation_posture=sync_run.topology_comparison_to_previous.previous_node_participation_posture,
                    current_paired_link_count=sync_run.topology_comparison_to_previous.current_paired_link_count,
                    previous_paired_link_count=sync_run.topology_comparison_to_previous.previous_paired_link_count,
                    current_single_sided_link_count=sync_run.topology_comparison_to_previous.current_single_sided_link_count,
                    previous_single_sided_link_count=sync_run.topology_comparison_to_previous.previous_single_sided_link_count,
                    current_linked_node_count=sync_run.topology_comparison_to_previous.current_linked_node_count,
                    previous_linked_node_count=sync_run.topology_comparison_to_previous.previous_linked_node_count,
                    current_isolated_node_count=sync_run.topology_comparison_to_previous.current_isolated_node_count,
                    previous_isolated_node_count=sync_run.topology_comparison_to_previous.previous_isolated_node_count,
                )
                if sync_run.topology_comparison_to_previous is not None
                else None
            ),
            policy_snapshot_summary=(
                AuditPolicySnapshotSummary(
                    snapshot_id=sync_run.policy_snapshot_summary.snapshot_id,
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
                    detail_source_readiness_posture=sync_run.policy_snapshot_summary.detail_source_readiness_posture,
                    detail_ready_target_count=sync_run.policy_snapshot_summary.detail_ready_target_count,
                    no_policies_observed_target_count=sync_run.policy_snapshot_summary.no_policies_observed_target_count,
                    detail_unavailable_target_count=sync_run.policy_snapshot_summary.detail_unavailable_target_count,
                    partial_detail_target_count=sync_run.policy_snapshot_summary.partial_detail_target_count,
                )
                if sync_run.policy_snapshot_summary is not None
                else None
            ),
            policy_comparison_to_previous=(
                AuditPolicySnapshotComparison(
                    current_snapshot_id=sync_run.policy_comparison_to_previous.current_snapshot_id,
                    previous_snapshot_id=sync_run.policy_comparison_to_previous.previous_snapshot_id,
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
                    current_detail_source_readiness_posture=sync_run.policy_comparison_to_previous.current_detail_source_readiness_posture,
                    previous_detail_source_readiness_posture=sync_run.policy_comparison_to_previous.previous_detail_source_readiness_posture,
                    current_detail_ready_target_count=sync_run.policy_comparison_to_previous.current_detail_ready_target_count,
                    previous_detail_ready_target_count=sync_run.policy_comparison_to_previous.previous_detail_ready_target_count,
                    current_no_policies_observed_target_count=sync_run.policy_comparison_to_previous.current_no_policies_observed_target_count,
                    previous_no_policies_observed_target_count=sync_run.policy_comparison_to_previous.previous_no_policies_observed_target_count,
                    current_detail_unavailable_target_count=sync_run.policy_comparison_to_previous.current_detail_unavailable_target_count,
                    previous_detail_unavailable_target_count=sync_run.policy_comparison_to_previous.previous_detail_unavailable_target_count,
                    current_partial_detail_target_count=sync_run.policy_comparison_to_previous.current_partial_detail_target_count,
                    previous_partial_detail_target_count=sync_run.policy_comparison_to_previous.previous_partial_detail_target_count,
                )
                if sync_run.policy_comparison_to_previous is not None
                else None
            ),
            readiness_snapshot_summary=None,
            notes=[
                *sync_run.notes,
                *_build_inventory_snapshot_note(sync_run),
                *_build_topology_snapshot_note(sync_run),
                *_build_policy_snapshot_note(sync_run),
            ],
        )
        for sync_run in load_sync_runs()
    ]
    readiness_records = [
        AuditEventRecord(
            event_id=f"readiness-snapshot:{snapshot.snapshot_id}",
            event_type="readiness_snapshot_recorded",
            source="app-api",
            actor="platform_system",
            target_scope="dry_run_readiness_support",
            result="succeeded",
            correlation_id=snapshot.snapshot_id,
            sync_run_id=None,
            readiness_snapshot_id=snapshot.snapshot_id,
            occurred_at=snapshot.persisted_at,
            message=(
                "Platform recorded a bounded dry-run-readiness support snapshot when the "
                "readiness summary changed materially."
            ),
            inventory_snapshot_summary=None,
            inventory_comparison_to_previous=None,
            topology_snapshot_summary=None,
            topology_comparison_to_previous=None,
            policy_snapshot_summary=None,
            policy_comparison_to_previous=None,
            readiness_snapshot_summary=AuditReadinessSnapshotSummary(
                snapshot_id=snapshot.snapshot_id,
                persisted_at=snapshot.persisted_at,
                readiness_status=snapshot.readiness_status,
                planning_readiness=snapshot.planning_readiness,
                phase_recommendation=snapshot.phase_recommendation,
                summary=snapshot.summary,
                blocker_count=snapshot.blocker_count,
                strongest_blockers=snapshot.strongest_blockers,
            ),
            notes=[
                "Readiness snapshot history reflects bounded planning-support metadata rather than dry-run execution, approval, or rollback history.",
                "A new readiness history record exists only when the persisted readiness content changed materially.",
            ],
        )
        for snapshot in load_readiness_snapshot_history()
    ]
    records = sorted(
        [*sync_run_records, *readiness_records],
        key=lambda record: record.occurred_at,
        reverse=True,
    )
    if records:
        data_status = "persisted_activity_history"
        summary = (
            "Audit history currently reflects platform-recorded read-side sync events plus "
            "persisted readiness-support snapshots. It does not yet represent full operator "
            "workflow, approval, or rollback history."
        )
    else:
        data_status = "empty"
        summary = (
            "No persisted platform audit-style sync events or readiness-support snapshots are currently available."
        )
    baseline_summary = build_history_baseline_summary(data_status, len(records))
    return AuditHistoryResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status=data_status,
        summary=summary,
        baseline_summary=baseline_summary,
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
                sync_run_id=record.sync_run_id,
                readiness_snapshot_id=record.readiness_snapshot_id,
                occurred_at=record.occurred_at,
                message=record.message,
                inventory_snapshot_summary=(
                    AuditInventorySnapshotSummaryResponse(
                        snapshot_id=record.inventory_snapshot_summary.snapshot_id,
                        sync_run_id=record.inventory_snapshot_summary.sync_run_id,
                        persisted_at=record.inventory_snapshot_summary.persisted_at,
                        observed_at=record.inventory_snapshot_summary.observed_at,
                        sync_source=record.inventory_snapshot_summary.sync_source,
                        sync_status=record.inventory_snapshot_summary.sync_status,
                        data_status=record.inventory_snapshot_summary.data_status,
                        source_endpoint=record.inventory_snapshot_summary.source_endpoint,
                        device_count=record.inventory_snapshot_summary.device_count,
                        role_counts=record.inventory_snapshot_summary.role_counts,
                        collector_status_counts=record.inventory_snapshot_summary.collector_status_counts,
                        capability_summary_counts=record.inventory_snapshot_summary.capability_summary_counts,
                    )
                    if record.inventory_snapshot_summary is not None
                    else None
                ),
                inventory_comparison_to_previous=(
                    AuditInventorySnapshotComparisonResponse(
                        current_snapshot_id=record.inventory_comparison_to_previous.current_snapshot_id,
                        previous_snapshot_id=record.inventory_comparison_to_previous.previous_snapshot_id,
                        current_persisted_at=record.inventory_comparison_to_previous.current_persisted_at,
                        previous_persisted_at=record.inventory_comparison_to_previous.previous_persisted_at,
                        current_observed_at=record.inventory_comparison_to_previous.current_observed_at,
                        previous_observed_at=record.inventory_comparison_to_previous.previous_observed_at,
                        current_sync_status=record.inventory_comparison_to_previous.current_sync_status,
                        previous_sync_status=record.inventory_comparison_to_previous.previous_sync_status,
                        current_data_status=record.inventory_comparison_to_previous.current_data_status,
                        previous_data_status=record.inventory_comparison_to_previous.previous_data_status,
                        current_device_count=record.inventory_comparison_to_previous.current_device_count,
                        previous_device_count=record.inventory_comparison_to_previous.previous_device_count,
                        device_count_delta=record.inventory_comparison_to_previous.device_count_delta,
                        added_device_count=record.inventory_comparison_to_previous.added_device_count,
                        removed_device_count=record.inventory_comparison_to_previous.removed_device_count,
                        changed_device_count=record.inventory_comparison_to_previous.changed_device_count,
                        change_preview=[
                            InventoryHistoryChangePreviewSchema.model_validate(
                                p.model_dump()
                            )
                            for p in record.inventory_comparison_to_previous.change_preview
                        ],
                        notes=record.inventory_comparison_to_previous.notes,
                    )
                    if record.inventory_comparison_to_previous is not None
                    else None
                ),
                topology_snapshot_summary=(
                    AuditTopologySnapshotSummaryResponse(
                        snapshot_id=record.topology_snapshot_summary.snapshot_id,
                        persisted_at=record.topology_snapshot_summary.persisted_at,
                        observed_at=record.topology_snapshot_summary.observed_at,
                        topology_name=record.topology_snapshot_summary.topology_name,
                        sync_source=record.topology_snapshot_summary.sync_source,
                        sync_status=record.topology_snapshot_summary.sync_status,
                        completeness=record.topology_snapshot_summary.completeness,
                        node_count=record.topology_snapshot_summary.node_count,
                        link_count=record.topology_snapshot_summary.link_count,
                        node_state_counts=record.topology_snapshot_summary.node_state_counts,
                        link_state_counts=record.topology_snapshot_summary.link_state_counts,
                        inference_posture=record.topology_snapshot_summary.inference_posture,
                        endpoint_pairing_posture=record.topology_snapshot_summary.endpoint_pairing_posture,
                        collection_posture=record.topology_snapshot_summary.collection_posture,
                        node_participation_posture=record.topology_snapshot_summary.node_participation_posture,
                        paired_link_count=record.topology_snapshot_summary.paired_link_count,
                        single_sided_link_count=record.topology_snapshot_summary.single_sided_link_count,
                        linked_node_count=record.topology_snapshot_summary.linked_node_count,
                        isolated_node_count=record.topology_snapshot_summary.isolated_node_count,
                    )
                    if record.topology_snapshot_summary is not None
                    else None
                ),
                topology_comparison_to_previous=(
                    AuditTopologySnapshotComparisonResponse(
                        current_snapshot_id=record.topology_comparison_to_previous.current_snapshot_id,
                        previous_snapshot_id=record.topology_comparison_to_previous.previous_snapshot_id,
                        current_persisted_at=record.topology_comparison_to_previous.current_persisted_at,
                        previous_persisted_at=record.topology_comparison_to_previous.previous_persisted_at,
                        current_node_count=record.topology_comparison_to_previous.current_node_count,
                        previous_node_count=record.topology_comparison_to_previous.previous_node_count,
                        current_link_count=record.topology_comparison_to_previous.current_link_count,
                        previous_link_count=record.topology_comparison_to_previous.previous_link_count,
                        node_count_delta=record.topology_comparison_to_previous.node_count_delta,
                        link_count_delta=record.topology_comparison_to_previous.link_count_delta,
                        added_node_count=record.topology_comparison_to_previous.added_node_count,
                        removed_node_count=record.topology_comparison_to_previous.removed_node_count,
                        changed_node_count=record.topology_comparison_to_previous.changed_node_count,
                        added_link_count=record.topology_comparison_to_previous.added_link_count,
                        removed_link_count=record.topology_comparison_to_previous.removed_link_count,
                        changed_link_count=record.topology_comparison_to_previous.changed_link_count,
                        notes=record.topology_comparison_to_previous.notes,
                        current_inference_posture=record.topology_comparison_to_previous.current_inference_posture,
                        previous_inference_posture=record.topology_comparison_to_previous.previous_inference_posture,
                        current_endpoint_pairing_posture=record.topology_comparison_to_previous.current_endpoint_pairing_posture,
                        previous_endpoint_pairing_posture=record.topology_comparison_to_previous.previous_endpoint_pairing_posture,
                        current_collection_posture=record.topology_comparison_to_previous.current_collection_posture,
                        previous_collection_posture=record.topology_comparison_to_previous.previous_collection_posture,
                        current_node_participation_posture=record.topology_comparison_to_previous.current_node_participation_posture,
                        previous_node_participation_posture=record.topology_comparison_to_previous.previous_node_participation_posture,
                        current_paired_link_count=record.topology_comparison_to_previous.current_paired_link_count,
                        previous_paired_link_count=record.topology_comparison_to_previous.previous_paired_link_count,
                        current_single_sided_link_count=record.topology_comparison_to_previous.current_single_sided_link_count,
                        previous_single_sided_link_count=record.topology_comparison_to_previous.previous_single_sided_link_count,
                        current_linked_node_count=record.topology_comparison_to_previous.current_linked_node_count,
                        previous_linked_node_count=record.topology_comparison_to_previous.previous_linked_node_count,
                        current_isolated_node_count=record.topology_comparison_to_previous.current_isolated_node_count,
                        previous_isolated_node_count=record.topology_comparison_to_previous.previous_isolated_node_count,
                    )
                    if record.topology_comparison_to_previous is not None
                    else None
                ),
                policy_snapshot_summary=(
                    AuditPolicySnapshotSummaryResponse(
                        snapshot_id=record.policy_snapshot_summary.snapshot_id,
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
                        detail_source_readiness_posture=record.policy_snapshot_summary.detail_source_readiness_posture,
                        detail_ready_target_count=record.policy_snapshot_summary.detail_ready_target_count,
                        no_policies_observed_target_count=record.policy_snapshot_summary.no_policies_observed_target_count,
                        detail_unavailable_target_count=record.policy_snapshot_summary.detail_unavailable_target_count,
                        partial_detail_target_count=record.policy_snapshot_summary.partial_detail_target_count,
                    )
                    if record.policy_snapshot_summary is not None
                    else None
                ),
                policy_comparison_to_previous=(
                    AuditPolicySnapshotComparisonResponse(
                        current_snapshot_id=record.policy_comparison_to_previous.current_snapshot_id,
                        previous_snapshot_id=record.policy_comparison_to_previous.previous_snapshot_id,
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
                        current_detail_source_readiness_posture=record.policy_comparison_to_previous.current_detail_source_readiness_posture,
                        previous_detail_source_readiness_posture=record.policy_comparison_to_previous.previous_detail_source_readiness_posture,
                        current_detail_ready_target_count=record.policy_comparison_to_previous.current_detail_ready_target_count,
                        previous_detail_ready_target_count=record.policy_comparison_to_previous.previous_detail_ready_target_count,
                        current_no_policies_observed_target_count=record.policy_comparison_to_previous.current_no_policies_observed_target_count,
                        previous_no_policies_observed_target_count=record.policy_comparison_to_previous.previous_no_policies_observed_target_count,
                        current_detail_unavailable_target_count=record.policy_comparison_to_previous.current_detail_unavailable_target_count,
                        previous_detail_unavailable_target_count=record.policy_comparison_to_previous.previous_detail_unavailable_target_count,
                        current_partial_detail_target_count=record.policy_comparison_to_previous.current_partial_detail_target_count,
                        previous_partial_detail_target_count=record.policy_comparison_to_previous.previous_partial_detail_target_count,
                    )
                    if record.policy_comparison_to_previous is not None
                    else None
                ),
                readiness_snapshot_summary=(
                    AuditReadinessSnapshotSummaryResponse(
                        snapshot_id=record.readiness_snapshot_summary.snapshot_id,
                        persisted_at=record.readiness_snapshot_summary.persisted_at,
                        readiness_status=record.readiness_snapshot_summary.readiness_status,
                        planning_readiness=record.readiness_snapshot_summary.planning_readiness,
                        phase_recommendation=record.readiness_snapshot_summary.phase_recommendation,
                        summary=record.readiness_snapshot_summary.summary,
                        blocker_count=record.readiness_snapshot_summary.blocker_count,
                        strongest_blockers=record.readiness_snapshot_summary.strongest_blockers,
                    )
                    if record.readiness_snapshot_summary is not None
                    else None
                ),
                notes=record.notes,
            )
            for record in records
        ],
    )

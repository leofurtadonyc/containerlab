"""Workflow-style history service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.models.workflow import (
    WorkflowHistoryRecord,
    WorkflowInventorySnapshotComparison,
    WorkflowInventorySnapshotSummary,
    WorkflowPolicySnapshotComparison,
    WorkflowPolicySnapshotSummary,
    WorkflowTopologySnapshotComparison,
    WorkflowTopologySnapshotSummary,
)
from app_api.persistence.history import load_sync_runs
from app_api.services.history_baseline import build_history_baseline_summary
from app_api.schemas.workflow_history import (
    WorkflowHistoryItem,
    WorkflowInventorySnapshotComparison as WorkflowInventorySnapshotComparisonResponse,
    WorkflowInventorySnapshotSummary as WorkflowInventorySnapshotSummaryResponse,
    WorkflowPolicySnapshotComparison as WorkflowPolicySnapshotComparisonResponse,
    WorkflowPolicySnapshotSummary as WorkflowPolicySnapshotSummaryResponse,
    WorkflowTopologySnapshotComparison as WorkflowTopologySnapshotComparisonResponse,
    WorkflowTopologySnapshotSummary as WorkflowTopologySnapshotSummaryResponse,
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
            sync_run_id=sync_run.sync_run_id,
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
            inventory_snapshot_summary=(
                WorkflowInventorySnapshotSummary(
                    snapshot_id=sync_run.inventory_snapshot_summary.snapshot_id,
                    persisted_at=sync_run.inventory_snapshot_summary.persisted_at,
                    observed_at=sync_run.inventory_snapshot_summary.observed_at,
                    sync_source=sync_run.inventory_snapshot_summary.sync_source,
                    sync_status=sync_run.inventory_snapshot_summary.sync_status,
                    data_status=sync_run.inventory_snapshot_summary.data_status,
                    device_count=sync_run.inventory_snapshot_summary.device_count,
                    role_counts=sync_run.inventory_snapshot_summary.role_counts,
                    collector_status_counts=sync_run.inventory_snapshot_summary.collector_status_counts,
                    capability_summary_counts=sync_run.inventory_snapshot_summary.capability_summary_counts,
                )
                if sync_run.inventory_snapshot_summary is not None
                else None
            ),
            inventory_comparison_to_previous=(
                WorkflowInventorySnapshotComparison(
                    current_snapshot_id=sync_run.inventory_comparison_to_previous.current_snapshot_id,
                    previous_snapshot_id=sync_run.inventory_comparison_to_previous.previous_snapshot_id,
                    current_persisted_at=sync_run.inventory_comparison_to_previous.current_persisted_at,
                    previous_persisted_at=sync_run.inventory_comparison_to_previous.previous_persisted_at,
                    current_device_count=sync_run.inventory_comparison_to_previous.current_device_count,
                    previous_device_count=sync_run.inventory_comparison_to_previous.previous_device_count,
                    device_count_delta=sync_run.inventory_comparison_to_previous.device_count_delta,
                    added_device_count=sync_run.inventory_comparison_to_previous.added_device_count,
                    removed_device_count=sync_run.inventory_comparison_to_previous.removed_device_count,
                    changed_device_count=sync_run.inventory_comparison_to_previous.changed_device_count,
                    notes=sync_run.inventory_comparison_to_previous.notes,
                )
                if sync_run.inventory_comparison_to_previous is not None
                else None
            ),
            topology_snapshot_summary=(
                WorkflowTopologySnapshotSummary(
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
                WorkflowTopologySnapshotComparison(
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
                WorkflowPolicySnapshotSummary(
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
                WorkflowPolicySnapshotComparison(
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
    baseline_summary = build_history_baseline_summary(data_status, len(records))
    return WorkflowHistoryResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status=data_status,
        summary=summary,
        baseline_summary=baseline_summary,
        count=len(records),
        items=[
            WorkflowHistoryItem(
                workflow_id=record.workflow_id,
                sync_run_id=record.sync_run_id,
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
                inventory_snapshot_summary=(
                    WorkflowInventorySnapshotSummaryResponse(
                        snapshot_id=record.inventory_snapshot_summary.snapshot_id,
                        persisted_at=record.inventory_snapshot_summary.persisted_at,
                        observed_at=record.inventory_snapshot_summary.observed_at,
                        sync_source=record.inventory_snapshot_summary.sync_source,
                        sync_status=record.inventory_snapshot_summary.sync_status,
                        data_status=record.inventory_snapshot_summary.data_status,
                        device_count=record.inventory_snapshot_summary.device_count,
                        role_counts=record.inventory_snapshot_summary.role_counts,
                        collector_status_counts=record.inventory_snapshot_summary.collector_status_counts,
                        capability_summary_counts=record.inventory_snapshot_summary.capability_summary_counts,
                    )
                    if record.inventory_snapshot_summary is not None
                    else None
                ),
                inventory_comparison_to_previous=(
                    WorkflowInventorySnapshotComparisonResponse(
                        current_snapshot_id=record.inventory_comparison_to_previous.current_snapshot_id,
                        previous_snapshot_id=record.inventory_comparison_to_previous.previous_snapshot_id,
                        current_persisted_at=record.inventory_comparison_to_previous.current_persisted_at,
                        previous_persisted_at=record.inventory_comparison_to_previous.previous_persisted_at,
                        current_device_count=record.inventory_comparison_to_previous.current_device_count,
                        previous_device_count=record.inventory_comparison_to_previous.previous_device_count,
                        device_count_delta=record.inventory_comparison_to_previous.device_count_delta,
                        added_device_count=record.inventory_comparison_to_previous.added_device_count,
                        removed_device_count=record.inventory_comparison_to_previous.removed_device_count,
                        changed_device_count=record.inventory_comparison_to_previous.changed_device_count,
                        notes=record.inventory_comparison_to_previous.notes,
                    )
                    if record.inventory_comparison_to_previous is not None
                    else None
                ),
                topology_snapshot_summary=(
                    WorkflowTopologySnapshotSummaryResponse(
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
                    WorkflowTopologySnapshotComparisonResponse(
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
                    WorkflowPolicySnapshotSummaryResponse(
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
                    WorkflowPolicySnapshotComparisonResponse(
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
                    )
                    if record.policy_comparison_to_previous is not None
                    else None
                ),
                notes=record.notes,
            )
            for record in records
        ],
    )

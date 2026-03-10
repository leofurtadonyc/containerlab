"""Policy-oriented collection flow helpers."""

from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.config.runtime import build_runtime_config
from gnmi_collector.mappings.policy import (
    derive_policy_observed_at,
    map_policy_records,
    summarize_policy_counts,
)
from gnmi_collector.metrics.state import record_policy_summary
from gnmi_collector.models.policy import (
    BackendPolicyDeliveryEnvelope,
    PolicyFlowSnapshot,
    PolicyFlowSummary,
)


def build_policy_flow_snapshot() -> PolicyFlowSnapshot:
    """Build the current end-to-end live policy collection flow snapshot."""
    config = build_runtime_config()
    adapter = NokiaSrosAdapter()

    plans = [adapter.build_policy_plan(target) for target in config.targets]
    raw_records = [adapter.collect_policy(target) for target in config.targets]
    normalized_records = map_policy_records(raw_records)
    aggregated_counts = summarize_policy_counts(raw_records)
    collection_success_count = sum(
        1 for record in raw_records if record.collection_status == "success"
    )
    collection_failure_count = sum(
        1 for record in raw_records if record.collection_status == "failure"
    )
    partial_collection_count = sum(
        1 for record in raw_records if record.collection_status == "partial"
    )

    if collection_failure_count == 0 and partial_collection_count == 0:
        delivery_status = "live_ready"
        sync_status = "ok"
    elif aggregated_counts["observed_target_count"] > 0:
        delivery_status = "partial"
        sync_status = "degraded"
    else:
        delivery_status = "failed"
        sync_status = "failed"

    notes = [
        "Policy inventory is currently bounded to live Nokia SR policy counters collected over gNMI.",
        "Per-policy SR intent details remain out of scope until a deeper vendor-neutral path is added.",
    ]
    if aggregated_counts["policy_count"] == 0:
        notes.append("No SR policies are currently observed across the configured Nokia targets.")
    if collection_failure_count > 0:
        notes.append(
            "One or more policy targets could not be collected, so degraded and unknown states remain explicit."
        )

    delivery = BackendPolicyDeliveryEnvelope(
        destination_service="app-api",
        delivery_mode=config.delivery.mode,
        delivery_status=delivery_status,
        destination_endpoint=config.delivery.endpoint,
        model_family="policy_inventory",
        sync_source="gnmi_collector_policy_sr_counters",
        sync_status=sync_status,
        completeness="partial",
        observed_at=derive_policy_observed_at(raw_records),
        observed_target_count=aggregated_counts["observed_target_count"],
        policy_capable_target_count=aggregated_counts["policy_capable_target_count"],
        policy_count=aggregated_counts["policy_count"],
        active_policy_count=aggregated_counts["active_policy_count"],
        static_policy_count=aggregated_counts["static_policy_count"],
        bgp_policy_count=aggregated_counts["bgp_policy_count"],
        records=normalized_records,
        notes=notes,
    )
    summary = PolicyFlowSummary(
        target_count=len(config.targets),
        planned_paths=sum(len(plan.policy_paths) for plan in plans),
        collection_success_count=collection_success_count,
        collection_failure_count=collection_failure_count,
        partial_collection_count=partial_collection_count,
        observed_target_count=aggregated_counts["observed_target_count"],
        policy_capable_target_count=aggregated_counts["policy_capable_target_count"],
        observed_policy_count=aggregated_counts["policy_count"],
        active_policy_count=aggregated_counts["active_policy_count"],
        static_policy_count=aggregated_counts["static_policy_count"],
        bgp_policy_count=aggregated_counts["bgp_policy_count"],
        backend_ready_policy_count=delivery.policy_count,
        backend_delivery_error_count=0,
    )
    record_policy_summary(summary)
    return PolicyFlowSnapshot(
        mode=config.mode,
        config_path=config.config_path,
        plans=plans,
        raw_records=raw_records,
        normalized_records=normalized_records,
        delivery=delivery,
        summary=summary,
    )

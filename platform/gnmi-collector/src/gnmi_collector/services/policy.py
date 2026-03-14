"""Policy-oriented collection flow helpers."""

from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.config.runtime import build_runtime_config
from gnmi_collector.mappings.policy import (
    derive_policy_observed_at,
    map_policy_records,
    summarize_policy_counts,
    summarize_policy_target_footprints,
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
    target_footprints = summarize_policy_target_footprints(raw_records, normalized_records)
    collection_success_count = sum(
        1 for record in raw_records if record.collection_status == "success"
    )
    collection_failure_count = sum(
        1 for record in raw_records if record.collection_status == "failure"
    )
    partial_collection_count = sum(
        1 for record in raw_records if record.collection_status == "partial"
    )
    normalized_policy_record_count = len(normalized_records)
    observed_values = [record.observed_at for record in raw_records if record.observed_at is not None]
    oldest_observed_at = min(observed_values) if observed_values else None
    newest_observed_at = max(observed_values) if observed_values else None
    detail_ready_target_count = sum(
        1 for footprint in target_footprints if footprint.detail_record_count > 0
    )

    if normalized_policy_record_count == 0:
        detail_mode = "counters_only"
    elif normalized_policy_record_count < aggregated_counts["policy_count"]:
        detail_mode = "mixed"
    else:
        detail_mode = "static_policies_when_present"

    if collection_failure_count == 0 and partial_collection_count == 0:
        delivery_status = "live_ready"
        sync_status = "ok"
    elif aggregated_counts["observed_target_count"] > 0:
        delivery_status = "partial"
        sync_status = "degraded"
    else:
        delivery_status = "failed"
        sync_status = "failed"

    if collection_failure_count == 0 and partial_collection_count == 0 and detail_ready_target_count == aggregated_counts["observed_target_count"]:
        degraded_scope_summary = (
            "All observed policy targets returned live evidence with bounded per-target detail coverage."
        )
    elif aggregated_counts["observed_target_count"] == 0:
        degraded_scope_summary = (
            "No configured policy targets returned usable live policy evidence."
        )
    elif collection_failure_count > 0 or partial_collection_count > 0:
        degraded_scope_summary = (
            "Policy delivery is degraded because one or more targets failed or returned partial live policy evidence."
        )
    elif detail_ready_target_count == 0 and aggregated_counts["policy_count"] > 0:
        degraded_scope_summary = (
            "Policy counters indicate observed policies, but the current bounded path could not derive per-target detail records."
        )
    else:
        degraded_scope_summary = (
            "Policy delivery remains bounded because only a subset of observed targets currently has per-target detail coverage."
        )

    notes = [
        "Policy inventory is currently bounded to live Nokia SR policy counters collected over gNMI.",
        "When static-policy state is exposed, the collector now derives bounded per-policy observations without claiming full SR policy truth.",
        "BGP-signaled SR policy detail remains out of scope until a deeper vendor-neutral path is added.",
    ]
    if oldest_observed_at is not None and newest_observed_at is not None:
        notes.append(
            f"Current policy freshness window spans from {oldest_observed_at.isoformat()} to {newest_observed_at.isoformat()} across targets that returned live evidence."
        )
    if aggregated_counts["ttm_preference_count"] > 0:
        notes.append(
            "Stable SR policy resource counters remain visible even when no per-policy detail records are currently observed."
        )
    if aggregated_counts["policy_count"] == 0:
        notes.append("No SR policies are currently observed across the configured Nokia targets.")
    elif normalized_policy_record_count == 0:
        notes.append(
            "Policy counters indicate SR policies are present, but the current platform path could not derive bounded per-policy detail records."
        )
    elif normalized_policy_record_count < aggregated_counts["policy_count"]:
        notes.append(
            "Only a subset of the observed policy count currently has bounded per-policy detail records; unsupported policy types remain explicit."
        )
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
        configured_target_count=len(config.targets),
        collection_success_count=collection_success_count,
        collection_partial_count=partial_collection_count,
        collection_failure_count=collection_failure_count,
        oldest_observed_at=oldest_observed_at,
        newest_observed_at=newest_observed_at,
        detail_ready_target_count=detail_ready_target_count,
        degraded_scope_summary=degraded_scope_summary,
        sync_source="gnmi_collector_policy_sr_counters",
        sync_status=sync_status,
        completeness="partial",
        detail_mode=detail_mode,
        observed_at=derive_policy_observed_at(raw_records),
        observed_target_count=aggregated_counts["observed_target_count"],
        policy_capable_target_count=aggregated_counts["policy_capable_target_count"],
        observed_target_role_counts=aggregated_counts["observed_target_role_counts"],
        policy_capable_target_role_counts=aggregated_counts["policy_capable_target_role_counts"],
        policy_count=aggregated_counts["policy_count"],
        active_policy_count=aggregated_counts["active_policy_count"],
        static_policy_count=aggregated_counts["static_policy_count"],
        static_local_policy_count=aggregated_counts["static_local_policy_count"],
        static_non_local_policy_count=aggregated_counts["static_non_local_policy_count"],
        bgp_policy_count=aggregated_counts["bgp_policy_count"],
        ttm_preference_count=aggregated_counts["ttm_preference_count"],
        binding_sid_count=aggregated_counts["binding_sid_count"],
        srv6_binding_sid_count=aggregated_counts["srv6_binding_sid_count"],
        target_footprints=target_footprints,
        records=normalized_records,
        notes=notes,
    )
    summary = PolicyFlowSummary(
        target_count=len(config.targets),
        planned_paths=sum(len(plan.policy_paths) for plan in plans),
        collection_success_count=collection_success_count,
        collection_failure_count=collection_failure_count,
        partial_collection_count=partial_collection_count,
        oldest_observed_at=oldest_observed_at,
        newest_observed_at=newest_observed_at,
        observed_target_count=aggregated_counts["observed_target_count"],
        policy_capable_target_count=aggregated_counts["policy_capable_target_count"],
        observed_target_role_counts=aggregated_counts["observed_target_role_counts"],
        policy_capable_target_role_counts=aggregated_counts["policy_capable_target_role_counts"],
        observed_policy_count=aggregated_counts["policy_count"],
        active_policy_count=aggregated_counts["active_policy_count"],
        static_policy_count=aggregated_counts["static_policy_count"],
        static_local_policy_count=aggregated_counts["static_local_policy_count"],
        static_non_local_policy_count=aggregated_counts["static_non_local_policy_count"],
        bgp_policy_count=aggregated_counts["bgp_policy_count"],
        ttm_preference_count=aggregated_counts["ttm_preference_count"],
        binding_sid_count=aggregated_counts["binding_sid_count"],
        srv6_binding_sid_count=aggregated_counts["srv6_binding_sid_count"],
        detail_ready_target_count=detail_ready_target_count,
        normalized_policy_record_count=normalized_policy_record_count,
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

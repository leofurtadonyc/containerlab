"""Inventory-oriented collection flow scaffolding."""

from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.config.runtime import build_runtime_config
from gnmi_collector.mappings.inventory import (
    derive_inventory_observed_range,
    map_inventory_record,
)
from gnmi_collector.metrics.state import record_inventory_summary
from gnmi_collector.models.inventory import (
    BackendInventoryDeliveryEnvelope,
    InventoryFlowSnapshot,
    InventoryFlowSummary,
)


def build_inventory_flow_snapshot() -> InventoryFlowSnapshot:
    """Build the current end-to-end live inventory collection flow snapshot."""
    config = build_runtime_config()
    adapter = NokiaSrosAdapter()

    plans = [adapter.build_inventory_plan(target) for target in config.targets]
    raw_records = [adapter.collect_inventory(target) for target in config.targets]
    normalized_records = [map_inventory_record(record) for record in raw_records]
    collection_success_count = sum(
        1 for record in raw_records if record.collection_status == "success"
    )
    partial_collection_count = sum(
        1 for record in raw_records if record.collection_status == "partial"
    )
    collection_failure_count = sum(
        1 for record in raw_records if record.collection_status == "failure"
    )
    observed_target_count = sum(
        1 for record in raw_records if record.collection_status != "failure"
    )
    normalization_partial_count = sum(
        1 for record in normalized_records if record.normalization_status == "partial"
    )
    normalization_failure_count = sum(
        1 for record in normalized_records if record.normalization_status == "failed"
    )
    oldest_observed_at, newest_observed_at = derive_inventory_observed_range(raw_records)
    if normalized_records and normalization_failure_count == 0 and normalization_partial_count == 0:
        delivery_status = "live_ready"
    elif normalized_records and normalization_failure_count < len(normalized_records):
        delivery_status = "partial"
    else:
        delivery_status = "failed"

    if collection_failure_count == 0 and partial_collection_count == 0:
        degraded_scope_summary = (
            "All configured inventory targets returned live normalized inventory records."
        )
    elif observed_target_count == 0:
        degraded_scope_summary = (
            "No configured inventory targets returned usable live inventory evidence."
        )
    elif collection_failure_count > 0 and partial_collection_count > 0:
        degraded_scope_summary = (
            "Inventory delivery is degraded because some targets failed collection and others returned partial inventory records."
        )
    elif collection_failure_count > 0:
        degraded_scope_summary = (
            "Inventory delivery is degraded because one or more targets failed collection."
        )
    else:
        degraded_scope_summary = (
            "Inventory delivery is degraded because one or more targets returned partial inventory records."
        )

    notes = [
        "Inventory remains a bounded normalized read path sourced from live Nokia gNMI collection.",
        "Coverage counts describe configured targets that returned usable current inventory evidence, not broader validation of every possible device fact.",
    ]
    if oldest_observed_at is not None and newest_observed_at is not None:
        notes.append(
            f"Current inventory freshness window spans from {oldest_observed_at.isoformat()} to {newest_observed_at.isoformat()} across targets that returned live evidence."
        )
    if collection_failure_count > 0 or partial_collection_count > 0:
        notes.append(degraded_scope_summary)

    delivery = BackendInventoryDeliveryEnvelope(
        destination_service="app-api",
        delivery_mode=config.delivery.mode,
        delivery_status=delivery_status,
        destination_endpoint=config.delivery.endpoint,
        model_family="inventory",
        configured_target_count=len(config.targets),
        observed_target_count=observed_target_count,
        collection_success_count=collection_success_count,
        collection_partial_count=partial_collection_count,
        collection_failure_count=collection_failure_count,
        oldest_observed_at=oldest_observed_at,
        newest_observed_at=newest_observed_at,
        degraded_scope_summary=degraded_scope_summary,
        record_count=len(normalized_records),
        records=normalized_records,
        notes=notes,
    )
    summary = InventoryFlowSummary(
        target_count=len(config.targets),
        planned_paths=sum(len(plan.inventory_paths) for plan in plans),
        observed_target_count=observed_target_count,
        collection_success_count=collection_success_count,
        partial_collection_count=partial_collection_count,
        collection_failure_count=collection_failure_count,
        normalization_partial_count=normalization_partial_count,
        normalization_failure_count=normalization_failure_count,
        oldest_observed_at=oldest_observed_at,
        newest_observed_at=newest_observed_at,
        normalized_record_count=len(normalized_records),
        backend_ready_record_count=delivery.record_count,
        backend_delivery_error_count=0,
    )
    record_inventory_summary(summary)
    return InventoryFlowSnapshot(
        mode=config.mode,
        config_path=config.config_path,
        plans=plans,
        raw_records=raw_records,
        normalized_records=normalized_records,
        delivery=delivery,
        summary=summary,
    )

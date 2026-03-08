"""Inventory-oriented collection flow scaffolding."""

from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.config.runtime import build_runtime_config
from gnmi_collector.mappings.inventory import map_inventory_record
from gnmi_collector.models.inventory import (
    BackendInventoryDeliveryEnvelope,
    InventoryFlowSnapshot,
    InventoryFlowSummary,
)


def build_inventory_flow_snapshot() -> InventoryFlowSnapshot:
    """Build the current end-to-end inventory collection flow snapshot."""
    config = build_runtime_config()
    adapter = NokiaSrosAdapter()

    plans = [adapter.build_inventory_plan(target) for target in config.targets]
    raw_records = [adapter.collect_inventory(target) for target in config.targets]
    normalized_records = [map_inventory_record(record) for record in raw_records]

    delivery = BackendInventoryDeliveryEnvelope(
        destination_service="app-api",
        delivery_mode=config.delivery.mode,
        delivery_status="ready_for_backend_contract",
        destination_endpoint=config.delivery.endpoint,
        model_family="inventory",
        record_count=len(normalized_records),
        records=normalized_records,
    )
    summary = InventoryFlowSummary(
        target_count=len(config.targets),
        planned_paths=sum(len(plan.inventory_paths) for plan in plans),
        collection_success_count=sum(
            1 for record in raw_records if record.collection_status == "success"
        ),
        collection_failure_count=sum(
            1 for record in raw_records if record.collection_status == "failure"
        ),
        normalized_record_count=len(normalized_records),
        backend_ready_record_count=delivery.record_count,
    )
    return InventoryFlowSnapshot(
        mode=config.mode,
        config_path=config.config_path,
        plans=plans,
        raw_records=raw_records,
        normalized_records=normalized_records,
        delivery=delivery,
        summary=summary,
    )

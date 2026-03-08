"""Inventory mapping placeholder."""

from gnmi_collector.models.inventory import InventoryRawRecord, NormalizedInventoryRecord


def map_inventory_record(raw_record: InventoryRawRecord) -> NormalizedInventoryRecord:
    """Normalize one raw inventory record into a platform-owned placeholder."""
    collector_status = "ok" if raw_record.collection_status == "success" else "degraded"
    return NormalizedInventoryRecord(
        device_id=raw_record.raw_data.get("system_name", raw_record.target_name),
        vendor=raw_record.vendor,
        platform=raw_record.raw_data.get("platform", raw_record.platform_hint),
        software_version=raw_record.raw_data.get("software_version"),
        role=raw_record.raw_data.get("role"),
        management_address=raw_record.raw_data.get("management_address", "unknown"),
        collector_status=collector_status,
        capability_summary="not_implemented_in_platform",
        normalization_status="normalized_placeholder",
        source="gnmi",
        source_target=raw_record.target_name,
        notes=[
            "Inventory normalization is scaffolded from placeholder vendor adapter output.",
            "Capability summary remains explicit until backend integration exists.",
        ],
    )

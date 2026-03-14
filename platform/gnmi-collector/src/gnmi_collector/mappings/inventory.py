"""Inventory normalization for live Nokia inventory records."""

from datetime import datetime

from gnmi_collector.models.inventory import InventoryRawRecord, NormalizedInventoryRecord


def map_inventory_record(raw_record: InventoryRawRecord) -> NormalizedInventoryRecord:
    """Normalize one raw inventory record into a platform-owned inventory model."""
    collector_status_map = {
        "success": "ok",
        "partial": "degraded",
        "failure": "unreachable",
    }
    normalization_status_map = {
        "success": "normalized_live",
        "partial": "partial",
        "failure": "failed",
    }
    collector_status = collector_status_map[raw_record.collection_status]
    normalization_status = normalization_status_map[raw_record.collection_status]
    capability_summary = (
        "not_implemented_in_platform"
        if raw_record.collection_status == "failure"
        else "partially_supported"
    )
    notes = [
        "Collected live over gNMI from a Nokia SR OS management-plane target.",
        "Inventory is normalized into a backend-owned device record before API exposure.",
    ]
    if raw_record.raw_data.get("role") not in {None, "", "unknown"}:
        notes.append("Role is sourced from the static onboarding target definition.")
    if raw_record.collection_error:
        notes.append(raw_record.collection_error)

    return NormalizedInventoryRecord(
        device_id=raw_record.raw_data.get("system_name", raw_record.target_name),
        vendor=raw_record.vendor,
        platform=raw_record.raw_data.get("platform", raw_record.platform_hint),
        software_version=raw_record.raw_data.get("software_version"),
        role=raw_record.raw_data.get("role"),
        management_address=raw_record.raw_data.get("management_address", "unknown"),
        collector_status=collector_status,
        capability_summary=capability_summary,
        normalization_status=normalization_status,
        source="gnmi",
        source_target=raw_record.target_name,
        notes=notes,
    )


def derive_inventory_observed_range(
    raw_records: list[InventoryRawRecord],
) -> tuple[datetime | None, datetime | None]:
    """Return the oldest and newest observed timestamps across inventory records."""
    observed_values = [record.observed_at for record in raw_records if record.observed_at is not None]
    if not observed_values:
        return None, None
    return min(observed_values), max(observed_values)

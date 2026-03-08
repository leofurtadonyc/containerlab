"""Device inventory service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.integrations.collector.inventory import get_collector_inventory_client
from app_api.models.inventory import InventoryDevice
from app_api.schemas.devices import DeviceRecord, DevicesListResponse


def _build_inventory_devices() -> list[InventoryDevice]:
    """Load backend-owned inventory models from the collector boundary."""
    snapshot = get_collector_inventory_client().read_inventory_snapshot()
    return [
        InventoryDevice(
            device_id=record.device_id,
            vendor=record.vendor,
            platform=record.platform,
            software_version=record.software_version,
            role=record.role,
            management_address=record.management_address,
            collector_status=record.collector_status,
            capability_summary=record.capability_summary,
        )
        for record in snapshot.records
    ]


def build_devices_list_response() -> DevicesListResponse:
    """Build the Phase 1 device inventory response from the collector boundary."""
    settings = get_settings()
    inventory_devices = _build_inventory_devices()
    items = [
        DeviceRecord(
            device_id=device.device_id,
            vendor=device.vendor,
            platform=device.platform,
            software_version=device.software_version,
            role=device.role,
            management_address=device.management_address,
            collector_status=device.collector_status,
            capability_summary=device.capability_summary,
        )
        for device in inventory_devices
    ]
    return DevicesListResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_1_skeleton",
        generated_at=datetime.now(UTC),
        data_status="integration_scaffold",
        summary=(
            "Phase 1 device inventory is backed by a bounded normalized collector "
            "integration placeholder rather than direct API-only stubs."
        ),
        count=len(items),
        items=items,
    )

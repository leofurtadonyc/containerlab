"""Normalized inventory snapshot route for backend consumption."""

from fastapi import APIRouter

from gnmi_collector.models.inventory import BackendInventoryDeliveryEnvelope
from gnmi_collector.services.inventory import build_inventory_flow_snapshot

router = APIRouter(tags=["inventory"])


@router.get("/inventory/snapshot", response_model=BackendInventoryDeliveryEnvelope)
def get_inventory_snapshot() -> BackendInventoryDeliveryEnvelope:
    """Expose the normalized live inventory snapshot for app-api consumption."""
    return build_inventory_flow_snapshot().delivery

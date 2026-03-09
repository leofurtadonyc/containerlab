"""Normalized topology snapshot route for backend consumption."""

from fastapi import APIRouter

from gnmi_collector.models.topology import BackendTopologyDeliveryEnvelope
from gnmi_collector.services.topology import build_topology_flow_snapshot

router = APIRouter(tags=["topology"])


@router.get("/topology/snapshot", response_model=BackendTopologyDeliveryEnvelope)
def get_topology_snapshot() -> BackendTopologyDeliveryEnvelope:
    """Expose the normalized live topology snapshot for app-api consumption."""
    return build_topology_flow_snapshot().delivery

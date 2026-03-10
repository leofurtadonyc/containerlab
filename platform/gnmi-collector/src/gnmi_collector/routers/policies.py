"""Normalized policy snapshot route for backend consumption."""

from fastapi import APIRouter

from gnmi_collector.models.policy import BackendPolicyDeliveryEnvelope
from gnmi_collector.services.policy import build_policy_flow_snapshot

router = APIRouter(tags=["policies"])


@router.get("/policies/snapshot", response_model=BackendPolicyDeliveryEnvelope)
def get_policy_snapshot() -> BackendPolicyDeliveryEnvelope:
    """Expose the normalized live policy snapshot for app-api consumption."""
    return build_policy_flow_snapshot().delivery

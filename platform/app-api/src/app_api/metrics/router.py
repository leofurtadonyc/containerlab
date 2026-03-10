"""Metrics endpoint scaffolding."""

from fastapi import APIRouter, Response

from app_api.config.settings import get_settings
from app_api.metrics.state import (
    get_cached_policy_metrics,
    get_cached_topology_metrics,
    render_prometheus_metrics,
)


PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"

router = APIRouter(tags=["metrics"])


@router.get("/metrics", include_in_schema=False)
def get_metrics() -> Response:
    """Expose bounded backend service metrics for Prometheus."""
    settings = get_settings()
    topology = get_cached_topology_metrics()
    policies = get_cached_policy_metrics()
    payload = render_prometheus_metrics(
        settings.app_version,
        topology_metrics={
            "node_count": topology.node_count,
            "link_count": topology.link_count,
            "data_status": topology.data_status,
            "sync_status": topology.sync_status,
            "completeness": topology.completeness,
            "node_state_counts": topology.node_state_counts,
            "link_state_counts": topology.link_state_counts,
        },
        policy_metrics={
            "record_count": policies.record_count,
            "active_policy_count": policies.active_policy_count,
            "static_policy_count": policies.static_policy_count,
            "bgp_policy_count": policies.bgp_policy_count,
            "observed_target_count": policies.observed_target_count,
            "policy_capable_target_count": policies.policy_capable_target_count,
            "data_status": policies.data_status,
            "sync_status": policies.sync_status,
            "completeness": policies.completeness,
        },
    )
    return Response(content=payload, media_type=PROMETHEUS_CONTENT_TYPE)

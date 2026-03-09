"""Metrics endpoint scaffolding."""

from collections import Counter

from fastapi import APIRouter, Response

from app_api.config.settings import get_settings
from app_api.metrics.state import render_prometheus_metrics
from app_api.services.topology import build_topology_response


PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"

router = APIRouter(tags=["metrics"])


@router.get("/metrics", include_in_schema=False)
def get_metrics() -> Response:
    """Expose bounded backend service metrics for Prometheus."""
    settings = get_settings()
    topology = build_topology_response()
    payload = render_prometheus_metrics(
        settings.app_version,
        topology_metrics={
            "node_count": len(topology.topology.nodes),
            "link_count": len(topology.topology.links),
            "data_status": topology.data_status,
            "sync_status": topology.topology.sync_status,
            "completeness": topology.topology.completeness,
            "node_state_counts": dict(Counter(node.state for node in topology.topology.nodes)),
            "link_state_counts": dict(Counter(link.state for link in topology.topology.links)),
        },
    )
    return Response(content=payload, media_type=PROMETHEUS_CONTENT_TYPE)

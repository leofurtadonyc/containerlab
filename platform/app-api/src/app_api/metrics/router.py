"""Metrics endpoint scaffolding."""

from fastapi import APIRouter, Response

from app_api.config.settings import get_settings
from app_api.metrics.state import render_prometheus_metrics


PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"

router = APIRouter(tags=["metrics"])


@router.get("/metrics", include_in_schema=False)
def get_metrics() -> Response:
    """Expose bounded backend service metrics for Prometheus."""
    settings = get_settings()
    payload = render_prometheus_metrics(settings.app_version)
    return Response(content=payload, media_type=PROMETHEUS_CONTENT_TYPE)

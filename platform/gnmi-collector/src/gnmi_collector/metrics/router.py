"""Metrics endpoint scaffolding for the collector."""

from fastapi import APIRouter, Response

from gnmi_collector.config.settings import get_settings


PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"

router = APIRouter(tags=["metrics"])


@router.get("/metrics", include_in_schema=False)
def get_metrics() -> Response:
    """Expose a minimal scrapeable placeholder for collector metrics."""
    settings = get_settings()
    payload = "\n".join(
        [
            "# HELP platform_gnmi_collector_info Phase 1 collector skeleton marker.",
            "# TYPE platform_gnmi_collector_info gauge",
            (
                "platform_gnmi_collector_info"
                f'{{service="gnmi-collector",version="{settings.app_version}"}} 1'
            ),
            "",
        ]
    )
    return Response(content=payload, media_type=PROMETHEUS_CONTENT_TYPE)

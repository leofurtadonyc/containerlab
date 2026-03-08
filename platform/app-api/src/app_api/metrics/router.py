"""Metrics endpoint scaffolding."""

from fastapi import APIRouter, Response

from app_api.config.settings import get_settings


PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"

router = APIRouter(tags=["metrics"])


@router.get("/metrics", include_in_schema=False)
def get_metrics() -> Response:
    """Expose a minimal scrapeable placeholder for Prometheus."""
    settings = get_settings()
    payload = "\n".join(
        [
            "# HELP platform_app_api_info Phase 1 backend skeleton marker.",
            "# TYPE platform_app_api_info gauge",
            (
                f'platform_app_api_info{{service="app-api",version="{settings.app_version}"}} 1'
            ),
            "",
        ]
    )
    return Response(content=payload, media_type=PROMETHEUS_CONTENT_TYPE)

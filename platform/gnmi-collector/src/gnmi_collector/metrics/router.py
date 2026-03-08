"""Metrics endpoint scaffolding for the collector."""

from fastapi import APIRouter, Response

from gnmi_collector.config.settings import get_settings
from gnmi_collector.services.inventory import build_inventory_flow_snapshot


PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"

router = APIRouter(tags=["metrics"])


@router.get("/metrics", include_in_schema=False)
def get_metrics() -> Response:
    """Expose bounded collector metrics for Prometheus."""
    settings = get_settings()
    inventory_flow = build_inventory_flow_snapshot()
    payload = "\n".join(
        [
            "# HELP platform_gnmi_collector_info Collector service build information.",
            "# TYPE platform_gnmi_collector_info gauge",
            (
                "platform_gnmi_collector_info"
                f'{{service="gnmi-collector",version="{settings.app_version}"}} 1'
            ),
            "# HELP platform_gnmi_collector_inventory_targets Configured inventory targets.",
            "# TYPE platform_gnmi_collector_inventory_targets gauge",
            (
                "platform_gnmi_collector_inventory_targets "
                f"{inventory_flow.summary.target_count}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_collection_success_total "
                "Total successful inventory collection attempts in the current scaffold."
            ),
            "# TYPE platform_gnmi_collector_inventory_collection_success_total counter",
            (
                "platform_gnmi_collector_inventory_collection_success_total "
                f"{inventory_flow.summary.collection_success_count}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_collection_failure_total "
                "Total failed inventory collection attempts in the current scaffold."
            ),
            "# TYPE platform_gnmi_collector_inventory_collection_failure_total counter",
            (
                "platform_gnmi_collector_inventory_collection_failure_total "
                f"{inventory_flow.summary.collection_failure_count}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_normalization_partial_total "
                "Total partially normalized inventory records."
            ),
            "# TYPE platform_gnmi_collector_inventory_normalization_partial_total counter",
            (
                "platform_gnmi_collector_inventory_normalization_partial_total "
                f"{inventory_flow.summary.normalization_partial_count}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_normalization_failure_total "
                "Total inventory normalization failures."
            ),
            "# TYPE platform_gnmi_collector_inventory_normalization_failure_total counter",
            (
                "platform_gnmi_collector_inventory_normalization_failure_total "
                f"{inventory_flow.summary.normalization_failure_count}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_normalized_records "
                "Normalized inventory records prepared by the mapping layer."
            ),
            "# TYPE platform_gnmi_collector_inventory_normalized_records gauge",
            (
                "platform_gnmi_collector_inventory_normalized_records "
                f"{inventory_flow.summary.normalized_record_count}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_backend_ready_records "
                "Normalized inventory records prepared for backend delivery."
            ),
            "# TYPE platform_gnmi_collector_inventory_backend_ready_records gauge",
            (
                "platform_gnmi_collector_inventory_backend_ready_records "
                f"{inventory_flow.summary.backend_ready_record_count}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_backend_delivery_error_total "
                "Total backend delivery preparation errors."
            ),
            "# TYPE platform_gnmi_collector_inventory_backend_delivery_error_total counter",
            (
                "platform_gnmi_collector_inventory_backend_delivery_error_total "
                f"{inventory_flow.summary.backend_delivery_error_count}"
            ),
            "",
        ]
    )
    return Response(content=payload, media_type=PROMETHEUS_CONTENT_TYPE)

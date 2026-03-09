"""Metrics endpoint scaffolding for the collector."""

from fastapi import APIRouter, Response

from gnmi_collector.config.runtime import build_runtime_config
from gnmi_collector.config.settings import get_settings
from gnmi_collector.metrics.state import get_metrics_snapshot


PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"

router = APIRouter(tags=["metrics"])


@router.get("/metrics", include_in_schema=False)
def get_metrics() -> Response:
    """Expose cached collector metrics for Prometheus without triggering collection."""
    settings = get_settings()
    config = build_runtime_config()
    snapshot = get_metrics_snapshot()
    inventory_summary = snapshot.inventory
    topology_summary = snapshot.topology
    target_count = len(config.targets)
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
            f"platform_gnmi_collector_inventory_targets {target_count}",
            (
                "# HELP platform_gnmi_collector_inventory_collection_success_total "
                "Total successful live inventory collection attempts."
            ),
            "# TYPE platform_gnmi_collector_inventory_collection_success_total counter",
            (
                "platform_gnmi_collector_inventory_collection_success_total "
                f"{inventory_summary.collection_success_count if inventory_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_collection_failure_total "
                "Total failed live inventory collection attempts."
            ),
            "# TYPE platform_gnmi_collector_inventory_collection_failure_total counter",
            (
                "platform_gnmi_collector_inventory_collection_failure_total "
                f"{inventory_summary.collection_failure_count if inventory_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_normalization_partial_total "
                "Total partially normalized inventory records."
            ),
            "# TYPE platform_gnmi_collector_inventory_normalization_partial_total counter",
            (
                "platform_gnmi_collector_inventory_normalization_partial_total "
                f"{inventory_summary.normalization_partial_count if inventory_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_normalization_failure_total "
                "Total inventory normalization failures."
            ),
            "# TYPE platform_gnmi_collector_inventory_normalization_failure_total counter",
            (
                "platform_gnmi_collector_inventory_normalization_failure_total "
                f"{inventory_summary.normalization_failure_count if inventory_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_normalized_records "
                "Normalized inventory records prepared by the mapping layer."
            ),
            "# TYPE platform_gnmi_collector_inventory_normalized_records gauge",
            (
                "platform_gnmi_collector_inventory_normalized_records "
                f"{inventory_summary.normalized_record_count if inventory_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_backend_ready_records "
                "Normalized inventory records prepared for backend delivery."
            ),
            "# TYPE platform_gnmi_collector_inventory_backend_ready_records gauge",
            (
                "platform_gnmi_collector_inventory_backend_ready_records "
                f"{inventory_summary.backend_ready_record_count if inventory_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_backend_delivery_error_total "
                "Total backend delivery preparation errors."
            ),
            "# TYPE platform_gnmi_collector_inventory_backend_delivery_error_total counter",
            (
                "platform_gnmi_collector_inventory_backend_delivery_error_total "
                f"{inventory_summary.backend_delivery_error_count if inventory_summary else 0}"
            ),
            "# HELP platform_gnmi_collector_topology_targets Configured topology targets.",
            "# TYPE platform_gnmi_collector_topology_targets gauge",
            f"platform_gnmi_collector_topology_targets {target_count}",
            (
                "# HELP platform_gnmi_collector_topology_collection_success_total "
                "Total successful live topology collection attempts."
            ),
            "# TYPE platform_gnmi_collector_topology_collection_success_total counter",
            (
                "platform_gnmi_collector_topology_collection_success_total "
                f"{topology_summary.collection_success_count if topology_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_topology_collection_failure_total "
                "Total failed live topology collection attempts."
            ),
            "# TYPE platform_gnmi_collector_topology_collection_failure_total counter",
            (
                "platform_gnmi_collector_topology_collection_failure_total "
                f"{topology_summary.collection_failure_count if topology_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_topology_collection_partial_total "
                "Total partially collected live topology records."
            ),
            "# TYPE platform_gnmi_collector_topology_collection_partial_total counter",
            (
                "platform_gnmi_collector_topology_collection_partial_total "
                f"{topology_summary.partial_collection_count if topology_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_topology_normalized_nodes "
                "Normalized topology nodes prepared by the mapping layer."
            ),
            "# TYPE platform_gnmi_collector_topology_normalized_nodes gauge",
            (
                "platform_gnmi_collector_topology_normalized_nodes "
                f"{topology_summary.normalized_node_count if topology_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_topology_normalized_links "
                "Normalized topology links prepared by the mapping layer."
            ),
            "# TYPE platform_gnmi_collector_topology_normalized_links gauge",
            (
                "platform_gnmi_collector_topology_normalized_links "
                f"{topology_summary.normalized_link_count if topology_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_topology_single_sided_links "
                "Topology links inferred from only one observed endpoint."
            ),
            "# TYPE platform_gnmi_collector_topology_single_sided_links gauge",
            (
                "platform_gnmi_collector_topology_single_sided_links "
                f"{topology_summary.single_sided_link_count if topology_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_topology_nodes_by_state "
                "Current normalized topology node counts by state."
            ),
            "# TYPE platform_gnmi_collector_topology_nodes_by_state gauge",
            *[
                (
                    "platform_gnmi_collector_topology_nodes_by_state"
                    f'{{state="{state}"}} {count}'
                )
                for state, count in sorted(
                    (topology_summary.node_state_counts if topology_summary else {}).items()
                )
            ],
            (
                "# HELP platform_gnmi_collector_topology_links_by_state "
                "Current normalized topology link counts by state."
            ),
            "# TYPE platform_gnmi_collector_topology_links_by_state gauge",
            *[
                (
                    "platform_gnmi_collector_topology_links_by_state"
                    f'{{state="{state}"}} {count}'
                )
                for state, count in sorted(
                    (topology_summary.link_state_counts if topology_summary else {}).items()
                )
            ],
            (
                "# HELP platform_gnmi_collector_topology_backend_ready_nodes "
                "Normalized topology nodes prepared for backend delivery."
            ),
            "# TYPE platform_gnmi_collector_topology_backend_ready_nodes gauge",
            (
                "platform_gnmi_collector_topology_backend_ready_nodes "
                f"{topology_summary.backend_ready_node_count if topology_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_topology_backend_ready_links "
                "Normalized topology links prepared for backend delivery."
            ),
            "# TYPE platform_gnmi_collector_topology_backend_ready_links gauge",
            (
                "platform_gnmi_collector_topology_backend_ready_links "
                f"{topology_summary.backend_ready_link_count if topology_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_topology_backend_delivery_error_total "
                "Total topology backend delivery preparation errors."
            ),
            "# TYPE platform_gnmi_collector_topology_backend_delivery_error_total counter",
            (
                "platform_gnmi_collector_topology_backend_delivery_error_total "
                f"{topology_summary.backend_delivery_error_count if topology_summary else 0}"
            ),
            "",
        ]
    )
    return Response(content=payload, media_type=PROMETHEUS_CONTENT_TYPE)

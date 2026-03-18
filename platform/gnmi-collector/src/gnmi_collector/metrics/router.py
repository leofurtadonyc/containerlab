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
    policy_summary = snapshot.policy
    snapshot_updated_at = snapshot.updated_at
    target_count = len(config.targets)
    payload = "\n".join(
        [
            "# HELP platform_gnmi_collector_info Collector service build information.",
            "# TYPE platform_gnmi_collector_info gauge",
            (
                "platform_gnmi_collector_info"
                f'{{service="gnmi-collector",version="{settings.app_version}"}} 1'
            ),
            "# HELP platform_gnmi_collector_metrics_cache_updated_timestamp_seconds Last time the collector refreshed its cached summary metrics.",
            "# TYPE platform_gnmi_collector_metrics_cache_updated_timestamp_seconds gauge",
            (
                "platform_gnmi_collector_metrics_cache_updated_timestamp_seconds "
                f"{snapshot_updated_at.timestamp() if snapshot_updated_at else 0}"
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
                "# HELP platform_gnmi_collector_inventory_collection_partial_total "
                "Total partially collected live inventory records."
            ),
            "# TYPE platform_gnmi_collector_inventory_collection_partial_total counter",
            (
                "platform_gnmi_collector_inventory_collection_partial_total "
                f"{inventory_summary.partial_collection_count if inventory_summary else 0}"
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
                "# HELP platform_gnmi_collector_inventory_observed_targets "
                "Configured inventory targets that returned usable live evidence."
            ),
            "# TYPE platform_gnmi_collector_inventory_observed_targets gauge",
            (
                "platform_gnmi_collector_inventory_observed_targets "
                f"{inventory_summary.observed_target_count if inventory_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_oldest_observed_timestamp_seconds "
                "Oldest current inventory observation timestamp across targets that returned live evidence."
            ),
            "# TYPE platform_gnmi_collector_inventory_oldest_observed_timestamp_seconds gauge",
            (
                "platform_gnmi_collector_inventory_oldest_observed_timestamp_seconds "
                f"{inventory_summary.oldest_observed_at.timestamp() if inventory_summary and inventory_summary.oldest_observed_at else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_inventory_newest_observed_timestamp_seconds "
                "Newest current inventory observation timestamp across targets that returned live evidence."
            ),
            "# TYPE platform_gnmi_collector_inventory_newest_observed_timestamp_seconds gauge",
            (
                "platform_gnmi_collector_inventory_newest_observed_timestamp_seconds "
                f"{inventory_summary.newest_observed_at.timestamp() if inventory_summary and inventory_summary.newest_observed_at else 0}"
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
                "# HELP platform_gnmi_collector_topology_observed_targets "
                "Configured topology targets that returned usable live evidence."
            ),
            "# TYPE platform_gnmi_collector_topology_observed_targets gauge",
            (
                "platform_gnmi_collector_topology_observed_targets "
                f"{topology_summary.observed_target_count if topology_summary else 0}"
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
                "# HELP platform_gnmi_collector_topology_paired_links "
                "Topology links inferred from paired observed endpoints."
            ),
            "# TYPE platform_gnmi_collector_topology_paired_links gauge",
            (
                "platform_gnmi_collector_topology_paired_links "
                f"{topology_summary.paired_link_count if topology_summary else 0}"
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
                "# HELP platform_gnmi_collector_topology_linked_nodes "
                "Observed topology nodes represented by at least one emitted inferred link."
            ),
            "# TYPE platform_gnmi_collector_topology_linked_nodes gauge",
            (
                "platform_gnmi_collector_topology_linked_nodes "
                f"{topology_summary.linked_node_count if topology_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_topology_isolated_nodes "
                "Observed topology nodes not represented by any emitted inferred link."
            ),
            "# TYPE platform_gnmi_collector_topology_isolated_nodes gauge",
            (
                "platform_gnmi_collector_topology_isolated_nodes "
                f"{topology_summary.isolated_node_count if topology_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_topology_node_participation_posture "
                "Current topology node participation posture as a one-hot gauge."
            ),
            "# TYPE platform_gnmi_collector_topology_node_participation_posture gauge",
            (
                "platform_gnmi_collector_topology_node_participation_posture"
                f'{{posture="{topology_summary.node_participation_posture if topology_summary else "unknown"}"}} 1'
            ),
            (
                "# HELP platform_gnmi_collector_topology_oldest_observed_timestamp_seconds "
                "Oldest current topology observation timestamp across targets that returned live evidence."
            ),
            "# TYPE platform_gnmi_collector_topology_oldest_observed_timestamp_seconds gauge",
            (
                "platform_gnmi_collector_topology_oldest_observed_timestamp_seconds "
                f"{topology_summary.oldest_observed_at.timestamp() if topology_summary and topology_summary.oldest_observed_at else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_topology_newest_observed_timestamp_seconds "
                "Newest current topology observation timestamp across targets that returned live evidence."
            ),
            "# TYPE platform_gnmi_collector_topology_newest_observed_timestamp_seconds gauge",
            (
                "platform_gnmi_collector_topology_newest_observed_timestamp_seconds "
                f"{topology_summary.newest_observed_at.timestamp() if topology_summary and topology_summary.newest_observed_at else 0}"
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
            "# HELP platform_gnmi_collector_policy_targets Configured policy targets.",
            "# TYPE platform_gnmi_collector_policy_targets gauge",
            f"platform_gnmi_collector_policy_targets {target_count}",
            (
                "# HELP platform_gnmi_collector_policy_collection_success_total "
                "Total successful live policy collection attempts."
            ),
            "# TYPE platform_gnmi_collector_policy_collection_success_total counter",
            (
                "platform_gnmi_collector_policy_collection_success_total "
                f"{policy_summary.collection_success_count if policy_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_collection_failure_total "
                "Total failed live policy collection attempts."
            ),
            "# TYPE platform_gnmi_collector_policy_collection_failure_total counter",
            (
                "platform_gnmi_collector_policy_collection_failure_total "
                f"{policy_summary.collection_failure_count if policy_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_collection_partial_total "
                "Total partially collected live policy records."
            ),
            "# TYPE platform_gnmi_collector_policy_collection_partial_total counter",
            (
                "platform_gnmi_collector_policy_collection_partial_total "
                f"{policy_summary.partial_collection_count if policy_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_oldest_observed_timestamp_seconds "
                "Oldest current policy observation timestamp across targets that returned live evidence."
            ),
            "# TYPE platform_gnmi_collector_policy_oldest_observed_timestamp_seconds gauge",
            (
                "platform_gnmi_collector_policy_oldest_observed_timestamp_seconds "
                f"{policy_summary.oldest_observed_at.timestamp() if policy_summary and policy_summary.oldest_observed_at else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_newest_observed_timestamp_seconds "
                "Newest current policy observation timestamp across targets that returned live evidence."
            ),
            "# TYPE platform_gnmi_collector_policy_newest_observed_timestamp_seconds gauge",
            (
                "platform_gnmi_collector_policy_newest_observed_timestamp_seconds "
                f"{policy_summary.newest_observed_at.timestamp() if policy_summary and policy_summary.newest_observed_at else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_observed_targets "
                "Targets that returned bounded live policy observations."
            ),
            "# TYPE platform_gnmi_collector_policy_observed_targets gauge",
            (
                "platform_gnmi_collector_policy_observed_targets "
                f"{policy_summary.observed_target_count if policy_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_capable_targets "
                "Targets exposing SR policy capability counters."
            ),
            "# TYPE platform_gnmi_collector_policy_capable_targets gauge",
            (
                "platform_gnmi_collector_policy_capable_targets "
                f"{policy_summary.policy_capable_target_count if policy_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_detail_ready_targets "
                "Observed policy targets that currently have bounded per-target detail coverage."
            ),
            "# TYPE platform_gnmi_collector_policy_detail_ready_targets gauge",
            (
                "platform_gnmi_collector_policy_detail_ready_targets "
                f"{policy_summary.detail_ready_target_count if policy_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_detail_source_readiness "
                "Current bounded policy detail source-readiness posture."
            ),
            "# TYPE platform_gnmi_collector_policy_detail_source_readiness gauge",
            (
                "platform_gnmi_collector_policy_detail_source_readiness"
                f'{{posture="{policy_summary.detail_source_readiness.posture if policy_summary else "unknown"}"}} 1'
            ),
            (
                "# HELP platform_gnmi_collector_policy_detail_source_targets "
                "Current bounded counts of source-visible policy targets by detail-source reason."
            ),
            "# TYPE platform_gnmi_collector_policy_detail_source_targets gauge",
            (
                "platform_gnmi_collector_policy_detail_source_targets"
                f'{{reason="no_policies_observed"}} {policy_summary.detail_source_readiness.no_policies_observed_target_count if policy_summary else 0}'
            ),
            (
                "platform_gnmi_collector_policy_detail_source_targets"
                f'{{reason="detail_unavailable"}} {policy_summary.detail_source_readiness.detail_unavailable_target_count if policy_summary else 0}'
            ),
            (
                "platform_gnmi_collector_policy_detail_source_targets"
                f'{{reason="partial_detail"}} {policy_summary.detail_source_readiness.partial_detail_target_count if policy_summary else 0}'
            ),
            (
                "# HELP platform_gnmi_collector_policy_observed_policies "
                "Bounded live SR policy count observed across all targets."
            ),
            "# TYPE platform_gnmi_collector_policy_observed_policies gauge",
            (
                "platform_gnmi_collector_policy_observed_policies "
                f"{policy_summary.observed_policy_count if policy_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_active_policies "
                "Active bounded SR policies observed across all targets."
            ),
            "# TYPE platform_gnmi_collector_policy_active_policies gauge",
            (
                "platform_gnmi_collector_policy_active_policies "
                f"{policy_summary.active_policy_count if policy_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_static_policies "
                "Static SR policies observed across all targets."
            ),
            "# TYPE platform_gnmi_collector_policy_static_policies gauge",
            (
                "platform_gnmi_collector_policy_static_policies "
                f"{policy_summary.static_policy_count if policy_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_bgp_policies "
                "BGP SR policies observed across all targets."
            ),
            "# TYPE platform_gnmi_collector_policy_bgp_policies gauge",
            (
                "platform_gnmi_collector_policy_bgp_policies "
                f"{policy_summary.bgp_policy_count if policy_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_backend_ready_policies "
                "Normalized policy records prepared for backend delivery."
            ),
            "# TYPE platform_gnmi_collector_policy_backend_ready_policies gauge",
            (
                "platform_gnmi_collector_policy_backend_ready_policies "
                f"{policy_summary.backend_ready_policy_count if policy_summary else 0}"
            ),
            (
                "# HELP platform_gnmi_collector_policy_backend_delivery_error_total "
                "Total policy backend delivery preparation errors."
            ),
            "# TYPE platform_gnmi_collector_policy_backend_delivery_error_total counter",
            (
                "platform_gnmi_collector_policy_backend_delivery_error_total "
                f"{policy_summary.backend_delivery_error_count if policy_summary else 0}"
            ),
            "",
        ]
    )
    return Response(content=payload, media_type=PROMETHEUS_CONTENT_TYPE)

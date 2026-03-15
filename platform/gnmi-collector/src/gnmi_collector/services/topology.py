"""Topology-oriented collection flow helpers."""

from collections import Counter
from concurrent.futures import ThreadPoolExecutor

from gnmi_collector.adapters.nokia import NokiaSrosAdapter
from gnmi_collector.config.runtime import build_runtime_config
from gnmi_collector.mappings.topology import (
    derive_topology_observed_at,
    map_topology_links,
    map_topology_nodes,
)
from gnmi_collector.metrics.state import record_topology_summary
from gnmi_collector.models.topology import (
    BackendTopologyDeliveryEnvelope,
    TopologyFlowSnapshot,
    TopologyFlowSummary,
)


def _derive_endpoint_pairing_posture(
    *,
    link_count: int,
    paired_link_count: int,
    single_sided_link_count: int,
) -> str:
    """Summarize the current endpoint-pairing posture for emitted links."""
    if link_count == 0:
        return "unknown"
    if paired_link_count == link_count and single_sided_link_count == 0:
        return "paired"
    if paired_link_count > 0 and single_sided_link_count > 0:
        return "partially_paired"
    if paired_link_count == 0 and single_sided_link_count > 0:
        return "single_sided"
    return "unknown"


def build_topology_flow_snapshot() -> TopologyFlowSnapshot:
    """Build the current end-to-end live topology collection flow snapshot."""
    config = build_runtime_config()
    adapter = NokiaSrosAdapter()

    plans = [adapter.build_topology_plan(target) for target in config.targets]
    max_workers = max(1, min(config.collector_target_concurrency, len(config.targets)))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        raw_records = list(executor.map(adapter.collect_topology, config.targets))
    normalized_nodes = map_topology_nodes(raw_records)
    normalized_links, paired_link_count, single_sided_link_count = map_topology_links(raw_records)
    node_state_counts = dict(Counter(node.state for node in normalized_nodes))
    link_state_counts = dict(Counter(link.state for link in normalized_links))
    collection_success_count = sum(
        1 for record in raw_records if record.collection_status == "success"
    )
    collection_failure_count = sum(
        1 for record in raw_records if record.collection_status == "failure"
    )
    partial_collection_count = sum(
        1 for record in raw_records if record.collection_status == "partial"
    )
    observed_target_count = sum(
        1 for record in raw_records if record.collection_status != "failure"
    )
    observed_values = [record.observed_at for record in raw_records if record.observed_at is not None]
    oldest_observed_at = min(observed_values) if observed_values else None
    newest_observed_at = max(observed_values) if observed_values else None
    endpoint_pairing_posture = _derive_endpoint_pairing_posture(
        link_count=len(normalized_links),
        paired_link_count=paired_link_count,
        single_sided_link_count=single_sided_link_count,
    )

    if normalized_nodes and collection_failure_count == 0 and partial_collection_count == 0:
        delivery_status = "live_ready"
        sync_status = "ok"
    elif normalized_nodes:
        delivery_status = "partial"
        sync_status = "degraded"
    else:
        delivery_status = "failed"
        sync_status = "failed"

    if collection_failure_count == 0 and partial_collection_count == 0 and single_sided_link_count == 0:
        degraded_scope_summary = (
            "All configured topology targets returned live evidence for the current bounded inference path, and all emitted inferred links are backed by paired endpoint evidence."
        )
    elif observed_target_count == 0:
        degraded_scope_summary = (
            "No configured topology targets returned usable live topology evidence."
        )
    elif collection_failure_count > 0 or partial_collection_count > 0:
        degraded_scope_summary = (
            "Topology delivery is degraded because one or more targets failed or returned partial live topology evidence."
        )
    else:
        degraded_scope_summary = (
            "Topology delivery remains bounded because one or more inferred links still rely on single-sided endpoint evidence."
        )

    notes = [
        "Topology links are inferred from live router interface names and current interface operational state.",
        "The topology slice remains intentionally partial until LLDP, IGP, or bounded controller enrichment is added.",
    ]
    if oldest_observed_at is not None and newest_observed_at is not None:
        notes.append(
            f"Current topology freshness window spans from {oldest_observed_at.isoformat()} to {newest_observed_at.isoformat()} across targets that returned live evidence."
        )
    if normalized_links:
        notes.append(
            "Collector endpoint-pairing posture is "
            f"{endpoint_pairing_posture}, with {paired_link_count} paired inferred links and {single_sided_link_count} single-sided inferred links."
        )
    if single_sided_link_count > 0:
        notes.append(
            "One or more links were inferred from only one observed endpoint, so single-sided endpoint evidence remains explicit."
        )
    if collection_failure_count > 0:
        notes.append(
            "One or more topology targets could not be collected, so unknown and degraded states remain explicit."
        )

    delivery = BackendTopologyDeliveryEnvelope(
        destination_service="app-api",
        delivery_mode=config.delivery.mode,
        delivery_status=delivery_status,
        destination_endpoint=config.delivery.endpoint,
        model_family="topology",
        configured_target_count=len(config.targets),
        observed_target_count=observed_target_count,
        collection_success_count=collection_success_count,
        collection_partial_count=partial_collection_count,
        collection_failure_count=collection_failure_count,
        oldest_observed_at=oldest_observed_at,
        newest_observed_at=newest_observed_at,
        degraded_scope_summary=degraded_scope_summary,
        endpoint_pairing_posture=endpoint_pairing_posture,
        paired_link_count=paired_link_count,
        single_sided_link_count=single_sided_link_count,
        topology_id="platform-observed-topology",
        topology_name="Platform Observed Topology",
        node_count=len(normalized_nodes),
        link_count=len(normalized_links),
        nodes=normalized_nodes,
        links=normalized_links,
        sync_source="gnmi_collector_topology_interface_inference",
        sync_status=sync_status,
        completeness="partial",
        observed_at=derive_topology_observed_at(raw_records),
        notes=notes,
    )
    summary = TopologyFlowSummary(
        target_count=len(config.targets),
        planned_paths=sum(len(plan.topology_paths) for plan in plans),
        observed_target_count=observed_target_count,
        collection_success_count=collection_success_count,
        collection_failure_count=collection_failure_count,
        partial_collection_count=partial_collection_count,
        oldest_observed_at=oldest_observed_at,
        newest_observed_at=newest_observed_at,
        normalized_node_count=len(normalized_nodes),
        normalized_link_count=len(normalized_links),
        inferred_link_count=len(normalized_links),
        endpoint_pairing_posture=endpoint_pairing_posture,
        paired_link_count=paired_link_count,
        single_sided_link_count=single_sided_link_count,
        node_state_counts=node_state_counts,
        link_state_counts=link_state_counts,
        backend_ready_node_count=delivery.node_count,
        backend_ready_link_count=delivery.link_count,
        backend_delivery_error_count=0,
    )
    record_topology_summary(summary)
    return TopologyFlowSnapshot(
        mode=config.mode,
        config_path=config.config_path,
        plans=plans,
        raw_records=raw_records,
        normalized_nodes=normalized_nodes,
        normalized_links=normalized_links,
        delivery=delivery,
        summary=summary,
    )

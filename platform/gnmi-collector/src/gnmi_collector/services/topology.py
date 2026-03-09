"""Topology-oriented collection flow helpers."""

from collections import Counter

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


def build_topology_flow_snapshot() -> TopologyFlowSnapshot:
    """Build the current end-to-end live topology collection flow snapshot."""
    config = build_runtime_config()
    adapter = NokiaSrosAdapter()

    plans = [adapter.build_topology_plan(target) for target in config.targets]
    raw_records = [adapter.collect_topology(target) for target in config.targets]
    normalized_nodes = map_topology_nodes(raw_records)
    normalized_links, single_sided_link_count = map_topology_links(raw_records)
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

    if normalized_nodes and collection_failure_count == 0 and partial_collection_count == 0:
        delivery_status = "live_ready"
        sync_status = "ok"
    elif normalized_nodes:
        delivery_status = "partial"
        sync_status = "degraded"
    else:
        delivery_status = "failed"
        sync_status = "failed"

    notes = [
        "Topology links are inferred from live router interface names and current interface operational state.",
        "The topology slice remains intentionally partial until LLDP, IGP, or bounded controller enrichment is added.",
    ]
    if single_sided_link_count > 0:
        notes.append(
            "One or more links were inferred from only one observed endpoint, so partial evidence remains explicit."
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
        collection_success_count=collection_success_count,
        collection_failure_count=collection_failure_count,
        partial_collection_count=partial_collection_count,
        normalized_node_count=len(normalized_nodes),
        normalized_link_count=len(normalized_links),
        inferred_link_count=len(normalized_links),
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

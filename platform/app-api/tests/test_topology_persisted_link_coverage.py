"""Unit tests: topology coverage from persisted-style link rows (attributes JSON only).

Persisted ``TopologyLinkTable`` rows expose pairing evidence via ``attributes``;
``endpoint_pairing_state`` and ``endpoint_evidence_count`` are not separate columns.
``build_topology_coverage_summary`` and ``resolve_topology_link_endpoint_evidence``
must derive the same postures after load as for live ``TopologyLink`` models.
"""

from types import SimpleNamespace

from app_api.models.topology import build_topology_coverage_summary


def _node(node_id: str) -> SimpleNamespace:
    return SimpleNamespace(node_id=node_id)


def _link(
    *,
    source: str,
    target: str,
    attributes: dict | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        source_node_id=source,
        target_node_id=target,
        attributes=attributes or {},
    )


def test_coverage_summary_derives_pairing_from_attributes_only_links() -> None:
    """Mimics ORM rows after persist: only attributes carry endpoint_pairing_state."""
    nodes = [_node("n1"), _node("n2")]
    links = [
        _link(
            source="n1",
            target="n2",
            attributes={"endpoint_pairing_state": "paired", "endpoint_evidence_count": "2"},
        ),
    ]
    coverage = build_topology_coverage_summary(nodes=nodes, links=links)
    assert coverage.inference_posture == "inferred"
    assert coverage.endpoint_pairing_posture == "paired"
    assert coverage.paired_link_count == 1
    assert coverage.single_sided_link_count == 0
    assert coverage.linked_node_count == 2
    assert coverage.isolated_node_count == 0
    assert coverage.node_participation_posture == "fully_linked"


def test_coverage_summary_partially_paired_from_attributes_only() -> None:
    nodes = [_node("n1"), _node("n2"), _node("n3")]
    links = [
        _link(
            source="n1",
            target="n2",
            attributes={"endpoint_pairing_state": "paired", "endpoint_evidence_count": "2"},
        ),
        _link(
            source="n2",
            target="n3",
            attributes={"endpoint_pairing_state": "single_sided", "endpoint_evidence_count": "1"},
        ),
    ]
    coverage = build_topology_coverage_summary(nodes=nodes, links=links)
    assert coverage.endpoint_pairing_posture == "partially_paired"
    assert coverage.paired_link_count == 1
    assert coverage.single_sided_link_count == 1
    assert coverage.node_participation_posture == "fully_linked"


def test_coverage_summary_unknown_pairing_when_attributes_missing_counts() -> None:
    """Older snapshots may lack pairing keys; evidence may still be unknown."""
    nodes = [_node("n1"), _node("n2")]
    links = [_link(source="n1", target="n2", attributes={})]
    coverage = build_topology_coverage_summary(nodes=nodes, links=links)
    assert coverage.endpoint_pairing_posture == "unknown"
    assert coverage.paired_link_count == 0
    assert coverage.single_sided_link_count == 0

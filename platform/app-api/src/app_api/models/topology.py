"""Backend-owned internal models and helpers for topology reads."""

from collections.abc import Sequence
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


TopologyEndpointPairingState = Literal["paired", "single_sided", "unknown"]
TopologyEndpointPairingPosture = Literal[
    "paired", "partially_paired", "single_sided", "unknown"
]
TopologyInferencePosture = Literal["inferred", "unknown"]
TopologyCollectionPosture = Literal["ok", "degraded", "blocked", "unknown"]
TopologyNodeParticipationPosture = Literal[
    "fully_linked", "partially_isolated", "isolated_only", "unknown"
]


class TopologyCoverageSummary(BaseModel):
    """Backend-owned bounded summary of endpoint-pairing coverage posture."""

    inference_posture: TopologyInferencePosture
    endpoint_pairing_posture: TopologyEndpointPairingPosture
    collection_posture: TopologyCollectionPosture
    node_participation_posture: TopologyNodeParticipationPosture
    paired_link_count: int
    single_sided_link_count: int
    linked_node_count: int
    isolated_node_count: int
    summary: str


class TopologyNode(BaseModel):
    """Backend-owned normalized topology node model."""

    node_id: str
    display_name: str
    role: str
    state: Literal["up", "down", "degraded", "unknown"]
    source: str
    device_id: str | None = None
    attributes: dict[str, str] = Field(default_factory=dict)


class TopologyLink(BaseModel):
    """Backend-owned normalized topology link model."""

    link_id: str
    source_node_id: str
    target_node_id: str
    state: Literal["up", "down", "degraded", "unknown"]
    source: str
    endpoint_pairing_state: TopologyEndpointPairingState = "unknown"
    endpoint_evidence_count: int | None = None
    attributes: dict[str, str] = Field(default_factory=dict)


class TopologySnapshot(BaseModel):
    """Backend-owned normalized topology snapshot."""

    topology_id: str
    topology_name: str
    nodes: list[TopologyNode]
    links: list[TopologyLink]
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    observed_at: datetime | None = None
    notes: list[str] = Field(default_factory=list)


class TopologyHistorySnapshotRecord(BaseModel):
    """Bounded summary of one persisted topology snapshot."""

    snapshot_id: str
    persisted_at: datetime
    observed_at: datetime | None = None
    topology_name: str
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    node_count: int
    link_count: int
    node_state_counts: dict[str, int] = Field(default_factory=dict)
    link_state_counts: dict[str, int] = Field(default_factory=dict)


class TopologyHistoryComparison(BaseModel):
    """Bounded comparison of the latest two persisted topology snapshots."""

    current_snapshot_id: str
    previous_snapshot_id: str
    current_persisted_at: datetime
    previous_persisted_at: datetime
    current_node_count: int
    previous_node_count: int
    current_link_count: int
    previous_link_count: int
    node_count_delta: int
    link_count_delta: int
    added_node_count: int
    removed_node_count: int
    changed_node_count: int
    added_link_count: int
    removed_link_count: int
    changed_link_count: int
    notes: list[str] = Field(default_factory=list)


class TopologyHistoryWindow(BaseModel):
    """Bounded persisted history window for topology comparison support."""

    status: Literal["unavailable", "current_only", "comparison_ready"]
    summary: str
    recent_snapshots: list[TopologyHistorySnapshotRecord] = Field(default_factory=list)
    comparison_to_previous: TopologyHistoryComparison | None = None


def _normalize_endpoint_pairing_state(value: object) -> TopologyEndpointPairingState | None:
    if value in {"paired", "single_sided", "unknown"}:
        return value
    return None


def _normalize_endpoint_pairing_posture(value: object) -> TopologyEndpointPairingPosture | None:
    if value in {"paired", "partially_paired", "single_sided", "unknown"}:
        return value
    return None


def _normalize_inference_posture(value: object) -> TopologyInferencePosture | None:
    if value in {"inferred", "unknown"}:
        return value
    return None


def _normalize_collection_posture(value: object) -> TopologyCollectionPosture | None:
    if value in {"ok", "degraded", "blocked", "unknown"}:
        return value
    return None


def _normalize_node_participation_posture(
    value: object,
) -> TopologyNodeParticipationPosture | None:
    if value in {"fully_linked", "partially_isolated", "isolated_only", "unknown"}:
        return value
    return None


def _parse_endpoint_evidence_count(value: object) -> int | None:
    if isinstance(value, int):
        return value if value >= 0 else None
    if isinstance(value, str):
        try:
            parsed_value = int(value)
        except ValueError:
            return None
        return parsed_value if parsed_value >= 0 else None
    return None


def resolve_topology_link_endpoint_evidence(
    link: Any,
) -> tuple[TopologyEndpointPairingState, int | None]:
    """Resolve typed endpoint-pairing evidence from a link model or DTO."""
    attributes = getattr(link, "attributes", {}) or {}
    if not isinstance(attributes, dict):
        attributes = {}

    endpoint_pairing_state = _normalize_endpoint_pairing_state(
        getattr(link, "endpoint_pairing_state", None)
    )
    if endpoint_pairing_state is None:
        endpoint_pairing_state = _normalize_endpoint_pairing_state(
            attributes.get("endpoint_pairing_state")
        )

    endpoint_evidence_count = _parse_endpoint_evidence_count(
        getattr(link, "endpoint_evidence_count", None)
    )
    if endpoint_evidence_count is None:
        endpoint_evidence_count = _parse_endpoint_evidence_count(
            attributes.get("endpoint_evidence_count")
        )

    if endpoint_pairing_state is None:
        if endpoint_evidence_count == 2:
            endpoint_pairing_state = "paired"
        elif endpoint_evidence_count == 1:
            endpoint_pairing_state = "single_sided"
        else:
            endpoint_pairing_state = "unknown"

    return endpoint_pairing_state, endpoint_evidence_count


def _derive_endpoint_pairing_posture(
    *,
    link_count: int,
    paired_link_count: int,
    single_sided_link_count: int,
    unknown_link_count: int,
) -> TopologyEndpointPairingPosture:
    if link_count == 0:
        return "unknown"
    if unknown_link_count > 0:
        return "unknown"
    if paired_link_count == link_count and single_sided_link_count == 0:
        return "paired"
    if paired_link_count > 0 and single_sided_link_count > 0:
        return "partially_paired"
    if paired_link_count == 0 and single_sided_link_count == link_count:
        return "single_sided"
    return "unknown"


def _derive_inference_posture(*, link_count: int) -> TopologyInferencePosture:
    if link_count > 0:
        return "inferred"
    return "unknown"


def _derive_node_participation_counts(
    *,
    nodes: Sequence[Any],
    links: Sequence[Any],
) -> tuple[int, int]:
    linked_node_ids = {
        node_id
        for link in links
        for node_id in (getattr(link, "source_node_id", None), getattr(link, "target_node_id", None))
        if isinstance(node_id, str)
    }
    linked_node_count = sum(
        1 for node in nodes if getattr(node, "node_id", None) in linked_node_ids
    )
    isolated_node_count = max(0, len(nodes) - linked_node_count)
    return linked_node_count, isolated_node_count


def _derive_node_participation_posture(
    *,
    node_count: int,
    linked_node_count: int,
    isolated_node_count: int,
) -> TopologyNodeParticipationPosture:
    if node_count == 0:
        return "unknown"
    if linked_node_count == node_count and isolated_node_count == 0:
        return "fully_linked"
    if linked_node_count > 0 and isolated_node_count > 0:
        return "partially_isolated"
    if linked_node_count == 0 and isolated_node_count == node_count:
        return "isolated_only"
    return "unknown"


def build_topology_coverage_summary(
    *,
    nodes: Sequence[Any],
    links: Sequence[Any],
    inference_posture: object | None = None,
    endpoint_pairing_posture: object | None = None,
    collection_posture: object | None = None,
    node_participation_posture: object | None = None,
    paired_link_count: int | None = None,
    single_sided_link_count: int | None = None,
    linked_node_count: int | None = None,
    isolated_node_count: int | None = None,
) -> TopologyCoverageSummary:
    """Build a bounded backend-owned topology coverage summary."""
    normalized_inference_posture = _normalize_inference_posture(inference_posture)
    normalized_posture = _normalize_endpoint_pairing_posture(endpoint_pairing_posture)
    normalized_collection_posture = _normalize_collection_posture(collection_posture)
    normalized_node_participation_posture = _normalize_node_participation_posture(
        node_participation_posture
    )
    resolved_inference_posture = (
        normalized_inference_posture
        if normalized_inference_posture is not None
        else _derive_inference_posture(link_count=len(links))
    )
    resolved_collection_posture = (
        normalized_collection_posture
        if normalized_collection_posture is not None
        else "unknown"
    )
    if (
        normalized_posture is not None
        and paired_link_count is not None
        and single_sided_link_count is not None
    ):
        resolved_paired_link_count = max(paired_link_count, 0)
        resolved_single_sided_link_count = max(single_sided_link_count, 0)
        resolved_posture = normalized_posture
    else:
        resolved_paired_link_count = 0
        resolved_single_sided_link_count = 0
        unknown_link_count = 0
        for link in links:
            resolved_state, _ = resolve_topology_link_endpoint_evidence(link)
            if resolved_state == "paired":
                resolved_paired_link_count += 1
            elif resolved_state == "single_sided":
                resolved_single_sided_link_count += 1
            else:
                unknown_link_count += 1
        resolved_posture = _derive_endpoint_pairing_posture(
            link_count=len(links),
            paired_link_count=resolved_paired_link_count,
            single_sided_link_count=resolved_single_sided_link_count,
            unknown_link_count=unknown_link_count,
        )

    if (
        normalized_node_participation_posture is not None
        and linked_node_count is not None
        and isolated_node_count is not None
    ):
        resolved_linked_node_count = max(linked_node_count, 0)
        resolved_isolated_node_count = max(isolated_node_count, 0)
        resolved_node_participation_posture = normalized_node_participation_posture
    else:
        resolved_linked_node_count, resolved_isolated_node_count = _derive_node_participation_counts(
            nodes=nodes,
            links=links,
        )
        resolved_node_participation_posture = _derive_node_participation_posture(
            node_count=len(nodes),
            linked_node_count=resolved_linked_node_count,
            isolated_node_count=resolved_isolated_node_count,
        )

    if resolved_inference_posture == "inferred":
        inference_summary = (
            "Current normalized topology remains inference-bounded rather than direct adjacency truth."
        )
    else:
        inference_summary = (
            "Current topology response cannot classify inference posture more precisely from the available normalized link evidence."
        )

    if resolved_collection_posture == "ok":
        collection_summary = "Current collection posture is healthy for the emitted live topology response."
    elif resolved_collection_posture == "degraded":
        collection_summary = (
            "Current collection posture is degraded for the emitted live topology response."
        )
    elif resolved_collection_posture == "blocked":
        collection_summary = "Current collection posture is blocked for the live topology path."
    else:
        collection_summary = (
            "Current topology response cannot classify collection posture more precisely from the available normalized evidence."
        )

    if len(links) == 0:
        endpoint_summary = (
            "Current topology response does not emit any normalized links, so endpoint-pairing posture remains unknown."
        )
    elif resolved_posture == "paired":
        endpoint_summary = (
            "All emitted normalized topology links are currently backed by paired endpoint evidence within the bounded inference slice."
        )
    elif resolved_posture == "partially_paired":
        endpoint_summary = (
            "Current normalized topology links include a mix of paired and single-sided endpoint evidence within the bounded inference slice."
        )
    elif resolved_posture == "single_sided":
        endpoint_summary = (
            "Current normalized topology links are inferred from single-sided endpoint evidence only within the bounded inference slice."
        )
    else:
        endpoint_summary = (
            "Current topology response cannot summarize endpoint-pairing posture honestly from the available normalized link evidence."
        )

    if len(nodes) == 0:
        node_participation_summary = (
            "Current topology response does not emit any normalized nodes, so node participation remains unknown."
        )
    elif resolved_node_participation_posture == "fully_linked":
        node_participation_summary = (
            "All observed normalized nodes are currently represented by at least one emitted inferred link within the bounded topology slice."
        )
    elif resolved_node_participation_posture == "partially_isolated":
        node_participation_summary = (
            "Current normalized topology includes both linked and isolated observed nodes within the bounded inferred slice."
        )
    elif resolved_node_participation_posture == "isolated_only":
        node_participation_summary = (
            "Observed normalized nodes are present, but none are currently represented by emitted inferred links within the bounded topology slice."
        )
    else:
        node_participation_summary = (
            "Current topology response cannot summarize node participation honestly from the available normalized node and link evidence."
        )

    summary = (
        f"{inference_summary} {collection_summary} {endpoint_summary} {node_participation_summary}"
    )

    return TopologyCoverageSummary(
        inference_posture=resolved_inference_posture,
        endpoint_pairing_posture=resolved_posture,
        collection_posture=resolved_collection_posture,
        node_participation_posture=resolved_node_participation_posture,
        paired_link_count=resolved_paired_link_count,
        single_sided_link_count=resolved_single_sided_link_count,
        linked_node_count=resolved_linked_node_count,
        isolated_node_count=resolved_isolated_node_count,
        summary=summary,
    )

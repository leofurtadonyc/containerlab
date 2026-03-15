"""Backend-owned internal models and helpers for topology reads."""

from collections.abc import Sequence
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


TopologyEndpointPairingState = Literal["paired", "single_sided", "unknown"]
TopologyEndpointPairingPosture = Literal[
    "paired", "partially_paired", "single_sided", "unknown"
]


class TopologyCoverageSummary(BaseModel):
    """Backend-owned bounded summary of endpoint-pairing coverage posture."""

    endpoint_pairing_posture: TopologyEndpointPairingPosture
    paired_link_count: int
    single_sided_link_count: int
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


def _normalize_endpoint_pairing_state(value: object) -> TopologyEndpointPairingState | None:
    if value in {"paired", "single_sided", "unknown"}:
        return value
    return None


def _normalize_endpoint_pairing_posture(value: object) -> TopologyEndpointPairingPosture | None:
    if value in {"paired", "partially_paired", "single_sided", "unknown"}:
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


def build_topology_coverage_summary(
    *,
    links: Sequence[Any],
    endpoint_pairing_posture: object | None = None,
    paired_link_count: int | None = None,
    single_sided_link_count: int | None = None,
) -> TopologyCoverageSummary:
    """Build a bounded backend-owned topology coverage summary."""
    normalized_posture = _normalize_endpoint_pairing_posture(endpoint_pairing_posture)
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

    if len(links) == 0:
        summary = (
            "Current topology response does not emit any normalized links, so endpoint-pairing posture remains unknown."
        )
    elif resolved_posture == "paired":
        summary = (
            "All emitted normalized topology links are currently backed by paired endpoint evidence within the bounded inference slice."
        )
    elif resolved_posture == "partially_paired":
        summary = (
            "Current normalized topology links include a mix of paired and single-sided endpoint evidence within the bounded inference slice."
        )
    elif resolved_posture == "single_sided":
        summary = (
            "Current normalized topology links are inferred from single-sided endpoint evidence only within the bounded inference slice."
        )
    else:
        summary = (
            "Current topology response cannot summarize endpoint-pairing posture honestly from the available normalized link evidence."
        )

    return TopologyCoverageSummary(
        endpoint_pairing_posture=resolved_posture,
        paired_link_count=resolved_paired_link_count,
        single_sided_link_count=resolved_single_sided_link_count,
        summary=summary,
    )

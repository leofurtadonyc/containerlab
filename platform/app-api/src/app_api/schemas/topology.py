"""Typed schemas for topology responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app_api.schemas.common import ApiResponseMetadata


class TopologyNodeRecord(BaseModel):
    """Normalized topology node record."""

    node_id: str
    display_name: str
    role: str
    state: Literal["up", "down", "degraded", "unknown"]
    source: str
    device_id: str | None = None
    attributes: dict[str, str]


class TopologyLinkRecord(BaseModel):
    """Normalized topology link record."""

    link_id: str
    source_node_id: str
    target_node_id: str
    state: Literal["up", "down", "degraded", "unknown"]
    source: str
    attributes: dict[str, str]


class TopologyRecord(BaseModel):
    """Normalized topology snapshot."""

    topology_id: str
    topology_name: str
    nodes: list[TopologyNodeRecord]
    links: list[TopologyLinkRecord]
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    observed_at: datetime | None = None
    notes: list[str]


class TopologyResponse(ApiResponseMetadata):
    """Read-only topology response."""

    data_status: Literal["normalized_scaffold", "live", "degraded"]
    summary: str
    topology: TopologyRecord

"""Backend-owned internal models for topology reads."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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

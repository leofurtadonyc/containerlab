"""Backend-owned internal models for policy inventory reads."""

from typing import Literal

from pydantic import BaseModel, Field


class CandidatePath(BaseModel):
    """Backend-owned normalized candidate path summary."""

    name: str
    path_state: Literal["active", "inactive", "unknown"]
    preference: int | None = None
    notes: list[str] = Field(default_factory=list)


class PolicyInventoryRecord(BaseModel):
    """Backend-owned normalized policy inventory model."""

    policy_id: str
    policy_name: str
    headend: str
    endpoint: str
    color: int
    candidate_paths: list[CandidatePath]
    intent_state: Literal["declared", "unknown"]
    observed_state: Literal["active", "inactive", "degraded", "unknown"]
    support_state: Literal[
        "supported",
        "partially_supported",
        "unsupported",
        "unknown",
        "not_implemented_in_platform",
    ]
    health_state: Literal["healthy", "degraded", "down", "unknown"]
    source: str
    notes: list[str] = Field(default_factory=list)

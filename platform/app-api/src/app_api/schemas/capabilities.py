"""Typed schemas for capability responses."""

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata


class CapabilityRecord(BaseModel):
    """Vendor-neutral capability record for Phase 2 APIs."""

    vendor: str
    platform: str
    version_scope: str | None = None
    domain: Literal[
        "inventory",
        "topology",
        "policy",
        "platform_health",
        "workflow_history",
        "audit_history",
    ]
    feature: str
    support_status: Literal[
        "supported",
        "partially_supported",
        "unsupported",
        "unknown",
        "not_implemented_in_platform",
    ]
    implementation_status: Literal["planned", "placeholder", "partial", "implemented"]
    availability_scope: str
    status_detail: str
    caveats: list[str]
    source_of_determination: str


class CapabilitiesListResponse(ApiResponseMetadata):
    """Read-only capability matrix response."""

    data_status: Literal["placeholder", "bounded_matrix"]
    summary: str
    count: int
    support_counts: dict[str, int] = Field(default_factory=dict)
    implementation_counts: dict[str, int] = Field(default_factory=dict)
    items: list[CapabilityRecord]

"""Typed schemas for capability responses."""

from typing import Literal

from pydantic import BaseModel

from app_api.schemas.common import ApiResponseMetadata


class CapabilityRecord(BaseModel):
    """Vendor-neutral capability record for Phase 1 APIs."""

    vendor: str
    platform: str
    version_scope: str | None = None
    feature: str
    support_status: Literal[
        "supported",
        "partially_supported",
        "unsupported",
        "unknown",
        "not_implemented_in_platform",
    ]
    implementation_status: Literal["planned", "placeholder", "partial", "implemented"]
    caveats: list[str]
    source_of_determination: str


class CapabilitiesListResponse(ApiResponseMetadata):
    """Read-only capability list scaffold."""

    data_status: Literal["placeholder"]
    summary: str
    count: int
    items: list[CapabilityRecord]

"""Typed schemas for device inventory responses."""

from typing import Literal

from pydantic import BaseModel

from app_api.schemas.common import ApiResponseMetadata


class DeviceRecord(BaseModel):
    """Vendor-neutral device inventory record for Phase 1 APIs."""

    device_id: str
    vendor: str
    platform: str
    software_version: str | None = None
    role: str | None = None
    management_address: str
    collector_status: Literal["ok", "degraded", "unreachable", "unknown"]
    capability_summary: Literal[
        "supported",
        "partially_supported",
        "unsupported",
        "unknown",
        "not_implemented_in_platform",
    ]


class DevicesListResponse(ApiResponseMetadata):
    """Read-only device inventory list scaffold."""

    data_status: Literal["placeholder", "integration_scaffold", "live", "degraded"]
    summary: str
    count: int
    items: list[DeviceRecord]

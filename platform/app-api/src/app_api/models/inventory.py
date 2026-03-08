"""Backend-owned internal models for inventory reads."""

from pydantic import BaseModel


class InventoryDevice(BaseModel):
    """Backend-owned normalized inventory model used before API serialization."""

    device_id: str
    vendor: str
    platform: str
    software_version: str | None = None
    role: str | None = None
    management_address: str
    collector_status: str
    capability_summary: str

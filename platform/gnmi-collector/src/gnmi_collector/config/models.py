"""Typed runtime configuration models for the collector."""

from typing import Literal

from pydantic import BaseModel, Field


class CollectorDeliveryConfig(BaseModel):
    """Backend delivery configuration for normalized collector outputs."""

    mode: Literal["backend_http_snapshot"]
    endpoint: str


class InventorySubscriptionConfig(BaseModel):
    """Inventory-oriented collection path definition."""

    name: str
    path: str
    cadence: Literal["poll"] = "poll"


class GnmiTargetAuthConfig(BaseModel):
    """Authentication settings for a gNMI target."""

    username: str
    password: str


class GnmiTargetConfig(BaseModel):
    """Target definition for a managed device."""

    name: str
    vendor: str
    role: str | None = None
    management_address: str
    port: int = 57400
    auth: GnmiTargetAuthConfig
    insecure: bool = True
    inventory_paths: list[str] = Field(default_factory=list)


class CollectorRuntimeConfig(BaseModel):
    """Collector runtime configuration used by the live inventory path."""

    mode: Literal["phase_2_live_inventory"]
    config_path: str
    metrics_port: int
    delivery: CollectorDeliveryConfig
    inventory_subscriptions: list[InventorySubscriptionConfig]
    targets: list[GnmiTargetConfig]

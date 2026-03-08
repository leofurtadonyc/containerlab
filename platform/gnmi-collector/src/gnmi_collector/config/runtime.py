"""Helpers for building the current collector runtime configuration."""

from gnmi_collector.config.models import (
    CollectorDeliveryConfig,
    CollectorRuntimeConfig,
    GnmiTargetAuthConfig,
    GnmiTargetConfig,
    InventorySubscriptionConfig,
)
from gnmi_collector.config.settings import get_settings


def build_runtime_config() -> CollectorRuntimeConfig:
    """Build the typed runtime config for the Phase 1 inventory scaffold."""
    settings = get_settings()
    inventory_subscriptions = [
        InventorySubscriptionConfig(name="system-name", path="/system/name"),
        InventorySubscriptionConfig(name="platform-chassis", path="/platform/chassis"),
        InventorySubscriptionConfig(name="software-version", path="/platform/software-version"),
    ]
    return CollectorRuntimeConfig(
        mode="phase_1_inventory_scaffold",
        config_path=settings.gnmi_config_path,
        metrics_port=settings.collector_metrics_port,
        delivery=CollectorDeliveryConfig(
            mode="backend_http_placeholder",
            endpoint=settings.app_api_url,
        ),
        inventory_subscriptions=inventory_subscriptions,
        targets=[
            GnmiTargetConfig(
                name="example-nokia-router",
                vendor="nokia",
                management_address="192.0.2.10",
                port=57400,
                auth=GnmiTargetAuthConfig(
                    username="example-user",
                    password="change_me",
                ),
                insecure=True,
                inventory_paths=[item.path for item in inventory_subscriptions],
            )
        ],
    )

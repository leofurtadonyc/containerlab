"""Helpers for building the current collector runtime configuration."""

from pathlib import Path
from typing import Any

import yaml

from gnmi_collector.config.models import (
    CollectorDeliveryConfig,
    CollectorRuntimeConfig,
    GnmiTargetAuthConfig,
    GnmiTargetConfig,
    InventorySubscriptionConfig,
    TopologySubscriptionConfig,
)
from gnmi_collector.config.settings import get_settings


def _load_config_document(config_path: str) -> dict[str, Any]:
    """Load the static collector configuration document."""
    config_file = Path(config_path)
    if not config_file.exists():
        raise FileNotFoundError(f"Collector config file not found: {config_path}")

    loaded = yaml.safe_load(config_file.read_text(encoding="utf-8")) or {}
    if not isinstance(loaded, dict):
        raise ValueError("Collector config file must contain a top-level mapping.")
    return loaded


def _build_inventory_subscriptions(document: dict[str, Any]) -> list[InventorySubscriptionConfig]:
    """Build typed inventory subscription definitions from the config document."""
    inventory = document.get("inventory", {})
    subscriptions = inventory.get("subscriptions", [])
    return [
        InventorySubscriptionConfig(
            name=item["name"],
            path=item["path"],
            cadence=item.get("cadence", "poll"),
        )
        for item in subscriptions
    ]


def _build_topology_subscriptions(document: dict[str, Any]) -> list[TopologySubscriptionConfig]:
    """Build typed topology subscription definitions from the config document."""
    topology = document.get("topology", {})
    subscriptions = topology.get("subscriptions", [])
    return [
        TopologySubscriptionConfig(
            name=item["name"],
            path=item["path"],
            cadence=item.get("cadence", "poll"),
        )
        for item in subscriptions
    ]


def _build_targets(
    document: dict[str, Any],
    inventory_subscriptions: list[InventorySubscriptionConfig],
    topology_subscriptions: list[TopologySubscriptionConfig],
) -> list[GnmiTargetConfig]:
    """Build typed live target definitions from the config document."""
    default_inventory_paths = [item.path for item in inventory_subscriptions]
    default_topology_paths = [item.path for item in topology_subscriptions]
    targets = document.get("targets", [])
    return [
        GnmiTargetConfig(
            name=item["name"],
            vendor=item["vendor"],
            role=item.get("role"),
            management_address=item["management_address"],
            port=item.get("port", 57400),
            auth=GnmiTargetAuthConfig(
                username=item["auth"]["username"],
                password=item["auth"]["password"],
            ),
            insecure=item.get("insecure", True),
            inventory_paths=item.get("inventory_paths", default_inventory_paths),
            topology_paths=item.get("topology_paths", default_topology_paths),
        )
        for item in targets
    ]


def build_runtime_config() -> CollectorRuntimeConfig:
    """Build the typed runtime config for the live inventory path."""
    settings = get_settings()
    document = _load_config_document(settings.gnmi_config_path)
    inventory_subscriptions = _build_inventory_subscriptions(document)
    topology_subscriptions = _build_topology_subscriptions(document)
    collector = document.get("collector", {})
    delivery = collector.get("delivery", {})

    return CollectorRuntimeConfig(
        mode=collector.get("mode", "phase_2_live_inventory"),
        config_path=settings.gnmi_config_path,
        metrics_port=settings.collector_metrics_port,
        delivery=CollectorDeliveryConfig(
            mode=delivery.get("mode", "backend_http_snapshot"),
            endpoint=delivery.get("endpoint", settings.app_api_url),
        ),
        inventory_subscriptions=inventory_subscriptions,
        topology_subscriptions=topology_subscriptions,
        targets=_build_targets(document, inventory_subscriptions, topology_subscriptions),
    )

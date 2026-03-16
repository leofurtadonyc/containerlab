"""Environment-driven settings for the gNMI collector service."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_gnmi_config_path() -> str:
    """Return the default config path for container and source-based runs."""
    container_path = Path("/app/configs/config.example.yaml")
    if container_path.exists():
        return str(container_path)

    repo_local_path = (
        Path(__file__).resolve().parents[3] / "configs" / "config.example.yaml"
    )
    return str(repo_local_path)


class Settings(BaseSettings):
    """Collector settings used by the live inventory path."""

    app_name: str = "Platform gNMI Collector"
    app_version: str = "0.1.0"
    collector_metrics_port: int = 9804
    app_api_url: str = "http://app-api:8000"
    gnmi_config_path: str = Field(default_factory=_default_gnmi_config_path)
    collector_mode: str = "phase_2_live_inventory"
    collector_target_concurrency: int = 12
    collector_gnmi_request_timeout_seconds: int = Field(default=2, ge=1)

    model_config = SettingsConfigDict(
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached settings for collector modules."""
    return Settings()

"""Environment-driven settings for the gNMI collector service."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Collector settings used by the live inventory path."""

    app_name: str = "Platform gNMI Collector"
    app_version: str = "0.1.0"
    collector_metrics_port: int = 9804
    app_api_url: str = "http://app-api:8000"
    gnmi_config_path: str = "/app/configs/config.example.yaml"
    collector_mode: str = "phase_2_live_inventory"

    model_config = SettingsConfigDict(
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached settings for collector modules."""
    return Settings()

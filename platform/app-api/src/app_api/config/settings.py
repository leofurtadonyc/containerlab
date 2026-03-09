"""Application settings scaffolding."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven configuration for the backend skeleton."""

    app_name: str = "Platform App API"
    app_version: str = "0.1.0"
    api_port: int = 8000
    database_url: str = "postgresql://platform:change_me@postgres:5432/platform"
    gnmi_collector_url: str = "http://gnmi-collector:9804"
    gnmi_collector_timeout_seconds: int = 30
    odl_url: str = "http://odl:8181"
    prometheus_url: str = "http://prometheus:9090"

    model_config = SettingsConfigDict(
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached settings for application modules."""
    return Settings()

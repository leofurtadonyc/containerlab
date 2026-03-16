"""Application settings scaffolding."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven configuration for the backend skeleton."""

    app_name: str = "Platform App API"
    app_version: str = "0.1.0"
    api_port: int = 8000
    database_url: str = "postgresql://platform:change_me@postgres:5432/platform"
    gnmi_collector_url: str = "http://gnmi-collector:9804"
    gnmi_collector_timeout_seconds: int = Field(default=3, ge=1)
    gnmi_collector_inventory_timeout_seconds: int | None = Field(default=None, ge=1)
    gnmi_collector_topology_timeout_seconds: int | None = Field(default=None, ge=1)
    gnmi_collector_policy_timeout_seconds: int | None = Field(default=None, ge=1)
    gnmi_collector_snapshot_cache_ttl_seconds: int = Field(default=15, ge=0)
    gnmi_collector_unavailable_snapshot_cache_ttl_seconds: int = Field(default=2, ge=0)
    odl_url: str = "http://odl:8181"
    odl_username: str = "admin"
    odl_password: str = "admin"
    odl_timeout_seconds: int = Field(default=3, ge=1)
    prometheus_url: str = "http://prometheus:9090"

    model_config = SettingsConfigDict(
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
    )

    def get_sqlalchemy_database_url(self) -> str:
        """Return a SQLAlchemy URL compatible with the installed PostgreSQL driver."""
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.database_url

    def get_gnmi_collector_inventory_timeout_seconds(self) -> int:
        """Return the bounded timeout budget for inventory collector reads."""
        return self.gnmi_collector_inventory_timeout_seconds or self.gnmi_collector_timeout_seconds

    def get_gnmi_collector_topology_timeout_seconds(self) -> int:
        """Return the bounded timeout budget for topology collector reads."""
        return self.gnmi_collector_topology_timeout_seconds or self.gnmi_collector_timeout_seconds

    def get_gnmi_collector_policy_timeout_seconds(self) -> int:
        """Return the bounded timeout budget for policy collector reads."""
        return self.gnmi_collector_policy_timeout_seconds or self.gnmi_collector_timeout_seconds


@lru_cache
def get_settings() -> Settings:
    """Return cached settings for application modules."""
    return Settings()

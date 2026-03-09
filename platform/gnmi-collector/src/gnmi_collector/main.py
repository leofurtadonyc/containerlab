"""Application entrypoint for the gNMI collector skeleton."""

from fastapi import FastAPI

from gnmi_collector.config.settings import get_settings
from gnmi_collector.metrics.router import router as metrics_router
from gnmi_collector.routers.inventory import router as inventory_router
from gnmi_collector.routers.topology import router as topology_router


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    openapi_url="/openapi.json",
)
app.include_router(inventory_router)
app.include_router(topology_router)
app.include_router(metrics_router)

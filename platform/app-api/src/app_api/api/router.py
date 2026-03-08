"""Top-level API router composition."""

from fastapi import APIRouter

from app_api.metrics.router import router as metrics_router
from app_api.routers.health import router as health_router


api_router = APIRouter()
api_router.include_router(health_router, prefix="/api/v1")
api_router.include_router(metrics_router)

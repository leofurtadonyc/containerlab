"""Top-level API router composition."""

from fastapi import APIRouter

from app_api.api.v1.router import router as v1_router
from app_api.metrics.router import router as metrics_router


api_router = APIRouter()
api_router.include_router(v1_router, prefix="/api/v1")
api_router.include_router(metrics_router)

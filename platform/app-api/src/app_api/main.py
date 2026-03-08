"""Application entrypoint for the platform backend skeleton."""

from fastapi import FastAPI

from app_api.api.router import api_router
from app_api.config.settings import get_settings


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    openapi_url="/openapi.json",
)
app.include_router(api_router)

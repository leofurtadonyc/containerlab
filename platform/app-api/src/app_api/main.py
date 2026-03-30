"""Application entrypoint for the platform backend skeleton."""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app_api.api.errors import (
    http_exception_handler,
    request_context_middleware,
    validation_exception_handler,
)
from app_api.api.router import api_router
from app_api.config.settings import get_settings
from app_api.startup.warmup import warm_read_side


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run bounded read-side warm-up before accepting traffic (avoids races with shell background warm-up)."""
    await asyncio.to_thread(warm_read_side)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8088",
        "http://127.0.0.1:8088",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

app.middleware("http")(request_context_middleware)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

app.include_router(api_router)

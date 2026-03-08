"""Shared API error and request-context helpers."""

from uuid import uuid4

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app_api.schemas.common import ErrorDetail, ErrorResponse


def get_request_id(request: Request) -> str:
    """Return the request id attached by middleware."""
    request_id = getattr(request.state, "request_id", None)
    if request_id is None:
        return "unknown"
    return str(request_id)


async def request_context_middleware(request: Request, call_next):
    """Attach a correlation id to each request and response."""
    request.state.request_id = request.headers.get("X-Request-ID") or str(uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    """Return a consistent error payload for HTTP errors."""
    payload = ErrorResponse(
        code="http_error",
        message=str(exc.detail),
        request_id=get_request_id(request),
    )
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Return a consistent error payload for request validation failures."""
    payload = ErrorResponse(
        code="validation_error",
        message="Request validation failed.",
        details=[
            ErrorDetail(
                field=".".join(str(part) for part in error["loc"]),
                issue=error["msg"],
            )
            for error in exc.errors()
        ],
        request_id=get_request_id(request),
    )
    return JSONResponse(status_code=422, content=payload.model_dump())

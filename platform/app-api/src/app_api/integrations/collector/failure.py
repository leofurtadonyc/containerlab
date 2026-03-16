"""Helpers for bounded collector-boundary failure classification."""

import json
import socket
from dataclasses import dataclass
from typing import Literal
from urllib.error import HTTPError, URLError

from pydantic import ValidationError


CollectorFetchErrorKind = Literal[
    "timeout_budget_exceeded",
    "collector_connection_error",
    "collector_http_error",
    "invalid_response_payload",
    "unknown_error",
]


@dataclass(frozen=True)
class CollectorFetchFailure:
    """Structured classification for one collector-boundary fetch failure."""

    kind: CollectorFetchErrorKind
    detail: str


def classify_collector_fetch_failure(
    exc: Exception,
    *,
    boundary_label: str,
    snapshot_url: str,
    timeout_seconds: int,
) -> CollectorFetchFailure:
    """Classify one collector-boundary failure into a stable bounded posture."""
    if _is_timeout_failure(exc):
        return CollectorFetchFailure(
            kind="timeout_budget_exceeded",
            detail=(
                "Collector boundary exceeded the "
                f"{timeout_seconds}s latency budget while reading {boundary_label} "
                f"from {snapshot_url}."
            ),
        )
    if isinstance(exc, HTTPError):
        return CollectorFetchFailure(
            kind="collector_http_error",
            detail=(
                "Collector boundary returned HTTP "
                f"{exc.code} while reading {boundary_label} from {snapshot_url}."
            ),
        )
    if isinstance(exc, URLError):
        return CollectorFetchFailure(
            kind="collector_connection_error",
            detail=(
                "Collector boundary connection failed while reading "
                f"{boundary_label} from {snapshot_url}: "
                f"{_stringify_error_reason(exc.reason)}."
            ),
        )
    if isinstance(exc, (json.JSONDecodeError, ValidationError)):
        return CollectorFetchFailure(
            kind="invalid_response_payload",
            detail=(
                "Collector boundary returned an invalid normalized payload while "
                f"reading {boundary_label} from {snapshot_url}."
            ),
        )
    return CollectorFetchFailure(
        kind="unknown_error",
        detail=(
            "Collector boundary raised an unexpected error while reading "
            f"{boundary_label} from {snapshot_url}: {type(exc).__name__}."
        ),
    )


def _is_timeout_failure(exc: Exception) -> bool:
    if isinstance(exc, (TimeoutError, socket.timeout)):
        return True
    if isinstance(exc, URLError):
        return isinstance(exc.reason, (TimeoutError, socket.timeout))
    return False


def _stringify_error_reason(reason: object) -> str:
    text = str(reason).strip()
    if not text:
        return "unknown collector connection error"
    return text.rstrip(".")

"""In-memory metrics state for the backend service."""

from collections import Counter, defaultdict
from threading import Lock


_lock = Lock()
_request_counts: Counter[tuple[str, str, str]] = Counter()
_request_duration_counts: Counter[tuple[str, str]] = Counter()
_request_duration_sums: dict[tuple[str, str], float] = defaultdict(float)


def observe_http_request(
    *,
    endpoint: str,
    method: str,
    status_code: int,
    duration_seconds: float,
) -> None:
    """Record one completed HTTP request."""
    status_class = f"{status_code // 100}xx"
    request_key = (endpoint, method, status_class)
    duration_key = (endpoint, method)
    with _lock:
        _request_counts[request_key] += 1
        _request_duration_counts[duration_key] += 1
        _request_duration_sums[duration_key] += duration_seconds


def render_prometheus_metrics(app_version: str) -> str:
    """Render backend metrics in Prometheus text format."""
    with _lock:
        request_counts = dict(_request_counts)
        duration_counts = dict(_request_duration_counts)
        duration_sums = dict(_request_duration_sums)

    lines = [
        "# HELP platform_app_api_info Backend service build information.",
        "# TYPE platform_app_api_info gauge",
        f'platform_app_api_info{{service="app-api",version="{app_version}"}} 1',
        "# HELP platform_app_api_http_requests_total Total completed HTTP requests.",
        "# TYPE platform_app_api_http_requests_total counter",
    ]

    for (endpoint, method, status_class), count in sorted(request_counts.items()):
        lines.append(
            (
                "platform_app_api_http_requests_total"
                f'{{endpoint="{endpoint}",method="{method}",status_class="{status_class}"}} '
                f"{count}"
            )
        )

    lines.extend(
        [
            (
                "# HELP platform_app_api_http_request_duration_seconds_count "
                "Count of observed HTTP request durations."
            ),
            "# TYPE platform_app_api_http_request_duration_seconds_count counter",
        ]
    )
    for (endpoint, method), count in sorted(duration_counts.items()):
        lines.append(
            (
                "platform_app_api_http_request_duration_seconds_count"
                f'{{endpoint="{endpoint}",method="{method}"}} {count}'
            )
        )

    lines.extend(
        [
            (
                "# HELP platform_app_api_http_request_duration_seconds_sum "
                "Sum of observed HTTP request durations in seconds."
            ),
            "# TYPE platform_app_api_http_request_duration_seconds_sum counter",
        ]
    )
    for (endpoint, method), duration_sum in sorted(duration_sums.items()):
        lines.append(
            (
                "platform_app_api_http_request_duration_seconds_sum"
                f'{{endpoint="{endpoint}",method="{method}"}} {duration_sum:.9f}'
            )
        )

    lines.append("")
    return "\n".join(lines)


def reset_metrics_registry() -> None:
    """Reset in-memory metrics for tests."""
    with _lock:
        _request_counts.clear()
        _request_duration_counts.clear()
        _request_duration_sums.clear()

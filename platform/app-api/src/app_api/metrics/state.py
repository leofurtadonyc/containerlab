"""In-memory metrics state for the backend service."""

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from threading import Lock


_lock = Lock()
_request_counts: Counter[tuple[str, str, str]] = Counter()
_request_duration_counts: Counter[tuple[str, str]] = Counter()
_request_duration_sums: dict[tuple[str, str], float] = defaultdict(float)


@dataclass(frozen=True)
class CachedTopologyMetrics:
    """Latest topology snapshot metrics cached for scrape-safe exposition."""

    node_count: int = 0
    link_count: int = 0
    data_status: str = "unknown"
    sync_status: str = "unknown"
    completeness: str = "unknown"
    node_state_counts: dict[str, int] = field(default_factory=dict)
    link_state_counts: dict[str, int] = field(default_factory=dict)


@dataclass(frozen=True)
class CachedPolicyMetrics:
    """Latest policy snapshot metrics cached for scrape-safe exposition."""

    record_count: int = 0
    observed_policy_count: int = 0
    active_policy_count: int = 0
    static_policy_count: int = 0
    bgp_policy_count: int = 0
    observed_target_count: int = 0
    policy_capable_target_count: int = 0
    observed_state_counts: dict[str, int] = field(default_factory=dict)
    health_state_counts: dict[str, int] = field(default_factory=dict)
    support_state_counts: dict[str, int] = field(default_factory=dict)
    policy_type_counts: dict[str, int] = field(default_factory=dict)
    data_status: str = "unknown"
    sync_status: str = "unknown"
    completeness: str = "unknown"
    detail_mode: str = "unknown"


_cached_topology_metrics = CachedTopologyMetrics()
_cached_policy_metrics = CachedPolicyMetrics()


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


def cache_topology_metrics(
    *,
    node_count: int,
    link_count: int,
    data_status: str,
    sync_status: str,
    completeness: str,
    node_state_counts: dict[str, int],
    link_state_counts: dict[str, int],
) -> None:
    """Store the latest topology metrics for bounded scrape exposition."""
    global _cached_topology_metrics
    with _lock:
        _cached_topology_metrics = CachedTopologyMetrics(
            node_count=node_count,
            link_count=link_count,
            data_status=data_status,
            sync_status=sync_status,
            completeness=completeness,
            node_state_counts=dict(node_state_counts),
            link_state_counts=dict(link_state_counts),
        )


def get_cached_topology_metrics() -> CachedTopologyMetrics:
    """Return the latest cached topology metrics."""
    with _lock:
        return _cached_topology_metrics


def cache_policy_metrics(
    *,
    record_count: int,
    observed_policy_count: int,
    active_policy_count: int,
    static_policy_count: int,
    bgp_policy_count: int,
    observed_target_count: int,
    policy_capable_target_count: int,
    observed_state_counts: dict[str, int],
    health_state_counts: dict[str, int],
    support_state_counts: dict[str, int],
    policy_type_counts: dict[str, int],
    data_status: str,
    sync_status: str,
    completeness: str,
    detail_mode: str,
) -> None:
    """Store the latest policy metrics for bounded scrape exposition."""
    global _cached_policy_metrics
    with _lock:
        _cached_policy_metrics = CachedPolicyMetrics(
            record_count=record_count,
            observed_policy_count=observed_policy_count,
            active_policy_count=active_policy_count,
            static_policy_count=static_policy_count,
            bgp_policy_count=bgp_policy_count,
            observed_target_count=observed_target_count,
            policy_capable_target_count=policy_capable_target_count,
            observed_state_counts=dict(observed_state_counts),
            health_state_counts=dict(health_state_counts),
            support_state_counts=dict(support_state_counts),
            policy_type_counts=dict(policy_type_counts),
            data_status=data_status,
            sync_status=sync_status,
            completeness=completeness,
            detail_mode=detail_mode,
        )


def get_cached_policy_metrics() -> CachedPolicyMetrics:
    """Return the latest cached policy metrics."""
    with _lock:
        return _cached_policy_metrics


def render_prometheus_metrics(
    app_version: str,
    *,
    topology_metrics: dict[str, object] | None = None,
    policy_metrics: dict[str, object] | None = None,
    history_metrics: dict[str, object] | None = None,
) -> str:
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

    if topology_metrics is not None:
        lines.extend(
            [
                "# HELP platform_app_api_topology_nodes Current normalized topology node count.",
                "# TYPE platform_app_api_topology_nodes gauge",
                f"platform_app_api_topology_nodes {topology_metrics['node_count']}",
                "# HELP platform_app_api_topology_links Current normalized topology link count.",
                "# TYPE platform_app_api_topology_links gauge",
                f"platform_app_api_topology_links {topology_metrics['link_count']}",
                (
                    "# HELP platform_app_api_topology_snapshot_status "
                    "Current topology snapshot status exposed by the backend."
                ),
                "# TYPE platform_app_api_topology_snapshot_status gauge",
                (
                    "platform_app_api_topology_snapshot_status"
                    f'{{data_status="{topology_metrics["data_status"]}",'
                    f'sync_status="{topology_metrics["sync_status"]}",'
                    f'completeness="{topology_metrics["completeness"]}"}} 1'
                ),
                (
                    "# HELP platform_app_api_topology_nodes_by_state "
                    "Current backend topology node counts by state."
                ),
                "# TYPE platform_app_api_topology_nodes_by_state gauge",
                *[
                    (
                        "platform_app_api_topology_nodes_by_state"
                        f'{{state="{state}"}} {count}'
                    )
                    for state, count in sorted(
                        dict(topology_metrics.get("node_state_counts", {})).items()
                    )
                ],
                (
                    "# HELP platform_app_api_topology_links_by_state "
                    "Current backend topology link counts by state."
                ),
                "# TYPE platform_app_api_topology_links_by_state gauge",
                *[
                    (
                        "platform_app_api_topology_links_by_state"
                        f'{{state="{state}"}} {count}'
                    )
                    for state, count in sorted(
                        dict(topology_metrics.get("link_state_counts", {})).items()
                    )
                ],
            ]
        )

    if policy_metrics is not None:
        lines.extend(
            [
                "# HELP platform_app_api_policy_records Current normalized policy record count.",
                "# TYPE platform_app_api_policy_records gauge",
                f"platform_app_api_policy_records {policy_metrics['record_count']}",
                (
                    "# HELP platform_app_api_policy_observed_policy_count "
                    "Aggregate SR policy count observed by the current bounded live slice."
                ),
                "# TYPE platform_app_api_policy_observed_policy_count gauge",
                (
                    "platform_app_api_policy_observed_policy_count "
                    f"{policy_metrics['observed_policy_count']}"
                ),
                "# HELP platform_app_api_policy_active_records Current active policy count.",
                "# TYPE platform_app_api_policy_active_records gauge",
                f"platform_app_api_policy_active_records {policy_metrics['active_policy_count']}",
                "# HELP platform_app_api_policy_static_records Current static policy count.",
                "# TYPE platform_app_api_policy_static_records gauge",
                f"platform_app_api_policy_static_records {policy_metrics['static_policy_count']}",
                "# HELP platform_app_api_policy_bgp_records Current BGP policy count.",
                "# TYPE platform_app_api_policy_bgp_records gauge",
                f"platform_app_api_policy_bgp_records {policy_metrics['bgp_policy_count']}",
                (
                    "# HELP platform_app_api_policy_observed_targets "
                    "Targets included in the current policy snapshot."
                ),
                "# TYPE platform_app_api_policy_observed_targets gauge",
                f"platform_app_api_policy_observed_targets {policy_metrics['observed_target_count']}",
                (
                    "# HELP platform_app_api_policy_capable_targets "
                    "Targets exposing bounded SR policy capability counters."
                ),
                "# TYPE platform_app_api_policy_capable_targets gauge",
                (
                    "platform_app_api_policy_capable_targets "
                    f"{policy_metrics['policy_capable_target_count']}"
                ),
                (
                    "# HELP platform_app_api_policy_snapshot_status "
                    "Current policy snapshot status exposed by the backend."
                ),
                "# TYPE platform_app_api_policy_snapshot_status gauge",
                (
                    "platform_app_api_policy_snapshot_status"
                    f'{{data_status="{policy_metrics["data_status"]}",'
                    f'sync_status="{policy_metrics["sync_status"]}",'
                    f'completeness="{policy_metrics["completeness"]}",'
                    f'detail_mode="{policy_metrics["detail_mode"]}"}} 1'
                ),
                (
                    "# HELP platform_app_api_policy_records_by_observed_state "
                    "Current normalized policy record counts by observed state."
                ),
                "# TYPE platform_app_api_policy_records_by_observed_state gauge",
                *[
                    (
                        "platform_app_api_policy_records_by_observed_state"
                        f'{{state="{state}"}} {count}'
                    )
                    for state, count in sorted(
                        {
                            "active": 0,
                            "inactive": 0,
                            "degraded": 0,
                            "unknown": 0,
                            **dict(policy_metrics.get("observed_state_counts", {})),
                        }.items()
                    )
                ],
                (
                    "# HELP platform_app_api_policy_records_by_health "
                    "Current normalized policy record counts by health state."
                ),
                "# TYPE platform_app_api_policy_records_by_health gauge",
                *[
                    (
                        "platform_app_api_policy_records_by_health"
                        f'{{state="{state}"}} {count}'
                    )
                    for state, count in sorted(
                        {
                            "healthy": 0,
                            "degraded": 0,
                            "down": 0,
                            "unknown": 0,
                            **dict(policy_metrics.get("health_state_counts", {})),
                        }.items()
                    )
                ],
                (
                    "# HELP platform_app_api_policy_records_by_support_state "
                    "Current normalized policy record counts by support state."
                ),
                "# TYPE platform_app_api_policy_records_by_support_state gauge",
                *[
                    (
                        "platform_app_api_policy_records_by_support_state"
                        f'{{state="{state}"}} {count}'
                    )
                    for state, count in sorted(
                        {
                            "supported": 0,
                            "partially_supported": 0,
                            "unsupported": 0,
                            "unknown": 0,
                            "not_implemented_in_platform": 0,
                            **dict(policy_metrics.get("support_state_counts", {})),
                        }.items()
                    )
                ],
                (
                    "# HELP platform_app_api_policy_records_by_type "
                    "Current normalized policy record counts by policy type."
                ),
                "# TYPE platform_app_api_policy_records_by_type gauge",
                *[
                    (
                        "platform_app_api_policy_records_by_type"
                        f'{{type="{policy_type}"}} {count}'
                    )
                    for policy_type, count in sorted(
                        {
                            "static_local": 0,
                            "static_non_local": 0,
                            "unknown": 0,
                            **dict(policy_metrics.get("policy_type_counts", {})),
                        }.items()
                    )
                ],
            ]
        )

    if history_metrics is not None:
        history_families = {"inventory", "topology", "policy"}
        history_results = {"completed", "partial", "failed", "unknown"}
        counts_by_model_family = dict(history_metrics.get("counts_by_model_family", {}))
        counts_by_result = dict(history_metrics.get("counts_by_result", {}))
        counts_by_model_family_and_result = dict(
            history_metrics.get("counts_by_model_family_and_result", {})
        )
        latest_finished_at_by_model_family = dict(
            history_metrics.get("latest_finished_at_by_model_family", {})
        )
        lines.extend(
            [
                "# HELP platform_app_api_sync_runs_total Recent persisted sync-run count.",
                "# TYPE platform_app_api_sync_runs_total gauge",
                f"platform_app_api_sync_runs_total {history_metrics['total_count']}",
                (
                    "# HELP platform_app_api_sync_runs_by_family "
                    "Recent persisted sync-run counts by model family."
                ),
                "# TYPE platform_app_api_sync_runs_by_family gauge",
                *[
                    (
                        "platform_app_api_sync_runs_by_family"
                        f'{{model_family="{model_family}"}} '
                        f"{counts_by_model_family.get(model_family, 0)}"
                    )
                    for model_family in sorted(history_families)
                ],
                (
                    "# HELP platform_app_api_sync_runs_by_result "
                    "Recent persisted sync-run counts by result."
                ),
                "# TYPE platform_app_api_sync_runs_by_result gauge",
                *[
                    (
                        "platform_app_api_sync_runs_by_result"
                        f'{{result="{result}"}} {counts_by_result.get(result, 0)}'
                    )
                    for result in sorted(history_results)
                ],
                (
                    "# HELP platform_app_api_sync_runs_by_family_and_result "
                    "Recent persisted sync-run counts by model family and result."
                ),
                "# TYPE platform_app_api_sync_runs_by_family_and_result gauge",
                *[
                    (
                        "platform_app_api_sync_runs_by_family_and_result"
                        f'{{model_family="{model_family}",result="{result}"}} '
                        f"{dict(counts_by_model_family_and_result.get(model_family, {})).get(result, 0)}"
                    )
                    for model_family in sorted(history_families)
                    for result in sorted(history_results)
                ],
                (
                    "# HELP platform_app_api_sync_run_latest_finished_at_seconds "
                    "Unix timestamp of the latest persisted sync-run finish time by model family."
                ),
                "# TYPE platform_app_api_sync_run_latest_finished_at_seconds gauge",
                *[
                    (
                        "platform_app_api_sync_run_latest_finished_at_seconds"
                        f'{{model_family="{model_family}"}} {finished_at.timestamp():.3f}'
                    )
                    for model_family, finished_at in sorted(
                        latest_finished_at_by_model_family.items()
                    )
                ],
            ]
        )

    lines.append("")
    return "\n".join(lines)


def reset_metrics_registry() -> None:
    """Reset in-memory metrics for tests."""
    global _cached_topology_metrics, _cached_policy_metrics
    with _lock:
        _request_counts.clear()
        _request_duration_counts.clear()
        _request_duration_sums.clear()
        _cached_topology_metrics = CachedTopologyMetrics()
        _cached_policy_metrics = CachedPolicyMetrics()

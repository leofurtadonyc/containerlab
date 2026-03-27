"""In-memory metrics state for the backend service."""

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from threading import Lock


_lock = Lock()
_request_counts: Counter[tuple[str, str, str]] = Counter()
_preview_decision_counts: Counter[tuple[str, str, str]] = Counter()
_preview_generation_seconds_sum: float = 0.0
_preview_generation_count: int = 0
_validation_outcome_counts: Counter[tuple[str, str, str, str, str]] = Counter()
_validation_generation_seconds_sum: float = 0.0
_validation_generation_count: int = 0
_request_duration_counts: Counter[tuple[str, str]] = Counter()
_request_duration_sums: dict[tuple[str, str], float] = defaultdict(float)


@dataclass(frozen=True)
class CachedCollectorBoundaryFetchMetrics:
    """Latest collector-boundary fetch posture for one read-path family."""

    latest_duration_seconds: float = 0.0
    timeout_budget_seconds: int = 0
    outcome: str = "not_observed"


@dataclass(frozen=True)
class CachedTopologyMetrics:
    """Latest topology snapshot metrics cached for scrape-safe exposition."""

    node_count: int = 0
    link_count: int = 0
    inference_posture: str = "unknown"
    endpoint_pairing_posture: str = "unknown"
    collection_posture: str = "unknown"
    node_participation_posture: str = "unknown"
    paired_link_count: int = 0
    single_sided_link_count: int = 0
    linked_node_count: int = 0
    isolated_node_count: int = 0
    data_status: str = "unknown"
    serving_mode: str = "unknown"
    sync_status: str = "unknown"
    completeness: str = "unknown"
    source_posture: str = "unknown"
    evidence_kind: str = "unknown"
    confidence_posture: str = "unknown"
    freshness_posture: str = "unknown"
    blocked_reason: str = "unknown"
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
    serving_mode: str = "unknown"
    sync_status: str = "unknown"
    completeness: str = "unknown"
    detail_mode: str = "unknown"
    detail_source_posture: str = "unknown"
    detail_source_no_policies_observed_target_count: int = 0
    detail_source_unavailable_target_count: int = 0
    detail_source_partial_target_count: int = 0
    empty_reason: str = "unknown"
    source_posture: str = "unknown"
    evidence_kind: str = "unknown"
    confidence_posture: str = "unknown"
    freshness_posture: str = "unknown"
    blocked_reason: str = "unknown"


@dataclass(frozen=True)
class CachedReadinessMetrics:
    """Latest bounded readiness-support metrics for scrape-safe exposition."""

    status: str = "unknown"
    planning_readiness: str = "unknown"
    phase_recommendation: str = "unknown"
    evaluation_at_seconds: float | None = None
    persisted_at_seconds: float | None = None
    evidence_coverage_counts: dict[str, int] = field(default_factory=dict)
    support_posture_counts: dict[str, int] = field(default_factory=dict)
    assessment_area_status_counts: dict[tuple[str, str], int] = field(default_factory=dict)
    blocker_counts_by_category_and_severity: dict[tuple[str, str], int] = field(
        default_factory=dict
    )
    blocked_scope_counts: dict[str, int] = field(default_factory=dict)


@dataclass(frozen=True)
class CachedRecoveryMetrics:
    """Latest bounded same-workspace recovery posture for scrape-safe exposition."""

    baseline_posture: str = "unknown"
    read_side_posture: str = "unknown"
    persisted_artifact_availability: dict[str, int] = field(default_factory=dict)


_cached_topology_metrics = CachedTopologyMetrics()
_cached_policy_metrics = CachedPolicyMetrics()
_cached_readiness_metrics = CachedReadinessMetrics()
_cached_recovery_metrics = CachedRecoveryMetrics()
_cached_collector_boundary_fetch_metrics: dict[str, CachedCollectorBoundaryFetchMetrics] = {
    "inventory": CachedCollectorBoundaryFetchMetrics(),
    "topology": CachedCollectorBoundaryFetchMetrics(),
    "policy": CachedCollectorBoundaryFetchMetrics(),
}


def record_preview_outcome(
    *,
    preview_type: str,
    decision: str,
    preview_status: str,
    duration_seconds: float,
) -> None:
    """Record one completed preview evaluation (Phase 2 preview engine)."""
    with _lock:
        _preview_decision_counts[(preview_type, decision, preview_status)] += 1
        _preview_generation_seconds_sum += max(0.0, duration_seconds)
        _preview_generation_count += 1


def record_validation_outcome(
    *,
    validation_type: str,
    validation_context: str,
    capability_decision_state: str,
    validation_status: str,
    overall_verdict: str | None,
    duration_seconds: float,
) -> None:
    """Record one completed validation evaluation (Phase 2 validation engine v1)."""
    verdict_label = overall_verdict if overall_verdict else "none"
    with _lock:
        _validation_outcome_counts[
            (
                validation_type,
                validation_context,
                capability_decision_state,
                validation_status,
                verdict_label,
            )
        ] += 1
        _validation_generation_seconds_sum += max(0.0, duration_seconds)
        _validation_generation_count += 1


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


def resolve_collector_boundary_fetch_outcome(
    *,
    status: str,
    fetch_error_kind: str | None,
) -> str:
    """Return one bounded collector-boundary outcome label."""
    if fetch_error_kind:
        return fetch_error_kind
    return status


def observe_collector_boundary_fetch(
    *,
    model_family: str,
    duration_seconds: float | None,
    timeout_budget_seconds: int,
    outcome: str,
) -> None:
    """Store the latest bounded collector-boundary fetch posture for scrape exposition."""
    global _cached_collector_boundary_fetch_metrics
    with _lock:
        _cached_collector_boundary_fetch_metrics = {
            **_cached_collector_boundary_fetch_metrics,
            model_family: CachedCollectorBoundaryFetchMetrics(
                latest_duration_seconds=max(0.0, duration_seconds or 0.0),
                timeout_budget_seconds=max(0, timeout_budget_seconds),
                outcome=outcome,
            ),
        }


def cache_topology_metrics(
    *,
    node_count: int,
    link_count: int,
    inference_posture: str,
    endpoint_pairing_posture: str,
    collection_posture: str,
    node_participation_posture: str,
    paired_link_count: int,
    single_sided_link_count: int,
    linked_node_count: int,
    isolated_node_count: int,
    data_status: str,
    serving_mode: str,
    sync_status: str,
    completeness: str,
    source_posture: str,
    evidence_kind: str,
    confidence_posture: str,
    freshness_posture: str,
    blocked_reason: str,
    node_state_counts: dict[str, int],
    link_state_counts: dict[str, int],
) -> None:
    """Store the latest topology metrics for bounded scrape exposition."""
    global _cached_topology_metrics
    with _lock:
        _cached_topology_metrics = CachedTopologyMetrics(
            node_count=node_count,
            link_count=link_count,
            inference_posture=inference_posture,
            endpoint_pairing_posture=endpoint_pairing_posture,
            collection_posture=collection_posture,
            node_participation_posture=node_participation_posture,
            paired_link_count=paired_link_count,
            single_sided_link_count=single_sided_link_count,
            linked_node_count=linked_node_count,
            isolated_node_count=isolated_node_count,
            data_status=data_status,
            serving_mode=serving_mode,
            sync_status=sync_status,
            completeness=completeness,
            source_posture=source_posture,
            evidence_kind=evidence_kind,
            confidence_posture=confidence_posture,
            freshness_posture=freshness_posture,
            blocked_reason=blocked_reason,
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
    serving_mode: str,
    sync_status: str,
    completeness: str,
    detail_mode: str,
    detail_source_posture: str,
    detail_source_no_policies_observed_target_count: int,
    detail_source_unavailable_target_count: int,
    detail_source_partial_target_count: int,
    empty_reason: str,
    source_posture: str,
    evidence_kind: str,
    confidence_posture: str,
    freshness_posture: str,
    blocked_reason: str,
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
            serving_mode=serving_mode,
            sync_status=sync_status,
            completeness=completeness,
            detail_mode=detail_mode,
            detail_source_posture=detail_source_posture,
            detail_source_no_policies_observed_target_count=(
                detail_source_no_policies_observed_target_count
            ),
            detail_source_unavailable_target_count=detail_source_unavailable_target_count,
            detail_source_partial_target_count=detail_source_partial_target_count,
            empty_reason=empty_reason,
            source_posture=source_posture,
            evidence_kind=evidence_kind,
            confidence_posture=confidence_posture,
            freshness_posture=freshness_posture,
            blocked_reason=blocked_reason,
        )


def get_cached_policy_metrics() -> CachedPolicyMetrics:
    """Return the latest cached policy metrics."""
    with _lock:
        return _cached_policy_metrics


def cache_readiness_metrics(
    *,
    status: str,
    planning_readiness: str,
    phase_recommendation: str,
    evaluation_at_seconds: float | None,
    persisted_at_seconds: float | None,
    evidence_coverage_counts: dict[str, int],
    support_posture_counts: dict[str, int],
    assessment_area_status_counts: dict[tuple[str, str], int],
    blocker_counts_by_category_and_severity: dict[tuple[str, str], int],
    blocked_scope_counts: dict[str, int],
) -> None:
    """Store the latest readiness-support metrics for bounded scrape exposition."""
    global _cached_readiness_metrics
    with _lock:
        _cached_readiness_metrics = CachedReadinessMetrics(
            status=status,
            planning_readiness=planning_readiness,
            phase_recommendation=phase_recommendation,
            evaluation_at_seconds=evaluation_at_seconds,
            persisted_at_seconds=persisted_at_seconds,
            evidence_coverage_counts=dict(evidence_coverage_counts),
            support_posture_counts=dict(support_posture_counts),
            assessment_area_status_counts=dict(assessment_area_status_counts),
            blocker_counts_by_category_and_severity=dict(
                blocker_counts_by_category_and_severity
            ),
            blocked_scope_counts=dict(blocked_scope_counts),
        )


def get_cached_readiness_metrics() -> CachedReadinessMetrics:
    """Return the latest cached readiness-support metrics."""
    with _lock:
        return _cached_readiness_metrics


def cache_recovery_metrics(
    *,
    baseline_posture: str,
    read_side_posture: str,
    persisted_artifact_availability: dict[str, int],
) -> None:
    """Store the latest bounded same-workspace recovery posture for metrics."""
    global _cached_recovery_metrics
    with _lock:
        _cached_recovery_metrics = CachedRecoveryMetrics(
            baseline_posture=baseline_posture,
            read_side_posture=read_side_posture,
            persisted_artifact_availability=dict(persisted_artifact_availability),
        )


def get_cached_recovery_metrics() -> CachedRecoveryMetrics:
    """Return the latest cached same-workspace recovery posture metrics."""
    with _lock:
        return _cached_recovery_metrics


def render_prometheus_metrics(
    app_version: str,
    *,
    topology_metrics: dict[str, object] | None = None,
    policy_metrics: dict[str, object] | None = None,
    readiness_metrics: dict[str, object] | None = None,
    recovery_metrics: dict[str, object] | None = None,
    history_metrics: dict[str, object] | None = None,
    inventory_snapshot_metrics: dict[str, object] | None = None,
    policy_snapshot_metrics: dict[str, object] | None = None,
) -> str:
    """Render backend metrics in Prometheus text format."""
    with _lock:
        request_counts = dict(_request_counts)
        duration_counts = dict(_request_duration_counts)
        duration_sums = dict(_request_duration_sums)
        collector_boundary_fetch_metrics = dict(_cached_collector_boundary_fetch_metrics)

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

    lines.extend(
        [
            (
                "# HELP platform_app_api_collector_boundary_latest_fetch_duration_seconds "
                "Latest observed collector-boundary fetch duration in seconds by model family."
            ),
            "# TYPE platform_app_api_collector_boundary_latest_fetch_duration_seconds gauge",
            *[
                (
                    "platform_app_api_collector_boundary_latest_fetch_duration_seconds"
                    f'{{model_family="{model_family}",outcome="{metrics.outcome}"}} '
                    f"{metrics.latest_duration_seconds:.9f}"
                )
                for model_family, metrics in sorted(collector_boundary_fetch_metrics.items())
            ],
            (
                "# HELP platform_app_api_collector_boundary_timeout_budget_seconds "
                "Configured collector-boundary timeout budget in seconds by model family."
            ),
            "# TYPE platform_app_api_collector_boundary_timeout_budget_seconds gauge",
            *[
                (
                    "platform_app_api_collector_boundary_timeout_budget_seconds"
                    f'{{model_family="{model_family}"}} {metrics.timeout_budget_seconds}'
                )
                for model_family, metrics in sorted(collector_boundary_fetch_metrics.items())
            ],
            (
                "# HELP platform_app_api_collector_boundary_latest_fetch_posture "
                "Latest observed collector-boundary fetch outcome by model family."
            ),
            "# TYPE platform_app_api_collector_boundary_latest_fetch_posture gauge",
            *[
                (
                    "platform_app_api_collector_boundary_latest_fetch_posture"
                    f'{{model_family="{model_family}",outcome="{metrics.outcome}"}} 1'
                )
                for model_family, metrics in sorted(collector_boundary_fetch_metrics.items())
            ],
        ]
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
                    "# HELP platform_app_api_topology_paired_links "
                    "Current backend-owned count of topology links with paired endpoint evidence."
                ),
                "# TYPE platform_app_api_topology_paired_links gauge",
                (
                    "platform_app_api_topology_paired_links "
                    f"{topology_metrics['paired_link_count']}"
                ),
                (
                    "# HELP platform_app_api_topology_single_sided_links "
                    "Current backend-owned count of topology links with single-sided endpoint evidence."
                ),
                "# TYPE platform_app_api_topology_single_sided_links gauge",
                (
                    "platform_app_api_topology_single_sided_links "
                    f"{topology_metrics['single_sided_link_count']}"
                ),
                (
                    "# HELP platform_app_api_topology_linked_nodes "
                    "Current backend-owned count of observed topology nodes represented by at least one emitted inferred link."
                ),
                "# TYPE platform_app_api_topology_linked_nodes gauge",
                (
                    "platform_app_api_topology_linked_nodes "
                    f"{topology_metrics['linked_node_count']}"
                ),
                (
                    "# HELP platform_app_api_topology_isolated_nodes "
                    "Current backend-owned count of observed topology nodes not represented by emitted inferred links."
                ),
                "# TYPE platform_app_api_topology_isolated_nodes gauge",
                (
                    "platform_app_api_topology_isolated_nodes "
                    f"{topology_metrics['isolated_node_count']}"
                ),
                (
                    "# HELP platform_app_api_topology_coverage_posture "
                    "Current backend-owned topology endpoint-pairing posture."
                ),
                "# TYPE platform_app_api_topology_coverage_posture gauge",
                (
                    "platform_app_api_topology_coverage_posture"
                    f'{{inference_posture="{topology_metrics["inference_posture"]}",'
                    f'endpoint_pairing_posture="{topology_metrics["endpoint_pairing_posture"]}",'
                    f'collection_posture="{topology_metrics["collection_posture"]}",'
                    f'node_participation_posture="{topology_metrics["node_participation_posture"]}"}} 1'
                ),
                (
                    "# HELP platform_app_api_topology_snapshot_status "
                    "Current topology snapshot status exposed by the backend."
                ),
                "# TYPE platform_app_api_topology_snapshot_status gauge",
                (
                    "platform_app_api_topology_snapshot_status"
                    f'{{data_status="{topology_metrics["data_status"]}",'
                    f'serving_mode="{topology_metrics["serving_mode"]}",'
                    f'sync_status="{topology_metrics["sync_status"]}",'
                    f'completeness="{topology_metrics["completeness"]}"}} 1'
                ),
                (
                    "# HELP platform_app_api_topology_evidence_posture "
                    "Current topology evidence posture exposed by the backend."
                ),
                "# TYPE platform_app_api_topology_evidence_posture gauge",
                (
                    "platform_app_api_topology_evidence_posture"
                    f'{{source_posture="{topology_metrics["source_posture"]}",'
                    f'evidence_kind="{topology_metrics["evidence_kind"]}",'
                    f'confidence_posture="{topology_metrics["confidence_posture"]}",'
                    f'freshness_posture="{topology_metrics["freshness_posture"]}",'
                    f'blocked_reason="{topology_metrics["blocked_reason"]}"}} 1'
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
                    f'serving_mode="{policy_metrics["serving_mode"]}",'
                    f'sync_status="{policy_metrics["sync_status"]}",'
                    f'completeness="{policy_metrics["completeness"]}",'
                    f'detail_mode="{policy_metrics["detail_mode"]}",'
                    f'empty_reason="{policy_metrics["empty_reason"]}"}} 1'
                ),
                (
                    "# HELP platform_app_api_policy_detail_source_readiness "
                    "Current bounded backend-owned policy detail source-readiness posture."
                ),
                "# TYPE platform_app_api_policy_detail_source_readiness gauge",
                (
                    "platform_app_api_policy_detail_source_readiness"
                    f'{{posture="{policy_metrics["detail_source_posture"]}"}} 1'
                ),
                (
                    "# HELP platform_app_api_policy_detail_source_targets "
                    "Current backend-owned counts of source-visible policy targets by detail-source reason."
                ),
                "# TYPE platform_app_api_policy_detail_source_targets gauge",
                (
                    "platform_app_api_policy_detail_source_targets"
                    f'{{reason="no_policies_observed"}} {policy_metrics["detail_source_no_policies_observed_target_count"]}'
                ),
                (
                    "platform_app_api_policy_detail_source_targets"
                    f'{{reason="detail_unavailable"}} {policy_metrics["detail_source_unavailable_target_count"]}'
                ),
                (
                    "platform_app_api_policy_detail_source_targets"
                    f'{{reason="partial_detail"}} {policy_metrics["detail_source_partial_target_count"]}'
                ),
                (
                    "# HELP platform_app_api_policy_evidence_posture "
                    "Current policy evidence posture exposed by the backend."
                ),
                "# TYPE platform_app_api_policy_evidence_posture gauge",
                (
                    "platform_app_api_policy_evidence_posture"
                    f'{{source_posture="{policy_metrics["source_posture"]}",'
                    f'evidence_kind="{policy_metrics["evidence_kind"]}",'
                    f'confidence_posture="{policy_metrics["confidence_posture"]}",'
                    f'freshness_posture="{policy_metrics["freshness_posture"]}",'
                    f'blocked_reason="{policy_metrics["blocked_reason"]}"}} 1'
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

    if readiness_metrics is not None:
        lines.extend(
            [
                (
                    "# HELP platform_app_api_readiness_status "
                    "Current bounded readiness-support status exposed by the backend."
                ),
                "# TYPE platform_app_api_readiness_status gauge",
                (
                    "platform_app_api_readiness_status"
                    f'{{status="{readiness_metrics["status"]}",'
                    f'planning_readiness="{readiness_metrics["planning_readiness"]}",'
                    f'phase_recommendation="{readiness_metrics["phase_recommendation"]}"}} 1'
                ),
                (
                    "# HELP platform_app_api_readiness_latest_evaluation_at_seconds "
                    "Unix timestamp of the latest bounded readiness evaluation generated by the backend."
                ),
                "# TYPE platform_app_api_readiness_latest_evaluation_at_seconds gauge",
                (
                    "platform_app_api_readiness_latest_evaluation_at_seconds "
                    + (
                        f"{readiness_metrics['evaluation_at_seconds']:.3f}"
                        if readiness_metrics["evaluation_at_seconds"] is not None
                        else "0"
                    )
                ),
                (
                    "# HELP platform_app_api_readiness_snapshot_persisted_at_seconds "
                    "Unix timestamp of the latest persisted readiness-support snapshot when available."
                ),
                "# TYPE platform_app_api_readiness_snapshot_persisted_at_seconds gauge",
                (
                    "platform_app_api_readiness_snapshot_persisted_at_seconds "
                    + (
                        f"{readiness_metrics['persisted_at_seconds']:.3f}"
                        if readiness_metrics["persisted_at_seconds"] is not None
                        else "0"
                    )
                ),
                (
                    "# HELP platform_app_api_readiness_prerequisites_by_evidence_coverage "
                    "Readiness prerequisite counts by evidence coverage posture."
                ),
                "# TYPE platform_app_api_readiness_prerequisites_by_evidence_coverage gauge",
                *[
                    (
                        "platform_app_api_readiness_prerequisites_by_evidence_coverage"
                        f'{{coverage="{coverage}"}} {count}'
                    )
                    for coverage, count in sorted(
                        {
                            "strong": 0,
                            "bounded": 0,
                            "partial": 0,
                            "blocked": 0,
                            **dict(readiness_metrics.get("evidence_coverage_counts", {})),
                        }.items()
                    )
                ],
                (
                    "# HELP platform_app_api_readiness_prerequisites_by_support_posture "
                    "Readiness prerequisite counts by support posture."
                ),
                "# TYPE platform_app_api_readiness_prerequisites_by_support_posture gauge",
                *[
                    (
                        "platform_app_api_readiness_prerequisites_by_support_posture"
                        f'{{support_posture="{support_posture}"}} {count}'
                    )
                    for support_posture, count in sorted(
                        {
                            "supported": 0,
                            "partially_supported": 0,
                            "unsupported": 0,
                            "unknown": 0,
                            "not_implemented_in_platform": 0,
                            **dict(readiness_metrics.get("support_posture_counts", {})),
                        }.items()
                    )
                ],
                (
                    "# HELP platform_app_api_readiness_assessment_areas_by_status "
                    "Readiness assessment area counts by area and status."
                ),
                "# TYPE platform_app_api_readiness_assessment_areas_by_status gauge",
                *[
                    (
                        "platform_app_api_readiness_assessment_areas_by_status"
                        f'{{area="{area}",status="{status}"}} {count}'
                    )
                    for (area, status), count in sorted(
                        dict(readiness_metrics.get("assessment_area_status_counts", {})).items()
                    )
                ],
                (
                    "# HELP platform_app_api_readiness_blockers_by_category_and_severity "
                    "Readiness blocker counts by blocker category and severity."
                ),
                "# TYPE platform_app_api_readiness_blockers_by_category_and_severity gauge",
                *[
                    (
                        "platform_app_api_readiness_blockers_by_category_and_severity"
                        f'{{category="{category}",severity="{severity}"}} {count}'
                    )
                    for (category, severity), count in sorted(
                        dict(
                            readiness_metrics.get(
                                "blocker_counts_by_category_and_severity", {}
                            )
                        ).items()
                    )
                ],
                (
                    "# HELP platform_app_api_readiness_blocked_scopes "
                    "Readiness blocker counts by blocked readiness scope."
                ),
                "# TYPE platform_app_api_readiness_blocked_scopes gauge",
                *[
                    (
                        "platform_app_api_readiness_blocked_scopes"
                        f'{{scope="{scope}"}} {count}'
                    )
                    for scope, count in sorted(
                        {
                            "planning_depth": 0,
                            "preview_contracts": 0,
                            "validation_contracts": 0,
                            "workflow_audit_relationships": 0,
                            "phase_transition": 0,
                            **dict(readiness_metrics.get("blocked_scope_counts", {})),
                        }.items()
                    )
                ],
            ]
        )

    if recovery_metrics is not None:
        artifact_availability = {
            "inventory_snapshot": 0,
            "topology_snapshot": 0,
            "policy_snapshot": 0,
            "sync_history": 0,
            "readiness_snapshot": 0,
            **dict(recovery_metrics.get("persisted_artifact_availability", {})),
        }
        lines.extend(
            [
                (
                    "# HELP platform_app_api_recovery_posture "
                    "Current bounded same-workspace recovery posture exposed by the backend."
                ),
                "# TYPE platform_app_api_recovery_posture gauge",
                (
                    "platform_app_api_recovery_posture"
                    f'{{baseline_posture="{recovery_metrics["baseline_posture"]}",'
                    f'read_side_posture="{recovery_metrics["read_side_posture"]}"}} 1'
                ),
                (
                    "# HELP platform_app_api_recovery_persisted_artifacts "
                    "Current bounded persisted artifact availability by artifact family."
                ),
                "# TYPE platform_app_api_recovery_persisted_artifacts gauge",
                *[
                    (
                        "platform_app_api_recovery_persisted_artifacts"
                        f'{{artifact="{artifact_name}"}} {artifact_value}'
                    )
                    for artifact_name, artifact_value in sorted(artifact_availability.items())
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

    if inventory_snapshot_metrics is not None:
        persisted_rows = int(inventory_snapshot_metrics.get("persisted_row_count", 0))
        latest_seconds = float(inventory_snapshot_metrics.get("latest_persisted_at_seconds", 0.0))
        lines.extend(
            [
                (
                    "# HELP platform_app_api_inventory_snapshots_persisted_total "
                    "Count of rows in the inventory_snapshots table (bounded history depth)."
                ),
                "# TYPE platform_app_api_inventory_snapshots_persisted_total gauge",
                f"platform_app_api_inventory_snapshots_persisted_total {persisted_rows}",
                (
                    "# HELP platform_app_api_inventory_snapshot_latest_persisted_at_seconds "
                    "Unix timestamp of the latest inventory_snapshots.persisted_at value, "
                    "or zero when the table is empty."
                ),
                "# TYPE platform_app_api_inventory_snapshot_latest_persisted_at_seconds gauge",
                f"platform_app_api_inventory_snapshot_latest_persisted_at_seconds {latest_seconds:.3f}",
            ]
        )

    if policy_snapshot_metrics is not None:
        persisted_rows = int(policy_snapshot_metrics.get("persisted_row_count", 0))
        latest_seconds = float(policy_snapshot_metrics.get("latest_persisted_at_seconds", 0.0))
        lines.extend(
            [
                (
                    "# HELP platform_app_api_policy_snapshots_persisted_total "
                    "Count of rows in the policy_snapshots table (bounded history depth)."
                ),
                "# TYPE platform_app_api_policy_snapshots_persisted_total gauge",
                f"platform_app_api_policy_snapshots_persisted_total {persisted_rows}",
                (
                    "# HELP platform_app_api_policy_snapshot_latest_persisted_at_seconds "
                    "Unix timestamp of the latest policy_snapshots.persisted_at value, "
                    "or zero when the table is empty."
                ),
                "# TYPE platform_app_api_policy_snapshot_latest_persisted_at_seconds gauge",
                f"platform_app_api_policy_snapshot_latest_persisted_at_seconds {latest_seconds:.3f}",
            ]
        )

    with _lock:
        preview_counts = dict(_preview_decision_counts)
        preview_sec_sum = _preview_generation_seconds_sum
        preview_sec_n = _preview_generation_count
    lines.extend(
        [
            (
                "# HELP platform_app_api_preview_requests_total "
                "Completed preview evaluations by type, decision, and status."
            ),
            "# TYPE platform_app_api_preview_requests_total counter",
            *[
                (
                    "platform_app_api_preview_requests_total"
                    f'{{preview_type="{pt}",decision="{dec}",status="{st}"}} {cnt}'
                )
                for (pt, dec, st), cnt in sorted(preview_counts.items())
            ],
            (
                "# HELP platform_app_api_preview_generation_seconds_sum "
                "Sum of preview evaluation wall time in seconds."
            ),
            "# TYPE platform_app_api_preview_generation_seconds_sum counter",
            f"platform_app_api_preview_generation_seconds_sum {preview_sec_sum:.9f}",
            (
                "# HELP platform_app_api_preview_generation_seconds_count "
                "Count of preview evaluation duration observations."
            ),
            "# TYPE platform_app_api_preview_generation_seconds_count counter",
            f"platform_app_api_preview_generation_seconds_count {preview_sec_n}",
        ]
    )

    with _lock:
        validation_counts = dict(_validation_outcome_counts)
        validation_sec_sum = _validation_generation_seconds_sum
        validation_sec_n = _validation_generation_count
    lines.extend(
        [
            (
                "# HELP platform_app_api_validation_requests_total "
                "Completed validation evaluations by type, context, capability decision, "
                "status, and overall verdict label."
            ),
            "# TYPE platform_app_api_validation_requests_total counter",
            *[
                (
                    "platform_app_api_validation_requests_total"
                    f'{{validation_type="{vt}",validation_context="{vc}",'
                    f'capability_decision="{cd}",validation_status="{vs}",overall_verdict="{ov}"}} '
                    f"{cnt}"
                )
                for (vt, vc, cd, vs, ov), cnt in sorted(validation_counts.items())
            ],
            (
                "# HELP platform_app_api_validation_generation_seconds_sum "
                "Sum of validation evaluation wall time in seconds."
            ),
            "# TYPE platform_app_api_validation_generation_seconds_sum counter",
            f"platform_app_api_validation_generation_seconds_sum {validation_sec_sum:.9f}",
            (
                "# HELP platform_app_api_validation_generation_seconds_count "
                "Count of validation evaluation duration observations."
            ),
            "# TYPE platform_app_api_validation_generation_seconds_count counter",
            f"platform_app_api_validation_generation_seconds_count {validation_sec_n}",
        ]
    )

    lines.append("")
    return "\n".join(lines)


def reset_metrics_registry() -> None:
    """Reset in-memory metrics for tests."""
    global _cached_topology_metrics, _cached_policy_metrics, _cached_readiness_metrics
    global _cached_recovery_metrics
    global _cached_collector_boundary_fetch_metrics
    global _preview_generation_seconds_sum, _preview_generation_count
    global _validation_generation_seconds_sum, _validation_generation_count
    with _lock:
        _request_counts.clear()
        _request_duration_counts.clear()
        _request_duration_sums.clear()
        _preview_decision_counts.clear()
        _preview_generation_seconds_sum = 0.0
        _preview_generation_count = 0
        _validation_outcome_counts.clear()
        _validation_generation_seconds_sum = 0.0
        _validation_generation_count = 0
        _cached_topology_metrics = CachedTopologyMetrics()
        _cached_policy_metrics = CachedPolicyMetrics()
        _cached_readiness_metrics = CachedReadinessMetrics()
        _cached_recovery_metrics = CachedRecoveryMetrics()
        _cached_collector_boundary_fetch_metrics = {
            "inventory": CachedCollectorBoundaryFetchMetrics(),
            "topology": CachedCollectorBoundaryFetchMetrics(),
            "policy": CachedCollectorBoundaryFetchMetrics(),
        }

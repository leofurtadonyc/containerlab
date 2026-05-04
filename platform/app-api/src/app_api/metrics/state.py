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
_safe_action_counts: Counter[tuple[str, str, str, str]] = Counter()
_safe_action_execution_seconds_sum: float = 0.0
_safe_action_execution_count: int = 0
_rollback_counts: Counter[tuple[str, str, str, str]] = Counter()
_rollback_execution_seconds_sum: float = 0.0
_rollback_execution_count: int = 0
_topology_truth_merges_total: int = 0
_topology_truth_controller_status_counts: Counter[str] = Counter()
_topology_truth_seconds_sum: float = 0.0
_controller_evidence_fetches_total: int = 0
_controller_evidence_seconds_sum: float = 0.0
_controller_evidence_reachability_counts: Counter[str] = Counter()
_controller_evidence_lane_posture_counts: Counter[tuple[str, str]] = Counter()
_controller_evidence_lane_session_posture_counts: Counter[tuple[str, str]] = Counter()
_controller_evidence_lane_evidence_strength_counts: Counter[tuple[str, str]] = Counter()
_controller_evidence_lane_session_backed_counts: Counter[tuple[str, str]] = Counter()
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
    lldp_observation_count: int = 0
    lldp_correlated_link_count: int = 0
    lldp_single_sided_link_count: int = 0
    lldp_bidirectional_link_count: int = 0
    lldp_mismatch_link_count: int = 0
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


@dataclass(frozen=True)
class CachedTopologyTruthMetrics:
    """Latest deeper topology truth merge observation (scrape-safe)."""

    controller_status: str = "unknown"
    merged_node_count: int = 0
    merged_link_count: int = 0
    inferred_only_links: int = 0
    physical_confirmed_links: int = 0
    igp_confirmed_links: int = 0
    ospf_observed_links: int = 0
    isis_observed_links: int = 0
    multi_source_confirmed_links: int = 0
    lldp_single_sided_links: int = 0
    lldp_bidirectional_links: int = 0
    lldp_mismatch_links: int = 0
    igp_protocol_mismatch_links: int = 0
    conflicts: int = 0


@dataclass(frozen=True)
class CachedControllerEvidenceMetrics:
    """Latest controller southbound session truth fetch v2 (scrape-safe)."""

    controller_reachability: str = "unknown"
    bgp_ls_lane_posture: str = "unknown"
    bgp_ls_session_posture: str = "unknown"
    bgp_ls_evidence_strength: str = "unknown"
    pcep_lane_posture: str = "unknown"
    pcep_session_posture: str = "unknown"
    pcep_evidence_strength: str = "unknown"
    netconf_lane_posture: str = "unknown"
    netconf_session_posture: str = "unknown"
    netconf_evidence_strength: str = "unknown"


_cached_topology_metrics = CachedTopologyMetrics()
_cached_policy_metrics = CachedPolicyMetrics()
_cached_readiness_metrics = CachedReadinessMetrics()
_cached_recovery_metrics = CachedRecoveryMetrics()
_cached_topology_truth_metrics = CachedTopologyTruthMetrics()
_cached_controller_evidence_metrics = CachedControllerEvidenceMetrics()
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
    global _preview_generation_seconds_sum, _preview_generation_count
    with _lock:
        _preview_decision_counts[(preview_type, decision, preview_status)] += 1
        _preview_generation_seconds_sum += max(0.0, duration_seconds)
        _preview_generation_count += 1


def record_safe_action_outcome(
    *,
    action_type: str,
    action_decision: str,
    execution_status: str,
    event: str,
    duration_seconds: float,
) -> None:
    """Record one safe-action lifecycle observation (v1 bounded slice)."""
    global _safe_action_execution_seconds_sum, _safe_action_execution_count
    with _lock:
        _safe_action_counts[(action_type, action_decision, execution_status, event)] += 1
        if event.startswith("execute"):
            _safe_action_execution_seconds_sum += max(0.0, duration_seconds)
            _safe_action_execution_count += 1


def record_controller_evidence_v2_observation(
    *,
    controller_reachability: str,
    bgp_ls_lane_posture: str,
    bgp_ls_session_posture: str,
    bgp_ls_evidence_strength: str,
    pcep_lane_posture: str,
    pcep_session_posture: str,
    pcep_evidence_strength: str,
    netconf_lane_posture: str,
    netconf_session_posture: str,
    netconf_evidence_strength: str,
    duration_seconds: float,
) -> None:
    """Record one controller southbound session truth v2 aggregate fetch."""
    global _cached_controller_evidence_metrics
    with _lock:
        global _controller_evidence_fetches_total, _controller_evidence_seconds_sum
        global _controller_evidence_reachability_counts
        global _controller_evidence_lane_posture_counts
        global _controller_evidence_lane_session_posture_counts
        global _controller_evidence_lane_evidence_strength_counts
        global _controller_evidence_lane_session_backed_counts
        _controller_evidence_fetches_total += 1
        _controller_evidence_seconds_sum += max(0.0, duration_seconds)
        _controller_evidence_reachability_counts[controller_reachability] += 1
        _controller_evidence_lane_posture_counts[("bgp_ls", bgp_ls_lane_posture)] += 1
        _controller_evidence_lane_posture_counts[("pcep", pcep_lane_posture)] += 1
        _controller_evidence_lane_posture_counts[("netconf", netconf_lane_posture)] += 1
        _controller_evidence_lane_session_posture_counts[("bgp_ls", bgp_ls_session_posture)] += 1
        _controller_evidence_lane_session_posture_counts[("pcep", pcep_session_posture)] += 1
        _controller_evidence_lane_session_posture_counts[("netconf", netconf_session_posture)] += 1
        _controller_evidence_lane_evidence_strength_counts[("bgp_ls", bgp_ls_evidence_strength)] += 1
        _controller_evidence_lane_evidence_strength_counts[("pcep", pcep_evidence_strength)] += 1
        _controller_evidence_lane_evidence_strength_counts[("netconf", netconf_evidence_strength)] += 1
        _controller_evidence_lane_session_backed_counts[("bgp_ls", str(bgp_ls_evidence_strength == "session_backed").lower())] += 1
        _controller_evidence_lane_session_backed_counts[("pcep", str(pcep_evidence_strength == "session_backed").lower())] += 1
        _controller_evidence_lane_session_backed_counts[("netconf", str(netconf_evidence_strength == "session_backed").lower())] += 1
        _cached_controller_evidence_metrics = CachedControllerEvidenceMetrics(
            controller_reachability=controller_reachability,
            bgp_ls_lane_posture=bgp_ls_lane_posture,
            bgp_ls_session_posture=bgp_ls_session_posture,
            bgp_ls_evidence_strength=bgp_ls_evidence_strength,
            pcep_lane_posture=pcep_lane_posture,
            pcep_session_posture=pcep_session_posture,
            pcep_evidence_strength=pcep_evidence_strength,
            netconf_lane_posture=netconf_lane_posture,
            netconf_session_posture=netconf_session_posture,
            netconf_evidence_strength=netconf_evidence_strength,
        )


def record_topology_truth_observation(
    *,
    controller_status: str,
    merged_node_count: int,
    merged_link_count: int,
    inferred_only_links: int,
    physical_confirmed_links: int,
    igp_confirmed_links: int,
    ospf_observed_links: int,
    isis_observed_links: int,
    multi_source_confirmed_links: int,
    lldp_single_sided_links: int,
    lldp_bidirectional_links: int,
    lldp_mismatch_links: int,
    igp_protocol_mismatch_links: int,
    conflicts: int,
    duration_seconds: float,
) -> None:
    """Record one deeper topology truth merge (v1)."""
    global _cached_topology_truth_metrics
    with _lock:
        global _topology_truth_merges_total, _topology_truth_seconds_sum
        _topology_truth_merges_total += 1
        _topology_truth_controller_status_counts[controller_status] += 1
        _topology_truth_seconds_sum += max(0.0, duration_seconds)
        _cached_topology_truth_metrics = CachedTopologyTruthMetrics(
            controller_status=controller_status,
            merged_node_count=merged_node_count,
            merged_link_count=merged_link_count,
            inferred_only_links=inferred_only_links,
            physical_confirmed_links=physical_confirmed_links,
            igp_confirmed_links=igp_confirmed_links,
            ospf_observed_links=ospf_observed_links,
            isis_observed_links=isis_observed_links,
            multi_source_confirmed_links=multi_source_confirmed_links,
            lldp_single_sided_links=lldp_single_sided_links,
            lldp_bidirectional_links=lldp_bidirectional_links,
            lldp_mismatch_links=lldp_mismatch_links,
            igp_protocol_mismatch_links=igp_protocol_mismatch_links,
            conflicts=conflicts,
        )


def record_rollback_outcome(
    *,
    rollback_type: str,
    rollback_decision: str,
    rollback_status: str,
    event: str,
    duration_seconds: float,
) -> None:
    """Record one rollback orchestration observation (v1 bounded slice)."""
    global _rollback_execution_seconds_sum, _rollback_execution_count
    with _lock:
        _rollback_counts[(rollback_type, rollback_decision, rollback_status, event)] += 1
        if event.startswith("execute"):
            _rollback_execution_seconds_sum += max(0.0, duration_seconds)
            _rollback_execution_count += 1


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
    global _validation_generation_seconds_sum, _validation_generation_count
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
    lldp_observation_count: int,
    lldp_correlated_link_count: int,
    lldp_single_sided_link_count: int,
    lldp_bidirectional_link_count: int,
    lldp_mismatch_link_count: int,
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
            lldp_observation_count=lldp_observation_count,
            lldp_correlated_link_count=lldp_correlated_link_count,
            lldp_single_sided_link_count=lldp_single_sided_link_count,
            lldp_bidirectional_link_count=lldp_bidirectional_link_count,
            lldp_mismatch_link_count=lldp_mismatch_link_count,
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
                    "# HELP platform_app_api_topology_lldp_observations "
                    "Current backend-owned count of LLDP neighbor observations attached to the topology snapshot."
                ),
                "# TYPE platform_app_api_topology_lldp_observations gauge",
                (
                    "platform_app_api_topology_lldp_observations "
                    f"{topology_metrics.get('lldp_observation_count', 0)}"
                ),
                (
                    "# HELP platform_app_api_topology_lldp_correlated_links "
                    "Current backend-owned count of topology links with correlated LLDP evidence."
                ),
                "# TYPE platform_app_api_topology_lldp_correlated_links gauge",
                (
                    "platform_app_api_topology_lldp_correlated_links "
                    f"{topology_metrics.get('lldp_correlated_link_count', 0)}"
                ),
                (
                    "# HELP platform_app_api_topology_lldp_single_sided_links "
                    "Current backend-owned count of topology links with one-sided LLDP evidence."
                ),
                "# TYPE platform_app_api_topology_lldp_single_sided_links gauge",
                (
                    "platform_app_api_topology_lldp_single_sided_links "
                    f"{topology_metrics.get('lldp_single_sided_link_count', 0)}"
                ),
                (
                    "# HELP platform_app_api_topology_lldp_bidirectional_links "
                    "Current backend-owned count of topology links with bidirectional LLDP evidence."
                ),
                "# TYPE platform_app_api_topology_lldp_bidirectional_links gauge",
                (
                    "platform_app_api_topology_lldp_bidirectional_links "
                    f"{topology_metrics.get('lldp_bidirectional_link_count', 0)}"
                ),
                (
                    "# HELP platform_app_api_topology_lldp_mismatch_links "
                    "Current backend-owned count of topology links where LLDP contradicts the interface-derived peer mapping."
                ),
                "# TYPE platform_app_api_topology_lldp_mismatch_links gauge",
                (
                    "platform_app_api_topology_lldp_mismatch_links "
                    f"{topology_metrics.get('lldp_mismatch_link_count', 0)}"
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
        total_persisted_count = int(history_metrics.get("total_persisted_count", 0))
        counts_by_model_family = dict(history_metrics.get("counts_by_model_family", {}))
        persisted_counts_by_model_family = dict(
            history_metrics.get("persisted_counts_by_model_family", {})
        )
        counts_by_result = dict(history_metrics.get("counts_by_result", {}))
        counts_by_model_family_and_result = dict(
            history_metrics.get("counts_by_model_family_and_result", {})
        )
        latest_finished_at_by_model_family = dict(
            history_metrics.get("latest_finished_at_by_model_family", {})
        )
        latest_observed_at_by_model_family = dict(
            history_metrics.get("latest_observed_at_by_model_family", {})
        )
        lines.extend(
            [
                (
                    "# HELP platform_app_api_sync_runs_persisted_total "
                    "Total rows in the sync_runs table."
                ),
                "# TYPE platform_app_api_sync_runs_persisted_total gauge",
                f"platform_app_api_sync_runs_persisted_total {total_persisted_count}",
                (
                    "# HELP platform_app_api_sync_runs_persisted_by_family "
                    "Total rows in the sync_runs table by model family."
                ),
                "# TYPE platform_app_api_sync_runs_persisted_by_family gauge",
                *[
                    (
                        "platform_app_api_sync_runs_persisted_by_family"
                        f'{{model_family="{model_family}"}} '
                        f"{persisted_counts_by_model_family.get(model_family, 0)}"
                    )
                    for model_family in sorted(history_families)
                ],
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
                    "Unix timestamp of the latest persisted sync-run finish time by model family; "
                    "zero when that family has no persisted sync runs yet."
                ),
                "# TYPE platform_app_api_sync_run_latest_finished_at_seconds gauge",
                *[
                    (
                        "platform_app_api_sync_run_latest_finished_at_seconds"
                        f'{{model_family="{model_family}"}} '
                        f"{(
                            latest_finished_at_by_model_family[model_family].timestamp()
                            if model_family in latest_finished_at_by_model_family
                            else 0.0
                        ):.3f}"
                    )
                    for model_family in sorted(history_families)
                ],
                (
                    "# HELP platform_app_api_collector_boundary_newest_observed_at_seconds "
                    "Unix timestamp from Postgres sync_runs: COALESCE(MAX(observed_at), MAX(finished_at)) "
                    "per model_family (collector observation time when present; else last persist). "
                    "Exposed on every /metrics scrape. Zero when that family has no rows."
                ),
                "# TYPE platform_app_api_collector_boundary_newest_observed_at_seconds gauge",
                *[
                    (
                        "platform_app_api_collector_boundary_newest_observed_at_seconds"
                        f'{{model_family="{model_family}"}} '
                        f"{(
                            latest_observed_at_by_model_family[model_family].timestamp()
                            if model_family in latest_observed_at_by_model_family
                            else 0.0
                        ):.3f}"
                    )
                    for model_family in sorted(history_families)
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

    with _lock:
        safe_action_counts = dict(_safe_action_counts)
        safe_act_sec_sum = _safe_action_execution_seconds_sum
        safe_act_sec_n = _safe_action_execution_count
    lines.extend(
        [
            (
                "# HELP platform_app_api_safe_actions_total "
                "Safe action observations by action_type, decision, execution_status, and event."
            ),
            "# TYPE platform_app_api_safe_actions_total counter",
            *[
                (
                    "platform_app_api_safe_actions_total"
                    f'{{action_type="{at}",action_decision="{ad}",execution_status="{es}",event="{ev}"}} '
                    f"{cnt}"
                )
                for (at, ad, es, ev), cnt in sorted(safe_action_counts.items())
            ],
            (
                "# HELP platform_app_api_safe_action_event_seconds_sum "
                "Sum of wall time for safe-action events that include execute paths."
            ),
            "# TYPE platform_app_api_safe_action_event_seconds_sum counter",
            f"platform_app_api_safe_action_event_seconds_sum {safe_act_sec_sum:.9f}",
            (
                "# HELP platform_app_api_safe_action_event_seconds_count "
                "Count of safe-action timed events (execute family)."
            ),
            "# TYPE platform_app_api_safe_action_event_seconds_count counter",
            f"platform_app_api_safe_action_event_seconds_count {safe_act_sec_n}",
        ]
    )

    with _lock:
        rollback_counts = dict(_rollback_counts)
        rb_sec_sum = _rollback_execution_seconds_sum
        rb_sec_n = _rollback_execution_count
    lines.extend(
        [
            (
                "# HELP platform_app_api_rollbacks_total "
                "Rollback orchestration observations by rollback_type, decision, status, and event."
            ),
            "# TYPE platform_app_api_rollbacks_total counter",
            *[
                (
                    "platform_app_api_rollbacks_total"
                    f'{{rollback_type="{rt}",rollback_decision="{rd}",rollback_status="{rs}",event="{ev}"}} '
                    f"{cnt}"
                )
                for (rt, rd, rs, ev), cnt in sorted(rollback_counts.items())
            ],
            (
                "# HELP platform_app_api_rollback_event_seconds_sum "
                "Sum of wall time for rollback events that include execute paths."
            ),
            "# TYPE platform_app_api_rollback_event_seconds_sum counter",
            f"platform_app_api_rollback_event_seconds_sum {rb_sec_sum:.9f}",
            (
                "# HELP platform_app_api_rollback_event_seconds_count "
                "Count of rollback timed events (execute family)."
            ),
            "# TYPE platform_app_api_rollback_event_seconds_count counter",
            f"platform_app_api_rollback_event_seconds_count {rb_sec_n}",
        ]
    )

    with _lock:
        tt_merge = _topology_truth_merges_total
        tt_sec = _topology_truth_seconds_sum
        tt_status = dict(_topology_truth_controller_status_counts)
        tt_cached = _cached_topology_truth_metrics
        ce_fetch = _controller_evidence_fetches_total
        ce_sec = _controller_evidence_seconds_sum
        ce_reach = dict(_controller_evidence_reachability_counts)
        ce_lane = dict(_controller_evidence_lane_posture_counts)
        ce_sess = dict(_controller_evidence_lane_session_posture_counts)
        ce_evd = dict(_controller_evidence_lane_evidence_strength_counts)
        ce_backed = dict(_controller_evidence_lane_session_backed_counts)
    lines.extend(
        [
            (
                "# HELP platform_app_api_topology_truth_merges_total "
                "Count of deeper topology truth merge computations."
            ),
            "# TYPE platform_app_api_topology_truth_merges_total counter",
            f"platform_app_api_topology_truth_merges_total {tt_merge}",
            (
                "# HELP platform_app_api_topology_truth_merge_seconds_sum "
                "Sum of wall time for topology truth merge computations."
            ),
            "# TYPE platform_app_api_topology_truth_merge_seconds_sum counter",
            f"platform_app_api_topology_truth_merge_seconds_sum {tt_sec:.9f}",
            (
                "# HELP platform_app_api_topology_truth_controller_status_total "
                "Topology truth merges by controller fetch status label."
            ),
            "# TYPE platform_app_api_topology_truth_controller_status_total counter",
            *[
                f'platform_app_api_topology_truth_controller_status_total{{status="{st}"}} {cnt}'
                for st, cnt in sorted(tt_status.items())
            ],
            "# HELP platform_app_api_topology_truth_last_merged_nodes Latest merged node count from last observation.",
            "# TYPE platform_app_api_topology_truth_last_merged_nodes gauge",
            f"platform_app_api_topology_truth_last_merged_nodes {tt_cached.merged_node_count}",
            "# HELP platform_app_api_topology_truth_last_merged_links Latest merged link count from last observation.",
            "# TYPE platform_app_api_topology_truth_last_merged_links gauge",
            f"platform_app_api_topology_truth_last_merged_links {tt_cached.merged_link_count}",
            "# HELP platform_app_api_topology_truth_last_inferred_only_links Latest inferred-only link count.",
            "# TYPE platform_app_api_topology_truth_last_inferred_only_links gauge",
            f"platform_app_api_topology_truth_last_inferred_only_links {tt_cached.inferred_only_links}",
            "# HELP platform_app_api_topology_truth_last_physical_confirmed_links Latest physically confirmed link count.",
            "# TYPE platform_app_api_topology_truth_last_physical_confirmed_links gauge",
            f"platform_app_api_topology_truth_last_physical_confirmed_links {tt_cached.physical_confirmed_links}",
            "# HELP platform_app_api_topology_truth_last_igp_confirmed_links Latest strongly IGP-confirmed link count.",
            "# TYPE platform_app_api_topology_truth_last_igp_confirmed_links gauge",
            f"platform_app_api_topology_truth_last_igp_confirmed_links {tt_cached.igp_confirmed_links}",
            "# HELP platform_app_api_topology_truth_last_ospf_observed_links Latest OSPF-observed weak link count.",
            "# TYPE platform_app_api_topology_truth_last_ospf_observed_links gauge",
            f"platform_app_api_topology_truth_last_ospf_observed_links {tt_cached.ospf_observed_links}",
            "# HELP platform_app_api_topology_truth_last_isis_observed_links Latest IS-IS-observed weak link count.",
            "# TYPE platform_app_api_topology_truth_last_isis_observed_links gauge",
            f"platform_app_api_topology_truth_last_isis_observed_links {tt_cached.isis_observed_links}",
            "# HELP platform_app_api_topology_truth_last_multi_source_confirmed_links Latest multi-source confirmed link count.",
            "# TYPE platform_app_api_topology_truth_last_multi_source_confirmed_links gauge",
            f"platform_app_api_topology_truth_last_multi_source_confirmed_links {tt_cached.multi_source_confirmed_links}",
            "# HELP platform_app_api_topology_truth_last_lldp_single_sided_links Latest one-sided LLDP-backed link count.",
            "# TYPE platform_app_api_topology_truth_last_lldp_single_sided_links gauge",
            f"platform_app_api_topology_truth_last_lldp_single_sided_links {tt_cached.lldp_single_sided_links}",
            "# HELP platform_app_api_topology_truth_last_lldp_bidirectional_links Latest bidirectional LLDP-backed link count.",
            "# TYPE platform_app_api_topology_truth_last_lldp_bidirectional_links gauge",
            f"platform_app_api_topology_truth_last_lldp_bidirectional_links {tt_cached.lldp_bidirectional_links}",
            "# HELP platform_app_api_topology_truth_last_lldp_mismatch_links Latest LLDP mismatch-marked link count.",
            "# TYPE platform_app_api_topology_truth_last_lldp_mismatch_links gauge",
            f"platform_app_api_topology_truth_last_lldp_mismatch_links {tt_cached.lldp_mismatch_links}",
            "# HELP platform_app_api_topology_truth_last_igp_protocol_mismatch_links Latest IGP mismatch-marked link count.",
            "# TYPE platform_app_api_topology_truth_last_igp_protocol_mismatch_links gauge",
            f"platform_app_api_topology_truth_last_igp_protocol_mismatch_links {tt_cached.igp_protocol_mismatch_links}",
            "# HELP platform_app_api_topology_truth_last_conflicts Latest disagreement/conflict count.",
            "# TYPE platform_app_api_topology_truth_last_conflicts gauge",
            f"platform_app_api_topology_truth_last_conflicts {tt_cached.conflicts}",
            (
                "# HELP platform_app_api_controller_evidence_fetches_total "
                "Count of controller southbound evidence aggregate fetches."
            ),
            "# TYPE platform_app_api_controller_evidence_fetches_total counter",
            f"platform_app_api_controller_evidence_fetches_total {ce_fetch}",
            (
                "# HELP platform_app_api_controller_evidence_fetch_seconds_sum "
                "Sum of wall time for controller evidence aggregate fetches."
            ),
            "# TYPE platform_app_api_controller_evidence_fetch_seconds_sum counter",
            f"platform_app_api_controller_evidence_fetch_seconds_sum {ce_sec:.9f}",
            (
                "# HELP platform_app_api_controller_evidence_reachability_total "
                "Controller evidence fetches by controller reachability label."
            ),
            "# TYPE platform_app_api_controller_evidence_reachability_total counter",
            *[
                f'platform_app_api_controller_evidence_reachability_total{{reachability="{k}"}} {v}'
                for k, v in sorted(ce_reach.items())
            ],
            (
                "# HELP platform_app_api_controller_evidence_lane_posture_total "
                "Lane posture observations per lane (v2)."
            ),
            "# TYPE platform_app_api_controller_evidence_lane_posture_total counter",
            *[
                f'platform_app_api_controller_evidence_lane_posture_total{{lane="{lane}",posture="{post}"}} {cnt}'
                for (lane, post), cnt in sorted(ce_lane.items())
            ],
            (
                "# HELP platform_app_api_controller_evidence_lane_session_posture_total "
                "Session posture observations per lane (v2)."
            ),
            "# TYPE platform_app_api_controller_evidence_lane_session_posture_total counter",
            *[
                f'platform_app_api_controller_evidence_lane_session_posture_total{{lane="{lane}",posture="{post}"}} {cnt}'
                for (lane, post), cnt in sorted(ce_sess.items())
            ],
            (
                "# HELP platform_app_api_controller_evidence_lane_evidence_strength_total "
                "Evidence strength observations per lane (v2)."
            ),
            "# TYPE platform_app_api_controller_evidence_lane_evidence_strength_total counter",
            *[
                f'platform_app_api_controller_evidence_lane_evidence_strength_total{{lane="{lane}",strength="{st}"}} {cnt}'
                for (lane, st), cnt in sorted(ce_evd.items())
            ],
            (
                "# HELP platform_app_api_controller_evidence_lane_session_backed_total "
                "Whether a lane observation was session-backed (`available=true`) versus weaker evidence."
            ),
            "# TYPE platform_app_api_controller_evidence_lane_session_backed_total counter",
            *[
                f'platform_app_api_controller_evidence_lane_session_backed_total{{lane="{lane}",available="{available}"}} {cnt}'
                for (lane, available), cnt in sorted(ce_backed.items())
            ],
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
    global _safe_action_execution_seconds_sum, _safe_action_execution_count, _safe_action_counts
    global _rollback_execution_seconds_sum, _rollback_execution_count, _rollback_counts
    global _cached_topology_truth_metrics
    global _topology_truth_merges_total, _topology_truth_seconds_sum, _topology_truth_controller_status_counts
    global _cached_controller_evidence_metrics
    global _controller_evidence_fetches_total, _controller_evidence_seconds_sum, _controller_evidence_reachability_counts
    global _controller_evidence_lane_posture_counts
    global _controller_evidence_lane_session_posture_counts, _controller_evidence_lane_evidence_strength_counts
    global _controller_evidence_lane_session_backed_counts
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
        _safe_action_counts.clear()
        _safe_action_execution_seconds_sum = 0.0
        _safe_action_execution_count = 0
        _rollback_counts.clear()
        _rollback_execution_seconds_sum = 0.0
        _rollback_execution_count = 0
        _topology_truth_merges_total = 0
        _topology_truth_seconds_sum = 0.0
        _topology_truth_controller_status_counts.clear()
        _cached_topology_truth_metrics = CachedTopologyTruthMetrics()
        _controller_evidence_fetches_total = 0
        _controller_evidence_seconds_sum = 0.0
        _controller_evidence_reachability_counts.clear()
        _controller_evidence_lane_posture_counts.clear()
        _controller_evidence_lane_session_posture_counts.clear()
        _controller_evidence_lane_evidence_strength_counts.clear()
        _controller_evidence_lane_session_backed_counts.clear()
        _cached_controller_evidence_metrics = CachedControllerEvidenceMetrics()
        _cached_topology_metrics = CachedTopologyMetrics()
        _cached_policy_metrics = CachedPolicyMetrics()
        _cached_readiness_metrics = CachedReadinessMetrics()
        _cached_recovery_metrics = CachedRecoveryMetrics()
        _cached_collector_boundary_fetch_metrics = {
            "inventory": CachedCollectorBoundaryFetchMetrics(),
            "topology": CachedCollectorBoundaryFetchMetrics(),
            "policy": CachedCollectorBoundaryFetchMetrics(),
        }

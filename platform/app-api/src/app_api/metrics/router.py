"""Metrics endpoint scaffolding."""

from fastapi import APIRouter, Response

from app_api.config.settings import get_settings
from app_api.metrics.state import (
    get_cached_readiness_metrics,
    get_cached_policy_metrics,
    get_cached_topology_metrics,
    render_prometheus_metrics,
)
from app_api.persistence.history import summarize_sync_run_history
from app_api.services.capabilities import refresh_readiness_metrics


PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"

router = APIRouter(tags=["metrics"])


@router.get("/metrics", include_in_schema=False)
def get_metrics() -> Response:
    """Expose bounded backend service metrics for Prometheus."""
    settings = get_settings()
    refresh_readiness_metrics()
    readiness = get_cached_readiness_metrics()
    topology = get_cached_topology_metrics()
    policies = get_cached_policy_metrics()
    sync_history = summarize_sync_run_history()
    payload = render_prometheus_metrics(
        settings.app_version,
        topology_metrics={
            "node_count": topology.node_count,
            "link_count": topology.link_count,
            "data_status": topology.data_status,
            "serving_mode": topology.serving_mode,
            "sync_status": topology.sync_status,
            "completeness": topology.completeness,
            "source_posture": topology.source_posture,
            "evidence_kind": topology.evidence_kind,
            "confidence_posture": topology.confidence_posture,
            "freshness_posture": topology.freshness_posture,
            "blocked_reason": topology.blocked_reason,
            "node_state_counts": topology.node_state_counts,
            "link_state_counts": topology.link_state_counts,
        },
        policy_metrics={
            "record_count": policies.record_count,
            "observed_policy_count": policies.observed_policy_count,
            "active_policy_count": policies.active_policy_count,
            "static_policy_count": policies.static_policy_count,
            "bgp_policy_count": policies.bgp_policy_count,
            "observed_target_count": policies.observed_target_count,
            "policy_capable_target_count": policies.policy_capable_target_count,
            "observed_state_counts": policies.observed_state_counts,
            "health_state_counts": policies.health_state_counts,
            "support_state_counts": policies.support_state_counts,
            "policy_type_counts": policies.policy_type_counts,
            "data_status": policies.data_status,
            "serving_mode": policies.serving_mode,
            "sync_status": policies.sync_status,
            "completeness": policies.completeness,
            "detail_mode": policies.detail_mode,
            "empty_reason": policies.empty_reason,
            "source_posture": policies.source_posture,
            "evidence_kind": policies.evidence_kind,
            "confidence_posture": policies.confidence_posture,
            "freshness_posture": policies.freshness_posture,
            "blocked_reason": policies.blocked_reason,
        },
        readiness_metrics={
            "status": readiness.status,
            "planning_readiness": readiness.planning_readiness,
            "phase_recommendation": readiness.phase_recommendation,
            "persisted_at_seconds": readiness.persisted_at_seconds,
            "evidence_coverage_counts": readiness.evidence_coverage_counts,
            "support_posture_counts": readiness.support_posture_counts,
            "assessment_area_status_counts": readiness.assessment_area_status_counts,
            "blocker_counts_by_category_and_severity": (
                readiness.blocker_counts_by_category_and_severity
            ),
            "blocked_scope_counts": readiness.blocked_scope_counts,
        },
        history_metrics={
            "total_count": sync_history.total_count,
            "counts_by_model_family": sync_history.counts_by_model_family,
            "counts_by_result": sync_history.counts_by_result,
            "counts_by_model_family_and_result": (
                sync_history.counts_by_model_family_and_result
            ),
            "latest_finished_at_by_model_family": (
                sync_history.latest_finished_at_by_model_family
            ),
        },
    )
    return Response(content=payload, media_type=PROMETHEUS_CONTENT_TYPE)

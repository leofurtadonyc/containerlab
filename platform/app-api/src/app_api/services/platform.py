"""Platform status service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.integrations.collector.inventory import get_collector_inventory_client
from app_api.integrations.collector.policies import get_collector_policy_client
from app_api.integrations.collector.topology import get_collector_topology_client
from app_api.integrations.odl import OdlControllerObservation, get_odl_client
from app_api.metrics.state import (
    cache_recovery_metrics,
    observe_collector_boundary_fetch,
    resolve_collector_boundary_fetch_outcome,
)
from app_api.models.topology import build_topology_coverage_summary
from app_api.persistence.history import summarize_sync_run_history
from app_api.persistence.read_side import (
    load_latest_inventory_snapshot,
    load_latest_policy_snapshot,
    load_latest_topology_snapshot,
)
from app_api.persistence.readiness import load_latest_readiness_snapshot_reference
from app_api.schemas.platform import (
    PlatformComponentStatus,
    PlatformReadPathStatus,
    PlatformRecoveryPersistedArtifacts,
    PlatformRecoveryStatus,
    PlatformStatusResponse,
)


def _build_declared_component(name: str, role: str) -> PlatformComponentStatus:
    """Return a declared component without a live observation yet."""
    return PlatformComponentStatus(
        name=name,
        role=role,
        lifecycle_state="declared",
        observation_state="not_checked",
    )


def _parse_collector_timestamp(value: str | None) -> datetime | None:
    """Parse an ISO-formatted collector timestamp when present."""
    if value is None:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _map_read_path_state(status: str, fetch_error_kind: str | None) -> str:
    """Map collector snapshot status into a bounded platform observation state."""
    if status == "live_normalized_feed":
        return "ok"
    if status == "partial_live_feed":
        return "degraded"
    if fetch_error_kind in {"timeout_budget_exceeded", "collector_connection_error"}:
        return "unreachable"
    if fetch_error_kind in {"collector_http_error", "invalid_response_payload", "unknown_error"}:
        return "degraded"
    return "unknown"


def _build_latency_budget_note(
    *,
    status: str,
    fetch_error_kind: str | None,
    timeout_budget_seconds: int,
    fetch_duration_seconds: float | None,
) -> str | None:
    """Summarize the latest collector-boundary latency posture for operators."""
    if timeout_budget_seconds <= 0 or fetch_duration_seconds is None:
        return None

    if fetch_error_kind == "timeout_budget_exceeded":
        return (
            "Latest backend collector fetch exhausted the "
            f"{timeout_budget_seconds}s latency budget after {fetch_duration_seconds:.3f}s, "
            "so this read path fell back instead of waiting longer."
        )
    if fetch_error_kind is not None:
        return (
            "Latest backend collector fetch completed in "
            f"{fetch_duration_seconds:.3f}s under the {timeout_budget_seconds}s latency budget "
            f"with {fetch_error_kind}."
        )
    if status == "partial_live_feed":
        return (
            "Latest backend collector fetch completed in "
            f"{fetch_duration_seconds:.3f}s within the {timeout_budget_seconds}s latency budget, "
            "but still returned only bounded partial live coverage."
        )
    return (
        "Latest backend collector fetch completed in "
        f"{fetch_duration_seconds:.3f}s within the {timeout_budget_seconds}s latency budget."
    )


def _observe_snapshot_fetch(
    *,
    model_family: str,
    status: str,
    fetch_error_kind: str | None,
    timeout_budget_seconds: int,
    fetch_duration_seconds: float | None,
) -> None:
    """Update bounded collector-boundary observability from one snapshot read."""
    observe_collector_boundary_fetch(
        model_family=model_family,
        duration_seconds=fetch_duration_seconds,
        timeout_budget_seconds=timeout_budget_seconds,
        outcome=resolve_collector_boundary_fetch_outcome(
            status=status,
            fetch_error_kind=fetch_error_kind,
        ),
    )


def _build_inventory_read_path_status() -> PlatformReadPathStatus:
    """Build bounded platform status for the inventory read path."""
    snapshot = get_collector_inventory_client().read_inventory_snapshot()
    _observe_snapshot_fetch(
        model_family="inventory",
        status=snapshot.status,
        fetch_error_kind=snapshot.fetch_error_kind,
        timeout_budget_seconds=snapshot.timeout_budget_seconds,
        fetch_duration_seconds=snapshot.fetch_duration_seconds,
    )
    latency_note = _build_latency_budget_note(
        status=snapshot.status,
        fetch_error_kind=snapshot.fetch_error_kind,
        timeout_budget_seconds=snapshot.timeout_budget_seconds,
        fetch_duration_seconds=snapshot.fetch_duration_seconds,
    )
    return PlatformReadPathStatus(
        model_family="inventory",
        observation_state=_map_read_path_state(snapshot.status, snapshot.fetch_error_kind),
        configured_target_count=snapshot.configured_target_count,
        observed_target_count=snapshot.observed_target_count,
        collection_success_count=snapshot.collection_success_count,
        collection_partial_count=snapshot.collection_partial_count,
        collection_failure_count=snapshot.collection_failure_count,
        oldest_observed_at=_parse_collector_timestamp(snapshot.oldest_observed_at),
        newest_observed_at=_parse_collector_timestamp(snapshot.newest_observed_at),
        degraded_scope_summary=snapshot.degraded_scope_summary,
        summary=(
            "Current inventory read-path coverage is bounded to the targets that returned normalized live inventory evidence."
        ),
        notes=[
            *snapshot.notes,
            *([latency_note] if latency_note else []),
            *([snapshot.fetch_error] if snapshot.fetch_error else []),
        ],
    )


def _build_topology_read_path_status() -> PlatformReadPathStatus:
    """Build bounded platform status for the topology read path."""
    snapshot = get_collector_topology_client().read_topology_snapshot()
    _observe_snapshot_fetch(
        model_family="topology",
        status=snapshot.status,
        fetch_error_kind=snapshot.fetch_error_kind,
        timeout_budget_seconds=snapshot.timeout_budget_seconds,
        fetch_duration_seconds=snapshot.fetch_duration_seconds,
    )
    latency_note = _build_latency_budget_note(
        status=snapshot.status,
        fetch_error_kind=snapshot.fetch_error_kind,
        timeout_budget_seconds=snapshot.timeout_budget_seconds,
        fetch_duration_seconds=snapshot.fetch_duration_seconds,
    )
    collection_posture = snapshot.collection_posture
    if collection_posture is None and snapshot.status == "collector_unavailable":
        collection_posture = "blocked"
    coverage_summary = build_topology_coverage_summary(
        nodes=snapshot.nodes,
        links=snapshot.links,
        inference_posture=snapshot.inference_posture,
        endpoint_pairing_posture=snapshot.endpoint_pairing_posture,
        collection_posture=collection_posture,
        node_participation_posture=snapshot.node_participation_posture,
        paired_link_count=snapshot.paired_link_count,
        single_sided_link_count=snapshot.single_sided_link_count,
        linked_node_count=snapshot.linked_node_count,
        isolated_node_count=snapshot.isolated_node_count,
    )
    return PlatformReadPathStatus(
        model_family="topology",
        observation_state=_map_read_path_state(snapshot.status, snapshot.fetch_error_kind),
        configured_target_count=snapshot.configured_target_count,
        observed_target_count=snapshot.observed_target_count,
        collection_success_count=snapshot.collection_success_count,
        collection_partial_count=snapshot.collection_partial_count,
        collection_failure_count=snapshot.collection_failure_count,
        oldest_observed_at=_parse_collector_timestamp(snapshot.oldest_observed_at),
        newest_observed_at=_parse_collector_timestamp(snapshot.newest_observed_at),
        inference_posture=coverage_summary.inference_posture,
        endpoint_pairing_posture=coverage_summary.endpoint_pairing_posture,
        collection_posture=coverage_summary.collection_posture,
        node_participation_posture=coverage_summary.node_participation_posture,
        paired_link_count=coverage_summary.paired_link_count,
        single_sided_link_count=coverage_summary.single_sided_link_count,
        linked_node_count=coverage_summary.linked_node_count,
        isolated_node_count=coverage_summary.isolated_node_count,
        degraded_scope_summary=snapshot.degraded_scope_summary,
        summary=(
            "Current topology read-path coverage is bounded to live interface evidence plus the current backend-owned inference rules. "
            f"{coverage_summary.summary}"
        ),
        notes=[
            *snapshot.notes,
            coverage_summary.summary,
            *([latency_note] if latency_note else []),
            *([snapshot.fetch_error] if snapshot.fetch_error else []),
        ],
    )


def _build_policy_read_path_status() -> PlatformReadPathStatus:
    """Build bounded platform status for the policy read path."""
    snapshot = get_collector_policy_client().read_policy_snapshot()
    _observe_snapshot_fetch(
        model_family="policy",
        status=snapshot.status,
        fetch_error_kind=snapshot.fetch_error_kind,
        timeout_budget_seconds=snapshot.timeout_budget_seconds,
        fetch_duration_seconds=snapshot.fetch_duration_seconds,
    )
    latency_note = _build_latency_budget_note(
        status=snapshot.status,
        fetch_error_kind=snapshot.fetch_error_kind,
        timeout_budget_seconds=snapshot.timeout_budget_seconds,
        fetch_duration_seconds=snapshot.fetch_duration_seconds,
    )
    return PlatformReadPathStatus(
        model_family="policy",
        observation_state=_map_read_path_state(snapshot.status, snapshot.fetch_error_kind),
        configured_target_count=snapshot.configured_target_count,
        observed_target_count=snapshot.observed_target_count,
        collection_success_count=snapshot.collection_success_count,
        collection_partial_count=snapshot.collection_partial_count,
        collection_failure_count=snapshot.collection_failure_count,
        oldest_observed_at=_parse_collector_timestamp(snapshot.oldest_observed_at),
        newest_observed_at=_parse_collector_timestamp(snapshot.newest_observed_at),
        policy_capable_target_count=snapshot.policy_capable_target_count,
        detail_ready_target_count=snapshot.detail_ready_target_count,
        degraded_scope_summary=snapshot.degraded_scope_summary,
        summary=(
            "Current policy read-path coverage is bounded to live SR-policy counter evidence and the subset of targets that yield normalized detail records."
        ),
        notes=[
            *snapshot.notes,
            *([latency_note] if latency_note else []),
            *([snapshot.fetch_error] if snapshot.fetch_error else []),
        ],
    )


def _build_recovery_persisted_artifacts() -> PlatformRecoveryPersistedArtifacts:
    """Return bounded same-workspace persisted artifact availability."""
    sync_history = summarize_sync_run_history()
    return PlatformRecoveryPersistedArtifacts(
        inventory_snapshot=load_latest_inventory_snapshot() is not None,
        topology_snapshot=load_latest_topology_snapshot() is not None,
        policy_snapshot=load_latest_policy_snapshot() is not None,
        sync_history=sync_history.total_count > 0,
        readiness_snapshot=load_latest_readiness_snapshot_reference() is not None,
    )


def _build_recovery_status(
    read_paths: list[PlatformReadPathStatus],
) -> PlatformRecoveryStatus:
    """Summarize the current same-workspace recovery posture for operators."""
    persisted_artifacts = _build_recovery_persisted_artifacts()
    persisted_artifact_map = persisted_artifacts.model_dump()
    has_preserved_baseline = any(persisted_artifact_map.values())
    degraded_model_families = [
        read_path.model_family
        for read_path in read_paths
        if read_path.observation_state != "ok"
    ]

    baseline_posture = (
        "preserved_same_workspace_baseline" if has_preserved_baseline else "new_baseline"
    )
    if not degraded_model_families:
        read_side_posture = "live_recollection_ready"
    elif has_preserved_baseline:
        read_side_posture = "degraded_with_persisted_baseline"
    else:
        read_side_posture = "degraded_without_persisted_baseline"

    if baseline_posture == "preserved_same_workspace_baseline":
        if read_side_posture == "live_recollection_ready":
            summary = (
                "Same-workspace persisted baseline is present and the current bounded read paths are recollecting live evidence."
            )
        else:
            summary = (
                "Same-workspace persisted baseline is present while one or more bounded live read paths are degraded, so preserved persisted anchors remain available where fallback is implemented."
            )
    elif read_side_posture == "live_recollection_ready":
        summary = (
            "Current runtime is on a new baseline and the bounded read paths are recollecting live evidence to establish fresh persisted anchors."
        )
    else:
        summary = (
            "Current runtime is on a new baseline and one or more bounded live read paths are degraded, so preserved same-workspace persisted anchors are not available yet."
        )

    present_artifacts = [
        artifact_name for artifact_name, present in persisted_artifact_map.items() if present
    ]
    if present_artifacts:
        artifact_note = (
            "Persisted application artifacts currently present in Postgres: "
            + ", ".join(present_artifacts)
            + "."
        )
    else:
        artifact_note = (
            "No bounded persisted inventory, topology, policy, sync-history, or readiness artifacts are currently present in Postgres."
        )

    if not degraded_model_families:
        read_path_note = (
            "Current live recollection is healthy across inventory, topology, and policy read paths."
        )
    else:
        read_path_note = (
            "Current live recollection is degraded for: "
            + ", ".join(degraded_model_families)
            + "."
        )

    notes = [
        "Preserved same-workspace baseline means at least one bounded persisted application artifact still exists in Postgres; inspect persisted_artifacts for per-slice coverage.",
        artifact_note,
        read_path_note,
    ]

    recovery_status = PlatformRecoveryStatus(
        baseline_posture=baseline_posture,
        read_side_posture=read_side_posture,
        summary=summary,
        persisted_artifacts=persisted_artifacts,
        notes=notes,
    )
    cache_recovery_metrics(
        baseline_posture=recovery_status.baseline_posture,
        read_side_posture=recovery_status.read_side_posture,
        persisted_artifact_availability={
            artifact_name: int(present)
            for artifact_name, present in persisted_artifact_map.items()
        },
    )
    return recovery_status


def _build_gnmi_collector_component_status(
    read_paths: list[PlatformReadPathStatus],
) -> PlatformComponentStatus:
    """Map bounded collector read-path summaries into the collector component row."""
    read_path_notes = []
    for read_path in read_paths:
        freshness_note = (
            f"freshness {read_path.oldest_observed_at.isoformat()} -> {read_path.newest_observed_at.isoformat()}"
            if read_path.oldest_observed_at and read_path.newest_observed_at
            else "freshness window unavailable"
        )
        coverage_note = (
            f"{read_path.model_family}: {read_path.observed_target_count}/{read_path.configured_target_count} targets, "
            f"success {read_path.collection_success_count}, partial {read_path.collection_partial_count}, failed {read_path.collection_failure_count}, {freshness_note}."
        )
        if read_path.detail_ready_target_count is not None:
            coverage_note += f" detail-ready targets {read_path.detail_ready_target_count}."
        if read_path.endpoint_pairing_posture is not None:
            coverage_note += (
                f" inference posture {read_path.inference_posture}, "
                f"collection posture {read_path.collection_posture}, "
                f"endpoint-pairing posture {read_path.endpoint_pairing_posture}, "
                f"node participation posture {read_path.node_participation_posture}, "
                f"paired links {read_path.paired_link_count}, "
                f"single-sided links {read_path.single_sided_link_count}, "
                f"linked nodes {read_path.linked_node_count}, "
                f"isolated nodes {read_path.isolated_node_count}."
            )
        read_path_notes.append(coverage_note)
        read_path_notes.append(read_path.degraded_scope_summary)

    return PlatformComponentStatus(
        name="gnmi-collector",
        role="observed-state-collector",
        lifecycle_state="declared",
        observation_state="not_checked",
        observation_summary=(
            "The backend now also carries bounded inventory, topology, and policy read-path coverage summaries derived from the collector boundary without turning Platform Health into a full dependency-health dashboard."
        ),
        notes=read_path_notes,
    )


def _read_odl_observation() -> OdlControllerObservation:
    """Read one bounded ODL controller observation."""
    try:
        return get_odl_client().read_controller_observation()
    except Exception:
        return OdlControllerObservation(
            observation_state="unknown",
            observed_source="odl_restconf_capability_probe",
            observation_summary=(
                "The backend could not complete the bounded ODL capability "
                "probe cleanly."
            ),
            observed_capabilities=[],
            notes=[
                "ODL remains an optional helper only on this path.",
                "The backend still owns platform status and does not delegate product truth to the controller.",
            ],
        )


def _build_odl_component_status() -> PlatformComponentStatus:
    """Map the bounded ODL observation into product-facing platform status."""
    observation = _read_odl_observation()
    return PlatformComponentStatus(
        name="odl",
        role="bounded-controller-helper",
        lifecycle_state="declared",
        observation_state=observation.observation_state,
        observation_source=observation.observed_source,
        observation_summary=observation.observation_summary,
        observed_capabilities=observation.observed_capabilities,
        notes=observation.notes,
    )


def build_platform_status_response() -> PlatformStatusResponse:
    """Build the bounded platform status response for the current phase."""
    settings = get_settings()
    read_paths = [
        _build_inventory_read_path_status(),
        _build_topology_read_path_status(),
        _build_policy_read_path_status(),
    ]
    recovery = _build_recovery_status(read_paths)
    return PlatformStatusResponse(
        status="ok",
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        topology_name="platform",
        summary=(
            "Phase 2 declared platform service inventory with one bounded ODL "
            "RESTCONF capability probe plus bounded inventory, topology, and policy "
            "collector read-path coverage summaries; deeper dependency health checks remain intentionally narrow."
        ),
        recovery=recovery,
        components=[
            _build_declared_component("app-api", "backend-api"),
            _build_declared_component("app-web", "operator-webui"),
            _build_gnmi_collector_component_status(read_paths),
            _build_declared_component("postgres", "durable-application-store"),
            _build_declared_component("prometheus", "metrics-store"),
            _build_declared_component("grafana", "observability-dashboards"),
            _build_odl_component_status(),
        ],
        read_paths=read_paths,
    )

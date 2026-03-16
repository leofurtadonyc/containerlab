"""Platform status service helpers."""

from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.integrations.collector.inventory import get_collector_inventory_client
from app_api.integrations.collector.policies import get_collector_policy_client
from app_api.integrations.collector.topology import get_collector_topology_client
from app_api.integrations.odl import OdlControllerObservation, get_odl_client
from app_api.models.topology import build_topology_coverage_summary
from app_api.schemas.platform import (
    PlatformComponentStatus,
    PlatformReadPathStatus,
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


def _map_read_path_state(status: str, fetch_error: str | None) -> str:
    """Map collector snapshot status into a bounded platform observation state."""
    if status == "live_normalized_feed":
        return "ok"
    if status == "partial_live_feed":
        return "degraded"
    if fetch_error:
        return "unreachable"
    return "unknown"


def _build_inventory_read_path_status() -> PlatformReadPathStatus:
    """Build bounded platform status for the inventory read path."""
    snapshot = get_collector_inventory_client().read_inventory_snapshot()
    return PlatformReadPathStatus(
        model_family="inventory",
        observation_state=_map_read_path_state(snapshot.status, snapshot.fetch_error),
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
        notes=snapshot.notes,
    )


def _build_topology_read_path_status() -> PlatformReadPathStatus:
    """Build bounded platform status for the topology read path."""
    snapshot = get_collector_topology_client().read_topology_snapshot()
    collection_posture = snapshot.collection_posture
    if collection_posture is None and snapshot.status == "collector_unavailable":
        collection_posture = "blocked"
    coverage_summary = build_topology_coverage_summary(
        links=snapshot.links,
        inference_posture=snapshot.inference_posture,
        endpoint_pairing_posture=snapshot.endpoint_pairing_posture,
        collection_posture=collection_posture,
        paired_link_count=snapshot.paired_link_count,
        single_sided_link_count=snapshot.single_sided_link_count,
    )
    return PlatformReadPathStatus(
        model_family="topology",
        observation_state=_map_read_path_state(snapshot.status, snapshot.fetch_error),
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
        paired_link_count=coverage_summary.paired_link_count,
        single_sided_link_count=coverage_summary.single_sided_link_count,
        degraded_scope_summary=snapshot.degraded_scope_summary,
        summary=(
            "Current topology read-path coverage is bounded to live interface evidence plus the current backend-owned inference rules. "
            f"{coverage_summary.summary}"
        ),
        notes=[*snapshot.notes, coverage_summary.summary],
    )


def _build_policy_read_path_status() -> PlatformReadPathStatus:
    """Build bounded platform status for the policy read path."""
    snapshot = get_collector_policy_client().read_policy_snapshot()
    return PlatformReadPathStatus(
        model_family="policy",
        observation_state=_map_read_path_state(snapshot.status, snapshot.fetch_error),
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
        notes=snapshot.notes,
    )


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
                f"paired links {read_path.paired_link_count}, "
                f"single-sided links {read_path.single_sided_link_count}."
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
    with ThreadPoolExecutor(max_workers=3) as executor:
        inventory_future = executor.submit(_build_inventory_read_path_status)
        topology_future = executor.submit(_build_topology_read_path_status)
        policy_future = executor.submit(_build_policy_read_path_status)
        read_paths = [
            inventory_future.result(),
            topology_future.result(),
            policy_future.result(),
        ]
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

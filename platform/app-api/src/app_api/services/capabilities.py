"""Capability service helpers."""

from datetime import UTC, datetime
from typing import Iterable

from app_api.config.settings import get_settings
from app_api.schemas.capabilities import CapabilityRecord, CapabilitiesListResponse


def _count_values(values: Iterable[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return counts


def build_capabilities_list_response() -> CapabilitiesListResponse:
    """Build the bounded capability matrix response for the current phase."""
    settings = get_settings()
    items = [
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current onboarded Nokia SR OS lab targets",
            domain="inventory",
            feature="device_inventory",
            support_status="supported",
            implementation_status="implemented",
            availability_scope=(
                "Live normalized gNMI-backed inventory across the onboarded "
                "Nokia-first device set."
            ),
            status_detail=(
                "The platform can currently serve this read-only inventory slice "
                "as a stable backend-owned contract for Nokia SR OS targets."
            ),
            caveats=[
                "This support statement is bounded to the current Nokia-first read-only inventory slice.",
                "Juniper inventory support is not implemented yet.",
            ],
            source_of_determination="live_inventory_read_path",
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current onboarded Nokia SR OS lab targets",
            domain="topology",
            feature="topology_observation",
            support_status="partially_supported",
            implementation_status="partial",
            availability_scope=(
                "Live normalized nodes plus bounded interface-inferred links for "
                "the current Nokia-first lab."
            ),
            status_detail=(
                "The platform can expose useful topology evidence, but the current "
                "slice remains intentionally partial rather than full adjacency or "
                "path truth."
            ),
            caveats=[
                "Link inference is still bounded to interface-name and operational-state evidence.",
                "Controller-derived or protocol-derived topology enrichment is not the current source of truth.",
            ],
            source_of_determination="live_topology_read_path",
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current onboarded Nokia SR OS lab targets",
            domain="policy",
            feature="policy_inventory",
            support_status="partially_supported",
            implementation_status="partial",
            availability_scope=(
                "Live SR policy counters with bounded static-policy detail when that "
                "Nokia state is present."
            ),
            status_detail=(
                "The platform can surface policy visibility and bounded per-policy "
                "evidence, but deeper BGP-signaled and full operational policy truth "
                "remain outside the current slice."
            ),
            caveats=[
                "Current policy support is honest about live-empty and detail-unavailable states.",
                "The product does not yet claim deeper policy parity or write-safe behavior.",
            ],
            source_of_determination="live_policy_read_path",
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="current onboarded Nokia SR OS lab targets",
            domain="policy",
            feature="bgp_signaled_policy_detail",
            support_status="unknown",
            implementation_status="planned",
            availability_scope=(
                "Planned future policy-depth area only; no stable normalized backend "
                "contract exists yet."
            ),
            status_detail=(
                "The platform does not yet have enough live Nokia evidence or bounded "
                "model coverage to claim this capability honestly."
            ),
            caveats=[
                "Unknown is explicit here because the support picture is not yet validated by stable implementation.",
            ],
            source_of_determination="capability_matrix_review",
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="platform-side persisted sync activity only",
            domain="workflow_history",
            feature="workflow_history_visibility",
            support_status="partially_supported",
            implementation_status="partial",
            availability_scope=(
                "Read-only history derived from persisted sync runs rather than an "
                "execution workflow engine."
            ),
            status_detail=(
                "Operators can inspect bounded platform-side sync activity today, but "
                "the platform does not yet expose fuller workflow semantics."
            ),
            caveats=[
                "No approvals, rollback, dry-run, or execution workflow state is implied by this capability.",
            ],
            source_of_determination="persisted_sync_activity_history",
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="platform-side persisted sync activity only",
            domain="audit_history",
            feature="audit_history_visibility",
            support_status="partially_supported",
            implementation_status="partial",
            availability_scope="Read-only audit-style visibility derived from persisted sync runs.",
            status_detail=(
                "The current audit view is useful for bounded platform-side "
                "visibility, but it is not a complete user-action audit system."
            ),
            caveats=[
                "User-driven audit history and broader action traces are not implemented in this phase.",
            ],
            source_of_determination="persisted_sync_activity_history",
        ),
        CapabilityRecord(
            vendor="nokia",
            platform="sros",
            version_scope="platform topology only",
            domain="platform_health",
            feature="odl_controller_capability_probe",
            support_status="partially_supported",
            implementation_status="partial",
            availability_scope=(
                "Bounded controller reachability and capability hints exposed "
                "through platform health only."
            ),
            status_detail=(
                "The platform now uses one ODL-backed read enrichment for controller "
                "capability discovery without treating ODL as topology or policy truth."
            ),
            caveats=[
                "This does not imply broader controller-backed topology, policy, or workflow support.",
            ],
            source_of_determination="odl_restconf_capability_probe",
        ),
        CapabilityRecord(
            vendor="juniper",
            platform="junos",
            version_scope="planned next expansion",
            domain="inventory",
            feature="device_inventory",
            support_status="not_implemented_in_platform",
            implementation_status="planned",
            availability_scope=(
                "Architecture target only; no Juniper inventory adapter or read path "
                "exists today."
            ),
            status_detail=(
                "The platform is designed to grow toward Juniper, but no delivered "
                "Juniper read-only inventory support should be inferred yet."
            ),
            caveats=[
                "This record exists to make the roadmap explicit without implying parity.",
            ],
            source_of_determination="vendor_roadmap",
        ),
    ]
    return CapabilitiesListResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status="bounded_matrix",
        summary=(
            "Phase 2 bounded capability matrix. Supported, partial, unknown, and "
            "not-implemented states are now explicit across the current Nokia-first "
            "read-only product slice without implying Juniper parity."
        ),
        count=len(items),
        support_counts=_count_values(item.support_status for item in items),
        implementation_counts=_count_values(
            item.implementation_status for item in items
        ),
        items=items,
    )

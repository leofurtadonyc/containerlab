"""Tests for bounded investigation next-inspection hint assembly."""

from datetime import UTC, datetime

from app_api.schemas.capabilities import CapabilitiesListResponse, DryRunReadinessSummary
from app_api.schemas.change_intelligence import (
    ChangeIntelligenceSafetyFraming,
    RecentChangeDomainSlice,
    RecentChangeSummaryResponse,
)
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.platform import (
    PlatformComponentStatus,
    PlatformReadPathStatus,
    PlatformRecoveryPersistedArtifacts,
    PlatformRecoveryStatus,
    PlatformStatusResponse,
)
from app_api.services.investigation_next_inspection import build_next_inspection_suggestions


def _rc_meta() -> ApiResponseMetadata:
    return ApiResponseMetadata(
        service="app-api",
        version="test",
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
    )


def _empty_recent(domains: list[RecentChangeDomainSlice]) -> RecentChangeSummaryResponse:
    return RecentChangeSummaryResponse(
        metadata=_rc_meta(),
        safety=ChangeIntelligenceSafetyFraming(
            authority_posture="evidence_aggregated_non_authoritative",
            explicit_non_claims=[],
            summary_disclaimer="s",
        ),
        window_semantics="backend_defined_bounded_lookback",
        completeness_posture="bounded_partial",
        sync_runs_limit_applied=20,
        readiness_snapshots_considered=0,
        domains=domains,
        aggregation_notes=[],
    )


def _minimal_platform(read_paths: list[PlatformReadPathStatus]) -> PlatformStatusResponse:
    recovery = PlatformRecoveryStatus(
        baseline_posture="new_baseline",
        read_side_posture="live_recollection_ready",
        summary="r",
        persisted_artifacts=PlatformRecoveryPersistedArtifacts(
            inventory_snapshot=False,
            topology_snapshot=False,
            policy_snapshot=False,
            sync_history=False,
            readiness_snapshot=False,
        ),
        notes=[],
    )
    return PlatformStatusResponse(
        service="app-api",
        version="test",
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        status="ok",
        topology_name="platform",
        summary="p",
        recovery=recovery,
        components=[
            PlatformComponentStatus(
                name="app-api",
                role="api",
                lifecycle_state="declared",
                observation_state="ok",
                observation_source="probe",
                observation_summary="ok",
                observed_capabilities=[],
                notes=[],
            )
        ],
        read_paths=read_paths,
    )


def _dry_run_empty() -> DryRunReadinessSummary:
    return DryRunReadinessSummary(
        status="bounded_readiness_support",
        planning_readiness="readiness_planning_supported",
        phase_recommendation="remain_phase_2_read_only_foundation",
        summary="dry-run",
        readiness_scope="scope",
        notes=[],
        strongest_blockers=[],
        bounded_next_steps=[],
        assessment_areas=[],
        blockers=[],
        prerequisites=[],
    )


def _minimal_capabilities(**kwargs) -> CapabilitiesListResponse:
    base = dict(
        service="app-api",
        version="test",
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        data_status="bounded_matrix",
        summary="c",
        count=0,
        domain_counts={},
        support_counts={},
        implementation_counts={},
        delivery_tier_counts={},
        evidence_basis_counts={},
        vendor_counts={},
        vendor_posture_counts={},
        workflow_readiness_counts={},
        workflow_readiness_scope_counts={},
        dry_run_readiness=_dry_run_empty(),
        items=[],
    )
    base.update(kwargs)
    return CapabilitiesListResponse(**base)


def _ok_read_path(model_family: str = "inventory") -> PlatformReadPathStatus:
    return PlatformReadPathStatus(
        model_family=model_family,  # type: ignore[arg-type]
        observation_state="ok",
        configured_target_count=1,
        observed_target_count=1,
        collection_success_count=1,
        collection_partial_count=0,
        collection_failure_count=0,
        oldest_observed_at=None,
        newest_observed_at=None,
        policy_capable_target_count=None,
        detail_ready_target_count=None,
        inference_posture=None,
        endpoint_pairing_posture=None,
        collection_posture=None,
        node_participation_posture=None,
        paired_link_count=None,
        single_sided_link_count=None,
        linked_node_count=None,
        isolated_node_count=None,
        degraded_scope_summary="ok",
        summary="s",
        notes=[],
    )


def test_build_next_inspection_suggestions_absent_domain() -> None:
    rc = _empty_recent(
        [
            RecentChangeDomainSlice(
                domain="devices",
                signal_families=[],
                evidence_status="absent",
                headline="No snapshots.",
                detail_notes=[],
            )
        ]
    )
    ps = _minimal_platform([_ok_read_path()])
    cap = _minimal_capabilities()
    suggestions = build_next_inspection_suggestions(rc, ps, cap)
    ids = [s.suggestion_id for s in suggestions]
    assert ids == ["change-intelligence-absent-devices"]
    assert suggestions[0].context_domain == "devices"
    assert "bounded" in suggestions[0].rationale.lower() or "no evidence" in suggestions[0].rationale.lower()


def test_build_next_inspection_suggestions_read_path_not_ok() -> None:
    rc = _empty_recent(
        [
            RecentChangeDomainSlice(
                domain="devices",
                signal_families=[],
                evidence_status="present",
                headline="ok",
                detail_notes=[],
            )
        ]
    )
    degraded = _ok_read_path()
    degraded = degraded.model_copy(update={"observation_state": "degraded"})
    ps = _minimal_platform([degraded])
    cap = _minimal_capabilities()
    suggestions = build_next_inspection_suggestions(rc, ps, cap)
    assert any(s.suggestion_id == "read-path-inventory-not-ok" for s in suggestions)
    assert any(s.context_domain == "platform_status" for s in suggestions)


def test_build_next_inspection_suggestions_capabilities_placeholder() -> None:
    rc = _empty_recent(
        [
            RecentChangeDomainSlice(
                domain="devices",
                signal_families=[],
                evidence_status="present",
                headline="ok",
                detail_notes=[],
            )
        ]
    )
    ps = _minimal_platform([_ok_read_path()])
    cap = _minimal_capabilities(data_status="placeholder")
    suggestions = build_next_inspection_suggestions(rc, ps, cap)
    assert any(s.suggestion_id == "capabilities-matrix-placeholder" for s in suggestions)
    assert any(s.context_domain == "capabilities" for s in suggestions)


def test_build_next_inspection_suggestions_fallback_when_no_triggers() -> None:
    rc = _empty_recent(
        [
            RecentChangeDomainSlice(
                domain="devices",
                signal_families=[],
                evidence_status="present",
                headline="ok",
                detail_notes=[],
            )
        ]
    )
    ps = _minimal_platform([_ok_read_path()])
    cap = _minimal_capabilities()
    suggestions = build_next_inspection_suggestions(rc, ps, cap)
    assert [s.suggestion_id for s in suggestions] == ["optional-change-intelligence-overview"]
    assert suggestions[0].framing_rule == "optional_next_product_surfaces_without_preference_ordering"

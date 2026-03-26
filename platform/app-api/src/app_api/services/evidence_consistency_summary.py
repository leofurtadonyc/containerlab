"""Assemble cross-domain evidence consistency summary from existing read responses only."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.evidence_consistency_summary import (
    EVIDENCE_CONSISTENCY_SUMMARY_CONTRACT_ID,
    DomainFreshnessEcho,
    EvidenceConsistencyItemRow,
    EvidenceConsistencyPivotHint,
    EvidenceConsistencySafetyFraming,
    EvidenceConsistencySummaryResponse,
)
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
    build_recent_change_summary_response,
)
from app_api.services.devices import build_devices_list_response
from app_api.services.policies import build_policies_list_response
from app_api.services.topology import build_topology_response

logger = logging.getLogger(__name__)


def _safe_call(label: str, fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs), None
    except Exception as exc:  # noqa: BLE001 — summary must survive partial failures
        logger.warning("evidence_consistency_summary: %s assembly failed: %s", label, exc)
        return None, f"{type(exc).__name__}: {exc}"


def _count_degraded_policies(policies) -> int:
    return sum(1 for it in policies.items if it.degraded_policy_v1.posture == "degraded")


def build_evidence_consistency_summary_response(
    *,
    sync_runs_limit: int = RECENT_CHANGE_SYNC_RUNS_DEFAULT,
) -> EvidenceConsistencySummaryResponse:
    """Compose bounded cross-domain consistency observations; no new collector or diff semantics."""
    settings = get_settings()
    bounded = max(1, min(int(sync_runs_limit), RECENT_CHANGE_SYNC_RUNS_MAX))
    now = datetime.now(tz=UTC)

    policies, policies_err = _safe_call("policies", build_policies_list_response)
    devices, devices_err = _safe_call("devices", build_devices_list_response)
    topology, topology_err = _safe_call("topology", build_topology_response)
    recent_change = build_recent_change_summary_response(sync_runs_limit=bounded)

    assembly_notes: list[str] = []
    if policies_err:
        assembly_notes.append(f"policies: {policies_err}")
    if devices_err:
        assembly_notes.append(f"devices: {devices_err}")
    if topology_err:
        assembly_notes.append(f"topology: {topology_err}")

    domain_echo: list[DomainFreshnessEcho] = []
    if policies is not None:
        domain_echo.append(
            DomainFreshnessEcho(
                domain="policies",
                data_status=policies.data_status,
                serving_mode=policies.serving_mode,
            )
        )
    if devices is not None:
        domain_echo.append(
            DomainFreshnessEcho(
                domain="devices",
                data_status=devices.data_status,
                serving_mode=devices.serving_mode,
            )
        )
    if topology is not None:
        domain_echo.append(
            DomainFreshnessEcho(
                domain="topology",
                data_status=topology.data_status,
                serving_mode=topology.serving_mode,
            )
        )

    items: list[EvidenceConsistencyItemRow] = []
    caveats: list[str] = [
        "Consistency rows cite existing response fields only; they are interpretation support, not vendor or "
        "controller verdicts.",
    ]

    # --- Auditable heuristics (contract taxonomy) ---

    if policies is not None and devices is not None:
        if policies.serving_mode != devices.serving_mode:
            items.append(
                EvidenceConsistencyItemRow(
                    category="freshness_or_serving_mismatch",
                    consistency_signal="appears_in_tension",
                    summary=(
                        "Policy inventory and device inventory use different serving_mode values for this assembly."
                    ),
                    detail=f"policies_serving_mode={policies.serving_mode} devices_serving_mode={devices.serving_mode}",
                    pivot_hints=[
                        EvidenceConsistencyPivotHint(
                            label="Policies list",
                            route_family="GET /api/v1/policies",
                        ),
                        EvidenceConsistencyPivotHint(
                            label="Devices list",
                            route_family="GET /api/v1/devices",
                        ),
                    ],
                )
            )

        if policies.history.status != devices.history.status:
            items.append(
                EvidenceConsistencyItemRow(
                    category="history_gate_mismatch",
                    consistency_signal="weak_alignment",
                    summary="Policy and device persisted-history gates differ (comparison readiness not uniform).",
                    detail=f"policies.history.status={policies.history.status} devices.history.status={devices.history.status}",
                    pivot_hints=[
                        EvidenceConsistencyPivotHint(
                            label="Policy history",
                            route_family="GET /api/v1/policies (history)",
                        ),
                        EvidenceConsistencyPivotHint(
                            label="Inventory history",
                            route_family="GET /api/v1/devices (history)",
                        ),
                    ],
                )
            )

    if policies is not None and topology is not None:
        degraded_n = _count_degraded_policies(policies)
        cov = topology.coverage_summary
        if degraded_n > 0 and cov.collection_posture == "ok":
            items.append(
                EvidenceConsistencyItemRow(
                    category="posture_tension",
                    consistency_signal="weak_alignment",
                    summary=(
                        "Policies show degraded_policy_v1 rows while topology collection_posture is ok—do not "
                        "infer dataplane health from topology alone."
                    ),
                    detail=f"degraded_policy_rows={degraded_n} topology.collection_posture={cov.collection_posture}",
                    pivot_hints=[
                        EvidenceConsistencyPivotHint(
                            label="Policies",
                            route_family="GET /api/v1/policies",
                        ),
                        EvidenceConsistencyPivotHint(
                            label="Topology",
                            route_family="GET /api/v1/topology",
                        ),
                    ],
                )
            )

        if policies.detail_mode == "counters_only" and topology.topology.nodes:
            items.append(
                EvidenceConsistencyItemRow(
                    category="scope_mismatch",
                    consistency_signal="weak_alignment",
                    summary=(
                        "Policy list is counters-only while topology exposes graph nodes—effective universes differ "
                        "for cross-domain reasoning."
                    ),
                    detail="policies.detail_mode=counters_only topology.nodes>0",
                    pivot_hints=[
                        EvidenceConsistencyPivotHint(
                            label="Policies",
                            route_family="GET /api/v1/policies",
                        ),
                        EvidenceConsistencyPivotHint(
                            label="Topology",
                            route_family="GET /api/v1/topology",
                        ),
                    ],
                )
            )

    pol_slice = next((d for d in recent_change.domains if d.domain == "policies"), None)
    if pol_slice is not None and policies is not None:
        if pol_slice.evidence_status == "present" and policies.history.status == "current_only":
            items.append(
                EvidenceConsistencyItemRow(
                    category="activity_vs_static_tension",
                    consistency_signal="weak_alignment",
                    summary=(
                        "Recent-change intelligence reports policy-domain activity signals while policy list history "
                        "is single-snapshot only (no previous-row comparison)."
                    ),
                    detail="change_intelligence.policies.present + policies.history.status=current_only",
                    pivot_hints=[
                        EvidenceConsistencyPivotHint(
                            label="Change intelligence",
                            route_family="GET /api/v1/change-intelligence/recent-summary",
                        ),
                        EvidenceConsistencyPivotHint(
                            label="Policies",
                            route_family="GET /api/v1/policies",
                        ),
                    ],
                )
            )

    if not items:
        items.append(
            EvidenceConsistencyItemRow(
                category="gap_note",
                consistency_signal="not_comparable",
                summary=(
                    "No cross-domain tension rows were emitted from the bounded heuristics above—absence of rows "
                    "here is not proof of uniform truth."
                ),
                detail=None,
                pivot_hints=[
                    EvidenceConsistencyPivotHint(
                        label="Delta digest (cross-domain context)",
                        route_family="GET /api/v1/delta-digest",
                    ),
                ],
            )
        )

    tension_count = sum(1 for i in items if i.consistency_signal == "appears_in_tension")
    weak_count = sum(1 for i in items if i.consistency_signal == "weak_alignment")
    if tension_count > 0:
        scope_summary = (
            f"Bounded cross-domain read-side comparison: {tension_count} tension row(s) and {weak_count} weak-alignment "
            f"row(s) from existing API-visible fields (sync_runs_limit_applied={bounded})."
        )
    elif weak_count > 0:
        scope_summary = (
            f"Bounded cross-domain read-side comparison: {weak_count} weak-alignment signal(s); no hard tension rows "
            f"from current heuristics (sync_runs_limit_applied={bounded})."
        )
    else:
        scope_summary = (
            "Bounded cross-domain read-side comparison: no tension or weak-alignment heuristics fired; see items "
            f"for honesty (sync_runs_limit_applied={bounded})."
        )

    return EvidenceConsistencySummaryResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=EVIDENCE_CONSISTENCY_SUMMARY_CONTRACT_ID,
        safety_framing=EvidenceConsistencySafetyFraming(),
        scope_summary=scope_summary,
        sync_runs_limit_applied=bounded,
        domain_freshness_echo=domain_echo,
        items=items,
        caveats=caveats,
        assembly_notes=assembly_notes,
    )

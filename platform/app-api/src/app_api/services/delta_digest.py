"""Assemble cross-domain delta digest from existing Phase 2 read responses only."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
import logging
from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.delta_digest import (
    DELTA_DIGEST_CONTRACT_ID,
    CrossDomainDeltaDigestResponse,
    DeltaDigestEvidenceStatus,
    DeltaDigestSection,
    DeltaDigestSectionKey,
    DeltaDigestSourceProvenance,
    DeltaDigestSafetyFraming,
)
from app_api.schemas.change_intelligence import RecentChangeCompletenessPosture
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.devices import DevicesListResponse
from app_api.schemas.policies import PoliciesListResponse
from app_api.schemas.topology import TopologyResponse
from app_api.services.capabilities import build_capabilities_list_response
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
    build_recent_change_summary_response,
)
from app_api.services.devices import build_devices_list_response
from app_api.services.platform import build_platform_status_response
from app_api.services.policies import build_policies_list_response
from app_api.services.topology import build_topology_response

logger = logging.getLogger(__name__)

_SECTION_ORDER: tuple[DeltaDigestSectionKey, ...] = (
    "recent_sync_anchor",
    "device_inventory_delta",
    "topology_coverage_posture",
    "policy_delta_degraded",
    "change_intelligence_pointer",
    "recommended_pivots",
    "caveats_missing_evidence",
)


def _safe_call(label: str, fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs), None
    except Exception as exc:  # noqa: BLE001 — digest must survive partial failures
        logger.warning("delta_digest: %s assembly failed: %s", label, exc)
        return None, f"{type(exc).__name__}: {exc}"


def _count_degraded_postures(policies: PoliciesListResponse) -> tuple[int, int, int]:
    degraded = unknown = ok = 0
    for it in policies.items:
        p = it.degraded_policy_v1.posture
        if p == "degraded":
            degraded += 1
        elif p == "unknown":
            unknown += 1
        else:
            ok += 1
    return degraded, unknown, ok


def build_cross_domain_delta_digest_response(
    *,
    sync_runs_limit: int = RECENT_CHANGE_SYNC_RUNS_DEFAULT,
) -> CrossDomainDeltaDigestResponse:
    """Compose bounded cross-domain digest; no new collector or diff semantics."""
    settings = get_settings()
    bounded = max(1, min(int(sync_runs_limit), RECENT_CHANGE_SYNC_RUNS_MAX))
    generated_at = datetime.now(UTC)

    with ThreadPoolExecutor(max_workers=6) as executor:
        platform_future = executor.submit(build_platform_status_response)
        recent_change_future = executor.submit(
            build_recent_change_summary_response,
            sync_runs_limit=bounded,
        )
        devices_future = executor.submit(_safe_call, "devices", build_devices_list_response)
        topology_future = executor.submit(_safe_call, "topology", build_topology_response)
        policies_future = executor.submit(_safe_call, "policies", build_policies_list_response)
        capabilities_future = executor.submit(
            _safe_call,
            "capabilities",
            build_capabilities_list_response,
        )

        platform = platform_future.result()
        recent_change = recent_change_future.result()
        devices, devices_err = devices_future.result()
        topology, topology_err = topology_future.result()
        policies, policies_err = policies_future.result()
        capabilities, capabilities_err = capabilities_future.result()

    provenance: list[DeltaDigestSourceProvenance] = [
        DeltaDigestSourceProvenance(
            source="platform_status",
            note="Platform status read path and recovery posture (bounded probe semantics).",
            generated_at=platform.generated_at,
            data_status_or_serving_hint=platform.status,
        ),
        DeltaDigestSourceProvenance(
            source="change_intelligence",
            note="Recent change intelligence aggregation (embedded; same window as sync_runs_limit).",
            generated_at=recent_change.metadata.generated_at,
            data_status_or_serving_hint=f"sync_runs_limit_applied={recent_change.sync_runs_limit_applied}",
        ),
    ]

    if devices is not None:
        provenance.append(
            DeltaDigestSourceProvenance(
                source="devices",
                note="Device inventory list and comparison posture.",
                generated_at=devices.generated_at,
                data_status_or_serving_hint=devices.data_status,
            )
        )
    if topology is not None:
        provenance.append(
            DeltaDigestSourceProvenance(
                source="topology",
                note="Topology snapshot and coverage summary.",
                generated_at=topology.generated_at,
                data_status_or_serving_hint=topology.data_status,
            )
        )
    if policies is not None:
        provenance.append(
            DeltaDigestSourceProvenance(
                source="policies",
                note="Normalized policy inventory and degraded_policy_v1 classification.",
                generated_at=policies.generated_at,
                data_status_or_serving_hint=policies.data_status,
            )
        )
    if capabilities is not None:
        provenance.append(
            DeltaDigestSourceProvenance(
                source="capabilities",
                note="Capabilities matrix (planning-support interpretation only).",
                generated_at=capabilities.generated_at,
                data_status_or_serving_hint=capabilities.data_status,
            )
        )

    sections: list[DeltaDigestSection] = []
    digest_notes: list[str] = [
        "Digest sections summarize visible fields from existing contracts; absence of evidence is valid.",
        "No cross-domain causal narrative is inferred—operators must open per-domain views for detail.",
    ]

    # 1 Sync anchor
    sync_detail = [
        f"Platform status generated_at (UTC): {platform.generated_at.isoformat()}.",
        f"Recovery baseline posture: {platform.recovery.baseline_posture}.",
        f"Read-side posture: {platform.recovery.read_side_posture}.",
    ]
    for d in recent_change.domains:
        if d.domain in ("workflow_history", "audit_history") and d.latest_sync_finished_at:
            sync_detail.append(
                f"Latest sync finish observed in {d.domain} slice: "
                f"{d.latest_sync_finished_at.isoformat()} (bounded window)."
            )
    sections.append(
        DeltaDigestSection(
            section_key="recent_sync_anchor",
            headline="Recent sync and platform observation anchor (bounded).",
            evidence_status="present",
            detail_notes=sync_detail,
            caveats=[
                "Sync-run visibility is read-side history only—not workflow execution authority.",
            ],
        )
    )

    # 2 Devices
    if devices is None:
        sections.append(
            DeltaDigestSection(
                section_key="device_inventory_delta",
                headline="Device inventory delta summary unavailable for this assembly.",
                evidence_status="unavailable",
                detail_notes=["Devices list could not be assembled for the digest."],
                caveats=[f"Assembly error: {devices_err or 'unknown'}."],
            )
        )
    else:
        cmp_ = devices.comparison_to_latest_persisted
        dev_notes = [
            f"data_status={devices.data_status}; serving_mode={devices.serving_mode}.",
            f"comparison_to_latest_persisted.status={cmp_.status}.",
            f"inventory count={devices.count}; device_count_delta={cmp_.device_count_delta}.",
            f"history.status={devices.history.status}.",
        ]
        dev_caveats: list[str] = []
        if devices.history.status == "unavailable":
            dev_caveats.append("Inventory history comparison not available—fresh baseline or missing snapshots possible.")
        if devices.data_status != "live":
            dev_caveats.append("Devices evidence is not fully live-backed; see evidence_confidence in /devices.")
        dev_status: DeltaDigestEvidenceStatus = (
            "partial" if devices.history.status != "comparison_ready" else "present"
        )
        sections.append(
            DeltaDigestSection(
                section_key="device_inventory_delta",
                headline="Device inventory delta summary (bounded list and comparison fields).",
                evidence_status=dev_status,
                detail_notes=dev_notes,
                caveats=dev_caveats,
            )
        )

    # 3 Topology
    if topology is None:
        sections.append(
            DeltaDigestSection(
                section_key="topology_coverage_posture",
                headline="Topology coverage summary unavailable for this assembly.",
                evidence_status="unavailable",
                detail_notes=["Topology response could not be assembled for the digest."],
                caveats=[f"Assembly error: {topology_err or 'unknown'}."],
            )
        )
    else:
        cov = topology.coverage_summary
        topo_notes = [
            f"data_status={topology.data_status}; serving_mode={topology.serving_mode}.",
            f"coverage inference_posture={cov.inference_posture}; collection_posture={cov.collection_posture}.",
            f"node_participation_posture={cov.node_participation_posture}.",
            f"comparison_to_latest_persisted.status={topology.comparison_to_latest_persisted.status}.",
        ]
        topo_caveats = [
            "Topology may be partial or inferred—see topology contract for pairing and completeness limits.",
        ]
        topo_status: DeltaDigestEvidenceStatus = (
            "partial" if topology.data_status == "degraded" or cov.collection_posture == "degraded" else "present"
        )
        sections.append(
            DeltaDigestSection(
                section_key="topology_coverage_posture",
                headline="Topology coverage and posture summary (existing coverage_summary fields).",
                evidence_status=topo_status,
                detail_notes=topo_notes,
                caveats=topo_caveats,
            )
        )

    # 4 Policies + degraded
    if policies is None:
        sections.append(
            DeltaDigestSection(
                section_key="policy_delta_degraded",
                headline="Policy inventory summary unavailable for this assembly.",
                evidence_status="unavailable",
                detail_notes=["Policies list could not be assembled for the digest."],
                caveats=[f"Assembly error: {policies_err or 'unknown'}."],
            )
        )
    else:
        dg, un, ok = _count_degraded_postures(policies)
        pol_notes = [
            f"data_status={policies.data_status}; policy rows returned={len(policies.items)}; inventory count={policies.count}.",
            f"degraded_policy_v1 posture counts — degraded={dg}, unknown={un}, ok={ok}.",
            f"policy history.status={policies.history.status}.",
        ]
        pol_caveats: list[str] = [
            "degraded_policy_v1 is inventory classification—not dataplane proof or SLA.",
        ]
        if policies.detail_mode == "counters_only":
            pol_caveats.append("Policy detail mode may be counters-only—per-policy evidence delta/timeline are separate routes.")
        pol_status: DeltaDigestEvidenceStatus = "present" if policies.items else "absent"
        sections.append(
            DeltaDigestSection(
                section_key="policy_delta_degraded",
                headline="Policy inventory and degraded_policy_v1 summary (bounded inventory slice).",
                evidence_status=pol_status,
                detail_notes=pol_notes,
                caveats=pol_caveats,
            )
        )

    # 5 Change intelligence pointer
    ci_notes = [
        f"Embedded contract: {recent_change.safety.contract_id}.",
        f"completeness_posture={recent_change.completeness_posture}; window={recent_change.window_semantics}.",
    ]
    sections.append(
        DeltaDigestSection(
            section_key="change_intelligence_pointer",
            headline="Change intelligence (embedded recent-summary; same bounded vocabulary).",
            evidence_status="present",
            detail_notes=ci_notes,
            caveats=list(recent_change.aggregation_notes)[:12],
        )
    )

    # 6 Pivots
    pivot_notes = [
        "Suggested navigation targets (read-only): view=investigation, view=situation-room, view=policies, view=topology, global operator search in shell.",
        "Dossier workspaces: policy_workspace=dossier, topology_workspace=dossier when ids are known.",
    ]
    if policies and policies.items:
        pivot_notes.append(f"Example policy_id for drill-down: {policies.items[0].policy_id}.")
    if topology and topology.topology.nodes:
        pivot_notes.append(f"Example topology node_id for drill-down: {topology.topology.nodes[0].node_id}.")
    sections.append(
        DeltaDigestSection(
            section_key="recommended_pivots",
            headline="Recommended pivots (navigation suggestions—not incident priority).",
            evidence_status="present",
            detail_notes=pivot_notes,
            caveats=[
                "Pivot suggestions are derived from visible inventory rows and shell routes only.",
            ],
        )
    )

    # 7 Caveats merge
    merged: list[str] = []
    merged.extend(recent_change.aggregation_notes)
    if capabilities is None:
        merged.append(f"Capabilities excerpt omitted: {capabilities_err or 'unavailable'}.")
    else:
        merged.append(
            "Capabilities matrix available—interpretation-support only; not workflow eligibility."
        )
    if devices_err:
        merged.append("Devices assembly failed; section marked unavailable.")
    if topology_err:
        merged.append("Topology assembly failed; section marked unavailable.")
    if policies_err:
        merged.append("Policies assembly failed; section marked unavailable.")

    sections.append(
        DeltaDigestSection(
            section_key="caveats_missing_evidence",
            headline="Caveats and missing evidence (merged; bounded partiality expected).",
            evidence_status="partial",
            detail_notes=merged[:24],
            caveats=[
                "This list is not exhaustive of all backend caveats—open owning APIs for full detail.",
            ],
        )
    )

    # Validate order
    assert len(sections) == len(_SECTION_ORDER)
    for idx, key in enumerate(_SECTION_ORDER):
        assert sections[idx].section_key == key

    any_unavailable = any(s.evidence_status == "unavailable" for s in sections)
    completeness: RecentChangeCompletenessPosture = (
        "bounded_partial" if any_unavailable or recent_change.completeness_posture == "bounded_partial" else "best_effort_visible_signals_only"
    )

    meta = ApiResponseMetadata(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=generated_at,
    )

    return CrossDomainDeltaDigestResponse(
        metadata=meta,
        contract_id=DELTA_DIGEST_CONTRACT_ID,
        safety=DeltaDigestSafetyFraming(),
        sync_runs_limit_applied=bounded,
        completeness_posture=completeness,
        recent_change_summary=recent_change,
        source_provenance=provenance,
        sections=sections,
        digest_framing_notes=digest_notes,
    )

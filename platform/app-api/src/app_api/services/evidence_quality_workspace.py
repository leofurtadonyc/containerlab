"""Assemble evidence quality / collection assurance summary from existing read responses only."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.devices import DevicesListResponse
from app_api.schemas.evidence_quality_workspace import (
    EVIDENCE_QUALITY_WORKSPACE_V1_CONTRACT_ID,
    EvidenceQualityRow,
    EvidenceQualitySafetyFraming,
    EvidenceQualitySummaryResponse,
    ReadPathReliabilityPosture,
)
from app_api.schemas.policies import PoliciesListResponse
from app_api.schemas.topology import TopologyResponse
from app_api.services.capabilities import build_capabilities_list_response
from app_api.services.change_intelligence import RECENT_CHANGE_SYNC_RUNS_DEFAULT, RECENT_CHANGE_SYNC_RUNS_MAX
from app_api.services.devices import build_devices_list_response
from app_api.services.platform import build_platform_status_response
from app_api.services.policies import build_policies_list_response
from app_api.services.topology import build_topology_response

logger = logging.getLogger(__name__)


def _safe_call(label: str, fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs), None
    except Exception as exc:  # noqa: BLE001 — summary must survive partial failures
        logger.warning("evidence_quality_workspace: %s assembly failed: %s", label, exc)
        return None, f"{type(exc).__name__}: {exc}"


def _collection_summary_from_platform(platform) -> str:
    if not platform or not platform.read_paths:
        return "Platform read-path status unavailable for this assembly."
    parts: list[str] = []
    for rp in platform.read_paths:
        parts.append(
            f"{rp.model_family}: observation_state={rp.observation_state} "
            f"failures={rp.collection_failure_count} partial={rp.collection_partial_count}"
        )
    return "Collector-to-backend read paths (bounded): " + "; ".join(parts)


def _reliability_posture(rows: list[EvidenceQualityRow]) -> ReadPathReliabilityPosture:
    if not rows:
        return "heavily_limited"
    if any(
        r.evidence_subject_domain == "global" and r.evidence_quality_dimension == "cross_domain_scope_note"
        for r in rows
    ):
        return "bounded_ok"
    ca = sum(1 for r in rows if r.evidence_quality_dimension == "collection_assurance")
    fb = sum(1 for r in rows if r.evidence_quality_dimension == "fallback_conditions")
    sp = sum(1 for r in rows if r.evidence_quality_dimension == "sparse_history_anchors")
    if ca >= 2 or (fb >= 2 and sp >= 1):
        return "heavily_limited"
    if len(rows) >= 3 or fb or sp or ca:
        return "mixed_degraded"
    return "bounded_ok"


def _rows_from_platform(platform) -> list[EvidenceQualityRow]:
    rows: list[EvidenceQualityRow] = []
    if platform is None:
        return rows

    rec = platform.recovery
    if rec.read_side_posture != "live_recollection_ready":
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="fallback_conditions",
                evidence_subject_domain="platform_recovery",
                summary=(
                    f"Platform recovery read-side posture is {rec.read_side_posture}; evidence may rely on "
                    "persisted baselines or degraded assembly."
                ),
                detail=rec.summary[:500] if rec.summary else None,
                source_citations=["GET /api/v1/platform/status — recovery.read_side_posture"],
            )
        )

    for rp in platform.read_paths or []:
        if rp.observation_state in ("degraded", "unreachable", "unknown"):
            rows.append(
                EvidenceQualityRow(
                    evidence_quality_dimension="collection_assurance",
                    evidence_subject_domain="platform_read_paths",
                    summary=(
                        f"Read path {rp.model_family} reports observation_state={rp.observation_state} with "
                        f"degraded_scope_summary cues."
                    ),
                    detail=rp.degraded_scope_summary[:400] if rp.degraded_scope_summary else None,
                    source_citations=["GET /api/v1/platform/status — read_paths[]"],
                )
            )
        if rp.collection_failure_count and rp.collection_failure_count > 0:
            rows.append(
                EvidenceQualityRow(
                    evidence_quality_dimension="collection_assurance",
                    evidence_subject_domain="platform_read_paths",
                    summary=(
                        f"Read path {rp.model_family} reports collection_failure_count={rp.collection_failure_count} "
                        f"(collection_partial_count={rp.collection_partial_count})."
                    ),
                    detail=rp.summary[:400] if rp.summary else None,
                    source_citations=["GET /api/v1/platform/status — read_paths[]"],
                )
            )
        if rp.collection_posture in ("degraded", "blocked"):
            rows.append(
                EvidenceQualityRow(
                    evidence_quality_dimension="read_path_fragility",
                    evidence_subject_domain="platform_read_paths",
                    summary=(
                        f"Read path {rp.model_family} collection_posture={rp.collection_posture} for live topology/"
                        "policy/inventory collection posture."
                    ),
                    source_citations=["GET /api/v1/platform/status — read_paths[].collection_posture"],
                )
            )
    return rows


def _rows_from_devices(devices: DevicesListResponse | None) -> list[EvidenceQualityRow]:
    rows: list[EvidenceQualityRow] = []
    if devices is None:
        return rows
    if devices.serving_mode == "persisted_fallback":
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="fallback_conditions",
                evidence_subject_domain="devices",
                summary="Devices list is served from persisted_fallback mode; live collector parity may be absent.",
                detail=devices.summary[:400] if devices.summary else None,
                source_citations=["GET /api/v1/devices — serving_mode"],
            )
        )
    if devices.data_status in ("degraded", "placeholder", "integration_scaffold"):
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="read_path_fragility",
                evidence_subject_domain="devices",
                summary=f"Devices data_status={devices.data_status} (bounded inventory truth).",
                source_citations=["GET /api/v1/devices — data_status"],
            )
        )
    if devices.history.status in ("unavailable", "current_only"):
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="sparse_history_anchors",
                evidence_subject_domain="devices",
                summary=(
                    f"Inventory history window is {devices.history.status}; comparison depth is limited vs "
                    "comparison_ready assemblies."
                ),
                detail=devices.history.summary[:400] if devices.history.summary else None,
                source_citations=["GET /api/v1/devices — history.status"],
            )
        )
    if devices.comparison_to_latest_persisted.status == "unavailable":
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="comparison_limits",
                evidence_subject_domain="devices",
                summary="Live inventory vs latest persisted comparison is unavailable; anchor honesty is limited.",
                source_citations=["GET /api/v1/devices — comparison_to_latest_persisted.status"],
            )
        )
    return rows


def _rows_from_policies(policies: PoliciesListResponse | None) -> list[EvidenceQualityRow]:
    rows: list[EvidenceQualityRow] = []
    if policies is None:
        return rows
    if policies.serving_mode == "persisted_fallback":
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="fallback_conditions",
                evidence_subject_domain="policies",
                summary="Policies list is served from persisted_fallback mode; live collector parity may be absent.",
                detail=policies.summary[:400] if policies.summary else None,
                source_citations=["GET /api/v1/policies — serving_mode"],
            )
        )
    if policies.empty_reason == "collector_unavailable":
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="collection_assurance",
                evidence_subject_domain="policies",
                summary="Policies empty_reason indicates collector_unavailable-class honesty for this assembly.",
                source_citations=["GET /api/v1/policies — empty_reason"],
            )
        )
    if policies.detail_mode in ("counters_only", "unknown"):
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="comparison_limits",
                evidence_subject_domain="policies",
                summary=f"Policy detail_mode={policies.detail_mode} caps per-policy depth versus richer modes.",
                source_citations=["GET /api/v1/policies — detail_mode"],
            )
        )
    if policies.history.status in ("unavailable", "current_only"):
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="sparse_history_anchors",
                evidence_subject_domain="policies",
                summary=(
                    f"Policy history window is {policies.history.status}; comparison-ready depth may be limited."
                ),
                detail=policies.history.summary[:400] if policies.history.summary else None,
                source_citations=["GET /api/v1/policies — history.status"],
            )
        )
    if policies.comparison_to_latest_persisted.status == "unavailable":
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="comparison_limits",
                evidence_subject_domain="policies",
                summary="Live policy list vs latest persisted comparison is unavailable.",
                source_citations=["GET /api/v1/policies — comparison_to_latest_persisted.status"],
            )
        )
    return rows


def _rows_from_topology(topology: TopologyResponse | None) -> list[EvidenceQualityRow]:
    rows: list[EvidenceQualityRow] = []
    if topology is None:
        return rows
    if topology.serving_mode == "persisted_fallback":
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="fallback_conditions",
                evidence_subject_domain="topology",
                summary="Topology is served from persisted_fallback mode; live collector parity may be absent.",
                detail=topology.summary[:400] if topology.summary else None,
                source_citations=["GET /api/v1/topology — serving_mode"],
            )
        )
    cov = topology.coverage_summary
    if cov.collection_posture in ("degraded", "blocked"):
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="read_path_fragility",
                evidence_subject_domain="topology",
                summary=f"Topology coverage_summary.collection_posture={cov.collection_posture}.",
                detail=cov.summary[:400] if cov.summary else None,
                source_citations=["GET /api/v1/topology — coverage_summary.collection_posture"],
            )
        )
    if topology.history.status in ("unavailable", "current_only"):
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="sparse_history_anchors",
                evidence_subject_domain="topology",
                summary=(
                    f"Topology history window is {topology.history.status}; comparison-ready depth may be limited."
                ),
                detail=topology.history.summary[:400] if topology.history.summary else None,
                source_citations=["GET /api/v1/topology — history.status"],
            )
        )
    if topology.comparison_to_latest_persisted.status == "unavailable":
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="comparison_limits",
                evidence_subject_domain="topology",
                summary="Live topology vs latest persisted comparison is unavailable.",
                source_citations=["GET /api/v1/topology — comparison_to_latest_persisted.status"],
            )
        )
    return rows


def _rows_from_capabilities(capabilities) -> list[EvidenceQualityRow]:
    rows: list[EvidenceQualityRow] = []
    if capabilities is None:
        return rows
    if capabilities.data_status == "placeholder":
        rows.append(
            EvidenceQualityRow(
                evidence_quality_dimension="unsupported_partial_detail",
                evidence_subject_domain="capabilities",
                summary="Capabilities matrix is still placeholder-class; planning-support depth is bounded.",
                source_citations=["GET /api/v1/capabilities — data_status"],
            )
        )
    return rows


def build_evidence_quality_workspace_response(
    *,
    sync_runs_limit: int = RECENT_CHANGE_SYNC_RUNS_DEFAULT,
) -> EvidenceQualitySummaryResponse:
    """Compose bounded evidence-quality observations; no new collector, persistence, or scoring engines."""
    settings = get_settings()
    bounded = max(1, min(int(sync_runs_limit), RECENT_CHANGE_SYNC_RUNS_MAX))
    now = datetime.now(tz=UTC)

    platform, platform_err = _safe_call("platform", build_platform_status_response)
    devices, devices_err = _safe_call("devices", build_devices_list_response)
    policies, policies_err = _safe_call("policies", build_policies_list_response)
    topology, topology_err = _safe_call("topology", build_topology_response)
    capabilities, capabilities_err = _safe_call("capabilities", build_capabilities_list_response)

    assembly_notes: list[str] = []
    if platform_err:
        assembly_notes.append(f"platform: {platform_err}")
    if devices_err:
        assembly_notes.append(f"devices: {devices_err}")
    if policies_err:
        assembly_notes.append(f"policies: {policies_err}")
    if topology_err:
        assembly_notes.append(f"topology: {topology_err}")
    if capabilities_err:
        assembly_notes.append(f"capabilities: {capabilities_err}")

    rows: list[EvidenceQualityRow] = []
    if platform is not None:
        rows.extend(_rows_from_platform(platform))
    if devices is not None:
        rows.extend(_rows_from_devices(devices))
    if policies is not None:
        rows.extend(_rows_from_policies(policies))
    if topology is not None:
        rows.extend(_rows_from_topology(topology))
    if capabilities is not None:
        rows.extend(_rows_from_capabilities(capabilities))

    if not rows:
        if not (platform_err and devices_err and policies_err and topology_err):
            rows.append(
                EvidenceQualityRow(
                    evidence_quality_dimension="cross_domain_scope_note",
                    evidence_subject_domain="global",
                    summary=(
                        "No explicit weakness signals were emitted from the sampled fields for this assembly; bounded "
                        "partiality may still apply—see per-domain GET responses."
                    ),
                    source_citations=[
                        "GET /api/v1/platform/status",
                        "GET /api/v1/devices",
                        "GET /api/v1/policies",
                        "GET /api/v1/topology",
                    ],
                )
            )
        else:
            rows.append(
                EvidenceQualityRow(
                    evidence_quality_dimension="cross_domain_scope_note",
                    evidence_subject_domain="global",
                    summary=(
                        "Core domain assemblies were unavailable for this response; see assembly_notes for partial "
                        "failure details."
                    ),
                    source_citations=[],
                )
            )

    posture = _reliability_posture(rows)
    coll_summary = _collection_summary_from_platform(platform)

    caveats: list[str] = [
        "Evidence quality rows cite existing response fields only; they are not a health score, validation verdict, "
        "or remediation plan.",
        "sync_runs_limit_applied is reserved for alignment with other bounded summaries; this assembly does not "
        "embed change intelligence by default.",
    ]

    scope_summary = (
        f"Evidence quality (bounded): read_path_reliability_posture={posture}; "
        f"sync_runs_limit_applied={bounded}; rows={len(rows)}."
    )

    return EvidenceQualitySummaryResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=EVIDENCE_QUALITY_WORKSPACE_V1_CONTRACT_ID,
        safety_framing=EvidenceQualitySafetyFraming(),
        read_path_reliability_posture=posture,
        collection_assurance_summary=coll_summary,
        scope_summary=scope_summary,
        sync_runs_limit_applied=bounded,
        rows=rows,
        caveats=caveats,
        assembly_notes=assembly_notes,
    )

"""Assemble per-policy path-analysis read responses (Phase 2, read-only).

Consumes the same policy inventory pipeline as ``services.policies`` and optional
latest persisted topology/inventory snapshot timestamps for freshness anchors.
Does not call the full topology collector path (avoids duplicate collector load);
topology partiality cues use latest **persisted** snapshot when available.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.integrations.collector.policies import CollectorPolicySnapshot
from app_api.models.policy import PolicyInventoryRecord
from app_api.persistence.read_side import load_latest_inventory_snapshot, load_latest_topology_snapshot
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.path_analysis import (
    DEFAULT_PATH_ANALYSIS_EXPLICIT_NON_CLAIMS,
    IntendedPathHint,
    ObservedPathHint,
    PathAnalysisCaveat,
    PathAnalysisCandidatePathSummary,
    PathAnalysisCurrentRowPosture,
    PathAnalysisFreshness,
    PathAnalysisSafetyFraming,
    PathAnalysisSubject,
    PathAnalysisTruthAlignment,
    PathAnalysisViewResponse,
    PathEvidenceAttribution,
    PathAnalysisTruthAlignmentPosture,
)
from app_api.services.policies import _build_policy_inventory


def _serving_mode_echo(
    collector_snapshot: CollectorPolicySnapshot,
    persisted_at: datetime | None,
) -> str:
    if collector_snapshot.status == "collector_unavailable":
        return "persisted_fallback" if persisted_at is not None else "unknown"
    if collector_snapshot.status == "partial_live_feed":
        return "mixed"
    if collector_snapshot.status == "live_normalized_feed":
        return "live"
    return "unknown"


def _truth_alignment_for_policy(
    policy: PolicyInventoryRecord,
) -> tuple[PathAnalysisTruthAlignmentPosture, str]:
    if policy.support_state in ("unsupported", "not_implemented_in_platform"):
        return (
            "insufficient_evidence",
            "Policy support posture limits path-analysis interpretation for this record.",
        )
    if policy.support_state == "partially_supported":
        return (
            "uncertain",
            "Policy is partially supported in the platform; intended versus observed alignment is coarse only.",
        )
    if policy.observed_state == "active" and policy.intent_state == "declared":
        return (
            "intended_vs_observed_aligned",
            "Declared intent and observed policy state are both present; this is not dataplane verification.",
        )
    if policy.observed_state in ("inactive", "degraded") and policy.intent_state == "declared":
        return (
            "uncertain",
            "Declared intent is present but observed policy state is not active; no forwarding verdict is implied.",
        )
    return (
        "uncertain",
        "Bounded policy read signals do not establish a stronger alignment posture.",
    )


def build_policy_path_analysis_response(policy_id: str) -> PathAnalysisViewResponse | None:
    """Return path analysis for ``policy_id``, or ``None`` if the policy record is absent."""
    settings = get_settings()
    collector_snapshot, policy_snapshot, persisted_at = _build_policy_inventory()
    record = next((r for r in policy_snapshot.records if r.policy_id == policy_id), None)
    if record is None:
        return None

    row_posture: PathAnalysisCurrentRowPosture = (
        "stale"
        if collector_snapshot.status == "collector_unavailable" and persisted_at is not None
        else "current"
    )

    topo_persisted = load_latest_topology_snapshot()
    inv_persisted = load_latest_inventory_snapshot()
    topo_observed_at = (
        topo_persisted.snapshot.observed_at if topo_persisted is not None else None
    )
    inv_observed_at = inv_persisted.snapshot.observed_at if inv_persisted is not None else None

    intended: list[IntendedPathHint] = [
        IntendedPathHint(
            hint_id="intent_endpoints",
            kind="policy_intent_endpoints",
            summary=(
                f"SR policy anchors headend {record.headend}, endpoint {record.endpoint}, color {record.color} "
                f"(declarative intent; not a computed TE path)."
            ),
            evidence_sources=[
                PathEvidenceAttribution(
                    domain="policies",
                    reference="GET /api/v1/policies (PolicyRecord headend, endpoint, color, intent_state)",
                ),
            ],
        )
    ]
    for idx, cp in enumerate(record.candidate_paths):
        intended.append(
            IntendedPathHint(
                hint_id=f"declared_candidate_{idx}",
                kind="policy_declared_candidate",
                summary=(
                    f"Declared candidate path {cp.name!r} "
                    f"(preference={cp.preference}); not controller CSPF output."
                ),
                evidence_sources=[
                    PathEvidenceAttribution(
                        domain="policies",
                        reference=f"PolicyInventoryRecord.candidate_paths[{idx}]",
                    ),
                ],
            )
        )

    observed: list[ObservedPathHint] = [
        ObservedPathHint(
            hint_id="policy_observed",
            kind="policy_observed_state",
            summary=f"Observed policy state is {record.observed_state!r}; health {record.health_state!r}.",
            evidence_sources=[
                PathEvidenceAttribution(
                    domain="policies",
                    reference="GET /api/v1/policies (PolicyRecord observed_state, health_state)",
                ),
            ],
            notes=list(record.notes)[:5],
        )
    ]
    for idx, cp in enumerate(record.candidate_paths):
        observed.append(
            ObservedPathHint(
                hint_id=f"candidate_observed_{idx}",
                kind="policy_candidate_path_state",
                summary=f"Candidate path {cp.name!r} observed path_state={cp.path_state!r}.",
                candidate_path_name=cp.name,
                observed_path_state=cp.path_state,
                evidence_sources=[
                    PathEvidenceAttribution(
                        domain="policies",
                        reference=f"PolicyInventoryRecord.candidate_paths[{idx}].path_state",
                    ),
                ],
                notes=list(cp.notes)[:5],
            )
        )

    if topo_persisted is not None:
        observed.append(
            ObservedPathHint(
                hint_id="topology_context",
                kind="topology_context_only",
                summary=(
                    f"Latest persisted topology snapshot is {topo_persisted.snapshot.completeness!r} complete "
                    f"(inference-bounded links; not validated adjacency truth)."
                ),
                evidence_sources=[
                    PathEvidenceAttribution(
                        domain="topology",
                        reference="GET /api/v1/topology (latest persisted snapshot anchor only here)",
                    ),
                ],
                notes=[],
            )
        )

    if inv_persisted is not None:
        observed.append(
            ObservedPathHint(
                hint_id="inventory_context",
                kind="inventory_context_only",
                summary="Inventory snapshot timestamps may contextualize endpoints; not path verification.",
                evidence_sources=[
                    PathEvidenceAttribution(
                        domain="devices",
                        reference="GET /api/v1/devices (inventory snapshot family)",
                    ),
                ],
                notes=[],
            )
        )

    summaries = [
        PathAnalysisCandidatePathSummary(
            name=cp.name,
            current_posture=row_posture,
            path_state=cp.path_state,
            last_recorded_path_state=cp.path_state,
            preference=cp.preference,
            notes=list(cp.notes),
        )
        for cp in record.candidate_paths
    ]

    evidence_rollup: list[PathEvidenceAttribution] = [
        PathEvidenceAttribution(domain="policies", reference="GET /api/v1/policies"),
        PathEvidenceAttribution(domain="platform_status", reference="GET /api/v1/platform/status (read_paths)"),
    ]
    if topo_persisted is not None:
        evidence_rollup.append(
            PathEvidenceAttribution(domain="topology", reference="GET /api/v1/topology"),
        )
    if inv_persisted is not None:
        evidence_rollup.append(
            PathEvidenceAttribution(domain="devices", reference="GET /api/v1/devices"),
        )
    evidence_rollup.append(
        PathEvidenceAttribution(
            domain="odl_controller_probe",
            reference="Platform status ODL observation (reachability only; not path truth)",
        )
    )

    posture, alignment_summary = _truth_alignment_for_policy(record)

    caveats: list[PathAnalysisCaveat] = [
        PathAnalysisCaveat(
            code="no_dataplane_evidence",
            message=(
                "Path analysis does not include per-hop forwarding, label stack, or interface-level verification."
            ),
        )
    ]
    if policy_snapshot.completeness == "partial" or record.support_state == "partially_supported":
        caveats.append(
            PathAnalysisCaveat(
                code="policy_detail_partial",
                message=(
                    "Policy inventory remains bounded; candidate-path and observed fields are read-side signals only."
                ),
            )
        )
    if topo_persisted is not None and topo_persisted.snapshot.completeness == "partial":
        caveats.append(
            PathAnalysisCaveat(
                code="topology_partial",
                message="Topology is explicitly partial; inferred links are not adjacency validation.",
            )
        )
        caveats.append(
            PathAnalysisCaveat(
                code="inferred_topology_links",
                message="Topology links may be inference-bounded; use topology partiality axes on the topology API.",
            )
        )
    if row_posture == "stale":
        caveats.append(
            PathAnalysisCaveat(
                code="persisted_fallback_stale_row",
                message="Policy row posture is stale (persisted fallback); live path signals may differ after recovery.",
            )
        )

    now = datetime.now(tz=UTC)
    return PathAnalysisViewResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        safety_framing=PathAnalysisSafetyFraming(
            authority_posture="read_only_assembly_non_authoritative",
            explicit_non_claims=list(DEFAULT_PATH_ANALYSIS_EXPLICIT_NON_CLAIMS),
        ),
        subject=PathAnalysisSubject(
            policy_id=record.policy_id,
            policy_name=record.policy_name,
            policy_type=record.policy_type,
            color=record.color,
            headend=record.headend,
            endpoint=record.endpoint,
            source_target=record.source_target,
        ),
        intended_path_hints=intended,
        observed_path_hints=observed,
        candidate_path_summaries=summaries,
        evidence_sources=evidence_rollup,
        freshness=PathAnalysisFreshness(
            assembly_generated_at=now,
            policy_snapshot_observed_at=policy_snapshot.observed_at,
            topology_snapshot_observed_at=topo_observed_at,
            inventory_snapshot_observed_at=inv_observed_at,
            serving_mode_echo=_serving_mode_echo(collector_snapshot, persisted_at),
        ),
        truth_alignment=PathAnalysisTruthAlignment(posture=posture, summary=alignment_summary),
        caveats=caveats,
    )

"""Assemble Policy Explainability Workspace v1 read responses (Phase 2, read-only).

Composes existing bounded contracts only; no fabricated rejections or workflow authority.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.path_analysis import PathAnalysisCandidatePathSummary
from app_api.schemas.policy_explainability import (
    POLICY_EXPLAINABILITY_WORKSPACE_V1_CONTRACT_ID,
    ExplainabilityCandidatePathRollup,
    ExplainabilityCandidateSignal,
    ExplainabilityUnknownCandidatePosture,
    PolicyExplainabilityNavigationTargets,
    PolicyExplainabilityResponse,
    PolicyExplainabilitySparseSignals,
)
from app_api.schemas.policies import CandidatePathRecord
from app_api.schemas.policy_dossier import PolicyDossierFreshnessBlock
from app_api.services.path_analysis import build_policy_path_analysis_response
from app_api.services.policy_dossier import (
    _merge_caveats_ordered,
    _policy_record_for_inventory_row,
    _topology_hints_from_impact,
)
from app_api.services.policy_evidence_delta import build_policy_evidence_delta_response
from app_api.services.policy_evidence_timeline import build_policy_evidence_timeline_response
from app_api.services.policy_topology_impact import build_policy_topology_impact_response
from app_api.services.policies import _build_policy_inventory

_MAX_HINT_LINES = 5


def _signal_from_path_state(state: str) -> ExplainabilityCandidateSignal:
    if state == "active":
        return "active_signal"
    if state == "inactive":
        return "inactive_signal"
    return "unknown_signal"


def _rollups_from_summaries(
    summaries: list[PathAnalysisCandidatePathSummary],
) -> list[ExplainabilityCandidatePathRollup]:
    out: list[ExplainabilityCandidatePathRollup] = []
    for s in summaries:
        out.append(
            ExplainabilityCandidatePathRollup(
                name=s.name,
                signal=_signal_from_path_state(s.path_state),
                path_state=s.path_state,
                preference=s.preference,
                hint_lines=list(s.notes)[:_MAX_HINT_LINES],
            )
        )
    return out


def _rollups_from_inventory_only(candidate_paths: list[CandidatePathRecord]) -> list[ExplainabilityCandidatePathRollup]:
    out: list[ExplainabilityCandidatePathRollup] = []
    for cp in candidate_paths:
        out.append(
            ExplainabilityCandidatePathRollup(
                name=cp.name,
                signal=_signal_from_path_state(cp.path_state),
                path_state=cp.path_state,
                preference=cp.preference,
                hint_lines=list(cp.notes)[:_MAX_HINT_LINES],
            )
        )
    return out


def _unknown_candidate_posture(
    rollups: list[ExplainabilityCandidatePathRollup],
) -> ExplainabilityUnknownCandidatePosture:
    if not rollups:
        return "full"
    signals = {r.signal for r in rollups}
    if signals == {"unknown_signal"}:
        return "full"
    if "unknown_signal" in signals:
        return "partial"
    return "none"


def build_policy_explainability_response(policy_id: str) -> PolicyExplainabilityResponse | None:
    """Return explainability workspace v1 for ``policy_id``, or ``None`` if the policy row is absent."""
    collector_snapshot, policy_snapshot, persisted_at = _build_policy_inventory()
    record = next((r for r in policy_snapshot.records if r.policy_id == policy_id), None)
    if record is None:
        return None

    row_current_posture: Literal["current", "stale"] = (
        "stale"
        if collector_snapshot.status == "collector_unavailable" and persisted_at is not None
        else "current"
    )

    path = build_policy_path_analysis_response(policy_id)
    topo_impact = build_policy_topology_impact_response(policy_id)
    timeline = build_policy_evidence_timeline_response(policy_id)
    delta = build_policy_evidence_delta_response(policy_id)
    if path is None or topo_impact is None or timeline is None or delta is None:
        return None

    settings = get_settings()
    now = datetime.now(tz=UTC)

    policy_record = _policy_record_for_inventory_row(record, row_current_posture)

    if path.candidate_path_summaries:
        rollups = _rollups_from_summaries(path.candidate_path_summaries)
    else:
        rollups = _rollups_from_inventory_only(policy_record.candidate_paths)

    unknown_posture = _unknown_candidate_posture(rollups)

    preamble = (
        "Policy explainability workspace v1 composes existing read-only policy surfaces only; "
        "nested contract_id fields identify each section's source contract. This assembly is not "
        "dataplane proof, SLA, workflow authority, validation verdict, or fabricated candidate rejection."
    )

    path_caveat_messages = [c.message for c in path.caveats]
    topo_row_caveats: list[str] = []
    for row in topo_impact.items[:12]:
        topo_row_caveats.extend(row.caveats)

    merged = _merge_caveats_ordered(
        [preamble],
        path_caveat_messages,
        list(topo_impact.global_caveats),
        topo_row_caveats,
        list(timeline.missing_evidence_notes),
        list(delta.caveats),
    )
    if delta.comparison_status != "delta_ready":
        merged = _merge_caveats_ordered(
            merged,
            [
                f"Evidence delta comparison_status={delta.comparison_status} "
                "(see nested policy_evidence_delta_v1 for honest scope).",
            ],
        )

    if unknown_posture in ("full", "partial"):
        merged = _merge_caveats_ordered(
            merged,
            [
                "Candidate-path story is incomplete or ambiguous in the current slice; "
                "see candidate_path_rollups and path_analysis caveats—no default 'first row wins'.",
            ],
        )

    if not topo_impact.items:
        merged = _merge_caveats_ordered(
            merged,
            [
                "Topology naming alignment is unknown in this slice (empty topology-impact rows)—not 'no dependencies'.",
            ],
        )

    serving = path.freshness.serving_mode_echo
    policy_serving_echo = serving if serving is not None else "unknown"

    empty_reason: str | None = None
    if policy_snapshot.empty_reason != "none":
        empty_reason = policy_snapshot.empty_reason

    navigation = PolicyExplainabilityNavigationTargets(
        investigation_shell_params={
            "inv_from": "policy_explainability",
            "policy_id": policy_id,
            "policy_explainability_entry": "v1",
        },
        situation_room_shell_params={
            "view": "situation-room",
            "sync_runs_limit": "10",
        },
        policies_view_params={
            "view": "policies",
            "policy_id": policy_id,
        },
        topology_object_hints=_topology_hints_from_impact(topo_impact.items),
        service_explorer_shell_params={
            "view": "service-explorer",
            "service_id": f"policy:{policy_id}",
        },
        delta_digest_shell_params={
            "view": "delta-digest",
            "sync_runs_limit": "10",
        },
    )

    freshness = PolicyDossierFreshnessBlock(
        dossier_assembled_at=now,
        policy_inventory_observed_at=path.freshness.policy_snapshot_observed_at,
        topology_snapshot_observed_at=path.freshness.topology_snapshot_observed_at,
        policy_inventory_empty_reason=empty_reason,
        policy_serving_mode_echo=policy_serving_echo,
    )

    timeline_sparse = bool(timeline.missing_evidence_notes) or len(timeline.entries) == 0
    sparse = PolicyExplainabilitySparseSignals(
        topology_naming_alignment_unknown=len(topo_impact.items) == 0,
        evidence_timeline_sparse=timeline_sparse,
        evidence_delta_not_ready=delta.comparison_status != "delta_ready",
    )

    summary = path.truth_alignment.summary.strip()
    if len(summary) > 4000:
        summary = summary[:3997] + "..."

    return PolicyExplainabilityResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=POLICY_EXPLAINABILITY_WORKSPACE_V1_CONTRACT_ID,
        policy_id=policy_id,
        policy_record=policy_record,
        path_analysis=path,
        topology_impact=topo_impact,
        evidence_timeline=timeline,
        evidence_delta=delta,
        path_explanation_summary=summary,
        candidate_path_rollups=rollups,
        unknown_candidate_posture=unknown_posture,
        sparse_signals=sparse,
        navigation_targets=navigation,
        freshness=freshness,
        merged_caveats=merged,
    )

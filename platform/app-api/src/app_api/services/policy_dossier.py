"""Assemble policy dossier v1 read responses (Phase 2, read-only).

Composes existing bounded contracts only; no new scoring or write-side behavior.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from app_api.config.settings import get_settings
from app_api.models.policy import PolicyInventoryRecord
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.policies import CandidatePathRecord, PolicyRecord
from app_api.schemas.policy_dossier import (
    POLICY_DOSSIER_CONTRACT_ID,
    PolicyDossierFreshnessBlock,
    PolicyDossierNavigationTargets,
    PolicyDossierResponse,
    PolicyDossierTopologyObjectHint,
)
from app_api.schemas.policy_topology_impact import PolicyTopologyImpactRow
from app_api.services.degraded_policy_v1 import build_degraded_policy_v1_classification
from app_api.services.path_analysis import build_policy_path_analysis_response
from app_api.services.policy_evidence_delta import build_policy_evidence_delta_response
from app_api.services.policy_evidence_timeline import build_policy_evidence_timeline_response
from app_api.services.policy_topology_impact import build_policy_topology_impact_response
from app_api.services.policies import _build_policy_inventory


def _merge_caveats_ordered(*chunks: list[str]) -> list[str]:
    """Flatten variadic ``list[str]`` chunks while preserving first-seen order."""
    seen: set[str] = set()
    out: list[str] = []
    for chunk in chunks:
        for s in chunk:
            if s not in seen:
                seen.add(s)
                out.append(s)
    return out


def _policy_record_for_inventory_row(
    policy: PolicyInventoryRecord,
    row_current_posture: Literal["current", "stale"],
) -> PolicyRecord:
    return PolicyRecord(
        policy_id=policy.policy_id,
        policy_name=policy.policy_name,
        policy_type=policy.policy_type,
        headend=policy.headend,
        endpoint=policy.endpoint,
        color=policy.color,
        source_target=policy.source_target,
        source_target_role=policy.source_target_role,
        candidate_paths=[
            CandidatePathRecord(
                name=path.name,
                current_posture=row_current_posture,
                path_state=path.path_state,
                last_recorded_path_state=path.path_state,
                preference=path.preference,
                notes=path.notes,
            )
            for path in policy.candidate_paths
        ],
        current_posture=row_current_posture,
        intent_state=policy.intent_state,
        observed_state=policy.observed_state,
        last_recorded_observed_state=policy.observed_state,
        support_state=policy.support_state,
        health_state=policy.health_state,
        last_recorded_health_state=policy.health_state,
        source=policy.source,
        notes=policy.notes,
        degraded_policy_v1=build_degraded_policy_v1_classification(
            policy=policy,
            row_current_posture=row_current_posture,
        ),
    )


def _topology_hints_from_impact(items: list[PolicyTopologyImpactRow]) -> list[PolicyDossierTopologyObjectHint]:
    seen: set[tuple[str, str]] = set()
    out: list[PolicyDossierTopologyObjectHint] = []
    for row in items:
        key = (row.topology_object_kind, row.topology_object_id)
        if key in seen:
            continue
        seen.add(key)
        out.append(
            PolicyDossierTopologyObjectHint(
                topology_object_kind=row.topology_object_kind,
                topology_object_id=row.topology_object_id,
            )
        )
        if len(out) >= 8:
            break
    return out


def build_policy_dossier_response(policy_id: str) -> PolicyDossierResponse | None:
    """Return dossier v1 for ``policy_id``, or ``None`` if the policy row is absent."""
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

    dossier_preamble = (
        "Policy dossier v1 composes existing read-only policy surfaces only; nested contract_id "
        "fields identify each section's source contract. This assembly is not dataplane proof, "
        "SLA, workflow authority, or validation verdict."
    )

    path_caveat_messages = [c.message for c in path.caveats]
    topo_row_caveats: list[str] = []
    for row in topo_impact.items[:12]:
        topo_row_caveats.extend(row.caveats)

    merged = _merge_caveats_ordered(
        [dossier_preamble],
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

    serving = path.freshness.serving_mode_echo
    policy_serving_echo = serving if serving is not None else "unknown"

    empty_reason: str | None = None
    if policy_snapshot.empty_reason != "none":
        empty_reason = policy_snapshot.empty_reason

    navigation = PolicyDossierNavigationTargets(
        investigation_shell_params={
            "inv_from": "policies",
            "policy_id": policy_id,
            "policy_dossier_entry": "v1",
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
    )

    freshness = PolicyDossierFreshnessBlock(
        dossier_assembled_at=now,
        policy_inventory_observed_at=path.freshness.policy_snapshot_observed_at,
        topology_snapshot_observed_at=path.freshness.topology_snapshot_observed_at,
        policy_inventory_empty_reason=empty_reason,
        policy_serving_mode_echo=policy_serving_echo,
    )

    return PolicyDossierResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=POLICY_DOSSIER_CONTRACT_ID,
        policy_record=policy_record,
        path_analysis=path,
        topology_impact=topo_impact,
        evidence_timeline=timeline,
        evidence_delta=delta,
        navigation_targets=navigation,
        freshness=freshness,
        merged_caveats=merged,
    )

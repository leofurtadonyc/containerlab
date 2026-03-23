"""Assemble operator briefing workspace from existing Phase 2 read responses only."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Literal

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.operator_briefing import (
    OPERATOR_BRIEFING_CONTRACT_ID,
    OperatorBriefingContextEcho,
    OperatorBriefingSectionMeta,
    OperatorBriefingSafetyFraming,
    OperatorBriefingWorkspaceResponse,
)
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.delta_digest import build_cross_domain_delta_digest_response
from app_api.services.investigation_workspace import build_investigation_context_assembly_response
from app_api.services.policy_dossier import build_policy_dossier_response
from app_api.services.situation_pack import build_situation_pack_assembly_response
from app_api.services.topology_object_dossier import build_topology_object_dossier_response

logger = logging.getLogger(__name__)

_MERGED_CAVEATS_CAP = 32
_PIVOT_CAP = 16


def _safe_call(label: str, fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs), None
    except Exception as exc:  # noqa: BLE001 — briefing must survive partial failures
        logger.warning("operator_briefing: %s assembly failed: %s", label, exc)
        return None, f"{type(exc).__name__}: {exc}"


def _dedupe_lines(lines: list[str], cap: int) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for line in lines:
        t = line.strip()
        if not t or t in seen:
            continue
        seen.add(t)
        out.append(t)
        if len(out) >= cap:
            break
    return out


def _recommended_pivots(
    *,
    bounded: int,
    policy_id: str | None,
    topology_object: str | None,
) -> list[str]:
    pivots = [
        f"Live shell: view=delta-digest (sync_runs_limit={bounded}) — cross_domain_delta_digest_v1.",
        f"Live shell: view=investigation (sync_runs_limit={bounded}) — investigation_workspace_phase2_v1.",
        f"Live shell: view=situation-room (sync_runs_limit={bounded}) — evidence_pack situation assembly.",
        "Exports (briefing_export_bundle_v1): GET /api/v1/exports/operator-briefing",
        "Exports (evidence_export_v1): GET /api/v1/exports/situation-room/summary",
        "Exports (evidence_export_v1): GET /api/v1/exports/investigation-workspace/summary",
    ]
    if policy_id:
        pivots.append(
            "Exports (evidence_export_v1): GET /api/v1/exports/policies/{policy_id}/dossier "
            f"(policy_id={policy_id})",
        )
        pivots.append(
            f"Live shell: view=policies — policy_workspace=dossier with policy_id={policy_id}",
        )
    if topology_object:
        pivots.append(
            "Exports (evidence_export_v1): GET /api/v1/exports/topology-objects/{object_id}/dossier "
            f"(object_id={topology_object})",
        )
        pivots.append(
            f"Live shell: view=topology — topology_workspace=dossier with topology_object={topology_object}",
        )
    return pivots[:_PIVOT_CAP]


def build_operator_briefing_workspace_response(
    *,
    sync_runs_limit: int = RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    policy_id: str | None = None,
    topology_object: str | None = None,
    topology_object_kind: Literal["node", "link"] | None = None,
    inv_from_client_hint: str | None = None,
    global_search_q_client_hint: str | None = None,
) -> OperatorBriefingWorkspaceResponse:
    """Compose bounded briefing from existing services; no new collector or scoring semantics."""
    settings = get_settings()
    bounded = max(1, min(int(sync_runs_limit), RECENT_CHANGE_SYNC_RUNS_MAX))

    briefing_context = OperatorBriefingContextEcho(
        sync_runs_limit_requested=bounded,
        policy_id=policy_id,
        topology_object=topology_object,
        topology_object_kind=topology_object_kind,
        inv_from_client_hint=inv_from_client_hint,
        global_search_q_client_hint=global_search_q_client_hint,
    )

    section_meta: list[OperatorBriefingSectionMeta] = []
    merged: list[str] = []

    section_meta.append(
        OperatorBriefingSectionMeta(
            section_key="briefing_context",
            evidence_status="present",
            caveats=[
                "Client hints (inv_from, global_search_q) are echo-only—no shell authority is implied "
                "by app-api.",
            ],
            freshness_lines=[f"briefing assembly generated in app-api {settings.app_version}"],
        ),
    )

    digest, digest_err = _safe_call(
        "delta_digest",
        build_cross_domain_delta_digest_response,
        sync_runs_limit=bounded,
    )
    delta_digest_error: str | None = digest_err
    if digest is not None:
        merged.extend(digest.digest_framing_notes[:8])
        merged.extend(str(x) for x in digest.safety.explicit_non_claims[:3])
        ds = "partial" if digest.completeness_posture == "bounded_partial" else "present"
        section_meta.append(
            OperatorBriefingSectionMeta(
                section_key="delta_digest",
                evidence_status=ds,
                caveats=[f"completeness_posture={digest.completeness_posture}"],
                freshness_lines=[f"sync_runs_limit_applied={digest.sync_runs_limit_applied}"],
            ),
        )
    else:
        section_meta.append(
            OperatorBriefingSectionMeta(
                section_key="delta_digest",
                evidence_status="unavailable",
                caveats=["Delta digest assembly failed; other sections may still be available."],
                error_note=delta_digest_error,
            ),
        )

    policy_dossier = None
    policy_note: str | None = None
    if policy_id:
        policy_dossier = build_policy_dossier_response(policy_id)
        if policy_dossier is None:
            policy_note = "policy_not_found"
            section_meta.append(
                OperatorBriefingSectionMeta(
                    section_key="policy_dossier",
                    evidence_status="absent",
                    caveats=["No normalized policy row for policy_id in current inventory slice."],
                    error_note=policy_note,
                ),
            )
        else:
            policy_note = None
            merged.extend(policy_dossier.merged_caveats[:8])
            section_meta.append(
                OperatorBriefingSectionMeta(
                    section_key="policy_dossier",
                    evidence_status="present",
                    caveats=[],
                    freshness_lines=[f"policy dossier contract {policy_dossier.contract_id}"],
                ),
            )
    else:
        policy_note = "not_requested"
        section_meta.append(
            OperatorBriefingSectionMeta(
                section_key="policy_dossier",
                evidence_status="absent",
                caveats=["policy_id not provided — open Policies or pass policy_id for dossier preview."],
                error_note=policy_note,
            ),
        )

    topo_dossier = None
    topo_note: str | None = None
    if topology_object:
        topo_dossier = build_topology_object_dossier_response(topology_object)
        if topo_dossier is None:
            topo_note = "object_not_found"
            section_meta.append(
                OperatorBriefingSectionMeta(
                    section_key="topology_object_dossier",
                    evidence_status="absent",
                    caveats=["Topology object dossier unavailable for object_id (unknown or related-policies gate)."],
                    error_note=topo_note,
                ),
            )
        else:
            kind_mismatch = (
                topology_object_kind is not None
                and topo_dossier.object_identity.object_kind != topology_object_kind
            )
            if kind_mismatch:
                topo_note = "kind_mismatch"
                merged.append(
                    "topology_object_kind client hint differs from dossier object_identity.object_kind — "
                    "trust dossier identity.",
                )
            section_meta.append(
                OperatorBriefingSectionMeta(
                    section_key="topology_object_dossier",
                    evidence_status="partial" if kind_mismatch else "present",
                    caveats=(["Client topology_object_kind hint mismatch — see dossier identity."] if kind_mismatch else []),
                    freshness_lines=[
                        f"object_kind={topo_dossier.object_identity.object_kind}",
                        f"contract_id={topo_dossier.contract_id}",
                    ],
                    error_note=topo_note if kind_mismatch else None,
                ),
            )
            merged.extend(topo_dossier.merged_caveats[:8])
    else:
        topo_note = "not_requested"
        section_meta.append(
            OperatorBriefingSectionMeta(
                section_key="topology_object_dossier",
                evidence_status="absent",
                caveats=[
                    "topology_object not provided — open Topology or pass topology_object for dossier preview.",
                ],
                error_note=topo_note,
            ),
        )

    situation, situation_err = _safe_call(
        "situation_pack",
        build_situation_pack_assembly_response,
        sync_runs_limit=bounded,
    )
    situation_pack_error = situation_err
    if situation is not None:
        merged.extend(situation.assembly_notes[:6])
        sp_status: Literal["present", "partial", "absent", "unavailable"] = "present"
        if situation.situation_review_guidance.explicit_missing_evidence_notes:
            sp_status = "partial"
        section_meta.append(
            OperatorBriefingSectionMeta(
                section_key="situation_room",
                evidence_status=sp_status,
                caveats=situation.situation_review_guidance.explicit_missing_evidence_notes[:4],
                freshness_lines=[f"situation pack safety {situation.safety.contract_id}"],
            ),
        )
    else:
        section_meta.append(
            OperatorBriefingSectionMeta(
                section_key="situation_room",
                evidence_status="unavailable",
                caveats=["Situation pack assembly failed."],
                error_note=situation_pack_error,
            ),
        )

    investigation, inv_err = _safe_call(
        "investigation_workspace",
        build_investigation_context_assembly_response,
        sync_runs_limit=bounded,
    )
    investigation_workspace_error = inv_err
    if investigation is not None:
        merged.extend(investigation.assembly_notes[:6])
        rc = investigation.recent_change
        inv_status: Literal["present", "partial"] = (
            "partial" if rc.completeness_posture == "bounded_partial" else "present"
        )
        section_meta.append(
            OperatorBriefingSectionMeta(
                section_key="investigation_workspace",
                evidence_status=inv_status,
                caveats=[f"recent_change completeness_posture={rc.completeness_posture}"],
                freshness_lines=[f"investigation contract {investigation.safety.contract_id}"],
            ),
        )
    else:
        section_meta.append(
            OperatorBriefingSectionMeta(
                section_key="investigation_workspace",
                evidence_status="unavailable",
                caveats=["Investigation workspace assembly failed."],
                error_note=investigation_workspace_error,
            ),
        )

    merged_caveats = _dedupe_lines(merged, _MERGED_CAVEATS_CAP)
    pivots = _recommended_pivots(
        bounded=bounded,
        policy_id=policy_id,
        topology_object=topology_object,
    )

    now = datetime.now(UTC)
    meta = ApiResponseMetadata(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=now,
    )

    return OperatorBriefingWorkspaceResponse(
        metadata=meta,
        contract_id=OPERATOR_BRIEFING_CONTRACT_ID,
        safety=OperatorBriefingSafetyFraming(),
        sync_runs_limit_applied=bounded,
        briefing_context=briefing_context,
        delta_digest=digest,
        delta_digest_error=delta_digest_error,
        policy_dossier=policy_dossier,
        policy_dossier_note=policy_note,
        topology_object_dossier=topo_dossier,
        topology_object_dossier_note=topo_note,
        situation_pack=situation,
        situation_pack_error=situation_pack_error,
        investigation_workspace=investigation,
        investigation_workspace_error=investigation_workspace_error,
        section_meta=section_meta,
        merged_caveats=merged_caveats,
        recommended_pivots=pivots,
    )

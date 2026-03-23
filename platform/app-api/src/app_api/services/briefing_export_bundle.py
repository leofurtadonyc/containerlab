"""Assemble briefing_export_bundle_v1 from the same bounded inputs as operator briefing."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Literal

from app_api.schemas.briefing_export_bundle import (
    BRIEFING_EXPORT_BUNDLE_CONTRACT_ID,
    BriefingExportBundleMember,
    BriefingExportBundleResponse,
    BriefingExportBundleSubject,
)
from app_api.schemas.evidence_export import DEFAULT_EVIDENCE_EXPORT_EXPLICIT_NON_CLAIMS
from app_api.schemas.operator_briefing import OPERATOR_BRIEFING_CONTRACT_ID
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.evidence_export import (
    build_investigation_workspace_export,
    build_policy_dossier_export,
    build_situation_room_export,
    build_topology_object_dossier_export,
    collect_contract_ids_depth_first,
)

DEFAULT_BUNDLE_FRAMING_BASE = (
    "Phase 2 read-only briefing export bundle: a single ordered archive of point-in-time "
    "evidence_export_v1 members aligned with operator briefing context. "
    "This is not a live feed, not authorization, and not a substitute for live product "
    "surfaces when current read-side truth is required."
)

BUNDLE_DEFAULT_NON_CLAIMS: list[str] = [
    "not_live_platform_truth_as_single_merged_feed",
    "not_tamper_detection_integrity_verification_or_signature_validation",
    "not_compliance_legal_hold_or_audit_signing",
    "not_backup_of_postgres_prometheus_or_collector_state",
    "not_validation_drift_verdict_safe_to_change_or_incident_command",
    "not_complete_if_any_member_was_omitted_capped_or_bounded_partial_upstream",
    "not_substitute_for_opening_live_policies_topology_situation_investigation_or_delta_digest",
    "bundle_members_are_point_in_time_assembly_at_bundle_generated_at",
    "live_product_surfaces_may_differ_after_bundle_generated_at",
]


def _dedupe_non_claims(lines: list[str], cap: int = 96) -> list[str]:
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


def _merge_member_non_claims(members: list[BriefingExportBundleMember]) -> list[str]:
    merged: list[str] = []
    for m in members:
        if m.payload is not None:
            merged.extend(m.payload.explicit_non_claims)
    return merged


def _union_source_contract_ids(
    bundle_json: dict,
) -> list[str]:
    """Depth-first contract_id order from the bundle tree (contract-aligned)."""
    return collect_contract_ids_depth_first(bundle_json)


def build_briefing_export_bundle_response(
    *,
    sync_runs_limit: int,
    policy_id: str | None = None,
    topology_object: str | None = None,
    topology_object_kind: Literal["node", "link"] | None = None,
    inv_from: str | None = None,
    global_search_q: str | None = None,
) -> BriefingExportBundleResponse:
    """Build bundle using the same export builders as standalone GET /api/v1/exports/... routes."""
    bounded = max(1, min(int(sync_runs_limit), RECENT_CHANGE_SYNC_RUNS_MAX))

    policy_id = policy_id.strip() if isinstance(policy_id, str) and policy_id.strip() else None
    topology_object = (
        topology_object.strip() if isinstance(topology_object, str) and topology_object.strip() else None
    )

    subject = BriefingExportBundleSubject(
        sync_runs_limit=bounded,
        policy_id=policy_id,
        topology_object=topology_object,
        topology_object_kind=topology_object_kind,
        inv_from=inv_from,
        global_search_q=global_search_q,
    )

    bundle_generated_at = datetime.now(tz=UTC)
    members: list[BriefingExportBundleMember] = []
    any_omission = False

    # 1) Policy dossier (only when policy_id requested)
    if policy_id is not None:
        pol = build_policy_dossier_export(policy_id)
        if pol is None:
            any_omission = True
            members.append(
                BriefingExportBundleMember(
                    export_kind="policy_dossier",
                    subject_ref={"policy_id": policy_id},
                    member_generated_at=None,
                    payload=None,
                    omission_reason="policy_dossier_unavailable",
                ),
            )
        else:
            members.append(
                BriefingExportBundleMember(
                    export_kind="policy_dossier",
                    subject_ref=dict(pol.subject_ref),
                    member_generated_at=pol.generated_at,
                    payload=pol,
                ),
            )

    # 2) Topology object dossier (only when both dimensions set)
    if topology_object is not None and topology_object_kind is not None:
        topo = build_topology_object_dossier_export(topology_object)
        if topo is None:
            any_omission = True
            members.append(
                BriefingExportBundleMember(
                    export_kind="topology_object_dossier",
                    subject_ref={
                        "object_id": topology_object,
                        "topology_object_kind": topology_object_kind,
                    },
                    member_generated_at=None,
                    payload=None,
                    omission_reason="topology_object_dossier_unavailable",
                ),
            )
        else:
            members.append(
                BriefingExportBundleMember(
                    export_kind="topology_object_dossier",
                    subject_ref=dict(topo.subject_ref),
                    member_generated_at=topo.generated_at,
                    payload=topo,
                ),
            )

    # 3) Situation room
    sit = build_situation_room_export(sync_runs_limit=bounded)
    members.append(
        BriefingExportBundleMember(
            export_kind="situation_room",
            subject_ref=dict(sit.subject_ref),
            member_generated_at=sit.generated_at,
            payload=sit,
        ),
    )

    # 4) Investigation workspace
    inv = build_investigation_workspace_export(sync_runs_limit=bounded)
    members.append(
        BriefingExportBundleMember(
            export_kind="investigation_workspace",
            subject_ref=dict(inv.subject_ref),
            member_generated_at=inv.generated_at,
            payload=inv,
        ),
    )

    explicit_non_claims = _dedupe_non_claims(
        list(BUNDLE_DEFAULT_NON_CLAIMS)
        + list(DEFAULT_EVIDENCE_EXPORT_EXPLICIT_NON_CLAIMS)
        + _merge_member_non_claims(members),
    )

    framing = DEFAULT_BUNDLE_FRAMING_BASE
    if any_omission:
        framing += " Partial bundle: one or more optional dossier members were omitted."

    body = BriefingExportBundleResponse(
        generated_at=bundle_generated_at,
        briefing_subject=subject,
        bundle_members=members,
        source_contract_ids=[],
        explicit_non_claims=explicit_non_claims,
        export_framing=framing,
    )

    # Fill source_contract_ids after model exists (needs tree walk for union)
    dumped = body.model_dump(mode="json")
    ids = _union_source_contract_ids(dumped)
    # Ensure contract anchors present in order
    anchor = [BRIEFING_EXPORT_BUNDLE_CONTRACT_ID, OPERATOR_BRIEFING_CONTRACT_ID]
    seen: set[str] = set()
    ordered: list[str] = []
    for a in anchor:
        if a not in seen:
            seen.add(a)
            ordered.append(a)
    for cid in ids:
        if cid not in seen:
            seen.add(cid)
            ordered.append(cid)

    return body.model_copy(update={"source_contract_ids": ordered})


def briefing_export_bundle_to_markdown(body: BriefingExportBundleResponse) -> str:
    """Human-readable Markdown companion; JSON remains the lossless interchange for members."""
    lines: list[str] = [
        "# Briefing export bundle (briefing_export_bundle_v1)",
        "",
        "**JSON is the lossless interchange format for embedded evidence_export_v1 members.**",
        "",
        "## Bundle metadata",
        "",
        f"- **generated_at (bundle assembly):** {body.generated_at.isoformat()}",
        f"- **contract_id:** {body.contract_id}",
        f"- **sync_runs_limit:** {body.briefing_subject.sync_runs_limit}",
    ]
    if body.briefing_subject.policy_id:
        lines.append(f"- **policy_id:** {body.briefing_subject.policy_id}")
    if body.briefing_subject.topology_object:
        lines.append(f"- **topology_object:** {body.briefing_subject.topology_object}")
        lines.append(f"- **topology_object_kind:** {body.briefing_subject.topology_object_kind}")
    if body.briefing_subject.inv_from:
        lines.append(f"- **inv_from (echo):** {body.briefing_subject.inv_from}")
    if body.briefing_subject.global_search_q:
        lines.append(f"- **global_search_q (echo):** {body.briefing_subject.global_search_q}")

    lines.extend(
        [
            "",
            "## Export framing",
            "",
            body.export_framing,
            "",
            "## Explicit non-claims (bundle)",
            "",
        ]
    )
    for claim in body.explicit_non_claims:
        lines.append(f"- {claim}")

    lines.extend(
        [
            "",
            "## Source contract ids (union)",
            "",
        ]
    )
    for cid in body.source_contract_ids:
        lines.append(f"- `{cid}`")

    lines.extend(
        [
            "",
            "## Members (ordered)",
            "",
        ]
    )
    for idx, m in enumerate(body.bundle_members, start=1):
        lines.append(f"### {idx}. {m.export_kind}")
        lines.append("")
        for k, v in m.subject_ref.items():
            lines.append(f"- **{k}:** {v}")
        if m.member_generated_at is not None:
            lines.append(f"- **member_generated_at:** {m.member_generated_at.isoformat()}")
        if m.omission_reason:
            lines.append(f"- **omission_reason:** {m.omission_reason}")
            lines.append("")
            continue
        if m.payload is None:
            lines.append("- **payload:** null")
            lines.append("")
            continue
        pl = m.payload
        lines.extend(
            [
                "",
                "#### Member explicit non-claims",
                "",
            ]
        )
        for c in pl.explicit_non_claims:
            lines.append(f"- {c}")
        nested_json = json.dumps(
            pl.model_dump(mode="json"),
            indent=2,
            ensure_ascii=False,
        )
        lines.extend(
            [
                "",
                "#### evidence_export_v1 (JSON)",
                "",
                "```json",
                nested_json,
                "```",
                "",
            ]
        )

    return "\n".join(lines)

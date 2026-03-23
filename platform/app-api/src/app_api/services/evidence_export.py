"""Evidence export v1 — compose existing Phase 2 read assemblies only."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from app_api.schemas.evidence_export import (
    DEFAULT_EVIDENCE_EXPORT_EXPLICIT_NON_CLAIMS,
    DEFAULT_EVIDENCE_EXPORT_FRAMING,
    EVIDENCE_EXPORT_CONTRACT_ID,
    InvestigationWorkspaceEvidenceExportResponse,
    PolicyDossierEvidenceExportResponse,
    SituationRoomEvidenceExportResponse,
    TopologyObjectDossierEvidenceExportResponse,
)
from app_api.schemas.evidence_pack import SituationPackAssemblyResponse
from app_api.schemas.investigation_workspace import InvestigationContextAssemblyResponse
from app_api.schemas.policy_dossier import PolicyDossierResponse
from app_api.schemas.topology_object_dossier import TopologyObjectDossierResponse
from app_api.services.investigation_workspace import (
    build_investigation_context_assembly_response,
)
from app_api.services.policy_dossier import build_policy_dossier_response
from app_api.services.situation_pack import build_situation_pack_assembly_response
from app_api.services.topology_object_dossier import build_topology_object_dossier_response


def collect_contract_ids_depth_first(obj: Any) -> list[str]:
    """Collect string ``contract_id`` values from a JSON-serializable tree (first-seen order)."""
    seen: set[str] = set()
    out: list[str] = []

    def walk(v: Any) -> None:
        if isinstance(v, dict):
            cid = v.get("contract_id")
            if isinstance(cid, str) and cid not in seen:
                seen.add(cid)
                out.append(cid)
            for vv in v.values():
                walk(vv)
        elif isinstance(v, list):
            for item in v:
                walk(item)

    walk(obj)
    return out


def build_policy_dossier_export(policy_id: str) -> PolicyDossierEvidenceExportResponse | None:
    nested = build_policy_dossier_response(policy_id)
    if nested is None:
        return None
    return _policy_export_from_nested(nested, policy_id)


def _policy_export_from_nested(
    nested: PolicyDossierResponse,
    policy_id: str,
) -> PolicyDossierEvidenceExportResponse:
    generated_at = datetime.now(tz=UTC)
    tree = nested.model_dump(mode="json")
    return PolicyDossierEvidenceExportResponse(
        contract_id=EVIDENCE_EXPORT_CONTRACT_ID,
        export_kind="policy_dossier",
        subject_ref={"policy_id": policy_id},
        generated_at=generated_at,
        source_contract_ids=collect_contract_ids_depth_first(tree),
        explicit_non_claims=list(DEFAULT_EVIDENCE_EXPORT_EXPLICIT_NON_CLAIMS),
        export_framing=DEFAULT_EVIDENCE_EXPORT_FRAMING,
        nested=nested,
    )


def build_topology_object_dossier_export(
    object_id: str,
) -> TopologyObjectDossierEvidenceExportResponse | None:
    nested = build_topology_object_dossier_response(object_id)
    if nested is None:
        return None
    generated_at = datetime.now(tz=UTC)
    tree = nested.model_dump(mode="json")
    return TopologyObjectDossierEvidenceExportResponse(
        contract_id=EVIDENCE_EXPORT_CONTRACT_ID,
        export_kind="topology_object_dossier",
        subject_ref={
            "object_id": object_id,
            "topology_object_kind": tree.get("object_identity", {}).get("object_kind"),
        },
        generated_at=generated_at,
        source_contract_ids=collect_contract_ids_depth_first(tree),
        explicit_non_claims=list(DEFAULT_EVIDENCE_EXPORT_EXPLICIT_NON_CLAIMS),
        export_framing=DEFAULT_EVIDENCE_EXPORT_FRAMING,
        nested=nested,
    )


def build_situation_room_export(
    *,
    sync_runs_limit: int,
) -> SituationRoomEvidenceExportResponse:
    nested = build_situation_pack_assembly_response(sync_runs_limit=sync_runs_limit)
    generated_at = datetime.now(tz=UTC)
    tree = nested.model_dump(mode="json")
    return SituationRoomEvidenceExportResponse(
        contract_id=EVIDENCE_EXPORT_CONTRACT_ID,
        export_kind="situation_room",
        subject_ref={"sync_runs_limit": sync_runs_limit},
        generated_at=generated_at,
        source_contract_ids=collect_contract_ids_depth_first(tree),
        explicit_non_claims=list(DEFAULT_EVIDENCE_EXPORT_EXPLICIT_NON_CLAIMS),
        export_framing=DEFAULT_EVIDENCE_EXPORT_FRAMING,
        nested=nested,
    )


def build_investigation_workspace_export(
    *,
    sync_runs_limit: int,
) -> InvestigationWorkspaceEvidenceExportResponse:
    nested = build_investigation_context_assembly_response(sync_runs_limit=sync_runs_limit)
    generated_at = datetime.now(tz=UTC)
    tree = nested.model_dump(mode="json")
    return InvestigationWorkspaceEvidenceExportResponse(
        contract_id=EVIDENCE_EXPORT_CONTRACT_ID,
        export_kind="investigation_workspace",
        subject_ref={"sync_runs_limit": sync_runs_limit},
        generated_at=generated_at,
        source_contract_ids=collect_contract_ids_depth_first(tree),
        explicit_non_claims=list(DEFAULT_EVIDENCE_EXPORT_EXPLICIT_NON_CLAIMS),
        export_framing=DEFAULT_EVIDENCE_EXPORT_FRAMING,
        nested=nested,
    )


def evidence_export_response_to_markdown(
    *,
    export_kind: str,
    subject_ref: dict[str, Any],
    generated_at: datetime,
    source_contract_ids: list[str],
    explicit_non_claims: list[str],
    export_framing: str,
    merged_caveats: list[str] | None,
    nested: PolicyDossierResponse
    | TopologyObjectDossierResponse
    | SituationPackAssemblyResponse
    | InvestigationContextAssemblyResponse,
) -> str:
    """Human-readable Markdown companion with metadata header and nested JSON body."""
    nested_json = json.dumps(
        nested.model_dump(mode="json"),
        indent=2,
        ensure_ascii=False,
    )
    lines: list[str] = [
        f"# Evidence export: {export_kind}",
        "",
        "## Export metadata",
        "",
        f"- **generated_at (export):** {generated_at.isoformat()}",
    ]
    for k, v in subject_ref.items():
        lines.append(f"- **{k}:** {v}")
    lines.extend(
        [
            "",
            "## Source contract ids (nested)",
            "",
        ]
    )
    for cid in source_contract_ids:
        lines.append(f"- `{cid}`")
    lines.extend(
        [
            "",
            "## Export framing",
            "",
            export_framing,
            "",
            "## Explicit non-claims",
            "",
        ]
    )
    for claim in explicit_non_claims:
        lines.append(f"- {claim}")
    if merged_caveats:
        lines.extend(["", "## Merged caveats (from nested dossier)", ""])
        for c in merged_caveats:
            lines.append(f"- {c}")
    lines.extend(
        [
            "",
            "## Nested payload (JSON)",
            "",
            "```json",
            nested_json,
            "```",
            "",
        ]
    )
    return "\n".join(lines)

"""Assemble maintenance_window_handoff_v1 around maintenance_window_workspace_v1 (Phase 2, read-only).

See ``platform/docs/maintenance-window-handoff-contract.md``.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.schemas.maintenance_window_handoff import (
    DEFAULT_MAINTENANCE_WINDOW_HANDOFF_EXPLICIT_NON_CLAIMS,
    MAINTENANCE_WINDOW_HANDOFF_V1_CONTRACT_ID,
    MaintenanceWindowHandoffResponse,
    MaintenanceWindowHandoffSubjectEcho,
)
from app_api.schemas.maintenance_window_workspace import MaintenanceWindowWorkspaceResponse
from app_api.services.maintenance_window_workspace import (
    build_maintenance_window_workspace_response,
    dedupe_subjects,
    subject_label,
)


def _merge_handoff_source_ids(workspace: MaintenanceWindowWorkspaceResponse) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for cid in [MAINTENANCE_WINDOW_HANDOFF_V1_CONTRACT_ID, *workspace.source_contract_ids]:
        if cid not in seen:
            seen.add(cid)
            out.append(cid)
    return out


def _merge_handoff_explicit_non_claims(workspace: MaintenanceWindowWorkspaceResponse) -> list[str]:
    merged: list[str] = list(DEFAULT_MAINTENANCE_WINDOW_HANDOFF_EXPLICIT_NON_CLAIMS)
    seen: set[str] = set(merged)
    for line in workspace.explicit_non_claims:
        if line not in seen:
            seen.add(line)
            merged.append(line)
    return merged


def build_maintenance_window_handoff_response(
    *,
    subject_pairs: list[tuple[str, str]],
    preview_context: str,
    sync_runs_limit: int,
    handoff_label: str | None = None,
    operator_note: str | None = None,
) -> MaintenanceWindowHandoffResponse:
    """Build handoff envelope; caller maps ``subjects_resolved == 0`` to HTTP 422."""
    workspace = build_maintenance_window_workspace_response(
        subject_pairs=subject_pairs,
        preview_context=preview_context,
        sync_runs_limit=sync_runs_limit,
    )
    distinct = dedupe_subjects(subject_pairs)
    subject_labels = [subject_label(k, oid) for k, oid in distinct]

    label_clean = handoff_label.strip() if isinstance(handoff_label, str) and handoff_label.strip() else None
    note_clean = operator_note.strip() if isinstance(operator_note, str) and operator_note.strip() else None

    handoff_generated_at = datetime.now(tz=UTC)

    return MaintenanceWindowHandoffResponse(
        handoff_generated_at=handoff_generated_at,
        handoff_subject=MaintenanceWindowHandoffSubjectEcho(
            subjects=subject_labels,
            preview_context=preview_context,
            sync_runs_limit=workspace.sync_runs_limit_applied,
            handoff_label=label_clean,
            operator_note=note_clean,
        ),
        workspace_snapshot=workspace,
        source_contract_ids=_merge_handoff_source_ids(workspace),
        explicit_non_claims=_merge_handoff_explicit_non_claims(workspace),
    )


def maintenance_window_handoff_to_markdown(handoff: MaintenanceWindowHandoffResponse) -> str:
    """Human companion; JSON remains canonical for structured fidelity."""
    ws = handoff.workspace_snapshot
    lines: list[str] = [
        "# Maintenance window handoff",
        "",
        "**Canonical structured data:** use JSON from `GET /api/v1/exports/maintenance-window-handoff` "
        "(`format=json`); this Markdown is a companion summary only.",
        "",
        f"- **contract_id:** `{handoff.contract_id}`",
        f"- **handoff_generated_at:** {handoff.handoff_generated_at.isoformat()}",
        f"- **handoff_format_version:** {handoff.handoff_format_version}",
        "",
        "## Handoff subject (query echo)",
        "",
        f"- **subjects:** {', '.join(handoff.handoff_subject.subjects)}",
        f"- **preview_context:** {handoff.handoff_subject.preview_context}",
        f"- **sync_runs_limit:** {handoff.handoff_subject.sync_runs_limit}",
    ]
    if handoff.handoff_subject.handoff_label:
        lines.append(f"- **handoff_label:** {handoff.handoff_subject.handoff_label}")
    if handoff.handoff_subject.operator_note:
        lines.append(f"- **operator_note:** {handoff.handoff_subject.operator_note}")
    lines.extend(
        [
            "",
            "## Workspace snapshot (embedded)",
            "",
            f"- **nested contract_id:** `{ws.contract_id}`",
            f"- **subjects_resolved:** {ws.subjects_resolved}",
            f"- **selected_subjects:** {', '.join(ws.selected_subjects)}",
            f"- **window_framing_summary:** {ws.window_framing_summary}",
            "",
            "## Explicit non-claims (handoff + workspace)",
            "",
        ],
    )
    for claim in handoff.explicit_non_claims[:24]:
        lines.append(f"- {claim}")
    if len(handoff.explicit_non_claims) > 24:
        lines.append(f"- … ({len(handoff.explicit_non_claims) - 24} more lines)")
    lines.extend(["", "## Source contract ids", ""])
    for cid in handoff.source_contract_ids[:48]:
        lines.append(f"- `{cid}`")
    lines.append("")
    return "\n".join(lines)

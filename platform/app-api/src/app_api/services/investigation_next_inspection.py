"""Bounded next-inspection hints for investigation workspace (Phase 2, read-only).

Derives optional navigation prompts **only** from fields already present in nested
responses—no cross-domain scoring, risk synthesis, or execution authority.
"""

from __future__ import annotations

from app_api.schemas.capabilities import CapabilitiesListResponse
from app_api.schemas.change_intelligence import ChangeEvidenceDomain, RecentChangeSummaryResponse
from app_api.schemas.investigation_workspace import (
    InvestigationContextDomain,
    InvestigationNextInspectionSuggestion,
    InvestigationSuggestionRule,
)
from app_api.schemas.platform import PlatformStatusResponse

_CHANGE_DOMAIN_LABELS: dict[ChangeEvidenceDomain, str] = {
    "devices": "Devices (inventory)",
    "topology": "Topology",
    "policies": "Policies",
    "readiness": "Readiness",
    "workflow_history": "Workflow history",
    "audit_history": "Audit history",
}


def _add(
    out: list[InvestigationNextInspectionSuggestion],
    seen: set[str],
    *,
    suggestion_id: str,
    context_domain: InvestigationContextDomain,
    framing_rule: InvestigationSuggestionRule,
    headline: str,
    rationale: str,
) -> None:
    if suggestion_id in seen:
        return
    seen.add(suggestion_id)
    out.append(
        InvestigationNextInspectionSuggestion(
            suggestion_id=suggestion_id,
            context_domain=context_domain,
            framing_rule=framing_rule,
            headline=headline,
            rationale=rationale,
        )
    )


def build_next_inspection_suggestions(
    recent_change: RecentChangeSummaryResponse,
    platform_status: PlatformStatusResponse,
    capabilities: CapabilitiesListResponse,
) -> list[InvestigationNextInspectionSuggestion]:
    """Return deterministic, evidence-backed navigation hints (no preference ordering)."""
    out: list[InvestigationNextInspectionSuggestion] = []
    seen: set[str] = set()

    for slice in recent_change.domains:
        label = _CHANGE_DOMAIN_LABELS[slice.domain]
        if slice.evidence_status == "absent":
            _add(
                out,
                seen,
                suggestion_id=f"change-intelligence-absent-{slice.domain}",
                context_domain=slice.domain,
                framing_rule="evidence_backed_read_only_surfaces_only",
                headline=f"Inspect the {label} read surface",
                rationale=(
                    "Recent change intelligence reports no evidence in the bounded lookback window "
                    f"for this domain (headline: {slice.headline})."
                ),
            )
        elif slice.evidence_status == "partial":
            _add(
                out,
                seen,
                suggestion_id=f"change-intelligence-partial-{slice.domain}",
                context_domain=slice.domain,
                framing_rule="evidence_backed_read_only_surfaces_only",
                headline=f"Review partial coverage on {label}",
                rationale=(
                    "Recent change intelligence reports partial evidence for this domain. "
                    f"Summary headline: {slice.headline}"
                ),
            )

    for rp in platform_status.read_paths or []:
        if rp.observation_state != "ok":
            mf = rp.model_family.replace(" ", "_")
            _add(
                out,
                seen,
                suggestion_id=f"read-path-{mf}-not-ok",
                context_domain="platform_status",
                framing_rule="evidence_backed_read_only_surfaces_only",
                headline=f"Review collector read path ({rp.model_family})",
                rationale=(
                    "Platform status reports this read path is not in an ok observation state "
                    f"(observation_state={rp.observation_state!r})."
                ),
            )

    if capabilities.data_status == "placeholder":
        _add(
            out,
            seen,
            suggestion_id="capabilities-matrix-placeholder",
            context_domain="capabilities",
            framing_rule="evidence_backed_read_only_surfaces_only",
            headline="Inspect the capability matrix surface",
            rationale=(
                "The capabilities response is still marked as placeholder in this environment; "
                "the matrix page shows the same bounded contract."
            ),
        )

    dry = capabilities.dry_run_readiness
    has_readiness_gap = any(s.context_domain == "readiness" for s in out)
    if dry and (dry.blockers or dry.strongest_blockers) and not has_readiness_gap:
        _add(
            out,
            seen,
            suggestion_id="dry-run-readiness-blockers-listed",
            context_domain="readiness",
            framing_rule="evidence_backed_read_only_surfaces_only",
            headline="Review readiness planning-support material",
            rationale=(
                "The nested dry-run readiness summary lists blockers or strongest blockers; "
                "this remains interpretation support only—not execution authorization."
            ),
        )

    if not out:
        _add(
            out,
            seen,
            suggestion_id="optional-change-intelligence-overview",
            context_domain="change_intelligence",
            framing_rule="optional_next_product_surfaces_without_preference_ordering",
            headline="Optional Overview recent-change check",
            rationale=(
                "No gap-style triggers were detected from this assembly snapshot alone. "
                "The bounded cross-domain recent-change card on Overview uses the same contract family."
            ),
        )

    out.sort(key=lambda s: s.suggestion_id)
    return out

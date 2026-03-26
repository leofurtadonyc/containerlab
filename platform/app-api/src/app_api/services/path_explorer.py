"""Path Explorer v1 — compose path-analysis, explainability, optional policy dossier.

Overlaps (composition only, no replacement of closed APIs):

- ``GET /api/v1/policies/{policy_id}/path-analysis`` — nested ``PathAnalysisViewResponse``.
- ``GET /api/v1/policies/{policy_id}/explainability`` — nested ``PolicyExplainabilityResponse``.
- ``GET /api/v1/policies/{policy_id}/dossier`` — optional nested ``PolicyDossierResponse``.

Topology-impact and service surfaces remain **inside** explainability/dossier as today; this workspace
does not add new topology or service-explorer APIs.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.path_analysis import PATH_ANALYSIS_CONTRACT_ID
from app_api.schemas.path_explorer import (
    DEFAULT_PATH_EXPLORER_EXPLICIT_NON_CLAIMS,
    PATH_EXPLORER_V1_CONTRACT_ID,
    PathExplorerWorkspaceResponse,
)
from app_api.schemas.policy_dossier import POLICY_DOSSIER_CONTRACT_ID, PolicyDossierResponse
from app_api.schemas.policy_explainability import POLICY_EXPLAINABILITY_WORKSPACE_V1_CONTRACT_ID
from app_api.services.path_analysis import build_policy_path_analysis_response
from app_api.services.policy_dossier import build_policy_dossier_response
from app_api.services.policy_explainability import build_policy_explainability_response


def build_path_explorer_workspace_response(policy_id: str) -> PathExplorerWorkspaceResponse | None:
    """Return Path Explorer v1 for ``policy_id``, or ``None`` if the policy row is absent."""
    pa = build_policy_path_analysis_response(policy_id)
    if pa is None:
        return None
    expl = build_policy_explainability_response(policy_id)
    if expl is None:
        return None

    dossier: PolicyDossierResponse | None = None
    dossier_note: str | None = None
    try:
        dossier = build_policy_dossier_response(policy_id)
    except Exception as exc:  # noqa: BLE001 — bounded read: surface as caveat line
        dossier_note = f"Policy dossier not embedded ({type(exc).__name__})."

    merged: list[str] = []
    seen: set[str] = set()
    for c in pa.caveats:
        line = c.message.strip()
        if line and line not in seen:
            seen.add(line)
            merged.append(line)
    for line in expl.merged_caveats:
        ls = line.strip()
        if ls and ls not in seen:
            seen.add(ls)
            merged.append(ls)
    if dossier_note:
        ls = dossier_note.strip()
        if ls not in seen:
            merged.append(ls)

    nested_nc = [str(x) for x in pa.safety_framing.explicit_non_claims]
    non_claims: list[str] = list(dict.fromkeys([*nested_nc, *DEFAULT_PATH_EXPLORER_EXPLICIT_NON_CLAIMS]))

    sources: list[str] = [PATH_ANALYSIS_CONTRACT_ID, POLICY_EXPLAINABILITY_WORKSPACE_V1_CONTRACT_ID]
    if dossier is not None:
        sources.append(POLICY_DOSSIER_CONTRACT_ID)

    settings = get_settings()
    now = datetime.now(tz=UTC)
    return PathExplorerWorkspaceResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        contract_id=PATH_EXPLORER_V1_CONTRACT_ID,
        policy_id=policy_id,
        path_analysis=pa,
        explainability=expl,
        policy_dossier=dossier,
        merged_caveats=merged,
        explicit_non_claims=non_claims,
        source_contract_ids=sources,
    )

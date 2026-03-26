"""Path Explorer v1 — composed path-analysis + explainability (+ optional dossier).

Read-only; see ``platform/docs/path-explorer-contract.md``.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.path_analysis import PathAnalysisViewResponse
from app_api.schemas.policy_dossier import PolicyDossierResponse
from app_api.schemas.policy_explainability import PolicyExplainabilityResponse

PATH_EXPLORER_V1_CONTRACT_ID = "path_explorer_v1"

DEFAULT_PATH_EXPLORER_EXPLICIT_NON_CLAIMS: tuple[str, ...] = (
    "path_explorer_v1 is a composed read-only workspace; it is not dataplane proof or a TE solver.",
    "path_explorer_v1 does not authorize changes, workflows, validation, or safe-to-change semantics.",
    "Nested contracts remain authoritative for their own JSON; composition does not strengthen evidence.",
)


class PathExplorerWorkspaceResponse(BaseModel):
    """Composed path-centric workspace for one normalized policy_id."""

    metadata: ApiResponseMetadata
    contract_id: Literal["path_explorer_v1"] = Field(default=PATH_EXPLORER_V1_CONTRACT_ID)
    policy_id: str
    path_analysis: PathAnalysisViewResponse
    explainability: PolicyExplainabilityResponse
    policy_dossier: PolicyDossierResponse | None = Field(
        default=None,
        description="Optional composed policy dossier when assembly succeeds; omission is not an error.",
    )
    merged_caveats: list[str] = Field(
        default_factory=list,
        description="Deduped caveat lines from nested assemblies and path-explorer framing.",
    )
    explicit_non_claims: list[str] = Field(
        default_factory=list,
        description="Union of workspace-level and nested path-analysis explicit non-claim strings.",
    )
    source_contract_ids: list[str] = Field(
        default_factory=list,
        description="Nested contract identifiers included in this response.",
    )

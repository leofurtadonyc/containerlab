"""Path Explorer v1 composed workspace API.

Read-only GET assembly; composes existing ``/policies/{id}/path-analysis``,
``/policies/{id}/explainability``, and optionally ``/policies/{id}/dossier`` — see ``services/path_explorer.py``.
"""

from fastapi import APIRouter, HTTPException, Query

from app_api.schemas.path_explorer import PathExplorerWorkspaceResponse
from app_api.services.path_explorer import build_path_explorer_workspace_response

router = APIRouter(tags=["path-explorer"])


@router.get("/path-explorer", response_model=PathExplorerWorkspaceResponse)
def get_path_explorer_workspace(
    policy_id: str = Query(
        ...,
        description="Normalized policy_id anchor (same inventory rules as /policies/{policy_id}/path-analysis).",
    ),
) -> PathExplorerWorkspaceResponse:
    """Read-only composed path-centric workspace (path-analysis + explainability [+ optional dossier])."""
    body = build_path_explorer_workspace_response(policy_id)
    if body is None:
        raise HTTPException(
            status_code=404,
            detail="No normalized policy record exists for the requested policy_id.",
        )
    return body

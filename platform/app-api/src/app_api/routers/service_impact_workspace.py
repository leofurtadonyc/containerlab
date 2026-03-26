"""Service Impact Workspace v1 composed API.

Read-only GET assembly; composes ``GET /api/v1/services/{service_id}`` and optionally
``GET /api/v1/topology/objects/{object_id}/failure-impact`` — see ``services/service_impact_workspace.py``.
Not ``evidence_export_v1`` and not a report download; export/replay boundaries are documented in
``platform/docs/service-impact-workspace-contract.md``.
"""

from fastapi import APIRouter, HTTPException, Query

from app_api.schemas.service_impact_workspace import ServiceImpactWorkspaceResponse
from app_api.services.service_impact_workspace import build_service_impact_workspace_response

router = APIRouter(tags=["service-impact-workspace"])


@router.get("/service-impact-workspace", response_model=ServiceImpactWorkspaceResponse)
def get_service_impact_workspace(
    service_id: str = Query(
        ...,
        description="Service Explorer service_id (policy:, color:, headend:, endpoint: — same rules as /services/{service_id}).",
    ),
) -> ServiceImpactWorkspaceResponse:
    """Read-only composed service-impact workspace (Service Explorer detail [+ optional failure-impact])."""
    body = build_service_impact_workspace_response(service_id)
    if body is None:
        raise HTTPException(
            status_code=404,
            detail="Unknown service_id form, or no members for this service anchor (same as Service Explorer detail).",
        )
    return body

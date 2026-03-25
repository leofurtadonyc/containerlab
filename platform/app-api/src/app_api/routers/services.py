"""Service Explorer v1 API (bounded read-side grouping over policies + topology)."""

from fastapi import APIRouter, Depends, HTTPException, status

from app_api.dependencies.read_side_query import read_side_primary_list_limit
from app_api.schemas.service_dossier import ServiceDossierResponse
from app_api.schemas.service_explorer import ServiceDetailResponse, ServicesListResponse
from app_api.services.service_dossier import build_service_dossier_response
from app_api.services.service_explorer import build_service_detail_response, build_services_list_response

router = APIRouter(tags=["services"])


@router.get("/services", response_model=ServicesListResponse)
def list_services(
    limit: int | None = Depends(read_side_primary_list_limit),
) -> ServicesListResponse:
    """Discoverable service groupings derived from the current policy inventory."""
    return build_services_list_response(limit=limit)


@router.get(
    "/services/{service_id:path}/dossier",
    response_model=ServiceDossierResponse,
)
def get_service_dossier(service_id: str) -> ServiceDossierResponse:
    """Composed Service Dossier v1 for one ``service_id`` (reuse-only nested assemblies)."""
    body = build_service_dossier_response(service_id)
    if body is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No service matches the requested service_id for the current policy inventory, "
                "or the service_id form is not supported."
            ),
        )
    return body


@router.get(
    "/services/{service_id:path}",
    response_model=ServiceDetailResponse,
)
def get_service(service_id: str) -> ServiceDetailResponse:
    """Detail for one ``service_id`` (``policy:…``, ``color:…``, ``headend:…``, or ``endpoint:…``)."""
    body = build_service_detail_response(service_id)
    if body is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No service matches the requested service_id for the current policy inventory, "
                "or the service_id form is not supported."
            ),
        )
    return body

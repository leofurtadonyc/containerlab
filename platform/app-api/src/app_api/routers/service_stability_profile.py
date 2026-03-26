"""Service stability profile API (Phase 2, read-only)."""

from fastapi import APIRouter, HTTPException, status

from app_api.schemas.service_stability_profile import ServiceStabilityProfileResponse
from app_api.services.service_stability_profile import build_service_stability_profile_response

router = APIRouter(tags=["services"])


@router.get(
    "/services/{service_id:path}/stability-profile",
    response_model=ServiceStabilityProfileResponse,
)
def get_service_stability_profile(service_id: str) -> ServiceStabilityProfileResponse:
    """Return bounded stability interpretation for one ``service_id`` (read-only assembly).

    Unknown or unsupported ``service_id`` values return **404** (same identity family as
    Service Explorer detail, dossier, and service evidence timeline/delta).
    """
    response = build_service_stability_profile_response(service_id)
    if response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No service matches the requested service_id for the current policy inventory, "
                "or the service_id form is not supported."
            ),
        )
    return response

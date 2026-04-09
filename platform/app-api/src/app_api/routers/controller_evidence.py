"""Controller southbound session truth API v2 (BGP-LS / PCEP / NETCONF lanes)."""

from fastapi import APIRouter

from app_api.schemas.controller_evidence import (
    BgpLsLaneOnlyResponse,
    ControllerEvidenceResponse,
    NetconfLaneOnlyResponse,
    PcepLaneOnlyResponse,
)
from app_api.services.controller_evidence import (
    build_bgpls_lane_only_response,
    build_controller_evidence_response,
    build_netconf_lane_only_response,
    build_pcep_lane_only_response,
)


router = APIRouter(tags=["controller"])


@router.get("/controller/evidence", response_model=ControllerEvidenceResponse)
def get_controller_evidence() -> ControllerEvidenceResponse:
    """Return aggregate controller southbound session truth (v2 lanes, backend-owned)."""
    return build_controller_evidence_response()


@router.get("/controller/evidence/bgpls", response_model=BgpLsLaneOnlyResponse)
def get_controller_evidence_bgpls() -> BgpLsLaneOnlyResponse:
    """BGP-LS lane only (same enrichment parse as deeper topology truth controller export)."""
    return build_bgpls_lane_only_response()


@router.get("/controller/evidence/pcep", response_model=PcepLaneOnlyResponse)
def get_controller_evidence_pcep() -> PcepLaneOnlyResponse:
    """PCEP-class topology partition from the shared network-topology aggregate."""
    return build_pcep_lane_only_response()


@router.get("/controller/evidence/netconf", response_model=NetconfLaneOnlyResponse)
def get_controller_evidence_netconf() -> NetconfLaneOnlyResponse:
    """NETCONF-oriented topology / supplemental connector hints from ODL RESTCONF."""
    return build_netconf_lane_only_response()

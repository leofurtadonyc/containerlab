"""Topology API endpoints."""

from fastapi import APIRouter, HTTPException, Query

from app_api.schemas.failure_impact import FailureImpactViewResponse
from app_api.schemas.topology import TopologyResponse
from app_api.schemas.topology_truth import TopologyTruthResponse
from app_api.schemas.topology_object_dossier import TopologyObjectDossierResponse
from app_api.schemas.topology_object_evidence_delta import TopologyObjectEvidenceDeltaResponse
from app_api.schemas.topology_object_evidence_timeline import TopologyObjectEvidenceTimelineResponse
from app_api.schemas.topology_related_policies import TopologyObjectRelatedPoliciesResponse
from app_api.schemas.topology_risk_summary import TopologyRiskSummaryResponse
from app_api.services.failure_impact import build_failure_impact_view_response
from app_api.services.topology import build_topology_response
from app_api.services.topology_truth import build_topology_truth_response
from app_api.services.topology_object_dossier import build_topology_object_dossier_response
from app_api.services.topology_object_evidence_delta import build_topology_object_evidence_delta_response
from app_api.services.topology_object_evidence_timeline import build_topology_object_evidence_timeline_response
from app_api.services.topology_related_policies import build_topology_object_related_policies_response
from app_api.services.topology_risk_summary import build_topology_risk_summary_response


router = APIRouter(tags=["topology"])


@router.get("/topology/risk-summary", response_model=TopologyRiskSummaryResponse)
def get_topology_risk_summary() -> TopologyRiskSummaryResponse:
    """Return bounded topology risk summary v1: ranked nodes and links by related-policy degraded counts.

    Read-only evidence assembly; not SLA/traffic risk, blast radius, or global policy health.
    """
    return build_topology_risk_summary_response()


@router.get("/topology/objects/{object_id}/related-policies", response_model=TopologyObjectRelatedPoliciesResponse)
def get_topology_object_related_policies(object_id: str) -> TopologyObjectRelatedPoliciesResponse:
    """Return policies whose normalized string fields match a topology node or link endpoint identifiers.

    ``object_id`` must be a ``node_id`` present in the current topology snapshot or a ``link_id``
    present in that snapshot. Unknown ids return **404** (not an empty list).
    """
    response = build_topology_object_related_policies_response(object_id)
    if response is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Topology object not found: {object_id!r} is not a known node_id or link_id "
                "in the current normalized topology snapshot."
            ),
        )
    return response


@router.get("/topology/objects/{object_id}/dossier", response_model=TopologyObjectDossierResponse)
def get_topology_object_dossier(object_id: str) -> TopologyObjectDossierResponse:
    """Return composed topology object dossier v1 (read-only evidence assembly).

    Unknown ``object_id`` values return **404** (same identity rules as related-policies and failure-impact).
    """
    response = build_topology_object_dossier_response(object_id)
    if response is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Topology object not found: {object_id!r} is not a known node_id or link_id "
                "in the current normalized topology snapshot."
            ),
        )
    return response


@router.get("/topology/objects/{object_id}/evidence-delta", response_model=TopologyObjectEvidenceDeltaResponse)
def get_topology_object_evidence_delta(object_id: str) -> TopologyObjectEvidenceDeltaResponse:
    """Return bounded topology-object evidence delta v1 (read-only assembly).

    Unknown ``object_id`` values return **404** (same identity rules as related-policies and dossier).
    """
    response = build_topology_object_evidence_delta_response(object_id)
    if response is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Topology object not found: {object_id!r} is not a known node_id or link_id "
                "in the current normalized topology snapshot."
            ),
        )
    return response


@router.get("/topology/objects/{object_id}/evidence-timeline", response_model=TopologyObjectEvidenceTimelineResponse)
def get_topology_object_evidence_timeline(object_id: str) -> TopologyObjectEvidenceTimelineResponse:
    """Return bounded topology-object evidence timeline v1 (read-only assembly).

    Unknown ``object_id`` values return **404** (same identity rules as related-policies and dossier).
    """
    response = build_topology_object_evidence_timeline_response(object_id)
    if response is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Topology object not found: {object_id!r} is not a known node_id or link_id "
                "in the current normalized topology snapshot."
            ),
        )
    return response


@router.get("/topology/objects/{object_id}/failure-impact", response_model=FailureImpactViewResponse)
def get_topology_object_failure_impact(object_id: str) -> FailureImpactViewResponse:
    """Return bounded failure-impact v1 rollups for a topology node or link (read-only evidence assembly).

    Unknown ``object_id`` values return **404** (same identity rules as related-policies).
    """
    response = build_failure_impact_view_response(object_id)
    if response is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Topology object not found: {object_id!r} is not a known node_id or link_id "
                "in the current normalized topology snapshot."
            ),
        )
    return response


@router.get("/topology/truth", response_model=TopologyTruthResponse)
def get_topology_truth(truth_posture: str | None = Query(None)) -> TopologyTruthResponse:
    """Return merged deeper topology truth (gNMI baseline + optional ODL network-topology export).

    Optional ``truth_posture`` filters merged nodes/links to one posture label (backend filter).
    """
    return build_topology_truth_response(truth_posture=truth_posture)


@router.get("/topology", response_model=TopologyResponse)
def get_topology() -> TopologyResponse:
    """Return the current normalized topology view."""
    return build_topology_response()

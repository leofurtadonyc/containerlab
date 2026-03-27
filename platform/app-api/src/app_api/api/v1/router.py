"""Version 1 API router composition."""

from fastapi import APIRouter

from app_api.routers.audit_history import router as audit_history_router
from app_api.routers.capabilities import router as capabilities_router
from app_api.routers.change_intelligence import router as change_intelligence_router
from app_api.routers.change_safety_case import router as change_safety_case_router
from app_api.routers.delta_digest import router as delta_digest_router
from app_api.routers.evidence_consistency import router as evidence_consistency_router
from app_api.routers.evidence_quality_workspace import router as evidence_quality_workspace_router
from app_api.routers.evidence_weakness_explanation import router as evidence_weakness_explanation_router
from app_api.routers.evidence_pack import router as evidence_pack_router
from app_api.routers.exports import router as exports_router
from app_api.routers.investigation_workspace import router as investigation_workspace_router
from app_api.routers.maintenance_evidence_workspace import router as maintenance_evidence_workspace_router
from app_api.routers.maintenance_preview import router as maintenance_preview_router
from app_api.routers.maintenance_window_workspace import router as maintenance_window_workspace_router
from app_api.routers.operator_briefing import router as operator_briefing_router
from app_api.routers.operator_search import router as operator_search_router
from app_api.routers.operational_stability_summary import (
    router as operational_stability_summary_router,
)
from app_api.routers.path_explorer import router as path_explorer_router
from app_api.routers.service_impact_workspace import router as service_impact_workspace_router
from app_api.routers.devices import router as devices_router
from app_api.routers.health import router as health_router
from app_api.routers.platform import router as platform_router
from app_api.routers.readiness_snapshot_history import (
    router as readiness_snapshot_history_router,
)
from app_api.routers.reports import router as reports_router
from app_api.routers.policies import router as policies_router
from app_api.routers.service_stability_profile import router as service_stability_profile_router
from app_api.routers.services import router as services_router
from app_api.routers.topology import router as topology_router
from app_api.routers.topology_object_stability_profile import (
    router as topology_object_stability_profile_router,
)
from app_api.routers.workflow_history import router as workflow_history_router


router = APIRouter()
router.include_router(delta_digest_router)
router.include_router(evidence_consistency_router)
router.include_router(evidence_quality_workspace_router)
router.include_router(evidence_weakness_explanation_router)
router.include_router(change_intelligence_router)
router.include_router(change_safety_case_router)
router.include_router(exports_router)
router.include_router(evidence_pack_router)
router.include_router(investigation_workspace_router)
router.include_router(maintenance_preview_router)
router.include_router(maintenance_evidence_workspace_router)
router.include_router(maintenance_window_workspace_router)
router.include_router(operator_briefing_router)
router.include_router(operator_search_router)
router.include_router(operational_stability_summary_router)
router.include_router(workflow_history_router)
router.include_router(audit_history_router)
router.include_router(devices_router)
router.include_router(topology_router)
router.include_router(topology_object_stability_profile_router)
router.include_router(policies_router)
router.include_router(path_explorer_router)
router.include_router(service_impact_workspace_router)
# Register before ``services_router`` so ``/services/{service_id:path}/stability-profile`` is not
# swallowed by the catch-all ``GET /services/{service_id:path}`` detail route.
router.include_router(service_stability_profile_router)
router.include_router(services_router)
router.include_router(capabilities_router)
router.include_router(readiness_snapshot_history_router)
router.include_router(reports_router)
router.include_router(health_router)
router.include_router(platform_router)

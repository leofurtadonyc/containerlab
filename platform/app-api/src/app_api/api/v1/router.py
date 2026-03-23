"""Version 1 API router composition."""

from fastapi import APIRouter

from app_api.routers.audit_history import router as audit_history_router
from app_api.routers.capabilities import router as capabilities_router
from app_api.routers.change_intelligence import router as change_intelligence_router
from app_api.routers.delta_digest import router as delta_digest_router
from app_api.routers.evidence_pack import router as evidence_pack_router
from app_api.routers.exports import router as exports_router
from app_api.routers.investigation_workspace import router as investigation_workspace_router
from app_api.routers.operator_briefing import router as operator_briefing_router
from app_api.routers.operator_search import router as operator_search_router
from app_api.routers.devices import router as devices_router
from app_api.routers.health import router as health_router
from app_api.routers.platform import router as platform_router
from app_api.routers.readiness_snapshot_history import (
    router as readiness_snapshot_history_router,
)
from app_api.routers.policies import router as policies_router
from app_api.routers.topology import router as topology_router
from app_api.routers.workflow_history import router as workflow_history_router


router = APIRouter()
router.include_router(delta_digest_router)
router.include_router(change_intelligence_router)
router.include_router(exports_router)
router.include_router(evidence_pack_router)
router.include_router(investigation_workspace_router)
router.include_router(operator_briefing_router)
router.include_router(operator_search_router)
router.include_router(workflow_history_router)
router.include_router(audit_history_router)
router.include_router(devices_router)
router.include_router(topology_router)
router.include_router(policies_router)
router.include_router(capabilities_router)
router.include_router(readiness_snapshot_history_router)
router.include_router(health_router)
router.include_router(platform_router)

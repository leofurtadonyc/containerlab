"""Version 1 API router composition."""

from fastapi import APIRouter

from app_api.routers.audit_history import router as audit_history_router
from app_api.routers.capabilities import router as capabilities_router
from app_api.routers.devices import router as devices_router
from app_api.routers.health import router as health_router
from app_api.routers.platform import router as platform_router
from app_api.routers.policies import router as policies_router
from app_api.routers.topology import router as topology_router
from app_api.routers.workflow_history import router as workflow_history_router


router = APIRouter()
router.include_router(workflow_history_router)
router.include_router(audit_history_router)
router.include_router(devices_router)
router.include_router(topology_router)
router.include_router(policies_router)
router.include_router(capabilities_router)
router.include_router(health_router)
router.include_router(platform_router)

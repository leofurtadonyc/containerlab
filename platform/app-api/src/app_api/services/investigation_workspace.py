"""Assemble bounded investigation context from existing read-side responses only."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.investigation_workspace import (
    INVESTIGATION_WORKSPACE_CONTRACT_ID,
    InvestigationContextAssemblyResponse,
    InvestigationWorkspaceSafetyFraming,
)
from app_api.services.capabilities import build_capabilities_list_response
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
    build_recent_change_summary_response,
)
from app_api.services.platform import build_platform_status_response


def build_investigation_context_assembly_response(
    *,
    sync_runs_limit: int = RECENT_CHANGE_SYNC_RUNS_DEFAULT,
) -> InvestigationContextAssemblyResponse:
    """Compose change intelligence, platform status, and capabilities from existing services.

    Does not add collection, validation, drift, or workflow semantics; nested payloads
    retain their own contracts and honesty limits.
    """
    settings = get_settings()
    bounded = max(1, min(int(sync_runs_limit), RECENT_CHANGE_SYNC_RUNS_MAX))

    recent_change = build_recent_change_summary_response(sync_runs_limit=bounded)
    platform_status = build_platform_status_response()
    capabilities = build_capabilities_list_response()

    now = datetime.now(UTC)
    assembly_notes = [
        (
            f"Assembly contract {INVESTIGATION_WORKSPACE_CONTRACT_ID}; nested sources: "
            "change intelligence (recent summary), platform status, capabilities matrix."
        ),
        (
            "Readiness and history semantics remain inside nested payloads under their own "
            "contracts; this assembly does not synthesize scores or safe-to-change posture."
        ),
        "No validation verdict, drift detection, or workflow authorization is introduced here.",
    ]

    return InvestigationContextAssemblyResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        safety=InvestigationWorkspaceSafetyFraming(
            authority_posture="interpretation_support_only",
        ),
        assembly_notes=assembly_notes,
        recent_change=recent_change,
        platform_status=platform_status,
        capabilities=capabilities,
    )

"""Assemble bounded operator situation (evidence) pack from existing read-side services only."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.evidence_pack import (
    EVIDENCE_PACK_CONTRACT_ID,
    EvidencePackSafetyFraming,
    SituationPackAssemblyResponse,
    SITUATION_PACK_GUIDANCE_FRAMING,
)
from app_api.services.audit_history import build_audit_history_response
from app_api.services.change_intelligence import (
    RECENT_CHANGE_SYNC_RUNS_DEFAULT,
    RECENT_CHANGE_SYNC_RUNS_MAX,
)
from app_api.services.devices import build_devices_list_response
from app_api.services.investigation_workspace import (
    build_investigation_context_assembly_response,
)
from app_api.services.policies import build_policies_list_response
from app_api.services.readiness_snapshot_history import (
    build_readiness_snapshot_history_response,
)
from app_api.services.topology import build_topology_response
from app_api.services.workflow_history import build_workflow_history_response


def build_situation_pack_assembly_response(
    *,
    sync_runs_limit: int = RECENT_CHANGE_SYNC_RUNS_DEFAULT,
) -> SituationPackAssemblyResponse:
    """Compose devices, topology, policies, readiness, histories, and investigation context.

    Uses only existing builder functions; does not add collection, validation, drift,
    workflow execution, or cross-domain scoring. Nested honesty limits stay inside each
    contract. ``change_intelligence``, ``platform_status``, and ``capabilities`` domains
    are included only under ``investigation_context`` to avoid duplicating large payloads.
    """
    settings = get_settings()
    bounded = max(1, min(int(sync_runs_limit), RECENT_CHANGE_SYNC_RUNS_MAX))

    investigation_context = build_investigation_context_assembly_response(
        sync_runs_limit=bounded,
    )
    devices = build_devices_list_response()
    topology = build_topology_response()
    policies = build_policies_list_response()
    readiness = build_readiness_snapshot_history_response(
        limit_requested=None,
        blocker_filter=None,
        include_blockers_detail=False,
    )
    workflow_history = build_workflow_history_response(sync_runs_limit=bounded)
    audit_history = build_audit_history_response(
        limit=None,
        sync_runs_limit=bounded,
        readiness_snapshot_history_limit=None,
    )

    now = datetime.now(UTC)
    assembly_notes = [
        (
            f"Situation pack assembly uses contract {EVIDENCE_PACK_CONTRACT_ID}; "
            "nested sources per domain: devices, topology, policies, readiness snapshot "
            "history, workflow history, audit history, investigation_context "
            f"({investigation_context.safety.contract_id})."
        ),
        (
            "Change intelligence (recent summary), platform status, and capabilities appear "
            "only under investigation_context; they are not duplicated as separate top-level "
            "fields."
        ),
        (
            "Each nested payload retains its own Phase 2 honesty limits; this assembly does "
            "not synthesize validation verdicts, safe-to-change posture, or ranked operator "
            "actions across domains."
        ),
    ]

    return SituationPackAssemblyResponse(
        metadata=ApiResponseMetadata(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=now,
        ),
        safety=EvidencePackSafetyFraming(authority_posture="interpretation_support_only"),
        assembly_notes=assembly_notes,
        situation_pack_guidance_framing=SITUATION_PACK_GUIDANCE_FRAMING,
        devices=devices,
        topology=topology,
        policies=policies,
        readiness=readiness,
        workflow_history=workflow_history,
        audit_history=audit_history,
        investigation_context=investigation_context,
    )

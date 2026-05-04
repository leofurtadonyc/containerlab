#!/usr/bin/env python3
"""Check app-api route families against app-web contract coverage.

This is intentionally lightweight and static. It does not replace FastAPI
OpenAPI generation or frontend type generation; it catches route-family drift
that would otherwise rely on agents remembering to update the WebUI client.
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path


PLATFORM_ROOT = Path(__file__).resolve().parents[1]
APP_API_V1_ROUTER = PLATFORM_ROOT / "app-api/src/app_api/api/v1/router.py"
APP_WEB_SRC = PLATFORM_ROOT / "app-web/src"
APP_WEB_CLIENT = APP_WEB_SRC / "api/client.ts"
APP_WEB_CONTRACTS = APP_WEB_SRC / "api/contracts.ts"


@dataclass(frozen=True)
class RouteFamilyGovernance:
    """Contract drift policy for one backend router include."""

    route_family: str
    coverage: str
    required_frontend_markers: tuple[str, ...] = ()
    required_contract_markers: tuple[str, ...] = ()
    backend_only_reason: str | None = None


ROUTE_FAMILY_GOVERNANCE: dict[str, RouteFamilyGovernance] = {
    "delta_digest_router": RouteFamilyGovernance(
        route_family="GET /api/v1/delta-digest",
        coverage="frontend_client",
        required_frontend_markers=("getDeltaDigest", "/api/v1/delta-digest"),
        required_contract_markers=("CrossDomainDeltaDigestResponse",),
    ),
    "evidence_consistency_router": RouteFamilyGovernance(
        route_family="GET /api/v1/evidence-consistency/summary",
        coverage="frontend_client",
        required_frontend_markers=("getEvidenceConsistencySummary", "/api/v1/evidence-consistency/summary"),
        required_contract_markers=("EvidenceConsistencySummaryResponse",),
    ),
    "evidence_quality_workspace_router": RouteFamilyGovernance(
        route_family="GET /api/v1/evidence-quality-workspace",
        coverage="frontend_client",
        required_frontend_markers=("getEvidenceQualityWorkspace", "/api/v1/evidence-quality-workspace"),
        required_contract_markers=("EvidenceQualitySummaryResponse",),
    ),
    "evidence_weakness_explanation_router": RouteFamilyGovernance(
        route_family="GET /api/v1/evidence-weakness-explanation",
        coverage="frontend_client",
        required_frontend_markers=("getEvidenceWeaknessExplanation", "/api/v1/evidence-weakness-explanation"),
        required_contract_markers=("EvidenceWeaknessExplanationResponse", "EvidenceWeaknessExplanationBlock"),
    ),
    "change_intelligence_router": RouteFamilyGovernance(
        route_family="GET /api/v1/change-intelligence/recent-summary",
        coverage="frontend_client",
        required_frontend_markers=("getRecentChangeSummary", "/api/v1/change-intelligence/recent-summary"),
        required_contract_markers=("RecentChangeSummaryResponse",),
    ),
    "change_safety_case_router": RouteFamilyGovernance(
        route_family="GET /api/v1/reports/change-safety-case/{policy,service,maintenance}",
        coverage="frontend_client",
        required_frontend_markers=("getPolicyChangeSafetyCase", "/api/v1/reports/change-safety-case/"),
        required_contract_markers=("ChangeSafetyCaseResponse",),
    ),
    "exports_router": RouteFamilyGovernance(
        route_family="GET /api/v1/exports/...",
        coverage="frontend_source",
        required_frontend_markers=("downloadEvidenceExport", "/api/v1/exports/"),
    ),
    "evidence_pack_router": RouteFamilyGovernance(
        route_family="GET /api/v1/evidence-pack/situation",
        coverage="frontend_client",
        required_frontend_markers=("getEvidencePackSituation", "/api/v1/evidence-pack/situation"),
        required_contract_markers=("SituationPackAssemblyResponse",),
    ),
    "investigation_workspace_router": RouteFamilyGovernance(
        route_family="GET /api/v1/investigation-workspace/context",
        coverage="frontend_client",
        required_frontend_markers=("getInvestigationWorkspaceContext", "/api/v1/investigation-workspace/context"),
        required_contract_markers=("InvestigationContextAssemblyResponse",),
    ),
    "maintenance_preview_router": RouteFamilyGovernance(
        route_family="GET /api/v1/maintenance-preview",
        coverage="frontend_client",
        required_frontend_markers=("getMaintenancePreview", "/api/v1/maintenance-preview"),
        required_contract_markers=("MaintenancePreviewResponse",),
    ),
    "maintenance_evidence_workspace_router": RouteFamilyGovernance(
        route_family="GET /api/v1/maintenance-evidence-workspace",
        coverage="frontend_client",
        required_frontend_markers=("getMaintenanceEvidenceWorkspace", "/api/v1/maintenance-evidence-workspace"),
        required_contract_markers=("MaintenanceEvidenceWorkspaceResponse",),
    ),
    "maintenance_window_workspace_router": RouteFamilyGovernance(
        route_family="GET /api/v1/maintenance-window-workspace",
        coverage="frontend_client",
        required_frontend_markers=("getMaintenanceWindowWorkspace", "/api/v1/maintenance-window-workspace"),
        required_contract_markers=("MaintenanceWindowWorkspaceResponse",),
    ),
    "operator_briefing_router": RouteFamilyGovernance(
        route_family="GET /api/v1/operator-briefing",
        coverage="frontend_client",
        required_frontend_markers=("getOperatorBriefing", "/api/v1/operator-briefing"),
        required_contract_markers=("OperatorBriefingWorkspaceResponse",),
    ),
    "operator_search_router": RouteFamilyGovernance(
        route_family="GET /api/v1/operator-search",
        coverage="frontend_client",
        required_frontend_markers=("getOperatorSearch", "/api/v1/operator-search"),
        required_contract_markers=("OperatorSearchResponse",),
    ),
    "operational_stability_summary_router": RouteFamilyGovernance(
        route_family="GET /api/v1/stability/summary",
        coverage="frontend_client",
        required_frontend_markers=("getOperationalStabilitySummary", "/api/v1/stability/summary"),
        required_contract_markers=("OperationalStabilitySummaryResponse",),
    ),
    "workflow_history_router": RouteFamilyGovernance(
        route_family="GET /api/v1/workflow-history",
        coverage="frontend_client",
        required_frontend_markers=("getWorkflowHistory", "/api/v1/workflow-history"),
        required_contract_markers=("WorkflowHistoryResponse",),
    ),
    "workflow_lifecycle_router": RouteFamilyGovernance(
        route_family="/api/v1/workflow-lifecycle",
        coverage="frontend_client",
        required_frontend_markers=("getWorkflowLifecycleList", "/api/v1/workflow-lifecycle"),
        required_contract_markers=("WorkflowLifecycleListResponse", "WorkflowLifecycleDetailResponse"),
    ),
    "validation_engine_router": RouteFamilyGovernance(
        route_family="/api/v1/validations",
        coverage="frontend_client",
        required_frontend_markers=("getValidationList", "/api/v1/validations"),
        required_contract_markers=("ValidationListResponse", "ValidationDetailResponse"),
    ),
    "safe_actions_router": RouteFamilyGovernance(
        route_family="/api/v1/actions",
        coverage="frontend_client",
        required_frontend_markers=("getSafeActionList", "getActionSafetyCase", "/api/v1/actions"),
        required_contract_markers=("SafeActionListResponse", "SafeActionDetailResponse", "ActionSafetyCaseResponse"),
    ),
    "rollback_orchestration_router": RouteFamilyGovernance(
        route_family="/api/v1/rollbacks",
        coverage="frontend_client",
        required_frontend_markers=("getRollbackList", "/api/v1/rollbacks"),
        required_contract_markers=("RollbackListResponse", "RollbackDetailResponse"),
    ),
    "preview_engine_router": RouteFamilyGovernance(
        route_family="/api/v1/previews",
        coverage="frontend_client",
        required_frontend_markers=("getPreviewList", "/api/v1/previews"),
        required_contract_markers=("PreviewListResponse", "PreviewDetailResponse"),
    ),
    "audit_history_router": RouteFamilyGovernance(
        route_family="GET /api/v1/audit-history",
        coverage="frontend_client",
        required_frontend_markers=("getAuditHistory", "/api/v1/audit-history"),
        required_contract_markers=("AuditHistoryResponse",),
    ),
    "devices_router": RouteFamilyGovernance(
        route_family="GET /api/v1/devices",
        coverage="frontend_client",
        required_frontend_markers=("getDevices", "/api/v1/devices"),
        required_contract_markers=("DevicesListResponse",),
    ),
    "topology_router": RouteFamilyGovernance(
        route_family="/api/v1/topology",
        coverage="frontend_client",
        required_frontend_markers=("getTopology", "/api/v1/topology"),
        required_contract_markers=("TopologyResponse",),
    ),
    "topology_object_stability_profile_router": RouteFamilyGovernance(
        route_family="GET /api/v1/topology/objects/{object_id}/stability-profile",
        coverage="frontend_client",
        required_frontend_markers=("getTopologyObjectStabilityProfile", "/api/v1/topology/objects/"),
        required_contract_markers=("TopologyObjectStabilityProfileResponse",),
    ),
    "policies_router": RouteFamilyGovernance(
        route_family="/api/v1/policies",
        coverage="frontend_client",
        required_frontend_markers=("getPolicies", "/api/v1/policies"),
        required_contract_markers=("PoliciesListResponse",),
    ),
    "path_explorer_router": RouteFamilyGovernance(
        route_family="GET /api/v1/path-explorer",
        coverage="frontend_client",
        required_frontend_markers=("getPathExplorerWorkspace", "/api/v1/path-explorer"),
        required_contract_markers=("PathExplorerWorkspaceResponse",),
    ),
    "service_impact_workspace_router": RouteFamilyGovernance(
        route_family="GET /api/v1/service-impact-workspace",
        coverage="frontend_client",
        required_frontend_markers=("getServiceImpactWorkspace", "/api/v1/service-impact-workspace"),
        required_contract_markers=("ServiceImpactWorkspaceResponse",),
    ),
    "service_stability_profile_router": RouteFamilyGovernance(
        route_family="GET /api/v1/services/{service_id}/stability-profile",
        coverage="frontend_client",
        required_frontend_markers=("getServiceStabilityProfile", "/api/v1/services/"),
        required_contract_markers=("ServiceStabilityProfileResponse",),
    ),
    "services_router": RouteFamilyGovernance(
        route_family="/api/v1/services",
        coverage="frontend_client",
        required_frontend_markers=("getServices", "/api/v1/services"),
        required_contract_markers=("ServicesListResponse", "ServiceDetailResponse"),
    ),
    "controller_evidence_router": RouteFamilyGovernance(
        route_family="GET /api/v1/controller/evidence",
        coverage="frontend_client",
        required_frontend_markers=("getControllerEvidence", "/api/v1/controller/evidence"),
        required_contract_markers=("ControllerEvidenceResponse",),
    ),
    "capabilities_router": RouteFamilyGovernance(
        route_family="GET /api/v1/capabilities",
        coverage="frontend_client",
        required_frontend_markers=("getCapabilities", "/api/v1/capabilities"),
        required_contract_markers=("CapabilitiesListResponse",),
    ),
    "readiness_snapshot_history_router": RouteFamilyGovernance(
        route_family="GET /api/v1/readiness-snapshot-history",
        coverage="backend_only_allowlisted",
        required_contract_markers=("ReadinessSnapshotHistoryResponse",),
        backend_only_reason=(
            "Readiness snapshot history is currently surfaced through capabilities/readiness assemblies; "
            "there is no dedicated WebUI client method for this support endpoint yet."
        ),
    ),
    "reports_router": RouteFamilyGovernance(
        route_family="GET /api/v1/reports/{service,policy,maintenance}-impact",
        coverage="frontend_client",
        required_frontend_markers=("getServiceImpactReport", "/api/v1/reports/service-impact"),
        required_contract_markers=("ImpactReportResponse",),
    ),
    "health_router": RouteFamilyGovernance(
        route_family="GET /api/v1/health",
        coverage="backend_only_allowlisted",
        backend_only_reason=(
            "Runtime health endpoint is consumed by nginx/proxy checks and verify-core-runtime, "
            "not by the typed product API client."
        ),
    ),
    "platform_router": RouteFamilyGovernance(
        route_family="GET /api/v1/platform/status",
        coverage="frontend_client",
        required_frontend_markers=("getPlatformStatus", "/api/v1/platform/status"),
        required_contract_markers=("PlatformStatusResponse",),
    ),
}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def read_frontend_source() -> str:
    chunks: list[str] = []
    for path in sorted(APP_WEB_SRC.rglob("*")):
        if path.suffix in {".ts", ".tsx"}:
            chunks.append(read_text(path))
    return "\n".join(chunks)


def included_router_names(router_source: str) -> list[str]:
    return re.findall(r"router\.include_router\((\w+)\)", router_source)


def main() -> int:
    errors: list[str] = []

    router_source = read_text(APP_API_V1_ROUTER)
    client_source = read_text(APP_WEB_CLIENT)
    contracts_source = read_text(APP_WEB_CONTRACTS)
    frontend_source = read_frontend_source()
    included = included_router_names(router_source)

    missing_governance = sorted(set(included) - set(ROUTE_FAMILY_GOVERNANCE))
    stale_governance = sorted(set(ROUTE_FAMILY_GOVERNANCE) - set(included))
    if missing_governance:
        errors.append(
            "Backend router include(s) missing API contract governance: "
            + ", ".join(missing_governance)
        )
    if stale_governance:
        errors.append(
            "API contract governance references router include(s) no longer registered: "
            + ", ".join(stale_governance)
        )

    for router_name in included:
        governance = ROUTE_FAMILY_GOVERNANCE.get(router_name)
        if governance is None:
            continue

        if governance.coverage == "backend_only_allowlisted":
            reason = (governance.backend_only_reason or "").strip()
            if len(reason) < 40:
                errors.append(
                    f"{router_name} ({governance.route_family}) is backend-only but lacks a specific reason."
                )
        else:
            source = client_source if governance.coverage == "frontend_client" else frontend_source
            for marker in governance.required_frontend_markers:
                if marker not in source:
                    errors.append(
                        f"{router_name} ({governance.route_family}) missing frontend marker {marker!r} "
                        f"for coverage mode {governance.coverage}."
                    )

        for marker in governance.required_contract_markers:
            if marker not in contracts_source:
                errors.append(
                    f"{router_name} ({governance.route_family}) missing contract marker {marker!r} "
                    "in app-web/src/api/contracts.ts."
                )

    if errors:
        print("API contract drift check failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        "API contract drift check passed: "
        f"{len(included)} backend router families have frontend coverage or an explicit backend-only reason."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

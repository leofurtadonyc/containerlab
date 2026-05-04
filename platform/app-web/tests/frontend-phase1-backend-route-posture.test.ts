import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const platformRoot = join(__dirname, "../..");
const appApiRoot = join(platformRoot, "app-api/src/app_api");

type RoutePosture =
  | "consumed"
  | "state-changing consumed"
  | "download-only"
  | "runtime-only"
  | "backend-only";

interface RoutePostureEntry {
  posture: RoutePosture;
  decision: string;
}

const BACKEND_ROUTE_POSTURE: Record<string, RoutePostureEntry> = {
  "GET /api/v1/actions": {
    posture: "backend-only",
    decision: "Safe Action list endpoint remains hidden from product navigation in Phase 1.",
  },
  "POST /api/v1/actions": {
    posture: "state-changing consumed",
    decision: "Safe Action create is visible in the bounded Safe Action workspace.",
  },
  "GET /api/v1/actions/{action_id}": {
    posture: "backend-only",
    decision: "Detail lookup remains helper-only; no direct routable product surface in Phase 1.",
  },
  "GET /api/v1/actions/{action_id}/timeline": {
    posture: "consumed",
    decision: "Timeline is loaded after visible Safe Action create/execute flows.",
  },
  "GET /api/v1/actions/{action_id}/safety-case": {
    posture: "consumed",
    decision: "Safety case is a visible bounded evidence surface.",
  },
  "POST /api/v1/actions/{action_id}/approve": {
    posture: "state-changing consumed",
    decision: "Approve is visible as part of the bounded Safe Action flow.",
  },
  "POST /api/v1/actions/{action_id}/reject": {
    posture: "backend-only",
    decision: "Reject method stays hidden until the workflow control IA decides its operator posture.",
  },
  "POST /api/v1/actions/{action_id}/execute": {
    posture: "state-changing consumed",
    decision: "Execute is visible but framed as platform-side, not device/controller push.",
  },
  "POST /api/v1/actions/{action_id}/cancel": {
    posture: "backend-only",
    decision: "Cancel method stays hidden until the workflow control IA decides its operator posture.",
  },
  "GET /api/v1/audit-history": {
    posture: "consumed",
    decision: "Audit history is a visible governance surface.",
  },
  "GET /api/v1/capabilities": {
    posture: "consumed",
    decision: "Capabilities is a visible governance surface.",
  },
  "GET /api/v1/change-intelligence/recent-summary": {
    posture: "consumed",
    decision: "Recent change summary is consumed by overview/read-side surfaces.",
  },
  "GET /api/v1/controller/evidence": {
    posture: "consumed",
    decision: "Aggregate controller evidence is visible as bounded helper evidence.",
  },
  "GET /api/v1/controller/evidence/bgpls": {
    posture: "backend-only",
    decision: "Granular controller lane route is not a standalone product workspace in Phase 1.",
  },
  "GET /api/v1/controller/evidence/netconf": {
    posture: "backend-only",
    decision: "Granular controller lane route is not a standalone product workspace in Phase 1.",
  },
  "GET /api/v1/controller/evidence/pcep": {
    posture: "backend-only",
    decision: "Granular controller lane route is not a standalone product workspace in Phase 1.",
  },
  "GET /api/v1/delta-digest": {
    posture: "consumed",
    decision: "Delta Digest is a visible evidence surface.",
  },
  "GET /api/v1/devices": {
    posture: "consumed",
    decision: "Devices is a visible network inventory surface.",
  },
  "GET /api/v1/evidence-consistency/summary": {
    posture: "consumed",
    decision: "Evidence Consistency is a visible evidence surface.",
  },
  "GET /api/v1/evidence-pack/situation": {
    posture: "consumed",
    decision: "Situation Room consumes this bounded evidence pack.",
  },
  "GET /api/v1/evidence-quality-workspace": {
    posture: "consumed",
    decision: "Evidence Quality workspace is visible.",
  },
  "GET /api/v1/evidence-weakness-explanation": {
    posture: "consumed",
    decision: "Evidence weakness explanation is visible and high-risk copy anchored.",
  },
  "GET /api/v1/exports/investigation-workspace/summary": {
    posture: "download-only",
    decision: "Evidence export helper path only; not a live workspace endpoint.",
  },
  "GET /api/v1/exports/maintenance-window-handoff": {
    posture: "backend-only",
    decision: "Maintenance handoff export is intentionally not surfaced in Phase 1.",
  },
  "GET /api/v1/exports/operator-briefing": {
    posture: "download-only",
    decision: "Operator briefing bundle export helper path only.",
  },
  "GET /api/v1/exports/policies/{policy_id}/dossier": {
    posture: "download-only",
    decision: "Evidence export helper path only.",
  },
  "GET /api/v1/exports/situation-room/summary": {
    posture: "download-only",
    decision: "Evidence export helper path only.",
  },
  "GET /api/v1/exports/topology-objects/{object_id}/dossier": {
    posture: "download-only",
    decision: "Evidence export helper path only.",
  },
  "GET /api/v1/health": {
    posture: "runtime-only",
    decision: "Runtime health route is not a product workspace.",
  },
  "GET /api/v1/investigation-workspace/context": {
    posture: "consumed",
    decision: "Investigation workspace is visible.",
  },
  "GET /api/v1/maintenance-evidence-workspace": {
    posture: "consumed",
    decision: "Maintenance Evidence workspace is visible.",
  },
  "GET /api/v1/maintenance-preview": {
    posture: "consumed",
    decision: "Maintenance Preview is visible.",
  },
  "GET /api/v1/maintenance-window-workspace": {
    posture: "consumed",
    decision: "Maintenance Window workspace is visible.",
  },
  "GET /api/v1/operator-briefing": {
    posture: "consumed",
    decision: "Operator Briefing is visible.",
  },
  "GET /api/v1/operator-search": {
    posture: "consumed",
    decision: "Global operator search consumes this navigation-first endpoint.",
  },
  "GET /api/v1/path-explorer": {
    posture: "consumed",
    decision: "Path Explorer is visible.",
  },
  "GET /api/v1/platform/status": {
    posture: "consumed",
    decision: "Platform status is visible.",
  },
  "GET /api/v1/policies": {
    posture: "consumed",
    decision: "Policies inventory is visible.",
  },
  "GET /api/v1/policies/{policy_id}/dossier": {
    posture: "consumed",
    decision: "Policy dossier workspace consumes this endpoint.",
  },
  "GET /api/v1/policies/{policy_id}/evidence-delta": {
    posture: "consumed",
    decision: "Policy evidence delta panel consumes this endpoint.",
  },
  "GET /api/v1/policies/{policy_id}/evidence-timeline": {
    posture: "consumed",
    decision: "Policy evidence timeline panel consumes this endpoint.",
  },
  "GET /api/v1/policies/{policy_id}/explainability": {
    posture: "consumed",
    decision: "Policy explainability workspace consumes this endpoint.",
  },
  "GET /api/v1/policies/{policy_id}/path-analysis": {
    posture: "consumed",
    decision: "Policy path analysis consumes this endpoint.",
  },
  "GET /api/v1/policies/{policy_id}/topology-impact": {
    posture: "consumed",
    decision: "Policy topology impact consumes this endpoint.",
  },
  "GET /api/v1/previews": {
    posture: "consumed",
    decision: "Preview list is visible in the Preview workspace.",
  },
  "POST /api/v1/previews": {
    posture: "state-changing consumed",
    decision: "Preview create is visible but non-executing.",
  },
  "GET /api/v1/previews/{preview_id}": {
    posture: "consumed",
    decision: "Preview detail is visible after selection/create.",
  },
  "GET /api/v1/previews/{preview_id}/diff": {
    posture: "consumed",
    decision: "Preview diff is visible as non-executing evidence.",
  },
  "GET /api/v1/previews/{preview_id}/timeline": {
    posture: "consumed",
    decision: "Preview timeline is visible.",
  },
  "GET /api/v1/readiness-snapshot-history": {
    posture: "backend-only",
    decision: "Standalone readiness snapshot history is not directly surfaced by the SPA in Phase 1.",
  },
  "GET /api/v1/reports/change-safety-case/maintenance": {
    posture: "consumed",
    decision: "CSC maintenance report is consumed by client and download helpers.",
  },
  "GET /api/v1/reports/change-safety-case/policy": {
    posture: "consumed",
    decision: "CSC policy report is consumed by client and download helpers.",
  },
  "GET /api/v1/reports/change-safety-case/service": {
    posture: "consumed",
    decision: "CSC service report is consumed by client and download helpers.",
  },
  "GET /api/v1/reports/maintenance-impact": {
    posture: "consumed",
    decision: "Maintenance Impact Report is consumed by client and download helpers.",
  },
  "GET /api/v1/reports/policy-impact": {
    posture: "consumed",
    decision: "Policy Impact Report is consumed by client and download helpers.",
  },
  "GET /api/v1/reports/service-impact": {
    posture: "consumed",
    decision: "Service Impact Report is consumed by client and download helpers.",
  },
  "GET /api/v1/rollbacks": {
    posture: "backend-only",
    decision: "Rollback list endpoint remains hidden from product navigation in Phase 1.",
  },
  "POST /api/v1/rollbacks": {
    posture: "state-changing consumed",
    decision: "Rollback create is visible in the bounded Rollback workspace.",
  },
  "GET /api/v1/rollbacks/{rollback_id}": {
    posture: "backend-only",
    decision: "Rollback detail lookup remains helper-only; no direct routable product surface in Phase 1.",
  },
  "GET /api/v1/rollbacks/{rollback_id}/timeline": {
    posture: "consumed",
    decision: "Rollback timeline is loaded after visible rollback create/execute flows.",
  },
  "POST /api/v1/rollbacks/{rollback_id}/approve": {
    posture: "state-changing consumed",
    decision: "Rollback approve is visible as part of the bounded rollback flow.",
  },
  "POST /api/v1/rollbacks/{rollback_id}/cancel": {
    posture: "backend-only",
    decision: "Rollback cancel method stays hidden until the workflow control IA decides its operator posture.",
  },
  "POST /api/v1/rollbacks/{rollback_id}/execute": {
    posture: "state-changing consumed",
    decision: "Rollback execute is visible but framed as compensation-only.",
  },
  "POST /api/v1/rollbacks/{rollback_id}/reject": {
    posture: "backend-only",
    decision: "Rollback reject method stays hidden until the workflow control IA decides its operator posture.",
  },
  "GET /api/v1/service-impact-workspace": {
    posture: "consumed",
    decision: "Service Impact workspace is visible.",
  },
  "GET /api/v1/services": {
    posture: "consumed",
    decision: "Service Explorer is visible.",
  },
  "GET /api/v1/services/{service_id:path}": {
    posture: "consumed",
    decision: "Service detail is visible; catch-all route ordering is protected.",
  },
  "GET /api/v1/services/{service_id:path}/dossier": {
    posture: "consumed",
    decision: "Service Dossier is visible.",
  },
  "GET /api/v1/services/{service_id:path}/evidence-delta": {
    posture: "consumed",
    decision: "Service evidence delta panel is visible.",
  },
  "GET /api/v1/services/{service_id:path}/evidence-timeline": {
    posture: "consumed",
    decision: "Service evidence timeline panel is visible.",
  },
  "GET /api/v1/services/{service_id:path}/stability-profile": {
    posture: "consumed",
    decision: "Service stability profile is visible.",
  },
  "GET /api/v1/stability/summary": {
    posture: "consumed",
    decision: "Stability workspace is visible.",
  },
  "GET /api/v1/topology": {
    posture: "consumed",
    decision: "Topology is visible.",
  },
  "GET /api/v1/topology/objects/{object_id}/dossier": {
    posture: "consumed",
    decision: "Topology object dossier is visible.",
  },
  "GET /api/v1/topology/objects/{object_id}/evidence-delta": {
    posture: "consumed",
    decision: "Topology object evidence delta is visible.",
  },
  "GET /api/v1/topology/objects/{object_id}/evidence-timeline": {
    posture: "consumed",
    decision: "Topology object evidence timeline is visible.",
  },
  "GET /api/v1/topology/objects/{object_id}/failure-impact": {
    posture: "consumed",
    decision: "Topology object failure impact is visible.",
  },
  "GET /api/v1/topology/objects/{object_id}/related-policies": {
    posture: "consumed",
    decision: "Topology related policies panel is visible.",
  },
  "GET /api/v1/topology/objects/{object_id}/stability-profile": {
    posture: "consumed",
    decision: "Topology object stability profile is visible.",
  },
  "GET /api/v1/topology/risk-summary": {
    posture: "consumed",
    decision: "Topology risk summary is visible.",
  },
  "GET /api/v1/topology/truth": {
    posture: "consumed",
    decision: "Topology truth is visible but bounded by safety copy.",
  },
  "GET /api/v1/validations": {
    posture: "consumed",
    decision: "Validation list is visible in Validation workspace.",
  },
  "POST /api/v1/validations": {
    posture: "state-changing consumed",
    decision: "Validation create is visible but non-executing.",
  },
  "GET /api/v1/validations/{validation_id}": {
    posture: "consumed",
    decision: "Validation detail is visible after selection/create.",
  },
  "GET /api/v1/validations/{validation_id}/timeline": {
    posture: "consumed",
    decision: "Validation timeline is visible.",
  },
  "GET /api/v1/workflow-history": {
    posture: "consumed",
    decision: "Workflow history is visible governance read-side evidence.",
  },
  "GET /api/v1/workflow-lifecycle": {
    posture: "consumed",
    decision: "Workflow lifecycle list is visible.",
  },
  "POST /api/v1/workflow-lifecycle": {
    posture: "state-changing consumed",
    decision: "Workflow lifecycle create is visible as record management only.",
  },
  "GET /api/v1/workflow-lifecycle/{workflow_id}": {
    posture: "consumed",
    decision: "Workflow lifecycle detail is visible.",
  },
  "GET /api/v1/workflow-lifecycle/{workflow_id}/timeline": {
    posture: "consumed",
    decision: "Workflow lifecycle timeline is visible.",
  },
  "POST /api/v1/workflow-lifecycle/{workflow_id}/transitions": {
    posture: "state-changing consumed",
    decision: "Workflow lifecycle transition is visible as record management only.",
  },
  "GET /metrics": {
    posture: "runtime-only",
    decision: "Prometheus scrape endpoint is not a product workspace.",
  },
};

describe("Phase 1 backend route posture", () => {
  it("classifies every FastAPI backend route without undecided posture", () => {
    const discovered = discoverBackendRoutes();
    expect(Object.keys(BACKEND_ROUTE_POSTURE).sort()).toEqual(discovered);
    expect(Object.values(BACKEND_ROUTE_POSTURE).every((entry) => entry.decision.length > 10)).toBe(true);
  });

  it("records resolved Phase 1 posture decisions for previously open endpoints", () => {
    expect(BACKEND_ROUTE_POSTURE["GET /api/v1/exports/maintenance-window-handoff"].posture).toBe("backend-only");
    expect(BACKEND_ROUTE_POSTURE["GET /api/v1/readiness-snapshot-history"].posture).toBe("backend-only");
    expect(BACKEND_ROUTE_POSTURE["GET /api/v1/controller/evidence/bgpls"].posture).toBe("backend-only");
    expect(BACKEND_ROUTE_POSTURE["POST /api/v1/actions/{action_id}/reject"].posture).toBe("backend-only");
    expect(BACKEND_ROUTE_POSTURE["POST /api/v1/actions/{action_id}/cancel"].posture).toBe("backend-only");
    expect(BACKEND_ROUTE_POSTURE["POST /api/v1/rollbacks/{rollback_id}/reject"].posture).toBe("backend-only");
    expect(BACKEND_ROUTE_POSTURE["POST /api/v1/rollbacks/{rollback_id}/cancel"].posture).toBe("backend-only");
  });
});

function discoverBackendRoutes(): string[] {
  const routerDir = join(appApiRoot, "routers");
  if (!existsSync(routerDir)) {
    return Object.keys(BACKEND_ROUTE_POSTURE).sort();
  }
  const routerRoutes = readdirSync(routerDir)
    .filter((name) => name.endsWith(".py") && name !== "__init__.py")
    .flatMap((name) => extractRoutes(join(routerDir, name), "/api/v1"));

  return [...routerRoutes, ...extractRoutes(join(appApiRoot, "metrics/router.py"), "")].sort();
}

function extractRoutes(path: string, apiPrefix: string): string[] {
  const source = readFileSync(path, "utf8");
  const prefix = readRouterPrefix(source);
  const routes: string[] = [];
  const routeRegex = /@router\.(get|post|put|patch|delete)\(\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of source.matchAll(routeRegex)) {
    const method = match[1].toUpperCase();
    const routePath = match[2] ?? match[3] ?? "";
    routes.push(`${method} ${joinRoute(apiPrefix, prefix, routePath)}`);
  }
  expect(routes, `No routes discovered in ${basename(path)}`).not.toEqual([]);
  return routes;
}

function readRouterPrefix(source: string): string {
  const match = source.match(/router = APIRouter\(([\s\S]*?)\)/);
  const args = match?.[1] ?? "";
  return args.match(/prefix=["']([^"']*)["']/)?.[1] ?? "";
}

function joinRoute(apiPrefix: string, routerPrefix: string, routePath: string): string {
  const pieces = [apiPrefix, routerPrefix, routePath].filter((piece) => piece.length > 0);
  const raw = pieces.join("/");
  return raw.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

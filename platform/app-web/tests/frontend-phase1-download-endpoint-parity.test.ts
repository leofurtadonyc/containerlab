import { describe, expect, it } from "vitest";

import { buildChangeSafetyCaseRequestPath } from "../src/lib/change-safety-case-download";
import { buildEvidenceExportRequestPath } from "../src/lib/evidence-export-download";
import { parseEvidenceExportJson } from "../src/lib/evidence-replay";
import { buildImpactReportRequestPath } from "../src/lib/impact-report-download";

type EndpointPosture = "consumed" | "download-only" | "runtime-only" | "backend-only" | "client-only";

const ENDPOINT_POSTURE_ALLOWLIST: Array<{ path: string; posture: EndpointPosture; note: string }> = [
  { path: "/api/v1/exports/policies/{policy_id}/dossier", posture: "download-only", note: "Evidence export helper only" },
  { path: "/api/v1/exports/topology-objects/{object_id}/dossier", posture: "download-only", note: "Evidence export helper only" },
  { path: "/api/v1/exports/situation-room/summary", posture: "download-only", note: "Evidence export helper only" },
  { path: "/api/v1/exports/investigation-workspace/summary", posture: "download-only", note: "Evidence export helper only" },
  { path: "/api/v1/exports/operator-briefing", posture: "download-only", note: "Evidence export helper only" },
  { path: "/api/v1/exports/maintenance-window-handoff", posture: "backend-only", note: "Not surfaced by Phase 1 frontend helpers" },
  { path: "/api/v1/reports/service-impact", posture: "consumed", note: "ApiClient and download helper" },
  { path: "/api/v1/reports/policy-impact", posture: "consumed", note: "ApiClient and download helper" },
  { path: "/api/v1/reports/maintenance-impact", posture: "consumed", note: "ApiClient and download helper" },
  { path: "/api/v1/reports/change-safety-case/policy", posture: "consumed", note: "ApiClient and download helper" },
  { path: "/api/v1/reports/change-safety-case/service", posture: "consumed", note: "ApiClient and download helper" },
  { path: "/api/v1/reports/change-safety-case/maintenance", posture: "consumed", note: "ApiClient and download helper" },
  { path: "/api/v1/readiness-snapshot-history", posture: "backend-only", note: "Not surfaced as a standalone Phase 1 SPA route" },
  { path: "/api/v1/controller/evidence/bgpls", posture: "backend-only", note: "Granular lane endpoint stays behind aggregate controller evidence UI" },
  { path: "/api/v1/controller/evidence/pcep", posture: "backend-only", note: "Granular lane endpoint stays behind aggregate controller evidence UI" },
  { path: "/api/v1/controller/evidence/netconf", posture: "backend-only", note: "Granular lane endpoint stays behind aggregate controller evidence UI" },
  { path: "/health", posture: "runtime-only", note: "Container/runtime check, not product navigation" },
  { path: "/metrics", posture: "runtime-only", note: "Runtime metrics, not product navigation" },
  { path: "evidence-replay-parser", posture: "client-only", note: "Local frozen-file parser; no backend request" },
];

describe("Phase 1 download/report/export parity", () => {
  it("covers all evidence export helper path families and supported formats", () => {
    expect(buildEvidenceExportRequestPath({ kind: "policy_dossier", policyId: "p:a" }, "json")).toBe(
      "/api/v1/exports/policies/p%3Aa/dossier?format=json",
    );
    expect(buildEvidenceExportRequestPath({ kind: "topology_object_dossier", objectId: "node:a" }, "markdown")).toBe(
      "/api/v1/exports/topology-objects/node%3Aa/dossier?format=markdown",
    );
    expect(buildEvidenceExportRequestPath({ kind: "situation_room", syncRunsLimit: 500 }, "json")).toBe(
      "/api/v1/exports/situation-room/summary?sync_runs_limit=100&format=json",
    );
    expect(buildEvidenceExportRequestPath({ kind: "investigation_workspace", syncRunsLimit: 0 }, "markdown")).toBe(
      "/api/v1/exports/investigation-workspace/summary?sync_runs_limit=1&format=markdown",
    );
    expect(
      buildEvidenceExportRequestPath(
        {
          kind: "operator_briefing_bundle",
          syncRunsLimit: 5,
          policyId: "p:a",
          topologyObject: "PE1",
          topologyObjectKind: "node",
          invFrom: "overview",
          globalSearchQ: "PE1",
        },
        "json",
      ),
    ).toBe(
      "/api/v1/exports/operator-briefing?sync_runs_limit=5&format=json&policy_id=p%3Aa&topology_object=PE1&topology_object_kind=node&inv_from=overview&global_search_q=PE1",
    );
  });

  it("keeps impact report and change safety case helpers separate from evidence export paths", () => {
    expect(buildImpactReportRequestPath({ kind: "service_impact", serviceId: "svc:a" }, "json")).toBe(
      "/api/v1/reports/service-impact?service_id=svc%3Aa&format=json",
    );
    expect(buildImpactReportRequestPath({ kind: "policy_impact", policyId: "p:a" }, "markdown")).toBe(
      "/api/v1/reports/policy-impact?policy_id=p%3Aa&format=markdown",
    );
    expect(
      buildImpactReportRequestPath(
        { kind: "maintenance_impact", query: { objectId: "PE1", objectKind: "node", previewContext: "planning_window" } },
        "json",
      ),
    ).toBe(
      "/api/v1/reports/maintenance-impact?format=json&preview_context=planning_window&object_id=PE1&object_kind=node",
    );
    expect(buildChangeSafetyCaseRequestPath({ kind: "policy_change_safety", policyId: "p:a" }, "json")).toBe(
      "/api/v1/reports/change-safety-case/policy?policy_id=p%3Aa&format=json",
    );
    expect(buildChangeSafetyCaseRequestPath({ kind: "service_change_safety", serviceId: "svc:a" }, "markdown")).toBe(
      "/api/v1/reports/change-safety-case/service?service_id=svc%3Aa&format=markdown",
    );
    expect(
      buildChangeSafetyCaseRequestPath(
        { kind: "topology_change_safety", query: { linkId: "P1--PE1", previewContext: "change_adjacent" } },
        "json",
      ),
    ).toBe(
      "/api/v1/reports/change-safety-case/maintenance?format=json&preview_context=change_adjacent&link_id=P1--PE1",
    );
  });

  it("rejects report/workspace JSON as evidence replay input and keeps replay client-only", () => {
    expect(
      parseEvidenceExportJson(JSON.stringify({ contract_id: "impact_report_v1", report_kind: "service_impact" })),
    ).toMatchObject({
      status: "error",
      error: { code: "impact_report_not_evidence_export" },
    });
    expect(
      parseEvidenceExportJson(JSON.stringify({ contract_id: "change_safety_case_v1", case_kind: "policy_change_safety" })),
    ).toMatchObject({
      status: "error",
      error: { code: "change_safety_case_not_evidence_export" },
    });
    expect(
      parseEvidenceExportJson(JSON.stringify({ contract_id: "service_impact_workspace_v1" })),
    ).toMatchObject({
      status: "error",
      error: { code: "service_impact_workspace_not_evidence_export" },
    });
  });
});

describe("Phase 1 endpoint posture allowlist", () => {
  it("classifies special backend/runtime/client-only endpoints with explicit posture", () => {
    expect(new Set(ENDPOINT_POSTURE_ALLOWLIST.map((item) => item.path)).size).toBe(ENDPOINT_POSTURE_ALLOWLIST.length);
    expect(ENDPOINT_POSTURE_ALLOWLIST.every((item) => item.posture !== undefined && item.note.length > 0)).toBe(true);
  });

  it("keeps previously unresolved endpoint decisions explicit", () => {
    expect(ENDPOINT_POSTURE_ALLOWLIST.filter((item) => item.posture === "backend-only").map((item) => item.path)).toEqual([
      "/api/v1/exports/maintenance-window-handoff",
      "/api/v1/readiness-snapshot-history",
      "/api/v1/controller/evidence/bgpls",
      "/api/v1/controller/evidence/pcep",
      "/api/v1/controller/evidence/netconf",
    ]);
  });
});

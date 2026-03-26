import { describe, expect, it } from "vitest";

import { buildChangeSafetyCaseRequestPath } from "../src/lib/change-safety-case-download";
import { buildEvidenceExportRequestPath } from "../src/lib/evidence-export-download";
import { buildImpactReportRequestPath } from "../src/lib/impact-report-download";

/**
 * Week 32 / week 33 regression: report-route downloads (`GET /api/v1/reports/...`) and
 * evidence exports (`GET /api/v1/exports/...`) must stay disjoint—Evidence replay accepts only
 * `evidence_export_v1` from exports (see `parseEvidenceExportJson` and product contracts).
 */
describe("report-route vs evidence-export URL families (honesty regression)", () => {
  it("Change Safety Case download paths use /api/v1/reports/change-safety-case/ only", () => {
    const paths = [
      buildChangeSafetyCaseRequestPath({ kind: "policy_change_safety", policyId: "PE1:static:1:100" }, "json"),
      buildChangeSafetyCaseRequestPath({ kind: "service_change_safety", serviceId: "color:100" }, "json"),
      buildChangeSafetyCaseRequestPath(
        {
          kind: "topology_change_safety",
          query: { nodeId: "PE1", previewContext: "topology_drilldown" },
        },
        "markdown",
      ),
    ];
    for (const p of paths) {
      expect(p).toMatch(/\/api\/v1\/reports\/change-safety-case\//);
      expect(p).not.toMatch(/\/api\/v1\/exports\//);
    }
  });

  it("Impact Report download paths use /api/v1/reports/*-impact only", () => {
    const paths = [
      buildImpactReportRequestPath({ kind: "policy_impact", policyId: "PE1:static:1:100" }, "json"),
      buildImpactReportRequestPath({ kind: "service_impact", serviceId: "color:100" }, "json"),
      buildImpactReportRequestPath(
        {
          kind: "maintenance_impact",
          query: { nodeId: "PE1", previewContext: "planning_window" },
        },
        "markdown",
      ),
    ];
    for (const p of paths) {
      expect(p).toMatch(/\/api\/v1\/reports\/(policy-impact|service-impact|maintenance-impact)/);
      expect(p).not.toMatch(/\/api\/v1\/exports\//);
      expect(p).not.toContain("change-safety-case");
    }
  });

  it("Service Impact Workspace live GET is neither exports nor report downloads (composed read-only)", () => {
    const p = "/api/v1/service-impact-workspace?service_id=color%3A100";
    expect(p).toMatch(/\/api\/v1\/service-impact-workspace/);
    expect(p).not.toMatch(/\/api\/v1\/exports\//);
    expect(p).not.toMatch(/\/api\/v1\/reports\//);
  });

  it("Evidence export paths use /api/v1/exports/ only (never report routes)", () => {
    const paths = [
      buildEvidenceExportRequestPath({ kind: "policy_dossier", policyId: "p:1" }, "json"),
      buildEvidenceExportRequestPath({ kind: "topology_object_dossier", objectId: "PE1" }, "json"),
      buildEvidenceExportRequestPath({ kind: "situation_room", syncRunsLimit: 8 }, "json"),
      buildEvidenceExportRequestPath({ kind: "investigation_workspace", syncRunsLimit: 8 }, "json"),
      buildEvidenceExportRequestPath({ kind: "operator_briefing_bundle", syncRunsLimit: 10 }, "json"),
    ];
    for (const p of paths) {
      expect(p).toMatch(/\/api\/v1\/exports\//);
      expect(p).not.toMatch(/\/api\/v1\/reports\//);
    }
  });
});

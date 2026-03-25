import { describe, expect, it } from "vitest";

import { buildImpactReportRequestPath } from "../src/lib/impact-report-download";

describe("buildImpactReportRequestPath", () => {
  it("builds service impact paths with encoded service_id", () => {
    expect(buildImpactReportRequestPath({ kind: "service_impact", serviceId: "color:100" }, "json")).toBe(
      "/api/v1/reports/service-impact?service_id=color%3A100&format=json",
    );
  });

  it("builds policy impact paths", () => {
    expect(
      buildImpactReportRequestPath({ kind: "policy_impact", policyId: "PE1:static:1:100" }, "markdown"),
    ).toBe("/api/v1/reports/policy-impact?policy_id=PE1%3Astatic%3A1%3A100&format=markdown");
  });

  it("builds maintenance impact paths from preview-shaped query", () => {
    const p = buildImpactReportRequestPath(
      { kind: "maintenance_impact", query: { nodeId: "PE1", previewContext: "planning_window" } },
      "json",
    );
    expect(p).toContain("/api/v1/reports/maintenance-impact?");
    expect(p).toContain("node_id=PE1");
    expect(p).toContain("preview_context=planning_window");
    expect(p).toContain("format=json");
  });
});

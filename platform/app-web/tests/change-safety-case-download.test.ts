import { describe, expect, it } from "vitest";

import { buildChangeSafetyCaseRequestPath } from "../src/lib/change-safety-case-download";

describe("buildChangeSafetyCaseRequestPath", () => {
  it("builds policy change safety paths with encoded policy_id", () => {
    expect(
      buildChangeSafetyCaseRequestPath(
        { kind: "policy_change_safety", policyId: "PE1:static:1:100" },
        "json",
      ),
    ).toBe("/api/v1/reports/change-safety-case/policy?policy_id=PE1%3Astatic%3A1%3A100&format=json");
  });

  it("builds service change safety paths", () => {
    expect(
      buildChangeSafetyCaseRequestPath({ kind: "service_change_safety", serviceId: "color:100" }, "markdown"),
    ).toBe("/api/v1/reports/change-safety-case/service?service_id=color%3A100&format=markdown");
  });

  it("builds topology change safety paths from maintenance-shaped query", () => {
    const p = buildChangeSafetyCaseRequestPath(
      { kind: "topology_change_safety", query: { nodeId: "PE1", previewContext: "planning_window" } },
      "json",
    );
    expect(p).toContain("/api/v1/reports/change-safety-case/maintenance?");
    expect(p).toContain("node_id=PE1");
    expect(p).toContain("preview_context=planning_window");
    expect(p).toContain("format=json");
  });
});

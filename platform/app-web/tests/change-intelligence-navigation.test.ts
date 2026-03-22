import { describe, expect, it } from "vitest";

import { isChangeIntelligenceProductSurfaceDomain } from "../src/lib/change-intelligence-navigation";

describe("isChangeIntelligenceProductSurfaceDomain", () => {
  it("is true for Devices, Topology, and Policies domains", () => {
    expect(isChangeIntelligenceProductSurfaceDomain("devices")).toBe(true);
    expect(isChangeIntelligenceProductSurfaceDomain("topology")).toBe(true);
    expect(isChangeIntelligenceProductSurfaceDomain("policies")).toBe(true);
  });

  it("is false for other change-evidence domains", () => {
    expect(isChangeIntelligenceProductSurfaceDomain("readiness")).toBe(false);
    expect(isChangeIntelligenceProductSurfaceDomain("workflow_history")).toBe(false);
    expect(isChangeIntelligenceProductSurfaceDomain("audit_history")).toBe(false);
  });
});

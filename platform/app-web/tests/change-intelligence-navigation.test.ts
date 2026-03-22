import { describe, expect, it } from "vitest";

import {
  isChangeIntelligenceHistorySurfaceDomain,
  isChangeIntelligenceProductSurfaceDomain,
  viewIdForChangeIntelligenceHistoryDomain,
} from "../src/lib/change-intelligence-navigation";

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

describe("isChangeIntelligenceHistorySurfaceDomain", () => {
  it("is true for workflow and audit history domains", () => {
    expect(isChangeIntelligenceHistorySurfaceDomain("workflow_history")).toBe(true);
    expect(isChangeIntelligenceHistorySurfaceDomain("audit_history")).toBe(true);
  });

  it("is false for product and readiness domains", () => {
    expect(isChangeIntelligenceHistorySurfaceDomain("devices")).toBe(false);
    expect(isChangeIntelligenceHistorySurfaceDomain("readiness")).toBe(false);
  });
});

describe("viewIdForChangeIntelligenceHistoryDomain", () => {
  it("maps to workflows and audit shell views", () => {
    expect(viewIdForChangeIntelligenceHistoryDomain("workflow_history")).toBe("workflows");
    expect(viewIdForChangeIntelligenceHistoryDomain("audit_history")).toBe("audit");
  });
});

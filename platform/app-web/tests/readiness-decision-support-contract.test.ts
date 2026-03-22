import { describe, expect, it } from "vitest";

import type { EvidenceDrilldownTarget } from "../src/lib/history-evidence-drilldown";
import {
  READINESS_BLOCKER_PARAM,
  READINESS_CAPABILITY_FEATURE_PARAM,
  READINESS_PREREQUISITE_PARAM,
} from "../src/lib/readiness-navigation";

describe("readiness decision-support URL contract (stable query names)", () => {
  it("exposes bounded param names aligned with Readiness and shell navigation", () => {
    expect(READINESS_BLOCKER_PARAM).toBe("readiness_blocker");
    expect(READINESS_PREREQUISITE_PARAM).toBe("readiness_prerequisite");
    expect(READINESS_CAPABILITY_FEATURE_PARAM).toBe("readiness_capability_feature");
  });
});

describe("history evidence drilldown readiness target shape", () => {
  it("allows optional readinessParams for bounded blocker scroll hints", () => {
    const target: EvidenceDrilldownTarget = {
      view: "readiness",
      label: "Readiness (planning support)",
      readinessParams: { blocker: "dry_run_contract_missing" },
    };
    expect(target.readinessParams?.blocker).toBe("dry_run_contract_missing");
  });
});

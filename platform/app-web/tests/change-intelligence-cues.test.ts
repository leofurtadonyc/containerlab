import { describe, expect, it } from "vitest";

import type { RecentChangeDomainSlice } from "../src/api/contracts";
import { countRecentChangeEvidenceStatuses } from "../src/lib/change-intelligence-cues";

function slice(
  domain: RecentChangeDomainSlice["domain"],
  evidence_status: RecentChangeDomainSlice["evidence_status"],
): RecentChangeDomainSlice {
  return {
    domain,
    signal_families: [],
    evidence_status,
    headline: "",
    detail_notes: [],
  };
}

describe("countRecentChangeEvidenceStatuses", () => {
  it("counts present, partial, and absent domains", () => {
    const counts = countRecentChangeEvidenceStatuses([
      slice("devices", "present"),
      slice("topology", "partial"),
      slice("policies", "absent"),
    ]);
    expect(counts).toEqual({ present: 1, partial: 1, absent: 1 });
  });
});

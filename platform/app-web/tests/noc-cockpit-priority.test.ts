import { describe, expect, it } from "vitest";

import type { PolicyRecord, PoliciesListResponse } from "../src/api/contracts";
import { pickStrongestPolicyId, worstDegradedPolicyFirst } from "../src/lib/noc-cockpit-priority";

function degradedPolicy(posture: "degraded" | "unknown" | "ok", policyId: string): PolicyRecord {
  return {
    policy_id: policyId,
    policy_name: policyId,
    policy_type: "static_local",
    headend: "PE1",
    endpoint: "192.0.2.11",
    color: 100,
    source_target: "PE1",
    source_target_role: "pe",
    candidate_paths: [],
    current_posture: "current",
    intent_state: "declared",
    observed_state: "active",
    last_recorded_observed_state: "active",
    support_state: "supported",
    health_state: "healthy",
    last_recorded_health_state: "healthy",
    source: "gnmi",
    notes: [],
    degraded_policy_v1: {
      contract_id: "degraded_policy_v1",
      posture,
      reason_codes: [],
      confidence: "medium",
      summary: "Fixture.",
      explicit_non_claims: [],
    },
  };
}

describe("noc-cockpit-priority", () => {
  it("worstDegradedPolicyFirst orders degraded before unknown before ok", () => {
    const items: PolicyRecord[] = [
      degradedPolicy("ok", "p_ok"),
      degradedPolicy("degraded", "p_deg"),
      degradedPolicy("unknown", "p_unk"),
    ];
    expect(worstDegradedPolicyFirst(items).map((p) => p.policy_id)).toEqual(["p_deg", "p_unk", "p_ok"]);
  });

  it("pickStrongestPolicyId prefers worst degraded when inventory exists", () => {
    const policiesData = {
      items: [degradedPolicy("ok", "first"), degradedPolicy("degraded", "worst")],
    } as PoliciesListResponse;
    expect(pickStrongestPolicyId(policiesData, "fallback")).toBe("worst");
  });

  it("pickStrongestPolicyId uses fallback when inventory empty", () => {
    const empty = { items: [] } as PoliciesListResponse;
    expect(pickStrongestPolicyId(empty, "fb")).toBe("fb");
    expect(pickStrongestPolicyId(null, "fb")).toBe("fb");
  });
});

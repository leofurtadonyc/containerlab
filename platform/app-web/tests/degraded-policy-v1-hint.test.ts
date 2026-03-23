import { describe, expect, it } from "vitest";

import type { PolicyRecord } from "../src/api/contracts";
import {
  buildDegradedPolicyV1ListRowHint,
  matchesDegradedPolicyV1PostureFilter,
} from "../src/lib/presentation";

function minimalPolicy(overrides: Partial<PolicyRecord>): PolicyRecord {
  return {
    policy_id: "id",
    policy_name: "n",
    policy_type: "static_local",
    headend: "PE1",
    endpoint: "10.0.0.1",
    color: 1,
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
      posture: "ok",
      reason_codes: [],
      confidence: "medium",
      summary: "ok summary",
      explicit_non_claims: ["not_sla_or_availability_guarantee"],
    },
    ...overrides,
  };
}

describe("matchesDegradedPolicyV1PostureFilter", () => {
  it("passes all when filter is all", () => {
    expect(matchesDegradedPolicyV1PostureFilter("degraded", "all")).toBe(true);
    expect(matchesDegradedPolicyV1PostureFilter("ok", "all")).toBe(true);
  });

  it("matches exact posture", () => {
    expect(matchesDegradedPolicyV1PostureFilter("degraded", "degraded")).toBe(true);
    expect(matchesDegradedPolicyV1PostureFilter("ok", "degraded")).toBe(false);
  });
});

describe("buildDegradedPolicyV1ListRowHint", () => {
  it("describes ok posture", () => {
    expect(buildDegradedPolicyV1ListRowHint(minimalPolicy({}))).toBe("No v1 reason codes");
  });

  it("describes unknown posture", () => {
    expect(
      buildDegradedPolicyV1ListRowHint(
        minimalPolicy({
          degraded_policy_v1: {
            contract_id: "degraded_policy_v1",
            posture: "unknown",
            reason_codes: [],
            confidence: "low",
            summary: "x",
            explicit_non_claims: [],
          },
        }),
      ),
    ).toBe("Ambiguous inventory signals (v1)");
  });

  it("lists reason codes for degraded posture", () => {
    expect(
      buildDegradedPolicyV1ListRowHint(
        minimalPolicy({
          degraded_policy_v1: {
            contract_id: "degraded_policy_v1",
            posture: "degraded",
            reason_codes: ["health_not_healthy", "persisted_row_stale", "intent_declared_observed_not_active"],
            confidence: "medium",
            summary: "s",
            explicit_non_claims: [],
          },
        }),
      ),
    ).toBe("health not healthy · persisted row stale · +1");
  });

  it("describes partial support for operators", () => {
    expect(
      buildDegradedPolicyV1ListRowHint(
        minimalPolicy({
          support_state: "partially_supported",
          degraded_policy_v1: {
            contract_id: "degraded_policy_v1",
            posture: "degraded",
            reason_codes: ["partial_or_unsupported_support_posture"],
            confidence: "medium",
            summary: "s",
            explicit_non_claims: [],
          },
        }),
      ),
    ).toContain("partial or unsupported support posture");
  });
});

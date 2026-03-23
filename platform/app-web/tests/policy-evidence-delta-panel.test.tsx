import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { PolicyEvidenceDeltaResponse } from "../src/api/contracts";
import { PolicyEvidenceDeltaPanel } from "../src/features/policies/policy-evidence-delta-panel";

const { usePolicyEvidenceDeltaQuery } = vi.hoisted(() => ({
  usePolicyEvidenceDeltaQuery: vi.fn(),
}));

vi.mock("../src/features/policies/api", () => ({
  usePolicyEvidenceDeltaQuery,
}));

const baseSafety = {
  contract_id: "policy_evidence_delta_v1",
  authority_posture: "interpretation_support_only" as const,
  explicit_non_claims: ["not_drift_truth", "not_config_diff_truth"] as const,
  phase: "phase_2_read_only_foundation" as const,
  summary_disclaimer: "Delta compares bounded read-side fields only—not drift truth.",
};

function baseFixture(overrides: Partial<PolicyEvidenceDeltaResponse> = {}): PolicyEvidenceDeltaResponse {
  return {
    metadata: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "policy_evidence_delta_v1",
    safety_framing: baseSafety,
    policy_id: "p1",
    comparison_status: "delta_ready",
    scope_summary: "Bounded delta between current and previous persisted snapshot.",
    current_anchor: {
      anchor_role: "current_inventory",
      observed_at: "2025-06-01T12:00:00Z",
      row_posture: "current",
      serving_mode: "live",
    },
    previous_anchor: {
      anchor_role: "previous_persisted_snapshot",
      snapshot_id: "snap-prev",
      persisted_at: "2025-05-01T00:00:00Z",
      observed_at: "2025-05-01T10:00:00Z",
    },
    delta_items: [],
    caveats: ["Path-analysis assembly exists for the current row only."],
    ...overrides,
  };
}

describe("PolicyEvidenceDeltaPanel", () => {
  it("shows loading state while the first payload is loading", () => {
    usePolicyEvidenceDeltaQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyEvidenceDeltaPanel policyId="p1" />);

    expect(html).toContain("Policy evidence delta");
    expect(html).toContain("Loading bounded policy evidence delta");
    expect(html).toContain("not");
    expect(html).toContain("drift");
  });

  it("shows a bounded 404 explanation when the policy is not in the inventory list", () => {
    usePolicyEvidenceDeltaQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("policy_id not found", 404, "http_error"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyEvidenceDeltaPanel policyId="missing" />);

    expect(html).toContain("Evidence delta not available for this id");
    expect(html).toContain("bounded inventory list");
  });

  it("shows no-comparable-anchor copy and gap items when history is sparse", () => {
    usePolicyEvidenceDeltaQuery.mockReturnValue({
      data: baseFixture({
        comparison_status: "no_comparable_anchor",
        previous_anchor: null,
        scope_summary: "No comparable persisted anchor in this environment.",
        delta_items: [
          {
            category: "gap_note",
            summary: "No delta between anchors: a previous persisted snapshot row is required.",
            detail: null,
          },
        ],
      }),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyEvidenceDeltaPanel policyId="p1" />);

    expect(html).toContain("No comparable persisted anchor");
    expect(html).toContain("honest boundary");
    expect(html).toContain("Gap or not comparable");
    expect(html).toContain("policy_evidence_delta_v1");
  });

  it("renders delta items, anchors, caveats, and related navigation", () => {
    usePolicyEvidenceDeltaQuery.mockReturnValue({
      data: baseFixture({
        delta_items: [
          {
            category: "posture_or_state_field_change",
            summary: "Normalized posture fields differ.",
            detail: "changed_fields=health_state",
          },
        ],
      }),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyEvidenceDeltaPanel policyId="p1" />);

    expect(html).toContain("Posture / state fields");
    expect(html).toContain("changed_fields=health_state");
    expect(html).toContain("snap-prev");
    expect(html).toContain("Path-analysis assembly exists");
    expect(html).toContain("Evidence timeline");
    expect(html).toContain("Path analysis");
    expect(html).toContain("Open investigation workspace");
  });
});

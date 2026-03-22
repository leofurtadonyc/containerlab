import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import { PolicyPathAnalysisPanel } from "../src/features/policies/policy-path-analysis-panel";

const { usePolicyPathAnalysisQuery } = vi.hoisted(() => ({
  usePolicyPathAnalysisQuery: vi.fn(),
}));

vi.mock("../src/features/policies/api", () => ({
  usePolicyPathAnalysisQuery,
}));

describe("PolicyPathAnalysisPanel", () => {
  it("shows loading state while the first payload is loading", () => {
    usePolicyPathAnalysisQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyPathAnalysisPanel policyId="p1" />);

    expect(html).toContain("Path analysis");
    expect(html).toContain("Loading bounded path analysis");
  });

  it("shows a bounded 404 explanation when the policy is not in the current inventory list", () => {
    usePolicyPathAnalysisQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("policy_id not found", 404, "http_error"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyPathAnalysisPanel policyId="missing" />);

    expect(html).toContain("Path analysis not available for this id");
    expect(html).toContain("bounded inventory list");
  });

  it("renders safety framing, hints, and metadata when path analysis succeeds", () => {
    usePolicyPathAnalysisQuery.mockReturnValue({
      data: {
        metadata: {
          service: "app-api",
          version: "test",
          phase: "phase_2_read_only_foundation",
          generated_at: "2025-01-01T00:00:00Z",
        },
        safety_framing: {
          contract_id: "path_analysis_phase2_v1",
          authority_posture: "read_only_assembly_non_authoritative",
          explicit_non_claims: ["not_validation_verdict"],
          phase: "phase_2_read_only_foundation",
          summary_disclaimer: "Disclaimer text for tests.",
        },
        subject: {
          anchor_kind: "policy",
          policy_id: "p1",
          policy_name: "Pol",
          policy_type: "static_local",
          color: 1,
          headend: "a",
          endpoint: "b",
          source_target: "t",
        },
        intended_path_hints: [],
        observed_path_hints: [],
        candidate_path_summaries: [],
        evidence_sources: [],
        freshness: {
          assembly_generated_at: "2025-01-01T00:00:00Z",
          policy_snapshot_observed_at: null,
          topology_snapshot_observed_at: null,
          inventory_snapshot_observed_at: null,
          serving_mode_echo: null,
        },
        truth_alignment: {
          posture: "insufficient_evidence",
          summary: "Not enough cross-signals.",
        },
        caveats: [{ code: "unknown", message: "A test caveat." }],
      },
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyPathAnalysisPanel policyId="p1" />);

    expect(html).toContain("path_analysis_phase2_v1");
    expect(html).toContain("Disclaimer text for tests.");
    expect(html).toContain("not validation verdict");
    expect(html).toContain("Pol (p1)");
    expect(html).toContain("Not enough cross-signals.");
    expect(html).toContain("A test caveat.");
  });
});

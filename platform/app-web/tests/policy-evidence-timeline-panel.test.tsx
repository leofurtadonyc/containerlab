import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { PolicyEvidenceTimelineEntry, PolicyEvidenceTimelineResponse } from "../src/api/contracts";
import { PolicyEvidenceTimelinePanel } from "../src/features/policies/policy-evidence-timeline-panel";

const { usePolicyEvidenceTimelineQuery } = vi.hoisted(() => ({
  usePolicyEvidenceTimelineQuery: vi.fn(),
}));

vi.mock("../src/features/policies/api", () => ({
  usePolicyEvidenceTimelineQuery,
}));

const baseSafety = {
  contract_id: "policy_evidence_timeline_v1",
  authority_posture: "interpretation_support_only" as const,
  explicit_non_claims: [
    "not_unified_forensic_chronology",
    "not_packet_path_proof",
  ] as const,
  phase: "phase_2_read_only_foundation" as const,
  summary_disclaimer: "Timeline orders existing read-side anchors only.",
};

function baseFixture(overrides: Partial<PolicyEvidenceTimelineResponse> = {}): PolicyEvidenceTimelineResponse {
  return {
    metadata: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "policy_evidence_timeline_v1",
    safety_framing: baseSafety,
    policy_id: "p1",
    scope_summary: "Full window where sources exist.",
    entries: [] as PolicyEvidenceTimelineEntry[],
    missing_evidence_notes: [],
    ...overrides,
  };
}

describe("PolicyEvidenceTimelinePanel", () => {
  it("shows loading state while the first payload is loading", () => {
    usePolicyEvidenceTimelineQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyEvidenceTimelinePanel policyId="p1" />);

    expect(html).toContain("Policy evidence timeline");
    expect(html).toContain("Loading bounded policy evidence timeline");
  });

  it("shows a bounded 404 explanation when the policy is not in the inventory list", () => {
    usePolicyEvidenceTimelineQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("policy_id not found", 404, "http_error"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyEvidenceTimelinePanel policyId="missing" />);

    expect(html).toContain("Evidence timeline not available for this id");
    expect(html).toContain("bounded inventory list");
  });

  it("shows a retryable error when the request fails", () => {
    usePolicyEvidenceTimelineQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("upstream failure", 502, "http_error"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyEvidenceTimelinePanel policyId="p1" />);

    expect(html).toContain("upstream failure");
    expect(html).toContain("Retry");
  });

  it("renders ordered entries, provenance, and sparse-timeline notes", () => {
    usePolicyEvidenceTimelineQuery.mockReturnValue({
      data: baseFixture({
        scope_summary: "Partial: some anchors missing.",
        entries: [
          {
            entry_kind: "path_analysis_assembly_anchor",
            sort_key: "2025-06-01T10:00:00Z",
            tie_break: 0,
            summary: "Path analysis assembly time.",
            provenance: "Path analysis",
            reference: "GET /api/v1/policies/{id}/path-analysis",
          },
          {
            entry_kind: "policy_inventory_snapshot_anchor",
            sort_key: "2025-06-01T09:00:00Z",
            tie_break: 0,
            summary: "List snapshot observed_at.",
            provenance: "Policies inventory",
            reference: "GET /api/v1/policies",
          },
        ],
        missing_evidence_notes: ["Persisted history window is sparse in this environment."],
      }),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyEvidenceTimelinePanel policyId="p1" />);

    expect(html).toContain("policy_evidence_timeline_v1");
    expect(html).toContain("Partial: some anchors missing.");
    expect(html).toContain("Honest gaps and partial evidence");
    expect(html).toContain("Persisted history window is sparse");
    expect(html).toContain("Path analysis assembly");
    expect(html).toContain("Path analysis assembly time.");
    expect(html).toContain("Ordered anchors (newest first)");
    expect(html).toContain("Open investigation workspace");
    expect(html).toContain("timeline includes a path-analysis anchor");
  });

  it("shows empty-anchor copy when the API returns no entries but is otherwise supported", () => {
    usePolicyEvidenceTimelineQuery.mockReturnValue({
      data: baseFixture({
        scope_summary: "Supported window; no anchors in this slice.",
        entries: [],
        missing_evidence_notes: [],
      }),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyEvidenceTimelinePanel policyId="p1" />);

    expect(html).toContain("No discrete timeline anchors were returned");
    expect(html).not.toContain("Honest gaps and partial evidence");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { EvidenceConsistencySummaryResponse } from "../src/api/contracts";
import { EvidenceConsistencyView } from "../src/features/evidence-consistency/view";

const { useEvidenceConsistencySummaryQuery } = vi.hoisted(() => ({
  useEvidenceConsistencySummaryQuery: vi.fn(),
}));

vi.mock("../src/features/overview/api", () => ({
  useEvidenceConsistencySummaryQuery,
  OVERVIEW_RECENT_CHANGE_SYNC_LIMIT: 20,
}));

function createFixture(): EvidenceConsistencySummaryResponse {
  return {
    metadata: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "evidence_consistency_summary_v1",
    safety_framing: {
      contract_id: "evidence_consistency_summary_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: ["not_validation_truth"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Consistency disclaimer.",
    },
    scope_summary: "Bounded cross-domain window.",
    sync_runs_limit_applied: 20,
    domain_freshness_echo: [{ domain: "policies", data_status: "ok", serving_mode: "live" }],
    items: [
      {
        category: "freshness_or_serving_mismatch",
        consistency_signal: "appears_in_tension",
        summary: "Policies list stale vs devices.",
        detail: "Heuristic detail.",
        pivot_hints: [{ label: "Devices", route_family: "GET /api/v1/devices" }],
      },
      {
        category: "gap_note",
        consistency_signal: "weak_alignment",
        summary: "Sparse topology slice.",
        detail: null,
        pivot_hints: [],
      },
    ],
    caveats: ["Caveat one."],
    assembly_notes: [],
  };
}

function createQueryState<T>(
  data: T | null,
  opts?: { error?: ApiClientError; isLoading?: boolean },
) {
  return {
    data,
    error: opts?.error ?? null,
    isLoading: opts?.isLoading ?? false,
    reload: () => {},
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EvidenceConsistencyView", () => {
  it("renders loading route while fetching", () => {
    useEvidenceConsistencySummaryQuery.mockReturnValue(createQueryState(null, { isLoading: true }));

    const html = renderToStaticMarkup(<EvidenceConsistencyView />);

    expect(html).toContain("evidence-consistency-route--loading");
  });

  it("renders error route with retry affordance", () => {
    useEvidenceConsistencySummaryQuery.mockReturnValue(
      createQueryState(null, {
        error: new ApiClientError("Upstream failed", 502, "request_failed"),
      }),
    );

    const html = renderToStaticMarkup(<EvidenceConsistencyView />);

    expect(html).toContain("evidence-consistency-route--error");
    expect(html).toContain("Upstream failed");
  });

  it("renders grouped rows and safety framing when data loads", () => {
    useEvidenceConsistencySummaryQuery.mockReturnValue(createQueryState(createFixture()));

    const html = renderToStaticMarkup(<EvidenceConsistencyView />);

    expect(html).toContain('data-testid="evidence-consistency-workspace"');
    expect(html).toContain("evidence_consistency_summary_v1");
    expect(html).toContain("Tension (interpretation support)");
    expect(html).toContain("Weak alignment");
    expect(html).toContain("freshness_or_serving_mismatch");
    expect(html).toContain("Domain freshness echo");
    expect(html).toContain("Caveat one.");
    expect(html).toContain("not_validation_truth");
  });
});

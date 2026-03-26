import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { OperationalStabilitySummaryResponse } from "../src/api/contracts";
import { StabilityWorkspaceView } from "../src/features/stability-workspace/view";

const {
  useOperationalStabilitySummaryQuery,
  useTopologyObjectStabilityProfileQuery,
  useServiceStabilityProfileQuery,
} = vi.hoisted(() => ({
  useOperationalStabilitySummaryQuery: vi.fn(),
  useTopologyObjectStabilityProfileQuery: vi.fn(),
  useServiceStabilityProfileQuery: vi.fn(),
}));

vi.mock("../src/features/stability-workspace/api", () => ({
  useOperationalStabilitySummaryQuery,
  useTopologyObjectStabilityProfileQuery,
  useServiceStabilityProfileQuery,
}));

function createSummaryFixture(): OperationalStabilitySummaryResponse {
  return {
    metadata: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "operational_stability_summary_v1",
    safety_framing: {
      contract_id: "operational_stability_summary_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: ["not_prediction_or_forecast"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Stability disclaimer.",
    },
    operational_stability_posture: "elevated_churn",
    scope_summary: "Bounded window over existing read-side evidence.",
    sync_runs_limit_applied: 20,
    rows: [
      {
        subject_family: "global_window",
        row_type: "churn_signal",
        stability_posture_hint: "elevated_churn",
        summary: "Recent activity in change intelligence.",
        detail: null,
        source_citations: ["GET /api/v1/change-intelligence/recent-summary"],
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
  useTopologyObjectStabilityProfileQuery.mockReturnValue(createQueryState(null, { isLoading: false }));
  useServiceStabilityProfileQuery.mockReturnValue(createQueryState(null, { isLoading: false }));
});

describe("StabilityWorkspaceView", () => {
  it("renders loading route while fetching summary", () => {
    useOperationalStabilitySummaryQuery.mockReturnValue(createQueryState(null, { isLoading: true }));

    const html = renderToStaticMarkup(<StabilityWorkspaceView />);

    expect(html).toContain("stability-workspace-route--loading");
  });

  it("renders error route with retry affordance", () => {
    useOperationalStabilitySummaryQuery.mockReturnValue(
      createQueryState(null, {
        error: new ApiClientError("Upstream failed", 502, "request_failed"),
      }),
    );

    const html = renderToStaticMarkup(<StabilityWorkspaceView />);

    expect(html).toContain("stability-workspace-route--error");
    expect(html).toContain("Upstream failed");
  });

  it("renders summary and non-claims when data loads", () => {
    useOperationalStabilitySummaryQuery.mockReturnValue(createQueryState(createSummaryFixture()));

    const html = renderToStaticMarkup(<StabilityWorkspaceView />);

    expect(html).toContain('data-testid="stability-workspace"');
    expect(html).toContain("operational_stability_summary_v1");
    expect(html).toContain("not_prediction_or_forecast");
    expect(html).toContain("elevated_churn");
    expect(html).toContain("Caveat one.");
  });
});

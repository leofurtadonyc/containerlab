import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { CapabilitiesListResponse } from "../src/api/contracts";
import { ReadinessView } from "../src/features/readiness/view";

const useCapabilitiesQuery = vi.hoisted(() => vi.fn());

vi.mock("../src/features/capabilities/api", () => ({
  useCapabilitiesQuery,
}));

function createQueryState<T>(data: T | null, error: ApiClientError | null = null, isLoading = false) {
  return {
    data,
    error,
    isLoading,
    reload: vi.fn(async () => undefined),
  };
}

function createReadinessCapabilitiesData(): CapabilitiesListResponse {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2026-03-10T12:00:00Z",
    data_status: "bounded_matrix",
    summary: "Capabilities summary.",
    count: 0,
    readiness_snapshot_id: "snap-ready-1",
    readiness_persisted_at: "2026-03-10T06:00:00Z",
    domain_counts: {},
    support_counts: {},
    implementation_counts: {},
    delivery_tier_counts: {},
    evidence_basis_counts: {},
    vendor_counts: {},
    vendor_posture_counts: {},
    workflow_readiness_counts: {},
    workflow_readiness_scope_counts: {},
    dry_run_readiness: {
      status: "bounded_readiness_support",
      planning_readiness: "readiness_planning_supported",
      phase_recommendation: "remain_phase_2_read_only_foundation",
      summary: "Readiness summary for tests.",
      readiness_scope: "Bounded dry-run planning scope.",
      notes: [],
      strongest_blockers: [],
      bounded_next_steps: [],
      evidence_coverage_counts: {},
      support_posture_counts: {},
      blocker_category_counts: {},
      blocker_severity_counts: {},
      blocked_scope_counts: {},
      assessment_areas: [],
      blockers: [],
      prerequisites: [],
    },
    items: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("readiness view", () => {
  it("separates evaluation sample time from persisted snapshot time in copy and metadata", () => {
    useCapabilitiesQuery.mockReturnValue(createQueryState(createReadinessCapabilitiesData()));

    const html = renderToStaticMarkup(<ReadinessView />);

    expect(html).toContain("Evaluation sample");
    expect(html).toContain("persisted snapshot");
    expect(html).toContain("Prometheus-observed");
    expect(html).toContain("interchangeable freshness claims");
    expect(html).toContain("Evaluation sample (this response):");
    expect(html).toContain("Persisted snapshot (last material change):");
    expect(html).toContain("Persisted snapshot (last material change)</span>");
    expect(html).toContain("Evaluation sample (this response)</span>");
    expect(html).toContain("Observability dashboards may show evaluation-sample age");
  });

  it("preserves loading state", () => {
    useCapabilitiesQuery.mockReturnValue(createQueryState(null, null, true));

    const html = renderToStaticMarkup(<ReadinessView />);

    expect(html).toContain("Loading bounded readiness support");
  });

  it("preserves error state with retry", () => {
    useCapabilitiesQuery.mockReturnValue(
      createQueryState(null, new ApiClientError("Capabilities failed", 500, "request_failed")),
    );

    const html = renderToStaticMarkup(<ReadinessView />);

    expect(html).toContain("Capabilities failed");
  });

  it("preserves empty capabilities response", () => {
    useCapabilitiesQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<ReadinessView />);

    expect(html).toContain("No readiness data");
  });
});

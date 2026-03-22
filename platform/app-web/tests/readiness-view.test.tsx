import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { CapabilitiesListResponse } from "../src/api/contracts";
import { ReadinessView } from "../src/features/readiness/view";

const useCapabilitiesQuery = vi.hoisted(() => vi.fn());
const useUrlSearchParamsMock = vi.hoisted(() => vi.fn(() => new URLSearchParams()));

vi.mock("../src/lib/use-url-search-params", () => ({
  useUrlSearchParams: () => useUrlSearchParamsMock(),
}));

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

function createReadinessCapabilitiesDataWithoutPersistedSnapshot(): CapabilitiesListResponse {
  const base = createReadinessCapabilitiesData();
  return {
    ...base,
    readiness_snapshot_id: null,
    readiness_persisted_at: null,
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
  useUrlSearchParamsMock.mockReset();
  useUrlSearchParamsMock.mockReturnValue(new URLSearchParams());
});

describe("readiness view", () => {
  it("separates evaluation sample time from persisted snapshot time in copy and metadata", () => {
    useCapabilitiesQuery.mockReturnValue(createQueryState(createReadinessCapabilitiesData()));

    const html = renderToStaticMarkup(<ReadinessView />);

    expect(html).toContain("Two different clocks");
    expect(html).toContain("generated_at");
    expect(html).toContain("readiness_persisted_at");
    expect(html).toContain("Evaluation sample (this response) age");
    expect(html).toContain("not interchangeable freshness signals");
    expect(html).toContain("Evaluation sample (this response):");
    expect(html).toContain("Persisted snapshot (last material change):");
    expect(html).toContain("Persisted snapshot (last material change)</span>");
    expect(html).toContain("Evaluation sample (this response)</span>");
    expect(html).toContain("Platform overview Grafana panels use the same two labels");
    expect(html).not.toContain("Persisted snapshot time unavailable.");
  });

  it("explains when persisted snapshot time is absent without implying a bug", () => {
    useCapabilitiesQuery.mockReturnValue(
      createQueryState(createReadinessCapabilitiesDataWithoutPersistedSnapshot()),
    );

    const html = renderToStaticMarkup(<ReadinessView />);

    expect(html).toContain("Persisted snapshot time unavailable.");
    expect(html).toContain("not a validation verdict");
    expect(html).toContain("Not available");
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

  it("shows capability navigation framing when readiness_capability_feature is present", () => {
    useUrlSearchParamsMock.mockReturnValue(
      new URLSearchParams("readiness_capability_feature=device_inventory_read"),
    );
    useCapabilitiesQuery.mockReturnValue(createQueryState(createReadinessCapabilitiesData()));

    const html = renderToStaticMarkup(<ReadinessView />);

    expect(html).toContain("Capability navigation context");
    expect(html).toContain("device_inventory_read");
  });

  it("exposes stable DOM ids for blocker cards for URL scroll alignment", () => {
    const data = createReadinessCapabilitiesData();
    const withBlockers = {
      ...data,
      dry_run_readiness: {
        ...data.dry_run_readiness,
        blockers: [
          {
            blocker: "dry_run_contract_missing" as const,
            category: "contract" as const,
            severity: "major" as const,
            evidence_basis: "design_review" as const,
            summary: "Test blocker.",
            blocked_readiness_scopes: ["planning_depth"] as const,
            related_prerequisites: ["inventory_read_model"] as const,
            notes: [],
          },
        ],
      },
    };
    useCapabilitiesQuery.mockReturnValue(createQueryState(withBlockers));

    const html = renderToStaticMarkup(<ReadinessView />);

    expect(html).toContain('id="readiness-blocker-dry_run_contract_missing"');
  });

  it("surfaces blocker and prerequisite drilldown affordances and stable prerequisite ids", () => {
    const data = createReadinessCapabilitiesData();
    const withDrilldown = {
      ...data,
      dry_run_readiness: {
        ...data.dry_run_readiness,
        blockers: [
          {
            blocker: "dry_run_contract_missing" as const,
            category: "contract" as const,
            severity: "major" as const,
            evidence_basis: "design_review" as const,
            summary: "Test blocker.",
            blocked_readiness_scopes: ["planning_depth"] as const,
            related_prerequisites: ["inventory_read_model"] as const,
            notes: [],
          },
        ],
        prerequisites: [
          {
            prerequisite: "inventory_read_model" as const,
            status: "partial" as const,
            support_posture: "partially_supported" as const,
            evidence_basis: "persisted_validated" as const,
            evidence_coverage: "bounded" as const,
            related_capabilities: ["device_inventory_read"],
            current_evidence: "Evidence line.",
            blocking_gaps: [],
          },
        ],
      },
    };
    useCapabilitiesQuery.mockReturnValue(createQueryState(withDrilldown));

    const html = renderToStaticMarkup(<ReadinessView />);

    expect(html).toContain("Blocker drilldown");
    expect(html).toContain("Prerequisite drilldown");
    expect(html).toContain('id="readiness-prerequisite-inventory_read_model"');
    expect(html).toContain("Blockers referencing this prerequisite");
    expect(html).toContain("nav-drilldown-button");
  });
});

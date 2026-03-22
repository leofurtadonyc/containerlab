import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CapabilitiesListResponse } from "../src/api/contracts";
import { CapabilitiesView } from "../src/features/capabilities/view";

const useCapabilitiesQuery = vi.hoisted(() => vi.fn());

vi.mock("../src/features/capabilities/api", () => ({
  useCapabilitiesQuery,
}));

function createQueryState<T>(data: T | null, error: unknown = null, isLoading = false) {
  return {
    data,
    error,
    isLoading,
    reload: vi.fn(async () => undefined),
  };
}

function createCapabilitiesListPayload(): CapabilitiesListResponse {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2026-03-10T12:00:00Z",
    data_status: "bounded_matrix",
    summary: "Capabilities summary for navigation tests.",
    count: 1,
    readiness_snapshot_id: "snap-ready-1",
    readiness_persisted_at: "2026-03-10T06:00:00Z",
    domain_counts: { inventory: 1 },
    support_counts: { supported: 1 },
    implementation_counts: { implemented: 1 },
    delivery_tier_counts: { delivered_read_only: 1 },
    evidence_basis_counts: { live_validated: 1 },
    vendor_counts: { nokia: 1 },
    vendor_posture_counts: { current_nokia_focus: 1 },
    workflow_readiness_counts: { supports_planning: 1 },
    workflow_readiness_scope_counts: {},
    dry_run_readiness: {
      status: "bounded_readiness_support",
      planning_readiness: "readiness_planning_supported",
      phase_recommendation: "remain_phase_2_read_only_foundation",
      summary: "Readiness summary.",
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
      blockers: [
        {
          blocker: "dry_run_contract_missing",
          category: "contract",
          severity: "major",
          evidence_basis: "design_review",
          summary: "Dry-run contract gap.",
          blocked_readiness_scopes: ["planning_depth"],
          related_prerequisites: ["inventory_read_model"],
          notes: [],
        },
      ],
      prerequisites: [],
    },
    items: [
      {
        vendor: "nokia",
        platform: "7750 SR-1",
        version_scope: null,
        domain: "inventory",
        feature: "device_inventory_read",
        support_status: "supported",
        implementation_status: "implemented",
        delivery_tier: "delivered_read_only",
        evidence_basis: "live_validated",
        vendor_posture: "current_nokia_focus",
        availability_scope: "lab",
        status_detail: "ok",
        caveats: [],
        source_of_determination: "collector",
        workflow_readiness_status: "supports_planning",
        workflow_readiness_scopes: ["planning_depth"],
        workflow_readiness_detail: "Planning depth supported.",
        related_readiness_blockers: ["dry_run_contract_missing"],
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("capabilities view", () => {
  it("surfaces bounded Readiness navigation copy and an Open Readiness control", () => {
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesListPayload()));

    const html = renderToStaticMarkup(<CapabilitiesView />);

    expect(html).toContain("Readiness interpretation");
    expect(html).toContain("Open Readiness");
    expect(html).toContain("Read-only navigation only");
  });
});

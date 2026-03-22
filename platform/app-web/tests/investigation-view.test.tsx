import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InvestigationContextAssemblyResponse } from "../src/api/contracts";
import { InvestigationView } from "../src/features/investigation/view";

const { useInvestigationWorkspaceContextQuery } = vi.hoisted(() => ({
  useInvestigationWorkspaceContextQuery: vi.fn(),
}));

vi.mock("../src/features/investigation/api", () => ({
  useInvestigationWorkspaceContextQuery,
}));

function createInvestigationAssemblyFixture(): InvestigationContextAssemblyResponse {
  return {
    metadata: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    safety: {
      contract_id: "investigation_workspace_phase2_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: ["not_validation_verdict", "not_drift_engine_result"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer:
        "Investigation workspace assemblies combine existing read-side evidence for operator interpretation.",
    },
    assembly_notes: ["Nested sources: change intelligence, platform status, capabilities."],
    recent_change: {
      metadata: {
        service: "app-api",
        version: "test",
        phase: "phase_2_read_only_foundation",
        generated_at: "2025-01-01T00:00:00Z",
      },
      safety: {
        contract_id: "change_intelligence_phase2_v1",
        authority_posture: "evidence_aggregated_non_authoritative",
        explicit_non_claims: ["not_validation_verdict"],
        phase: "phase_2_read_only_foundation",
        summary_disclaimer: "Recent change summary disclaimer.",
      },
      window_semantics: "backend_defined_bounded_lookback",
      completeness_posture: "bounded_partial",
      sync_runs_limit_applied: 20,
      readiness_snapshots_considered: 0,
      domains: [
        {
          domain: "devices",
          signal_families: [],
          evidence_status: "absent",
          headline: "No inventory snapshots.",
          detail_notes: [],
        },
      ],
      aggregation_notes: [],
    },
    platform_status: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
      status: "ok",
      topology_name: "platform",
      summary: "Platform ok.",
      recovery: {
        baseline_posture: "new_baseline",
        read_side_posture: "live_recollection_ready",
        summary: "New baseline.",
        persisted_artifacts: {
          inventory_snapshot: false,
          topology_snapshot: false,
          policy_snapshot: false,
          sync_history: false,
          readiness_snapshot: false,
        },
        notes: [],
      },
      components: [],
      read_paths: [],
    },
    capabilities: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
      data_status: "bounded_matrix",
      summary: "Capabilities summary for investigation fixture.",
      count: 2,
      domain_counts: {},
      support_counts: {},
      implementation_counts: {},
      delivery_tier_counts: {},
      evidence_basis_counts: {},
      vendor_counts: {},
      vendor_posture_counts: {},
      workflow_readiness_counts: {},
      workflow_readiness_scope_counts: {},
      items: [],
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("InvestigationView", () => {
  it("renders nested contract summaries when investigation context loads", () => {
    useInvestigationWorkspaceContextQuery.mockReturnValue({
      data: createInvestigationAssemblyFixture(),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<InvestigationView />);

    expect(html).toContain("Investigation workspace");
    expect(html).toContain("investigation_workspace_phase2_v1");
    expect(html).toContain("change_intelligence_phase2_v1");
    expect(html).toContain("Platform status (nested)");
    expect(html).toContain("Capabilities (nested)");
    expect(html).toContain("Open Devices");
  });

  it("shows loading state before data arrives", () => {
    useInvestigationWorkspaceContextQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<InvestigationView />);
    expect(html).toContain("Loading bounded investigation context");
  });
});

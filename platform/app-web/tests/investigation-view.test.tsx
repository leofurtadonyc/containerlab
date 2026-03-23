import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { InvestigationContextAssemblyResponse } from "../src/api/contracts";
import { INV_FROM_PARAM } from "../src/lib/investigation-url-context";
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
          detail_notes: ["Note for devices."],
        },
        {
          domain: "readiness",
          signal_families: [],
          evidence_status: "absent",
          headline: "No readiness snapshots.",
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
      components: [
        {
          name: "app-api",
          role: "api",
          lifecycle_state: "declared",
          observation_state: "ok",
          observation_source: "probe",
          observation_summary: "ok",
          observed_capabilities: [],
          notes: [],
        },
      ],
      read_paths: [
        {
          model_family: "inventory",
          observation_state: "ok",
          configured_target_count: 4,
          observed_target_count: 4,
          collection_success_count: 4,
          collection_partial_count: 0,
          collection_failure_count: 0,
          oldest_observed_at: "2025-01-01T00:00:00Z",
          newest_observed_at: "2025-01-01T00:05:00Z",
          policy_capable_target_count: null,
          detail_ready_target_count: null,
          inference_posture: null,
          endpoint_pairing_posture: null,
          collection_posture: null,
          node_participation_posture: null,
          paired_link_count: null,
          single_sided_link_count: null,
          linked_node_count: null,
          isolated_node_count: null,
          degraded_scope_summary: "None.",
          summary: "Inventory path ok.",
          notes: [],
        },
      ],
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
      dry_run_readiness: {
        status: "bounded_readiness_support",
        planning_readiness: "readiness_planning_supported",
        phase_recommendation: "remain_phase_2_read_only_foundation",
        summary: "Readiness summary.",
        readiness_scope: "scope",
        notes: [],
        strongest_blockers: ["Blocker one", "Blocker two"],
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
      items: [
        {
          vendor: "nokia",
          platform: "sros",
          version_scope: "lab",
          domain: "inventory",
          feature: "device_inventory",
          support_status: "supported",
          implementation_status: "implemented",
          delivery_tier: "delivered_read_only",
          evidence_basis: "live_validated",
          vendor_posture: "current_nokia_focus",
          availability_scope: "lab",
          status_detail: "ok",
          caveats: [],
          source_of_determination: "live",
          workflow_readiness_status: "supports_planning",
          workflow_readiness_scopes: ["planning_depth"],
          workflow_readiness_detail: "detail",
          related_readiness_blockers: [],
        },
      ],
    },
    next_inspection_framing:
      "These hints are optional read-only navigation prompts derived from fields already present in this assembly.",
    next_inspection_suggestions: [
      {
        suggestion_id: "change-intelligence-absent-devices",
        context_domain: "devices",
        framing_rule: "evidence_backed_read_only_surfaces_only",
        headline: "Inspect the Devices (inventory) read surface",
        rationale: "Recent change intelligence reports no evidence in the bounded lookback window for this domain.",
      },
      {
        suggestion_id: "change-intelligence-absent-readiness",
        context_domain: "readiness",
        framing_rule: "evidence_backed_read_only_surfaces_only",
        headline: "Inspect the Readiness read surface",
        rationale: "Recent change intelligence reports no evidence in the bounded lookback window for this domain.",
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("InvestigationView", () => {
  it("renders failure-impact entry framing when failure_impact_entry=v1", () => {
    window.history.replaceState(
      {},
      "",
      `/?view=investigation&${INV_FROM_PARAM}=topology&topology_object=PE1&topology_object_kind=node&failure_impact_entry=v1`,
    );
    useInvestigationWorkspaceContextQuery.mockReturnValue({
      data: createInvestigationAssemblyFixture(),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<InvestigationView />);

    expect(html).toContain("Entry from Topology failure impact (v1)");
    expect(html).toContain("blast-radius simulation");
  });

  it("renders navigation context banner when inv_from and shell object params are set", () => {
    window.history.replaceState(
      {},
      "",
      `/?view=investigation&${INV_FROM_PARAM}=devices&device_id=device-fixture-1`,
    );
    useInvestigationWorkspaceContextQuery.mockReturnValue({
      data: createInvestigationAssemblyFixture(),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<InvestigationView />);

    expect(html).toContain("investigation-nav-context-banner");
    expect(html).toContain("Devices");
    expect(html).toContain("device-fixture-1");
  });

  it("does not render navigation context banner when inv_from is absent (direct entry)", () => {
    useInvestigationWorkspaceContextQuery.mockReturnValue({
      data: createInvestigationAssemblyFixture(),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<InvestigationView />);

    expect(html).not.toContain("investigation-nav-context-banner");
  });

  it("renders the investigation workspace product surface when context loads", () => {
    useInvestigationWorkspaceContextQuery.mockReturnValue({
      data: createInvestigationAssemblyFixture(),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<InvestigationView />);

    expect(html).toContain("investigation_workspace_phase2_v1");
    expect(html).toContain("change_intelligence_phase2_v1");
    expect(html).toContain("Recent change intelligence");
    expect(html).toContain("Current platform posture");
    expect(html).toContain("Collector read paths");
    expect(html).toContain("Capabilities &amp; planning posture");
    expect(html).toContain("Dry-run readiness assessment");
    expect(html).toContain("Strongest blockers");
    expect(html).toContain("Recency anchors (bounded, not a unified event log)");
    expect(html).toContain("Cross-domain context at a glance");
    expect(html).toContain("Current posture snapshot");
    expect(html).toContain("Aggregated change signals");
    expect(html).toContain("Planning &amp; capability anchors");
    expect(html).toContain("Where to inspect next (optional)");
    expect(html).toContain("These hints are optional read-only navigation prompts");
    expect(html).toContain("Open related surface");
    expect(html).toContain("Navigate to full product surfaces");
    expect(html).toContain("Reload assembly");
    expect(html).toContain("Open Readiness");
    expect(html).toContain("Open Devices");
    expect(html).toContain("Workflow history");
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

  it("shows error state when the investigation assembly request fails", () => {
    useInvestigationWorkspaceContextQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("network", 0, "network_error"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<InvestigationView />);
    expect(html).toContain("investigation-workspace-route--error");
    expect(html).toContain("Back to Overview");
  });

  it("shows empty state when no assembly payload is returned", () => {
    useInvestigationWorkspaceContextQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<InvestigationView />);
    expect(html).toContain("investigation-workspace-route--empty");
    expect(html).toContain("No investigation context");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { SituationPackAssemblyResponse } from "../src/api/contracts";
import { SituationRoomView } from "../src/features/situation-room/view";

const { useSituationPackQuery } = vi.hoisted(() => ({
  useSituationPackQuery: vi.fn(),
}));

vi.mock("../src/features/situation-room/api", () => ({
  useSituationPackQuery,
}));

/** Minimal valid situation pack for static render smoke tests. */
function createSituationPackFixture(): SituationPackAssemblyResponse {
  const meta = {
    service: "app-api" as const,
    version: "test",
    phase: "phase_2_read_only_foundation" as const,
    generated_at: "2025-01-01T00:00:00Z",
  };

  const readSideEcho = {
    limit_requested: null,
    items_total: 0,
    items_returned: 0,
    history_recent_limit_requested: null,
    history_recent_limit_effective: null,
    history_recent_snapshots_returned: null,
    sync_runs_limit_requested: null,
    sync_runs_limit_effective: 20,
    readiness_snapshot_history_limit_requested: null,
    readiness_snapshot_history_limit_effective: 20,
  };

  return {
    metadata: meta,
    safety: {
      contract_id: "evidence_pack_phase2_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: ["not_validation_verdict", "not_dry_run_execution"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Operator evidence packs assemble existing read-side evidence.",
    },
    assembly_notes: ["Note one.", "Note two."],
    situation_pack_guidance_framing: "Nested investigation context; no duplicate top-level change rows.",
    devices: {
      ...meta,
      data_status: "live",
      serving_mode: "live_collector",
      evidence_confidence: {
        source_posture: "live_observed",
        evidence_kind: "direct_observed",
        confidence_posture: "strong_for_current_slice",
        freshness_posture: "current",
        blocked_reason: "none",
      },
      summary: "Devices ok.",
      served_persisted_at: null,
      comparison_to_latest_persisted: {
        status: "unavailable",
        summary: "n/a",
        comparison_snapshot_id: null,
      },
      history: {
        recent_snapshots: [],
        comparison_to_previous: null,
      },
      count: 2,
      items: [],
      read_side_query: readSideEcho,
    },
    topology: {
      ...meta,
      data_status: "live",
      serving_mode: "live_collector",
      evidence_confidence: {
        source_posture: "live_observed",
        evidence_kind: "direct_observed",
        confidence_posture: "strong_for_current_slice",
        freshness_posture: "current",
        blocked_reason: "none",
      },
      summary: "Topo ok.",
      served_persisted_at: null,
      comparison_to_latest_persisted: {
        status: "unavailable",
        summary: "n/a",
        comparison_snapshot_id: null,
      },
      history: {
        recent_snapshots: [],
        comparison_to_previous: null,
      },
      coverage_summary: {
        coverage_posture: "partial",
        paired_link_count: 0,
        single_sided_link_count: 0,
        linked_node_count: 0,
        isolated_node_count: 0,
        notes: [],
      },
      topology: {
        topology_id: "t1",
        topology_name: "lab",
        nodes: [],
        links: [],
        sync_source: "gnmi",
        sync_status: "ok",
        completeness: "partial",
        observed_at: "2025-01-01T00:00:00Z",
        notes: [],
      },
    },
    policies: {
      ...meta,
      data_status: "live",
      serving_mode: "live_collector",
      evidence_confidence: {
        source_posture: "live_observed",
        evidence_kind: "direct_observed",
        confidence_posture: "strong_for_current_slice",
        freshness_posture: "current",
        blocked_reason: "none",
      },
      summary: "Policies ok.",
      served_persisted_at: null,
      comparison_to_latest_persisted: {
        status: "unavailable",
        summary: "n/a",
        comparison_snapshot_id: null,
      },
      history: {
        recent_snapshots: [],
        comparison_to_previous: null,
      },
      count: 1,
      items: [],
      read_side_query: readSideEcho,
    },
    readiness: {
      ...meta,
      data_status: "empty",
      summary: "No snapshots.",
      count: 0,
      read_side_query: readSideEcho,
      items: [],
    },
    workflow_history: {
      ...meta,
      data_status: "empty",
      summary: "No workflow rows.",
      baseline_summary: {
        baseline_posture: "new_baseline",
        summary: "Baseline.",
        notes: [],
      },
      count: 0,
      items: [],
      read_side_query: readSideEcho,
    },
    audit_history: {
      ...meta,
      data_status: "empty",
      summary: "No audit rows.",
      baseline_summary: {
        baseline_posture: "new_baseline",
        summary: "Baseline.",
        notes: [],
      },
      count: 0,
      items: [],
      read_side_query: readSideEcho,
    },
    investigation_context: {
      metadata: meta,
      safety: {
        contract_id: "investigation_workspace_phase2_v1",
        authority_posture: "interpretation_support_only",
        explicit_non_claims: ["not_validation_verdict"],
        phase: "phase_2_read_only_foundation",
        summary_disclaimer: "Investigation disclaimer.",
      },
      assembly_notes: [],
      recent_change: {
        metadata: meta,
        safety: {
          contract_id: "change_intelligence_phase2_v1",
          authority_posture: "evidence_aggregated_non_authoritative",
          explicit_non_claims: [],
          phase: "phase_2_read_only_foundation",
          summary_disclaimer: "Change disclaimer.",
        },
        window_semantics: "backend_defined_bounded_lookback",
        completeness_posture: "bounded_partial",
        sync_runs_limit_applied: 20,
        readiness_snapshots_considered: 0,
        domains: [],
        aggregation_notes: [],
      },
      platform_status: {
        ...meta,
        status: "ok",
        topology_name: "platform",
        summary: "Ok.",
        recovery: {
          baseline_posture: "new_baseline",
          read_side_posture: "live_recollection_ready",
          summary: "Recovery.",
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
        ...meta,
        data_status: "bounded_matrix",
        summary: "Cap summary.",
        count: 1,
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
          summary: "R.",
          readiness_scope: "scope",
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
      },
      next_inspection_framing: "Framing.",
      next_inspection_suggestions: [],
    },
  } as unknown as SituationPackAssemblyResponse;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SituationRoomView", () => {
  it("renders the situation-room product surface when the pack loads", () => {
    useSituationPackQuery.mockReturnValue({
      data: createSituationPackFixture(),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<SituationRoomView />);

    expect(html).toContain("evidence_pack_phase2_v1");
    expect(html).toContain("Operator evidence packs assemble");
    expect(html).toContain("not validation verdict");
    expect(html).toContain("Current inventory");
    expect(html).toContain("Platform");
    expect(html).toContain("Recent change signals");
    expect(html).toContain("Persistence");
    expect(html).toContain("Readiness");
    expect(html).toContain("capability planning posture");
    expect(html).toContain("Honest evidence gaps");
    expect(html).toContain("Interpretation support");
    expect(html).toContain("Cross-domain context at a glance");
    expect(html).toContain("Pack assembly notes");
    expect(html).toContain("Note one.");
    expect(html).toContain("Open Topology");
    expect(html).toContain("Reload assembly");
    expect(html).toContain("Open investigation workspace");
    expect(html).toContain("Open full product surfaces");
  });

  it("shows loading state before data arrives", () => {
    useSituationPackQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<SituationRoomView />);
    expect(html).toContain("Loading bounded evidence pack assembly");
  });

  it("shows error state when the situation pack request fails", () => {
    useSituationPackQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("network", 0, "network_error"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<SituationRoomView />);
    expect(html).toContain("situation-room-route--error");
    expect(html).toContain("Back to Overview");
  });
});

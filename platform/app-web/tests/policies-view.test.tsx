import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildPolicyDetailBlockerSummary,
  buildPolicyDetailSourceReadinessSummary,
  describePolicyDetailBlockerReason,
  PoliciesView,
} from "../src/features/policies/view";

const { usePoliciesQuery, usePolicyPathAnalysisQuery, usePolicyTopologyImpactQuery, useTopologyQuery } =
  vi.hoisted(() => ({
    usePoliciesQuery: vi.fn(),
    usePolicyPathAnalysisQuery: vi.fn(),
    usePolicyTopologyImpactQuery: vi.fn(),
    useTopologyQuery: vi.fn(),
  }));

vi.mock("../src/features/policies/api", () => ({
  usePoliciesQuery,
  usePolicyPathAnalysisQuery,
  usePolicyTopologyImpactQuery,
}));

vi.mock("../src/features/topology/api", async () => {
  const actual = await vi.importActual<typeof import("../src/features/topology/api")>(
    "../src/features/topology/api",
  );

  return {
    ...actual,
    useTopologyQuery,
  };
});

function createQueryState<T>(data: T | null) {
  return {
    data,
    error: null,
    isLoading: false,
    isRefreshing: false,
    reload: vi.fn(async () => undefined),
  };
}

function createSamplePolicyItem() {
  return {
    policy_id: "PE1:static_local:192.0.2.11:100",
    policy_name: "sample-policy",
    policy_type: "static_local" as const,
    headend: "PE1",
    endpoint: "192.0.2.11",
    color: 100,
    source_target: "PE1",
    source_target_role: "pe",
    candidate_paths: [] as [],
    current_posture: "current" as const,
    intent_state: "declared" as const,
    observed_state: "active" as const,
    last_recorded_observed_state: "active" as const,
    support_state: "supported" as const,
    health_state: "healthy" as const,
    last_recorded_health_state: "healthy" as const,
    source: "gnmi_collector",
    notes: [] as [],
    degraded_policy_v1: {
      contract_id: "degraded_policy_v1" as const,
      posture: "ok" as const,
      reason_codes: [] as [],
      confidence: "medium" as const,
      summary:
        "Degraded-policy v1: no v1 reason codes triggered on this record given current normalized inventory fields.",
      explicit_non_claims: [
        "not_sla_or_availability_guarantee",
        "not_dataplane_or_te_resolution_verdict",
        "not_validation_or_safe_to_change_authority",
        "not_replacement_for_controller_computed_policy_truth",
      ],
    },
  };
}

function createPathAnalysisFixture() {
  return {
    metadata: {
      service: "app-api" as const,
      version: "test",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    safety_framing: {
      contract_id: "path_analysis_phase2_v1",
      authority_posture: "read_only_assembly_non_authoritative" as const,
      explicit_non_claims: [
        "not_validation_verdict",
        "not_dataplane_forwarding_truth",
      ] as const,
      phase: "phase_2_read_only_foundation" as const,
      summary_disclaimer: "Path analysis organizes existing read-side signals for operator interpretation.",
    },
    subject: {
      anchor_kind: "policy" as const,
      policy_id: "PE1:static_local:192.0.2.11:100",
      policy_name: "sample-policy",
      policy_type: "static_local" as const,
      color: 100,
      headend: "PE1",
      endpoint: "192.0.2.11",
      source_target: "PE1",
    },
    intended_path_hints: [
      {
        hint_id: "intent_endpoints",
        kind: "policy_intent_endpoints" as const,
        summary: "Headend to endpoint scope.",
        evidence_sources: [{ domain: "policies" as const, reference: "GET /api/v1/policies" }],
      },
    ],
    observed_path_hints: [],
    candidate_path_summaries: [
      {
        name: "primary",
        current_posture: "current" as const,
        path_state: "active" as const,
        last_recorded_path_state: "active" as const,
        preference: 1,
        notes: [],
      },
    ],
    evidence_sources: [{ domain: "policies" as const, reference: "GET /api/v1/policies" }],
    freshness: {
      assembly_generated_at: "2025-01-01T00:00:00Z",
      policy_snapshot_observed_at: "2025-01-01T00:00:00Z",
      topology_snapshot_observed_at: null,
      inventory_snapshot_observed_at: null,
      serving_mode_echo: "live" as const,
    },
    truth_alignment: {
      posture: "intended_vs_observed_aligned" as const,
      summary: "Signals align for this bounded slice.",
    },
    caveats: [],
  };
}

function createPolicyDataWithHistory() {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    data_status: "live",
    serving_mode: "live_collector",
    evidence_confidence: {
      source_posture: "live_observed",
      evidence_kind: "aggregate_plus_bounded_records",
      confidence_posture: "bounded_partial",
      freshness_posture: "current",
      blocked_reason: "none",
      summary: "Policy summary.",
      notes: [],
    },
    summary: "Policy summary.",
    served_persisted_at: null,
    sync_source: "gnmi_collector",
    sync_status: "ok",
    completeness: "partial",
    detail_mode: "static_policies_when_present",
    detail_source_readiness: {
      posture: "partially_ready",
      no_policies_observed_target_count: 30,
      detail_unavailable_target_count: 0,
      partial_detail_target_count: 0,
    },
    empty_reason: "none",
    observed_at: "2025-01-01T00:00:00Z",
    observed_target_count: 34,
    policy_capable_target_count: 34,
    observed_target_role_counts: { pe: 4 },
    policy_capable_target_role_counts: { pe: 4 },
    observed_policy_count: 4,
    active_policy_count: 4,
    static_policy_count: 4,
    static_local_policy_count: 4,
    static_non_local_policy_count: 0,
    bgp_policy_count: 0,
    ttm_preference_count: 4,
    binding_sid_count: 4,
    srv6_binding_sid_count: 0,
    count: 4,
    notes: [],
    comparison_to_latest_persisted: {
      status: "live_vs_latest_persisted_ready",
      summary: "Comparison ready.",
      comparison_snapshot_id: "policy-snapshot-latest",
      comparison_persisted_at: "2025-01-01T00:00:00Z",
      current_observed_at: "2025-01-01T00:00:00Z",
      current_observed_policy_count: 4,
      persisted_observed_policy_count: 4,
      current_detail_record_count: 4,
      persisted_detail_record_count: 4,
      observed_policy_delta: 0,
      detail_record_delta: 0,
      added_policy_count: 0,
      removed_policy_count: 0,
      changed_policy_count: 0,
      change_preview: [],
      notes: [],
    },
    history: {
      status: "comparison_ready",
      summary:
        "Recent persisted normalized policy snapshots are available for bounded current-versus-previous comparison.",
      recent_snapshots: [
        {
          snapshot_id: "policy-snapshot-current",
          sync_run_id: "sync-run-current",
          source_endpoint: "http://collector:9804/policies/snapshot",
          persisted_at: "2025-01-01T00:00:00Z",
          observed_at: "2025-01-01T00:00:00Z",
          data_status: "live",
          sync_source: "persisted_policy_snapshot",
          sync_status: "ok",
          completeness: "partial",
          detail_mode: "static_policies_when_present",
          empty_reason: "none",
          observed_policy_count: 4,
          active_policy_count: 4,
          static_local_policy_count: 4,
          observed_target_count: 34,
          policy_capable_target_count: 34,
          detail_record_count: 4,
          detail_source_readiness: {
            posture: "partially_ready",
            no_policies_observed_target_count: 30,
            detail_unavailable_target_count: 0,
            partial_detail_target_count: 0,
          },
          detail_source_readiness_posture: "partially_ready",
          detail_ready_target_count: 4,
          no_policies_observed_target_count: 30,
          detail_unavailable_target_count: 0,
          partial_detail_target_count: 0,
        },
        {
          snapshot_id: "policy-snapshot-older",
          sync_run_id: "sync-run-older",
          source_endpoint: "http://collector:9804/policies/snapshot",
          persisted_at: "2024-12-31T23:30:00Z",
          observed_at: "2024-12-31T23:29:00Z",
          data_status: "live",
          sync_source: "persisted_policy_snapshot",
          sync_status: "ok",
          completeness: "partial",
          detail_mode: "static_policies_when_present",
          empty_reason: "none",
          observed_policy_count: 4,
          active_policy_count: 4,
          static_local_policy_count: 4,
          observed_target_count: 34,
          policy_capable_target_count: 34,
          detail_record_count: 4,
          detail_source_readiness: {
            posture: "partially_ready",
            no_policies_observed_target_count: 30,
            detail_unavailable_target_count: 0,
            partial_detail_target_count: 0,
          },
          detail_source_readiness_posture: "partially_ready",
          detail_ready_target_count: 4,
          no_policies_observed_target_count: 30,
          detail_unavailable_target_count: 0,
          partial_detail_target_count: 0,
        },
      ],
      comparison_to_previous: {
        current_snapshot_id: "policy-snapshot-current",
        previous_snapshot_id: "policy-snapshot-older",
        current_persisted_at: "2025-01-01T00:00:00Z",
        previous_persisted_at: "2024-12-31T23:30:00Z",
        current_observed_policy_count: 4,
        previous_observed_policy_count: 4,
        current_detail_record_count: 4,
        previous_detail_record_count: 4,
        observed_policy_delta: 0,
        detail_record_delta: 0,
        added_policy_count: 0,
        removed_policy_count: 0,
        changed_policy_count: 0,
        change_preview: [],
        notes: ["Bounded policy history note."],
        current_detail_source_readiness_posture: "partially_ready",
        previous_detail_source_readiness_posture: "partially_ready",
        current_detail_ready_target_count: 4,
        previous_detail_ready_target_count: 4,
        current_no_policies_observed_target_count: 30,
        previous_no_policies_observed_target_count: 30,
        current_detail_unavailable_target_count: 1,
        previous_detail_unavailable_target_count: 2,
        current_partial_detail_target_count: 0,
        previous_partial_detail_target_count: 1,
        current_static_local_policy_count: 4,
        previous_static_local_policy_count: 4,
        static_local_policy_delta: 0,
        current_observed_at: "2025-01-01T00:00:00Z",
        previous_observed_at: "2024-12-31T23:29:00Z",
        current_data_status: "live",
        previous_data_status: "live",
        current_sync_run_id: "sync-run-current",
        previous_sync_run_id: "sync-run-older",
        current_source_endpoint: "http://collector:9804/policies/snapshot",
        previous_source_endpoint: "http://collector:9804/policies/snapshot",
        current_detail_source_readiness: {
          posture: "partially_ready",
          no_policies_observed_target_count: 30,
          detail_unavailable_target_count: 1,
          partial_detail_target_count: 0,
        },
        previous_detail_source_readiness: {
          posture: "partially_ready",
          no_policies_observed_target_count: 30,
          detail_unavailable_target_count: 2,
          partial_detail_target_count: 1,
        },
      },
    },
    target_footprints: [
      {
        target_name: "PE1",
        target_role: "pe",
        current_posture: "current",
        collection_status: "success",
        last_recorded_collection_status: "success",
        policy_capable: true,
        observed_policy_count: 1,
        active_policy_count: 1,
        static_policy_count: 1,
        static_local_policy_count: 1,
        static_non_local_policy_count: 0,
        bgp_policy_count: 0,
        ttm_preference_count: 1,
        binding_sid_count: 1,
        srv6_binding_sid_count: 0,
        detail_record_count: 1,
        detail_blocker_reason: "none",
        notes: [],
      },
    ],
    read_side_query: {
      limit_requested: null,
      items_total: 4,
      items_returned: 4,
      history_recent_limit_requested: null,
      history_recent_limit_effective: 3,
      history_recent_snapshots_returned: 2,
      sync_runs_limit_requested: null,
      sync_runs_limit_effective: null,
      readiness_snapshot_history_limit_requested: null,
      readiness_snapshot_history_limit_effective: null,
    },
    items: [],
  };
}

describe("policy detail blocker readouts", () => {
  it("maps per-policy detail blockers into explicit blocked posture", () => {
    expect(describePolicyDetailBlockerReason("per_policy_details_unavailable")).toEqual({
      pillValue: "blocked",
      label: "Per-policy detail unavailable",
      detail:
        "Counters show policy presence on this target, but the bounded path cannot yet derive stable per-policy records.",
    });
  });

  it("summarizes explicit blocker posture across target footprints", () => {
    const summary = buildPolicyDetailBlockerSummary([
      "none",
      "per_policy_details_unavailable",
      "collection_partial",
      "not_recorded",
    ]);

    expect(summary).toEqual({
      label: "2 blocked",
      detail:
        "2 of 3 targets with explicit blocker posture remain blocked from stable per-policy detail records. 1 targets are currently detail-ready.",
      breakdown: "Collection partial: 1 • Per-policy detail unavailable: 1",
      blockedTargetCount: 2,
      detailReadyTargetCount: 1,
      notRecordedTargetCount: 1,
    });
  });

  it("stays explicit when blocker reasons are not recorded", () => {
    const summary = buildPolicyDetailBlockerSummary(["not_recorded", "not_recorded"]);

    expect(summary).toEqual({
      label: "Not recorded",
      detail:
        "The backend did not expose explicit per-target detail blocker reasons on this response.",
      breakdown: "",
      blockedTargetCount: 0,
      detailReadyTargetCount: 0,
      notRecordedTargetCount: 2,
    });
  });

  it("summarizes partially ready source-readiness without replacing blocker posture", () => {
    const summary = buildPolicyDetailSourceReadinessSummary(
      {
        posture: "partially_ready",
        no_policies_observed_target_count: 30,
        detail_unavailable_target_count: 0,
        partial_detail_target_count: 0,
      },
      4,
    );

    expect(summary).toEqual({
      label: "Partially ready",
      detail:
        "The current source-visible slice is mixed: 4 targets are detail-ready while 30 remain live-empty, 0 remain detail-unavailable, and 0 remain partially covered.",
      breakdown: "Detail-ready: 4 • Live-empty: 30 • Detail unavailable: 0 • Partial detail: 0",
      sourceVisibleTargetCount: 34,
    });
  });

  it("summarizes source-detail-unavailable posture explicitly", () => {
    const summary = buildPolicyDetailSourceReadinessSummary(
      {
        posture: "source_detail_unavailable",
        no_policies_observed_target_count: 0,
        detail_unavailable_target_count: 2,
        partial_detail_target_count: 0,
      },
      0,
    );

    expect(summary).toEqual({
      label: "Source detail unavailable",
      detail:
        "Observed SR policy presence exists, but the current bounded source slice still cannot derive stable per-policy detail on 2 source-visible targets.",
      breakdown: "Detail-ready: 0 • Live-empty: 0 • Detail unavailable: 2 • Partial detail: 0",
      sourceVisibleTargetCount: 2,
    });
  });
});

function createTopologyImpactEmptyFixture(policyId: string, policyName: string) {
  return {
    metadata: {
      service: "app-api" as const,
      version: "test",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    policy_id: policyId,
    policy_name: policyName,
    derivation_summary: "Test derivation for topology impact.",
    global_caveats: [] as string[],
    items: [] as [],
  };
}

describe("policies view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePolicyPathAnalysisQuery.mockReturnValue(createQueryState(null));
    usePolicyTopologyImpactQuery.mockReturnValue(
      createQueryState(
        createTopologyImpactEmptyFixture("PE1:static_local:192.0.2.11:100", "sample-policy"),
      ),
    );
  });

  it("renders persisted policy history and recent snapshot anchors", () => {
    usePoliciesQuery.mockReturnValue(createQueryState(createPolicyDataWithHistory()));
    useTopologyQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<PoliciesView />);

    expect(html).toContain("Recent Persisted Snapshots");
    expect(html).toContain("policy-snapshot-current");
    expect(html).toContain("policy-snapshot-older");
    expect(html).toContain("Bounded policy history note.");
    expect(html).toContain("sync-run-current");
    expect(html).toContain("http://collector:9804/policies/snapshot");
    expect(html).toContain("Nested readiness:");
    expect(html).toContain("Persisted rollup:");
    expect(html).toContain("34 observed");
    expect(html).toContain("Static local (bounded slice):");
    expect(html).toContain("Bounded query readout (from API)");
    expect(html).toContain("Persisted snapshot summaries:");
  });

  it("renders persisted source-readiness posture in history and comparison", () => {
    usePoliciesQuery.mockReturnValue(createQueryState(createPolicyDataWithHistory()));
    useTopologyQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<PoliciesView />);

    expect(html).toContain("trust cues, not validation verdicts");
    expect(html).toContain("persisted coverage cues");
    expect(html).toContain("Current source-readiness posture");
    expect(html).toContain("Previous source-readiness posture");
    expect(html).toContain("Current / previous detail-ready targets");
    expect(html).toContain("Current / previous live-empty targets");
    expect(html).toContain("Current / previous detail-unavailable targets");
    expect(html).toContain("Current / previous partial-detail targets");
    expect(html).toContain("snapshot-derived trust cues only");
    expect(html).toContain("source-readiness");
    expect(html).toContain("detail-ready");
    expect(html).toContain("live-empty");
    expect(html).toContain("detail-unavailable");
    expect(html).toContain("partial");
    expect(html).toContain("Current / previous observed");
    expect(html).toContain("Current / previous sync run");
    expect(html).toContain("Current / previous source endpoint");
    expect(html).toContain("Nested readiness (current / previous)");
    expect(html).toContain("Current:");
    expect(html).toContain("Previous:");
  });

  it("omits comparison-only rows when newer backend omits extended comparison counts", () => {
    const base = createPolicyDataWithHistory();
    const comparison = base.history.comparison_to_previous;
    if (!comparison) {
      throw new Error("expected comparison fixture");
    }
    const slimComparison = { ...comparison };
    delete slimComparison.current_detail_unavailable_target_count;
    delete slimComparison.previous_detail_unavailable_target_count;
    delete slimComparison.current_partial_detail_target_count;
    delete slimComparison.previous_partial_detail_target_count;
    usePoliciesQuery.mockReturnValue(
      createQueryState({
        ...base,
        history: { ...base.history, comparison_to_previous: slimComparison },
      }),
    );
    useTopologyQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<PoliciesView />);

    expect(html).toContain("Current / previous live-empty targets");
    expect(html).not.toContain("Current / previous detail-unavailable targets");
    expect(html).not.toContain("Current / previous partial-detail targets");
  });

  it("shows an honest current-only note when comparison is absent", () => {
    const base = createPolicyDataWithHistory();
    usePoliciesQuery.mockReturnValue(
      createQueryState({
        ...base,
        history: {
          status: "current_only",
          summary: "Only one persisted snapshot on file.",
          recent_snapshots: base.history.recent_snapshots.slice(0, 1),
          comparison_to_previous: null,
        },
      }),
    );
    useTopologyQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<PoliciesView />);

    expect(html).toContain("current only");
    expect(html).toContain("no paired previous snapshot");
  });

  it("shows unavailable history copy when there are no recent snapshots", () => {
    const base = createPolicyDataWithHistory();
    usePoliciesQuery.mockReturnValue(
      createQueryState({
        ...base,
        history: {
          status: "unavailable",
          summary: "No history.",
          recent_snapshots: [],
          comparison_to_previous: null,
        },
        read_side_query: {
          ...base.read_side_query,
          history_recent_snapshots_returned: 0,
        },
      }),
    );
    useTopologyQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<PoliciesView />);

    expect(html).toContain("No persisted policy-history window is currently available");
  });

  it("describes honest primary list truncation when echo shows partial items", () => {
    const base = createPolicyDataWithHistory();
    usePoliciesQuery.mockReturnValue(
      createQueryState({
        ...base,
        read_side_query: {
          ...base.read_side_query,
          limit_requested: 2,
          items_total: 4,
          items_returned: 2,
        },
      }),
    );
    useTopologyQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<PoliciesView />);

    expect(html).toContain("Primary policy inventory list shows 2 of 4 rows");
  });

  it("renders the path analysis panel when policies are listed and path analysis returns data", () => {
    usePoliciesQuery.mockReturnValue(
      createQueryState({
        ...createPolicyDataWithHistory(),
        items: [createSamplePolicyItem()],
      }),
    );
    useTopologyQuery.mockReturnValue(createQueryState(null));
    usePolicyPathAnalysisQuery.mockReturnValue(createQueryState(createPathAnalysisFixture()));

    const html = renderToStaticMarkup(<PoliciesView />);

    expect(html).toContain("Path analysis");
    expect(html).toContain("path_analysis_phase2_v1");
    expect(html).toContain("Explicit non-claims");
    expect(html).toContain("Truth alignment");
    expect(html).toContain("Signals align for this bounded slice.");
    expect(html).toContain("Topology impact");
    expect(html).toContain("Read-only naming alignment");
    expect(html).toContain("Degraded policy (v1)");
    expect(html).toContain("Explicit non-claims (4)");
  });
});
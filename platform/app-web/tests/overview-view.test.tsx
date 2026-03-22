import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { CapabilitiesListResponse } from "../src/api/contracts";
import { OverviewView } from "../src/features/overview/view";

const {
  usePlatformStatusQuery,
  useDevicesQuery,
  useTopologyQuery,
  usePoliciesQuery,
  useCapabilitiesQuery,
  useRecentChangeSummaryQuery,
} = vi.hoisted(() => ({
  usePlatformStatusQuery: vi.fn(),
  useDevicesQuery: vi.fn(),
  useTopologyQuery: vi.fn(),
  usePoliciesQuery: vi.fn(),
  useCapabilitiesQuery: vi.fn(),
  useRecentChangeSummaryQuery: vi.fn(),
}));

vi.mock("../src/features/platform-health/api", async () => {
  const actual = await vi.importActual<typeof import("../src/features/platform-health/api")>(
    "../src/features/platform-health/api",
  );

  return {
    ...actual,
    usePlatformStatusQuery,
  };
});

vi.mock("../src/features/devices/api", () => ({
  useDevicesQuery,
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

vi.mock("../src/features/policies/api", () => ({
  usePoliciesQuery,
}));

vi.mock("../src/features/capabilities/api", () => ({
  useCapabilitiesQuery,
}));

vi.mock("../src/features/overview/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/features/overview/api")>();
  return {
    ...actual,
    useRecentChangeSummaryQuery,
  };
});

function createQueryState<T>(data: T | null, overrides: Partial<{ error: ApiClientError | null; isLoading: boolean; isRefreshing: boolean }> = {}) {
  return {
    data,
    error: overrides.error ?? null,
    isLoading: overrides.isLoading ?? false,
    isRefreshing: overrides.isRefreshing ?? false,
    reload: vi.fn(async () => undefined),
  };
}

function createPlatformStatusData() {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    status: "ok",
    summary: "Platform is healthy.",
    recovery: {
      baseline_posture: "preserved_same_workspace_baseline" as const,
      read_side_posture: "live_recollection_ready" as const,
      summary: "Same-workspace persisted baseline is present.",
      persisted_artifacts: {
        inventory_snapshot: true,
        topology_snapshot: true,
        policy_snapshot: true,
        sync_history: true,
        readiness_snapshot: true,
      },
      notes: [],
    },
    components: [
      {
        name: "app-api",
        observation_state: "ok",
        summary: "Healthy",
        notes: [],
      },
    ],
    read_paths: [
      {
        model_family: "topology",
        observation_state: "degraded",
        configured_target_count: 4,
        observed_target_count: 3,
        collection_success_count: 2,
        collection_partial_count: 1,
        collection_failure_count: 1,
        oldest_observed_at: "2025-01-01T00:00:00Z",
        newest_observed_at: "2025-01-01T00:05:00Z",
        policy_capable_target_count: null,
        detail_ready_target_count: null,
        inference_posture: "inferred",
        endpoint_pairing_posture: "partially_paired",
        collection_posture: "degraded",
        node_participation_posture: "partially_isolated",
        paired_link_count: 2,
        single_sided_link_count: 1,
        linked_node_count: 2,
        isolated_node_count: 1,
        degraded_scope_summary: "One topology target is degraded.",
        summary: "Topology read path is partially degraded.",
        notes: [],
      },
    ],
  };
}

function createTopologyData() {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    data_status: "live",
    serving_mode: "live_collector",
    evidence_confidence: {
      source_posture: "live_observed",
      evidence_kind: "observed_plus_inferred",
      confidence_posture: "bounded_partial",
      freshness_posture: "current",
      blocked_reason: "none",
      summary: "Current topology is inferred.",
      notes: [],
    },
    summary: "Topology summary.",
    served_persisted_at: null,
    comparison_to_latest_persisted: {
      status: "unavailable",
      summary: "No comparison snapshot.",
      comparison_snapshot_id: null,
      comparison_persisted_at: null,
      current_observed_at: null,
      current_node_count: 0,
      persisted_node_count: 0,
      current_link_count: 0,
      persisted_link_count: 0,
      node_count_delta: 0,
      link_count_delta: 0,
      added_node_count: 0,
      removed_node_count: 0,
      changed_node_count: 0,
      added_link_count: 0,
      removed_link_count: 0,
      changed_link_count: 0,
      notes: [],
    },
    history: {
      status: "unavailable",
      summary: "No persisted topology history yet.",
      recent_snapshots: [],
      comparison_to_previous: null,
    },
    coverage_summary: {
      inference_posture: "inferred",
      endpoint_pairing_posture: "partially_paired",
      collection_posture: "degraded",
      node_participation_posture: "partially_isolated",
      paired_link_count: 2,
      single_sided_link_count: 1,
      linked_node_count: 2,
      isolated_node_count: 1,
      summary: "Some links remain single-sided.",
    },
    topology: {
      topology_id: "topology-1",
      topology_name: "platform",
      nodes: [
        { node_id: "leaf-1", display_name: "leaf-1", state: "ok", role: "leaf", management_address: null, source: "collector", attributes: {}, notes: [] },
        { node_id: "spine-1", display_name: "spine-1", state: "degraded", role: "spine", management_address: null, source: "collector", attributes: {}, notes: [] },
      ],
      links: [
        { link_id: "link-1", source_node_id: "leaf-1", target_node_id: "spine-1", state: "up", source: "collector", endpoint_pairing_state: "paired", endpoint_evidence_count: 2, attributes: {} },
        { link_id: "link-2", source_node_id: "leaf-1", target_node_id: "spine-1", state: "up", source: "collector", endpoint_pairing_state: "single_sided", endpoint_evidence_count: 1, attributes: {} },
      ],
      sync_source: "collector",
      sync_status: "degraded",
      completeness: "partial",
      observed_at: null,
      notes: ["Topology remains partial."],
    },
  };
}

function createPoliciesData() {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    data_status: "live",
    serving_mode: "live_collector",
    evidence_confidence: {
      source_posture: "live_observed",
      evidence_kind: "aggregate_only",
      confidence_posture: "bounded_partial",
      freshness_posture: "current",
      blocked_reason: "none",
      summary: "Policy summary.",
      notes: [],
    },
    summary: "Policies summary.",
    served_persisted_at: null,
    sync_source: "collector",
    sync_status: "ok",
    completeness: "partial",
    detail_mode: "counters_only",
    empty_reason: "none",
    detail_source_readiness: {
      posture: "partially_ready",
      no_policies_observed_target_count: 0,
      detail_unavailable_target_count: 0,
      partial_detail_target_count: 0,
    },
    observed_at: "2025-01-01T00:00:00Z",
    observed_target_count: 4,
    policy_capable_target_count: 4,
    observed_target_role_counts: { pe: 2, p: 2 },
    policy_capable_target_role_counts: { pe: 2, p: 2 },
    observed_policy_count: 2,
    active_policy_count: 2,
    static_policy_count: 2,
    static_local_policy_count: 2,
    static_non_local_policy_count: 0,
    bgp_policy_count: 0,
    ttm_preference_count: 14,
    binding_sid_count: 2,
    srv6_binding_sid_count: 0,
    count: 1,
    notes: [],
    target_footprints: [],
    items: [
      {
        policy_id: "policy-1",
        target_id: "leaf-1",
        policy_type: "bgp",
        name: "BGP Policy",
        health_state: "degraded",
        support_state: "supported",
        observed_state: "present",
        notes: ["Policy needs review."],
        attributes: {},
      },
    ],
    comparison_to_latest_persisted: {
      status: "unavailable",
      summary: "No comparison snapshot.",
      comparison_snapshot_id: null,
      comparison_persisted_at: null,
      current_observed_at: null,
      current_observed_policy_count: 2,
      persisted_observed_policy_count: 0,
      current_detail_record_count: 1,
      persisted_detail_record_count: 0,
      observed_policy_delta: 2,
      detail_record_delta: 1,
      added_policy_count: 1,
      removed_policy_count: 0,
      changed_policy_count: 0,
      change_preview: [],
      notes: [],
    },
    history: {
      status: "unavailable",
      summary: "No history yet.",
      recent_snapshots: [],
      comparison_to_previous: null,
    },
  };
}

function createRecentChangeSummaryData() {
  const absentDomain = {
    signal_families: [] as string[],
    evidence_status: "absent" as const,
    headline: "No persisted inventory snapshots in this workspace baseline.",
    detail_notes: [] as string[],
  };
  return {
    metadata: {
      service: "app-api" as const,
      version: "test",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    safety: {
      contract_id: "change_intelligence_phase2_v1",
      authority_posture: "evidence_aggregated_non_authoritative" as const,
      explicit_non_claims: ["not_validation_verdict"],
      phase: "phase_2_read_only_foundation" as const,
      summary_disclaimer:
        "Recent change intelligence summarizes existing read-side evidence for operator visibility. It is not a validation verdict, drift detection result, safe-to-change recommendation, or workflow authorization.",
    },
    window_semantics: "backend_defined_bounded_lookback",
    completeness_posture: "bounded_partial",
    sync_runs_limit_applied: 20,
    readiness_snapshots_considered: 0,
    domains: [
      { domain: "devices" as const, ...absentDomain },
      {
        domain: "topology" as const,
        signal_families: [],
        evidence_status: "absent",
        headline: "No persisted topology snapshots.",
        detail_notes: [],
      },
      {
        domain: "policies" as const,
        signal_families: [],
        evidence_status: "absent",
        headline: "No persisted policy snapshots.",
        detail_notes: [],
      },
      {
        domain: "readiness" as const,
        signal_families: [],
        evidence_status: "absent",
        headline: "No persisted readiness-support snapshots.",
        detail_notes: [],
      },
      {
        domain: "workflow_history" as const,
        signal_families: [],
        evidence_status: "absent",
        headline: "No persisted read-side sync runs in the requested window.",
        detail_notes: [],
      },
      {
        domain: "audit_history" as const,
        signal_families: [],
        evidence_status: "absent",
        headline: "Audit-style history is built from the same persisted sync runs (0 in window).",
        detail_notes: [],
      },
    ],
    aggregation_notes: ["Contract change_intelligence_phase2_v1; sync_runs_limit=20."],
  };
}

function createCapabilitiesData(): CapabilitiesListResponse {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    data_status: "bounded_matrix",
    summary: "Capabilities summary.",
    count: 1,
    readiness_snapshot_id: "readiness-1",
    readiness_persisted_at: "2025-01-01T00:00:00Z",
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
          summary: "Gap.",
          blocked_readiness_scopes: ["planning_depth"],
          related_prerequisites: ["inventory_read_model"],
          notes: [],
        },
      ],
      prerequisites: [],
    },
    items: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useRecentChangeSummaryQuery.mockReturnValue(createQueryState(createRecentChangeSummaryData()));
});

describe("overview view", () => {
  it("surfaces a bounded investigation workspace entrypoint above recent change", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatusData()));
    useDevicesQuery.mockReturnValue(createQueryState(null));
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesData()));

    const html = renderToStaticMarkup(<OverviewView />);

    expect(html).toContain("Investigation workspace (bounded)");
    expect(html).toContain("Open investigation workspace");
    expect(html).toContain("sync run window");
  });

  it("stages collector-backed overview queries instead of starting them all at once", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(null, { isLoading: true }));
    useDevicesQuery.mockReturnValue(createQueryState(null, { isLoading: true }));
    useTopologyQuery.mockReturnValue(createQueryState(null, { isLoading: true }));
    usePoliciesQuery.mockReturnValue(createQueryState(null, { isLoading: true }));
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesData()));

    renderToStaticMarkup(<OverviewView />);

    expect(useTopologyQuery).toHaveBeenCalledWith(false);
    expect(usePoliciesQuery).toHaveBeenCalledWith(false);
    expect(usePlatformStatusQuery).toHaveBeenCalledWith(false);
  });

  it("renders available slices when one core query fails", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatusData()));
    useDevicesQuery.mockReturnValue(
      createQueryState(null, {
        error: new ApiClientError("Devices timed out", 504, "request_failed"),
      }),
    );
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesData()));

    const html = renderToStaticMarkup(<OverviewView />);

    expect(html).toContain("Overview is currently partial");
    expect(html).toContain("Device inventory");
    expect(html).toContain("Devices timed out");
    expect(html).toContain("Retry devices");
    expect(html).toContain("Topology coverage");
    expect(html).toContain("Node participation");
    expect(html).toContain("Partially isolated");
    expect(html).toContain("Policies Trust Cues");
    expect(html).toContain("Devices Trust Cues");
    expect(html).toContain("Inventory trust cues are temporarily unavailable");
  });

  it("surfaces recovery posture when platform status includes recovery contract", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatusData()));
    useDevicesQuery.mockReturnValue(createQueryState(null));
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesData()));

    const html = renderToStaticMarkup(<OverviewView />);

    expect(html).toContain("Recovery Posture");
    expect(html).toContain("Same-Workspace Recovery");
    expect(html).toContain("Preserved same-workspace baseline");
    expect(html).toContain("Live recollection ready");
    expect(html).toContain("Preserved baseline and fresh live recollection are not the same thing");
  });

  it("surfaces coarse readiness decision-support cues on the capabilities summary card and trust cue", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatusData()));
    useDevicesQuery.mockReturnValue(createQueryState(null));
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesData()));

    const html = renderToStaticMarkup(<OverviewView />);

    expect(html).toContain("Readiness posture:");
    expect(html).toContain("Dry-run readiness status");
    expect(html).toContain("bounded readiness support");
    expect(html).toContain("explicit blocker records");
  });

  it("surfaces recovery notes row when backend supplies recovery.notes", () => {
    const status = createPlatformStatusData();
    status.recovery = {
      ...status.recovery,
      notes: ["Per-slice live coverage may still be partial despite preserved anchors."],
    };
    usePlatformStatusQuery.mockReturnValue(createQueryState(status));
    useDevicesQuery.mockReturnValue(createQueryState(null));
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesData()));

    const html = renderToStaticMarkup(<OverviewView />);

    expect(html).toContain("Notes");
    expect(html).toContain("Per-slice live coverage may still be partial despite preserved anchors.");
  });

  it("surfaces observed policy count separately from detailed records in the overview summary", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatusData()));
    useDevicesQuery.mockReturnValue(createQueryState({
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
      data_status: "live",
      serving_mode: "live_collector",
      evidence_confidence: {
        source_posture: "live_observed",
        evidence_kind: "observed_records",
        confidence_posture: "strong_for_current_slice",
        freshness_posture: "current",
        blocked_reason: "none",
        summary: "Inventory summary.",
        notes: [],
      },
      summary: "Inventory summary.",
      served_persisted_at: null,
      count: 4,
      history: {
        status: "unavailable",
        summary: "No persisted inventory history yet.",
        recent_snapshots: [],
        comparison_to_previous: null,
      },
      items: [],
      comparison_to_latest_persisted: {
        status: "unavailable",
        summary: "No comparison snapshot.",
        comparison_snapshot_id: null,
        comparison_persisted_at: null,
        current_device_count: 0,
        persisted_device_count: 0,
        device_count_delta: 0,
        added_device_count: 0,
        removed_device_count: 0,
        changed_device_count: 0,
        current_role_counts: {},
        persisted_role_counts: {},
        current_collector_status_counts: {},
        persisted_collector_status_counts: {},
        current_capability_summary_counts: {},
        persisted_capability_summary_counts: {},
        notes: [],
      },
    }));
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState({
      ...createPoliciesData(),
      count: 0,
      observed_policy_count: 2,
      empty_reason: "per_policy_details_unavailable",
      detail_mode: "counters_only",
      items: [],
    }));
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesData()));

    const html = renderToStaticMarkup(<OverviewView />);

    expect(html).toContain("Policy inventory");
    expect(html).toContain("Observed policies • Detailed records: 0 • live");
    expect(html).toContain("Inventory history");
    expect(html).toContain("No snapshots • unavailable");
    expect(html).toContain("Policy history");
    expect(html).toContain("No snapshots • unavailable • partially ready");
  });

  it("surfaces policy history trust cue when policies exposes comparison-ready persisted history", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatusData()));
    useDevicesQuery.mockReturnValue(createQueryState(null));
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(
      createQueryState({
        ...createPoliciesData(),
        history: {
          status: "comparison_ready",
          summary: "Policy history window ready.",
          recent_snapshots: [
            {
              snapshot_id: "policy-snap-a",
              sync_run_id: "sync-policy-a",
              source_endpoint: "http://collector/policies",
              persisted_at: "2025-01-01T00:00:00Z",
              observed_at: "2025-01-01T00:00:00Z",
              data_status: "live",
              sync_source: "persisted_policy_snapshot",
              sync_status: "ok",
              completeness: "partial",
              detail_mode: "static_policies_when_present",
              empty_reason: "none",
              observed_policy_count: 2,
              active_policy_count: 2,
              static_local_policy_count: 2,
              observed_target_count: 4,
              policy_capable_target_count: 4,
              detail_record_count: 2,
              detail_source_readiness: {
                posture: "partially_ready",
                no_policies_observed_target_count: 1,
                detail_unavailable_target_count: 0,
                partial_detail_target_count: 0,
              },
              detail_source_readiness_posture: "partially_ready",
              detail_ready_target_count: 2,
              no_policies_observed_target_count: 1,
              detail_unavailable_target_count: 0,
              partial_detail_target_count: 0,
            },
            {
              snapshot_id: "policy-snap-b",
              persisted_at: "2024-12-31T00:00:00Z",
              observed_at: "2024-12-31T00:00:00Z",
              data_status: "live",
              sync_source: "persisted_policy_snapshot",
              sync_status: "ok",
              completeness: "partial",
              detail_mode: "static_policies_when_present",
              empty_reason: "none",
              observed_policy_count: 2,
              active_policy_count: 2,
              detail_record_count: 2,
            },
          ],
          comparison_to_previous: {
            current_snapshot_id: "policy-snap-a",
            previous_snapshot_id: "policy-snap-b",
            current_persisted_at: "2025-01-01T00:00:00Z",
            previous_persisted_at: "2024-12-31T00:00:00Z",
            current_observed_policy_count: 2,
            previous_observed_policy_count: 2,
            current_detail_record_count: 2,
            previous_detail_record_count: 2,
            observed_policy_delta: 0,
            detail_record_delta: 0,
            added_policy_count: 0,
            removed_policy_count: 0,
            changed_policy_count: 0,
            change_preview: [],
            notes: [],
          },
        },
      }),
    );
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesData()));

    const html = renderToStaticMarkup(<OverviewView />);

    expect(html).toContain("Policy history");
    expect(html).toContain("2 snapshots");
    expect(html).toContain("comparison ready");
    expect(html).toContain("partially ready");
    expect(html).toContain("Latest-versus-previous comparison is available");
  });

  it("surfaces inventory history trust cue when devices exposes comparison-ready persisted history", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatusData()));
    useDevicesQuery.mockReturnValue(
      createQueryState({
        service: "app-api",
        version: "test",
        phase: "phase_2_read_only_foundation",
        generated_at: "2025-01-01T00:00:00Z",
        data_status: "live",
        serving_mode: "live_collector",
        evidence_confidence: {
          source_posture: "live_observed",
          evidence_kind: "direct_observed",
          confidence_posture: "strong_for_current_slice",
          freshness_posture: "current",
          blocked_reason: "none",
          summary: "Inventory summary.",
          notes: [],
        },
        summary: "Inventory summary.",
        served_persisted_at: null,
        count: 2,
        items: [],
        comparison_to_latest_persisted: {
          status: "live_vs_latest_persisted_ready",
          summary: "Ready.",
          comparison_snapshot_id: "inv-latest",
          comparison_persisted_at: "2025-01-01T00:00:00Z",
          current_device_count: 2,
          persisted_device_count: 2,
          device_count_delta: 0,
          added_device_count: 0,
          removed_device_count: 0,
          changed_device_count: 0,
          current_role_counts: {},
          persisted_role_counts: {},
          current_collector_status_counts: {},
          persisted_collector_status_counts: {},
          current_capability_summary_counts: {},
          persisted_capability_summary_counts: {},
          notes: [],
        },
        history: {
          status: "comparison_ready",
          summary: "History window ready.",
          recent_snapshots: [
            {
              snapshot_id: "inv-a",
              sync_run_id: "sync-a",
              persisted_at: "2025-01-01T00:00:00Z",
              observed_at: null,
              sync_source: "gnmi_collector_inventory",
              sync_status: "live_normalized_feed",
              data_status: "live",
              source_endpoint: "http://collector/inventory",
              device_count: 2,
              role_counts: { pe: 2 },
              collector_status_counts: { ok: 2 },
              capability_summary_counts: { partially_supported: 2 },
            },
            {
              snapshot_id: "inv-b",
              sync_run_id: "sync-b",
              persisted_at: "2024-12-31T00:00:00Z",
              observed_at: null,
              sync_source: "gnmi_collector_inventory",
              sync_status: "live_normalized_feed",
              data_status: "live",
              source_endpoint: "http://collector/inventory",
              device_count: 2,
              role_counts: { pe: 2 },
              collector_status_counts: { ok: 2 },
              capability_summary_counts: { partially_supported: 2 },
            },
          ],
          comparison_to_previous: {
            current_snapshot_id: "inv-a",
            previous_snapshot_id: "inv-b",
            current_persisted_at: "2025-01-01T00:00:00Z",
            previous_persisted_at: "2024-12-31T00:00:00Z",
            current_observed_at: null,
            previous_observed_at: null,
            current_sync_status: "live_normalized_feed",
            previous_sync_status: "live_normalized_feed",
            current_data_status: "live",
            previous_data_status: "live",
            current_device_count: 2,
            previous_device_count: 2,
            device_count_delta: 0,
            added_device_count: 0,
            removed_device_count: 0,
            changed_device_count: 0,
            change_preview: [],
            notes: [],
          },
        },
      }),
    );
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesData()));

    const html = renderToStaticMarkup(<OverviewView />);

    expect(html).toContain("Inventory history");
    expect(html).toContain("2 snapshots");
    expect(html).toContain("comparison ready");
    expect(html).toContain("Latest-versus-previous comparison is available");
  });

  it("does not show a partial-failure banner while remaining slices are still loading", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatusData()));
    useDevicesQuery.mockReturnValue(createQueryState(null, { isLoading: true }));
    useTopologyQuery.mockReturnValue(createQueryState(null, { isLoading: true }));
    usePoliciesQuery.mockReturnValue(createQueryState(null, { isLoading: true }));
    useCapabilitiesQuery.mockReturnValue(createQueryState(null, { isLoading: true }));

    const html = renderToStaticMarkup(<OverviewView />);

    expect(html).not.toContain("Overview is currently partial");
    expect(html).toContain("Platform status");
    expect(html).toContain("Device inventory");
    expect(html).toContain("Loading");
  });

  it("surfaces bounded recent change intelligence with explicit non-claims", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatusData()));
    useDevicesQuery.mockReturnValue(createQueryState(null));
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesData()));

    const html = renderToStaticMarkup(<OverviewView />);

    expect(html).toContain("Recent change (bounded)");
    expect(html).toContain("not a validation verdict");
    expect(html).toContain("validation, drift detection, safe-to-change");
    expect(html).toContain("Workflow history");
    expect(html).toContain("Audit history");
    expect(html).toContain("domains with present evidence");
    expect(html).toContain("Open Devices");
    expect(html).toContain("Open Topology");
    expect(html).toContain("Open Policies");
    expect(html).toContain("Open Workflow history");
    expect(html).toContain("Open Audit history");
    expect(html).toContain("evidence may still be absent");
    expect(html).toContain("honest absence on those pages stays explicit");
  });

  it("shows a loading placeholder for recent change intelligence until data arrives", () => {
    useRecentChangeSummaryQuery.mockReturnValue(createQueryState(null, { isLoading: true }));
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatusData()));
    useDevicesQuery.mockReturnValue(createQueryState(null));
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));
    useCapabilitiesQuery.mockReturnValue(createQueryState(createCapabilitiesData()));

    const html = renderToStaticMarkup(<OverviewView />);

    expect(html).toContain("Loading cross-domain persisted evidence summary");
  });
});
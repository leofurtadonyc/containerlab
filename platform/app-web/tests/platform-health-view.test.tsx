import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type {
  DevicesListResponse,
  PlatformReadPathStatus,
  PlatformStatusResponse,
  PoliciesListResponse,
} from "../src/api/contracts";
import { PlatformHealthView } from "../src/features/platform-health/view";

const { usePlatformStatusQuery, usePoliciesQuery, useDevicesQuery } = vi.hoisted(() => ({
  usePlatformStatusQuery: vi.fn(),
  usePoliciesQuery: vi.fn(),
  useDevicesQuery: vi.fn(),
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

vi.mock("../src/features/policies/api", () => ({
  usePoliciesQuery,
}));

vi.mock("../src/features/devices/api", () => ({
  useDevicesQuery,
}));

function createQueryState<T>(data: T | null) {
  return {
    data,
    error: null,
    isLoading: false,
    reload: vi.fn(async () => undefined),
  };
}

function readPath(
  modelFamily: PlatformReadPathStatus["model_family"],
  overrides: Partial<PlatformReadPathStatus> = {},
): PlatformReadPathStatus {
  const base: PlatformReadPathStatus = {
    model_family: modelFamily,
    observation_state: "ok",
    configured_target_count: 4,
    observed_target_count: 4,
    collection_success_count: 4,
    collection_partial_count: 0,
    collection_failure_count: 0,
    oldest_observed_at: "2025-01-01T00:00:00Z",
    newest_observed_at: "2025-01-01T00:05:00Z",
    policy_capable_target_count: modelFamily === "policy" ? 4 : null,
    detail_ready_target_count: modelFamily === "policy" ? 4 : null,
    inference_posture: null,
    endpoint_pairing_posture: null,
    collection_posture: null,
    node_participation_posture: null,
    paired_link_count: null,
    single_sided_link_count: null,
    linked_node_count: null,
    isolated_node_count: null,
    degraded_scope_summary: "No degraded scope.",
    summary: `${modelFamily} read path ok.`,
    notes: [],
  };

  if (modelFamily === "topology") {
    base.inference_posture = "inferred";
    base.endpoint_pairing_posture = "paired";
    base.collection_posture = "ok";
    base.node_participation_posture = "fully_linked";
    base.paired_link_count = 2;
    base.single_sided_link_count = 0;
    base.linked_node_count = 4;
    base.isolated_node_count = 0;
  }

  return { ...base, ...overrides };
}

function createPlatformStatus(overrides: Partial<PlatformStatusResponse> = {}): PlatformStatusResponse {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    status: "ok",
    topology_name: "platform",
    summary: "Platform is healthy.",
    recovery: {
      baseline_posture: "preserved_same_workspace_baseline",
      read_side_posture: "live_recollection_ready",
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
        role: "backend_api",
        lifecycle_state: "declared",
        observation_state: "ok",
        observation_source: "self",
        observation_summary: "Healthy",
        observed_capabilities: [],
        notes: [],
      },
    ],
    read_paths: [readPath("inventory"), readPath("topology"), readPath("policy")],
    ...overrides,
  };
}

function createDevicesData(): DevicesListResponse {
  return {
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
      summary: "Devices summary.",
      notes: [],
    },
    summary: "Devices summary.",
    served_persisted_at: null,
    count: 0,
    items: [],
    comparison_to_latest_persisted: {
      status: "unavailable",
      summary: "No comparison.",
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
    history: {
      status: "unavailable",
      summary: "No inventory history yet.",
      recent_snapshots: [],
      comparison_to_previous: null,
    },
  };
}

function createPoliciesData(): PoliciesListResponse {
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
    detail_source_readiness: {
      posture: "ready",
      no_policies_observed_target_count: 0,
      detail_unavailable_target_count: 0,
      partial_detail_target_count: 0,
    },
    empty_reason: "none",
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
    items: [],
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

describe("PlatformHealthView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDevicesQuery.mockReturnValue(createQueryState(createDevicesData()));
  });

  it("surfaces same-workspace recovery summary card and trust cue when recovery contract is present", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatus()));
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));

    const html = renderToStaticMarkup(<PlatformHealthView />);

    expect(html).toContain("Same-Workspace Recovery");
    expect(html).toContain("Preserved same-workspace baseline");
    expect(html).toContain("Live recollection ready");
    expect(html).toContain("Preserved baseline and fresh live recollection are not the same thing");
    expect(html).toContain("Recovery posture");
    expect(html).toContain("Same-workspace persisted baseline is present");
    expect(html).toContain("see Overview for richer recovery cues");
  });

  it("surfaces new baseline and degraded read-side posture in recovery trust cue", () => {
    usePlatformStatusQuery.mockReturnValue(
      createQueryState(
        createPlatformStatus({
          recovery: {
            baseline_posture: "new_baseline",
            read_side_posture: "degraded_without_persisted_baseline",
            summary: "Current runtime is on a new baseline.",
            persisted_artifacts: {
              inventory_snapshot: false,
              topology_snapshot: false,
              policy_snapshot: false,
              sync_history: false,
              readiness_snapshot: false,
            },
            notes: [],
          },
        }),
      ),
    );
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));

    const html = renderToStaticMarkup(<PlatformHealthView />);

    expect(html).toContain("New baseline");
    expect(html).toContain("Degraded without persisted baseline");
  });

  it("surfaces bounded policy-history trust cue when policies expose persisted snapshots", () => {
    const policies = createPoliciesData();
    policies.history = {
      status: "comparison_ready",
      summary: "History available.",
      recent_snapshots: [
        {
          snapshot_id: "policy-snap-a",
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
          detail_record_count: 2,
        },
      ],
      comparison_to_previous: null,
    };

    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatus()));
    usePoliciesQuery.mockReturnValue(createQueryState(policies));

    const html = renderToStaticMarkup(<PlatformHealthView />);

    expect(html).toContain("Policy history");
    expect(html).toContain("Persisted snapshots");
    expect(html).toContain("comparison ready");
    expect(html).toContain("not drift analysis");
    expect(html).toContain("validation verdicts");
  });

  it("surfaces bounded inventory-history trust cue from the supporting Devices API", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatus()));
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));

    const html = renderToStaticMarkup(<PlatformHealthView />);

    expect(html).toContain("Inventory history");
    expect(html).toContain("No snapshots");
    expect(html).toContain("unavailable");
    expect(html).toContain("Read-side evidence");
  });

  it("shows unavailable inventory history when the Devices query fails", () => {
    usePlatformStatusQuery.mockReturnValue(createQueryState(createPlatformStatus()));
    usePoliciesQuery.mockReturnValue(createQueryState(createPoliciesData()));
    useDevicesQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("devices failed", 0, "network_error"),
      isLoading: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PlatformHealthView />);

    expect(html).toContain("Inventory history");
    expect(html).toContain("Unavailable");
    expect(html).toContain("could not load the supporting Devices response");
  });
});

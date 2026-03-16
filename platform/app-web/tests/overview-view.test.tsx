import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import { OverviewView } from "../src/features/overview/view";

const {
  usePlatformStatusQuery,
  useDevicesQuery,
  useTopologyQuery,
  usePoliciesQuery,
  useCapabilitiesQuery,
} = vi.hoisted(() => ({
  usePlatformStatusQuery: vi.fn(),
  useDevicesQuery: vi.fn(),
  useTopologyQuery: vi.fn(),
  usePoliciesQuery: vi.fn(),
  useCapabilitiesQuery: vi.fn(),
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

function createQueryState<T>(data: T | null, overrides: Partial<{ error: ApiClientError | null; isLoading: boolean; isRefreshing: boolean }> = {}) {
  return {
    data,
    error: overrides.error ?? null,
    isLoading: overrides.isLoading ?? false,
    isRefreshing: overrides.isRefreshing ?? false,
    reload: vi.fn(),
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
        paired_link_count: 2,
        single_sided_link_count: 1,
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
    coverage_summary: {
      inference_posture: "inferred",
      endpoint_pairing_posture: "partially_paired",
      collection_posture: "degraded",
      paired_link_count: 2,
      single_sided_link_count: 1,
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
    empty_reason: "none",
    count: 1,
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
      current_record_count: 0,
      persisted_record_count: 0,
      record_count_delta: 0,
      added_record_count: 0,
      removed_record_count: 0,
      changed_record_count: 0,
      notes: [],
    },
  };
}

function createCapabilitiesData() {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    data_status: "live",
    summary: "Capabilities summary.",
    count: 1,
    readiness_snapshot_id: "readiness-1",
    readiness_persisted_at: "2025-01-01T00:00:00Z",
    dry_run_readiness: [
      {
        name: "Inventory",
        readiness: "ready",
        support_state: "supported",
        reason: "ok",
        notes: [],
        identifier: null,
      },
    ],
    items: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("overview view", () => {
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
    expect(html).toContain("Policies Trust Cues");
    expect(html).toContain("Devices Trust Cues");
    expect(html).toContain("Inventory trust cues are temporarily unavailable");
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
});
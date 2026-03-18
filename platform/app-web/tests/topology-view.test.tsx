import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TopologyView } from "../src/features/topology/view";

const { useTopologyQuery, usePoliciesQuery } = vi.hoisted(() => ({
  useTopologyQuery: vi.fn(),
  usePoliciesQuery: vi.fn(),
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

function createQueryState<T>(data: T | null) {
  return {
    data,
    error: null,
    isLoading: false,
    reload: vi.fn(async () => undefined),
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
      summary: "Topology summary.",
      notes: [],
    },
    summary: "Topology summary.",
    served_persisted_at: null,
    comparison_to_latest_persisted: {
      status: "live_vs_latest_persisted_ready",
      summary: "Comparison ready.",
      comparison_snapshot_id: "topology-snapshot-latest",
      comparison_persisted_at: "2025-01-01T00:00:00Z",
      current_observed_at: "2025-01-01T00:00:00Z",
      current_node_count: 2,
      persisted_node_count: 1,
      current_link_count: 1,
      persisted_link_count: 1,
      node_count_delta: 1,
      link_count_delta: 0,
      added_node_count: 1,
      removed_node_count: 0,
      changed_node_count: 0,
      added_link_count: 0,
      removed_link_count: 0,
      changed_link_count: 1,
      notes: [],
    },
    history: {
      status: "comparison_ready",
      summary:
        "Recent persisted normalized topology snapshots are available for bounded current-versus-previous comparison.",
      recent_snapshots: [
        {
          snapshot_id: "topology-snapshot-current",
          persisted_at: "2025-01-01T00:00:00Z",
          observed_at: "2025-01-01T00:00:00Z",
          topology_name: "Platform Observed Topology",
          sync_source: "persisted_topology_snapshot",
          sync_status: "degraded",
          completeness: "partial",
          node_count: 1,
          link_count: 1,
          node_state_counts: { up: 1 },
          link_state_counts: { degraded: 1 },
        },
        {
          snapshot_id: "topology-snapshot-older",
          persisted_at: "2024-12-31T23:30:00Z",
          observed_at: "2024-12-31T23:29:00Z",
          topology_name: "Platform Observed Topology",
          sync_source: "persisted_topology_snapshot",
          sync_status: "ok",
          completeness: "partial",
          node_count: 2,
          link_count: 1,
          node_state_counts: { up: 2 },
          link_state_counts: { up: 1 },
        },
      ],
      comparison_to_previous: {
        current_snapshot_id: "topology-snapshot-current",
        previous_snapshot_id: "topology-snapshot-older",
        current_persisted_at: "2025-01-01T00:00:00Z",
        previous_persisted_at: "2024-12-31T23:30:00Z",
        current_node_count: 1,
        previous_node_count: 2,
        current_link_count: 1,
        previous_link_count: 1,
        node_count_delta: -1,
        link_count_delta: 0,
        added_node_count: 0,
        removed_node_count: 1,
        changed_node_count: 0,
        added_link_count: 0,
        removed_link_count: 0,
        changed_link_count: 1,
        notes: ["Bounded topology history note."],
      },
    },
    coverage_summary: {
      inference_posture: "inferred",
      endpoint_pairing_posture: "paired",
      collection_posture: "ok",
      node_participation_posture: "fully_linked",
      paired_link_count: 1,
      single_sided_link_count: 0,
      linked_node_count: 2,
      isolated_node_count: 0,
      summary: "Paired link evidence is available.",
    },
    topology: {
      topology_id: "platform-observed-topology",
      topology_name: "Platform Observed Topology",
      nodes: [
        {
          node_id: "PE1",
          display_name: "PE1",
          role: "pe",
          current_posture: "current",
          state: "up",
          last_recorded_state: "up",
          source: "gnmi",
          device_id: "PE1",
          attributes: { vendor: "nokia", loopback_ipv4: "100.65.255.11" },
        },
        {
          node_id: "P1",
          display_name: "P1",
          role: "p",
          current_posture: "current",
          state: "up",
          last_recorded_state: "up",
          source: "gnmi",
          device_id: "P1",
          attributes: { vendor: "nokia", loopback_ipv4: "100.65.255.1" },
        },
      ],
      links: [
        {
          link_id: "PE1--P1",
          source_node_id: "PE1",
          target_node_id: "P1",
          current_posture: "current",
          state: "up",
          last_recorded_state: "up",
          source: "gnmi",
          endpoint_pairing_state: "paired",
          endpoint_evidence_count: 2,
          attributes: {
            knowledge_state: "partial",
            inference_method: "interface_name_and_oper_state",
          },
        },
      ],
      sync_source: "gnmi_collector_topology_interface_inference",
      sync_status: "ok",
      completeness: "partial",
      observed_at: "2025-01-01T00:00:00Z",
      notes: [],
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("topology view", () => {
  it("renders persisted topology history and recent snapshot anchors", () => {
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<TopologyView />);

    expect(html).toContain("Persisted History And Comparison");
    expect(html).toContain("Recent Persisted Snapshots");
    expect(html).toContain("topology-snapshot-current");
    expect(html).toContain("topology-snapshot-older");
    expect(html).toContain("Bounded topology history note.");
  });
});
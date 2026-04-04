import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TopologyView } from "../src/features/topology/view";

const { useTopologyQuery, usePoliciesQuery, useTopologyRelatedPoliciesQuery, useTopologyRiskSummaryQuery } =
  vi.hoisted(() => ({
  useTopologyQuery: vi.fn(),
  usePoliciesQuery: vi.fn(),
  useTopologyRiskSummaryQuery: vi.fn(),
  useTopologyRelatedPoliciesQuery: vi.fn((objectId: string | null) => ({
    data: {
      metadata: {
        service: "app-api",
        version: "test",
        phase: "phase_2_read_only_foundation",
        generated_at: "2025-01-01T00:00:00Z",
      },
      object_kind: objectId?.includes("--") ? ("link" as const) : ("node" as const),
      object_id: objectId ?? "",
      derivation_summary: "Test derivation for related policies.",
      global_caveats: [],
      items: [],
    },
    error: null,
    isLoading: false,
    isRefreshing: false,
    reload: vi.fn(async () => undefined),
  })),
}));

vi.mock("../src/features/topology/api", async () => {
  const actual = await vi.importActual<typeof import("../src/features/topology/api")>(
    "../src/features/topology/api",
  );

  return {
    ...actual,
    useTopologyQuery,
    useTopologyRelatedPoliciesQuery,
    useTopologyRiskSummaryQuery,
    useTopologyObjectDossierQuery: vi.fn(() => ({
      data: null,
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    })),
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
    isRefreshing: false,
    reload: vi.fn(async () => undefined),
  };
}

function createTopologyRiskSummaryData() {
  return {
    metadata: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "topology_risk_summary_v1" as const,
    ranking_basis: "test basis",
    safety_framing: {
      contract_id: "topology_risk_summary_v1",
      authority_posture: "interpretation_support_only" as const,
      explicit_non_claims: ["not_failure_probability"] as const,
      phase: "phase_2_read_only_foundation" as const,
      summary_disclaimer: "Test disclaimer.",
    },
    assembly_confidence: "medium" as const,
    ranked_objects: [],
    total_objects: 0,
    freshness: {
      assembly_generated_at: "2025-01-01T00:00:01Z",
      policy_inventory_observed_at: null,
      topology_snapshot_observed_at: null,
      policy_inventory_empty_reason: null,
      policy_serving_mode_echo: "live",
    },
    caveats: [],
    missing_evidence_notes: [],
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
          inference_posture: "inferred",
          endpoint_pairing_posture: "paired",
          collection_posture: "degraded",
          node_participation_posture: "fully_linked",
          paired_link_count: 1,
          single_sided_link_count: 0,
          linked_node_count: 1,
          isolated_node_count: 0,
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
          inference_posture: "inferred",
          endpoint_pairing_posture: "partially_paired",
          collection_posture: "ok",
          node_participation_posture: "partially_isolated",
          paired_link_count: 1,
          single_sided_link_count: 0,
          linked_node_count: 2,
          isolated_node_count: 0,
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
        current_inference_posture: "inferred",
        previous_inference_posture: "inferred",
        current_endpoint_pairing_posture: "paired",
        previous_endpoint_pairing_posture: "partially_paired",
        current_collection_posture: "degraded",
        previous_collection_posture: "ok",
        current_node_participation_posture: "fully_linked",
        previous_node_participation_posture: "partially_isolated",
        current_paired_link_count: 1,
        previous_paired_link_count: 1,
        current_single_sided_link_count: 0,
        previous_single_sided_link_count: 0,
        current_linked_node_count: 1,
        previous_linked_node_count: 2,
        current_isolated_node_count: 0,
        previous_isolated_node_count: 0,
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
          physical_adjacency_posture: "suppressed_or_unknown",
          physical_adjacency: {
            posture: "suppressed_or_unknown",
            lldp_observation_count: 0,
            lldp_bidirectional: false,
            local_interfaces: [],
            remote_systems: [],
            remote_ports: [],
            correlation_notes: [],
          },
          attributes: {
            knowledge_state: "partial",
            inference_method: "interface_name_and_oper_state",
          },
        },
      ],
      sync_source: "gnmi_collector_topology_interface_and_lldp",
      sync_status: "ok",
      completeness: "partial",
      observed_at: "2025-01-01T00:00:00Z",
      notes: [],
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useTopologyRiskSummaryQuery.mockReturnValue(createQueryState(createTopologyRiskSummaryData()));
});

describe("topology view", () => {
  it("renders controller and deeper-truth panel entry points", () => {
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<TopologyView />);

    expect(html).toContain("Controller southbound session truth");
    expect(html).toContain("Load controller evidence");
    expect(html).toContain("Deeper topology truth");
    expect(html).toContain("Load merged truth");
  });

  it("renders persisted topology history and recent snapshot anchors", () => {
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<TopologyView />);

    expect(html).toContain("Persisted History And Comparison");
    expect(html).toContain("Recent Persisted Snapshots");
    expect(html).toContain("topology-snapshot-current");
    expect(html).toContain("topology-snapshot-older");
    expect(html).toContain("Bounded topology history note.");
    expect(html).toContain("Topology attention (risk summary v1)");
  });

  it("renders persisted coverage posture in history and comparison", () => {
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<TopologyView />);

    expect(html).toContain("trust cues, not validation verdicts");
    expect(html).toContain("snapshot-derived trust cues only");
    expect(html).toContain("Current inference posture");
    expect(html).toContain("Previous inference posture");
    expect(html).toContain("Current collection posture");
    expect(html).toContain("Previous collection posture");
    expect(html).toContain("Current node participation");
    expect(html).toContain("Previous node participation");
    expect(html).toContain("Current endpoint pairing");
    expect(html).toContain("Previous endpoint pairing");
    expect(html).toContain("Current / previous paired links");
    expect(html).toContain("Current / previous single-sided links");
    expect(html).toContain("Current / previous linked nodes");
    expect(html).toContain("Current / previous isolated nodes");
    expect(html).toContain("• inference");
    expect(html).toContain("• collection");
    expect(html).toContain("• participation");
  });

  it("renders honest empty history footnotes without coverage rows", () => {
    const base = createTopologyData();
    const emptyHistory = {
      ...base,
      history: {
        status: "unavailable" as const,
        summary: "No persisted topology history yet.",
        recent_snapshots: [],
        comparison_to_previous: null,
      },
    };
    useTopologyQuery.mockReturnValue(createQueryState(emptyHistory));
    usePoliciesQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<TopologyView />);

    expect(html).toContain("No persisted normalized topology snapshots");
    expect(html).toContain("Bounded comparison is only available once at least two");
  });

  it("renders related policies drill-through panels for node and link selections", () => {
    useTopologyQuery.mockReturnValue(createQueryState(createTopologyData()));
    usePoliciesQuery.mockReturnValue(createQueryState(null));

    const html = renderToStaticMarkup(<TopologyView />);

    expect(html).toContain("Related policies");
    expect(html).toContain("Test derivation for related policies.");
    expect(html).toContain("Open dossier");
  });
});
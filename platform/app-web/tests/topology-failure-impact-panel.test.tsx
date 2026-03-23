import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import { TopologyFailureImpactPanel } from "../src/features/topology/topology-failure-impact-panel";

const { useTopologyFailureImpactQuery } = vi.hoisted(() => ({
  useTopologyFailureImpactQuery: vi.fn(),
}));

vi.mock("../src/features/topology/api", () => ({
  useTopologyFailureImpactQuery,
}));

const basePayload = {
  metadata: {
    service: "app-api" as const,
    version: "test",
    phase: "phase_2_read_only_foundation" as const,
    generated_at: "2025-01-01T00:00:00Z",
  },
  contract_id: "failure_impact_v1" as const,
  safety_framing: {
    contract_id: "failure_impact_v1",
    authority_posture: "interpretation_support_only" as const,
    explicit_non_claims: ["not_graph_simulation"] as const,
    phase: "phase_2_read_only_foundation" as const,
    summary_disclaimer: "Test disclaimer: not blast radius.",
  },
  subject: { kind: "node" as const, object_id: "PE1" },
  rollup_counts: {
    related_policies_total: 2,
    degraded_related_policies_total: 1,
    non_degraded_related_policies_total: 1,
    related_policies_path_analysis_supported_total: 2,
  },
  degraded_posture_breakdown: { ok: 1, degraded: 1, unknown: 0 },
  freshness: {
    assembly_generated_at: "2025-01-01T00:00:01Z",
    policy_inventory_observed_at: "2025-01-01T00:00:00Z",
    topology_snapshot_observed_at: "2025-01-01T00:00:00Z",
    policy_inventory_empty_reason: null,
    policy_serving_mode_echo: "live",
  },
  caveats: ["Caveat one."],
  missing_evidence_notes: [] as string[],
};

describe("TopologyFailureImpactPanel", () => {
  it("prompts when no topology object is selected", () => {
    useTopologyFailureImpactQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyFailureImpactPanel objectId={null} objectKind={null} />,
    );

    expect(html).toContain("Failure impact (v1)");
    expect(html).toContain("Select a node or link");
    expect(html).toContain("blast-radius simulation");
  });

  it("shows loading on first fetch", () => {
    useTopologyFailureImpactQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyFailureImpactPanel objectId="PE1" objectKind="node" />,
    );

    expect(html).toContain("Loading failure-impact rollups");
  });

  it("shows a safe 404 explanation", () => {
    useTopologyFailureImpactQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("not found", 404, "http_error"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyFailureImpactPanel objectId="missing" objectKind="node" />,
    );

    expect(html).toContain("No topology object for this id");
  });

  it("shows empty related-policy honesty and framing copy", () => {
    useTopologyFailureImpactQuery.mockReturnValue({
      data: {
        ...basePayload,
        rollup_counts: {
          related_policies_total: 0,
          degraded_related_policies_total: 0,
          non_degraded_related_policies_total: 0,
          related_policies_path_analysis_supported_total: 0,
        },
        degraded_posture_breakdown: { ok: 0, degraded: 0, unknown: 0 },
        caveats: ["Topology partial."],
        missing_evidence_notes: [],
      },
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyFailureImpactPanel objectId="PE1" objectKind="node" />,
    );

    expect(html).toContain("No related policies matched");
    expect(html).toContain("read-only");
    expect(html).toContain("blast-radius simulation");
  });

  it("highlights partial path-analysis support", () => {
    useTopologyFailureImpactQuery.mockReturnValue({
      data: {
        ...basePayload,
        rollup_counts: {
          related_policies_total: 2,
          degraded_related_policies_total: 0,
          non_degraded_related_policies_total: 2,
          related_policies_path_analysis_supported_total: 1,
        },
        missing_evidence_notes: [
          "Path-analysis interpretation is limited for one or more related policies.",
        ],
      },
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyFailureImpactPanel objectId="PE1" objectKind="node" />,
    );

    expect(html).toContain("Partial path-analysis support");
    expect(html).toContain("Path-analysis interpretation is limited");
  });

  it("renders rollup counts and investigation link affordance", () => {
    useTopologyFailureImpactQuery.mockReturnValue({
      data: basePayload,
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyFailureImpactPanel objectId="PE1" objectKind="node" />,
    );

    expect(html).toContain("Related policies (distinct)");
    expect(html).toContain(">2<");
    expect(html).toContain("Open dossier workspace");
    expect(html).toContain("Open in Investigation");
    expect(html).toContain("failure_impact_entry=v1");
    expect(html).toContain("Policies filtered to degraded (v1)");
    expect(html).toContain("Not Graph Simulation");
  });
});

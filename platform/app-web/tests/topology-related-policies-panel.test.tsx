import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { PoliciesListResponse } from "../src/api/contracts";
import { ApiClientError } from "../src/api/client";
import { TopologyRelatedPoliciesPanel } from "../src/features/topology/topology-related-policies-panel";

const { useTopologyRelatedPoliciesQuery } = vi.hoisted(() => ({
  useTopologyRelatedPoliciesQuery: vi.fn(),
}));

vi.mock("../src/features/topology/api", () => ({
  useTopologyRelatedPoliciesQuery,
}));

const policiesListForEnrichment = {
  items: [
    {
      policy_id: "PE1:static_local:192.0.2.11:100",
      policy_name: "pol-a",
      policy_type: "static_local" as const,
      headend: "PE1",
      endpoint: "PE2",
      color: 100,
      source_target: "t1",
      source_target_role: null,
      candidate_paths: [],
      current_posture: "current" as const,
      intent_state: "declared" as const,
      observed_state: "active" as const,
      last_recorded_observed_state: "active" as const,
      support_state: "partially_supported" as const,
      health_state: "healthy" as const,
      last_recorded_health_state: "healthy" as const,
      source: "gnmi",
      notes: [],
      degraded_policy_v1: {
        contract_id: "degraded_policy_v1",
        posture: "degraded",
        reason_codes: ["partial_or_unsupported_support_posture"],
        confidence: "medium",
        summary: "Degraded-policy v1: test fixture.",
        explicit_non_claims: ["not_sla_or_availability_guarantee"],
      },
    },
  ],
} as unknown as PoliciesListResponse;

describe("TopologyRelatedPoliciesPanel", () => {
  it("shows loading while the first payload loads", () => {
    useTopologyRelatedPoliciesQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyRelatedPoliciesPanel objectId="PE1" objectKind="node" policiesList={null} />,
    );

    expect(html).toContain("Related policies");
    expect(html).toContain("Loading policies related to this topology object");
  });

  it("shows a bounded 404 explanation when the topology object is absent", () => {
    useTopologyRelatedPoliciesQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("not found", 404, "http_error"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyRelatedPoliciesPanel objectId="missing" objectKind="node" policiesList={null} />,
    );

    expect(html).toContain("No topology object for this id");
  });

  it("renders empty and partial caveats when the API returns no matches", () => {
    useTopologyRelatedPoliciesQuery.mockReturnValue({
      data: {
        metadata: {
          service: "app-api",
          version: "test",
          phase: "phase_2_read_only_foundation",
          generated_at: "2025-01-01T00:00:00Z",
        },
        object_kind: "node",
        object_id: "PE1",
        derivation_summary: "Derived via string equality on headend, endpoint, source_target.",
        global_caveats: ["Topology is partial; matches may be incomplete."],
        items: [],
      },
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyRelatedPoliciesPanel objectId="PE1" objectKind="node" policiesList={null} />,
    );

    expect(html).toContain("No policy inventory records matched");
    expect(html).toContain("Topology is partial");
  });

  it("renders policy rows with health enrichment and open-details control", () => {
    useTopologyRelatedPoliciesQuery.mockReturnValue({
      data: {
        metadata: {
          service: "app-api",
          version: "test",
          phase: "phase_2_read_only_foundation",
          generated_at: "2025-01-01T00:00:00Z",
        },
        object_kind: "node",
        object_id: "PE1",
        derivation_summary: "Derived via string equality.",
        global_caveats: [],
        items: [
          {
            policy_id: "PE1:static_local:192.0.2.11:100",
            policy_name: "pol-a",
            policy_type: "static_local",
            relationship_kind: "policy_field_matches_node_identifier",
            matched_field: "headend",
            matched_policy_value: "PE1",
            matched_topology_identifier: "PE1",
            anchor_topology_node_id: "PE1",
            evidence_source: "test",
            caveats: ["Per-reference caveat."],
          },
        ],
      },
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyRelatedPoliciesPanel objectId="PE1" objectKind="node" policiesList={policiesListForEnrichment} />,
    );

    expect(html).toContain("pol-a");
    expect(html).toContain("Open policy details");
    expect(html).toContain("Per-reference caveat.");
  });
});

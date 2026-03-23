import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import { PolicyTopologyImpactPanel } from "../src/features/policies/policy-topology-impact-panel";

const { usePolicyTopologyImpactQuery } = vi.hoisted(() => ({
  usePolicyTopologyImpactQuery: vi.fn(),
}));

vi.mock("../src/features/policies/api", () => ({
  usePolicyTopologyImpactQuery,
}));

describe("PolicyTopologyImpactPanel", () => {
  it("shows loading on first fetch", () => {
    usePolicyTopologyImpactQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyTopologyImpactPanel policyId="p1" />);

    expect(html).toContain("Topology impact");
    expect(html).toContain("Loading bounded topology relationship context");
  });

  it("shows 404 when policy is missing from inventory", () => {
    usePolicyTopologyImpactQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("missing", 404, "http_error"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyTopologyImpactPanel policyId="missing" />);

    expect(html).toContain("Policy not in current inventory");
  });

  it("renders rows with open-in-topology when data succeeds", () => {
    usePolicyTopologyImpactQuery.mockReturnValue({
      data: {
        metadata: {
          service: "app-api",
          version: "test",
          phase: "phase_2_read_only_foundation",
          generated_at: "2025-01-01T00:00:00Z",
        },
        policy_id: "PE1:static_local:192.0.2.11:100",
        policy_name: "pol-a",
        derivation_summary: "Lists topology nodes where strings align.",
        global_caveats: [],
        items: [
          {
            topology_object_kind: "node",
            topology_object_id: "PE1",
            relationship_kind: "policy_field_matches_node_identifier",
            matched_field: "headend",
            matched_policy_value: "PE1",
            matched_topology_identifier: "PE1",
            anchor_topology_node_id: "PE1",
            evidence_source: "test",
            caveats: [],
          },
        ],
      },
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <PolicyTopologyImpactPanel policyId="PE1:static_local:192.0.2.11:100" />,
    );

    expect(html).toContain("Direct identifier match (node)");
    expect(html).toContain("Open in topology");
    expect(html).toContain("node");
    expect(html).toContain("PE1");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import { ServiceImpactWorkspaceProduct } from "../src/features/service-impact-workspace/service-impact-workspace-product";

const { useServiceImpactWorkspaceQuery } = vi.hoisted(() => ({
  useServiceImpactWorkspaceQuery: vi.fn(),
}));

vi.mock("../src/features/service-impact-workspace/api", () => ({
  useServiceImpactWorkspaceQuery,
}));

const degradedOk = {
  contract_id: "degraded_policy_v1" as const,
  posture: "ok" as const,
  reason_codes: [] as [],
  confidence: "medium" as const,
  summary: "ok",
  explicit_non_claims: [],
};

const explorerDetail = {
  service: "app-api" as const,
  version: "0.1.0",
  phase: "phase_2_read_only_foundation" as const,
  generated_at: "2025-01-01T00:00:00Z",
  contract_id: "service_explorer_v1" as const,
  service_id: "color:100",
  kind: "color" as const,
  policy_inventory: {
    data_status: "live" as const,
    serving_mode: "live_collector" as const,
    empty_reason: "none" as const,
    summary: "inv",
    observed_policy_count: 1,
    policy_items_total: 1,
  },
  members: [
    {
      policy_id: "p1",
      policy_name: "n",
      policy_type: "static_local" as const,
      headend: "PE1",
      endpoint: "10.0.0.1",
      color: 100,
      source_target: "PE1",
      degraded_policy_v1: degradedOk,
    },
  ],
  members_total: 1,
  degraded_service: { posture: "ok" as const, reason_codes: [], reason_codes_truncated: false },
  topology_evidence_status: "present" as const,
  topology_links: [
    {
      policy_id: "p1",
      node_id: "N1",
      display_name: "N1",
      matched_on: "node_id" as const,
      matched_from_policy_field: "headend" as const,
    },
  ],
  topology_caveats: [],
  caveats: [],
  recommended_pivots: [],
};

const failureImpactMinimal = {
  metadata: {
    service: "app-api" as const,
    version: "0.1.0",
    phase: "phase_2_read_only_foundation" as const,
    generated_at: "2025-01-01T00:00:00Z",
  },
  contract_id: "failure_impact_v1" as const,
  safety_framing: {
    contract_id: "failure_impact_v1",
    authority_posture: "interpretation_support_only" as const,
    explicit_non_claims: ["not_graph_simulation"],
    phase: "phase_2_read_only_foundation" as const,
    summary_disclaimer: "Fi disclaimer.",
  },
  subject: { kind: "node" as const, object_id: "N1" },
  rollup_counts: {
    related_policies_total: 2,
    degraded_related_policies_total: 0,
    non_degraded_related_policies_total: 2,
    related_policies_path_analysis_supported_total: 1,
  },
  degraded_posture_breakdown: { ok: 2, degraded: 0, unknown: 0 },
  freshness: {
    assembly_generated_at: "2025-01-01T00:00:00Z",
    policy_inventory_observed_at: null,
    topology_snapshot_observed_at: null,
    policy_inventory_empty_reason: null,
    policy_serving_mode_echo: "live",
  },
  caveats: [],
  missing_evidence_notes: [],
};

const workspacePayload = {
  metadata: {
    service: "app-api" as const,
    version: "test",
    phase: "phase_2_read_only_foundation" as const,
    generated_at: "2025-01-01T00:00:00Z",
  },
  contract_id: "service_impact_workspace_v1" as const,
  service_id: "color:100",
  service_explorer: explorerDetail,
  failure_impact: failureImpactMinimal,
  failure_impact_topology_anchor: "N1",
  failure_impact_assembly_note: null,
  merged_caveats: ["Caveat line one."],
  merged_evidence_gap_notes: [],
  explicit_non_claims: [
    "service_impact_workspace_v1 is a composed read-only workspace; it is not blast-radius or dependency truth.",
  ],
  source_contract_ids: ["service_explorer_v1", "failure_impact_v1"],
  recommended_api_pivots: ["GET /api/v1/maintenance-preview?node_id=N1 — maintenance preview (planning context only)."],
};

describe("ServiceImpactWorkspaceProduct", () => {
  it("renders service_impact_workspace_v1 marker and key sections when data is present", () => {
    useServiceImpactWorkspaceQuery.mockReturnValue({
      data: workspacePayload,
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<ServiceImpactWorkspaceProduct serviceId="color:100" />);
    expect(html).toContain("service_impact_workspace_v1");
    expect(html).toContain("no dossier explainability");
    expect(html).toContain("color:100");
    expect(html).toContain("Related policies (members)");
    expect(html).toContain("Failure-impact relationship");
    expect(html).toContain("GET /api/v1/maintenance-preview");
  });

  it("renders sparse copy when failure-impact is absent and a gap note is present", () => {
    useServiceImpactWorkspaceQuery.mockReturnValue({
      data: {
        ...workspacePayload,
        failure_impact: null,
        failure_impact_topology_anchor: null,
        failure_impact_assembly_note: "No topology_links; failure-impact rollup omitted.",
        merged_evidence_gap_notes: ["No topology_links; failure-impact rollup omitted."],
        source_contract_ids: ["service_explorer_v1"],
        service_explorer: {
          ...explorerDetail,
          topology_links: [],
          topology_evidence_status: "partial",
        },
      },
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<ServiceImpactWorkspaceProduct serviceId="color:100" />);
    expect(html).toContain("No embedded failure_impact");
    expect(html).toContain("topology_links");
  });

  it("renders 404-style copy when service is missing", () => {
    useServiceImpactWorkspaceQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("missing", 404, "not_found"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<ServiceImpactWorkspaceProduct serviceId="nope:1" />);
    expect(html).toContain("not available");
  });
});

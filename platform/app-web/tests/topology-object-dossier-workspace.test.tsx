import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import { TopologyObjectDossierWorkspace } from "../src/features/topology/topology-object-dossier-workspace";

const { useTopologyObjectDossierQuery } = vi.hoisted(() => ({
  useTopologyObjectDossierQuery: vi.fn(),
}));

vi.mock("../src/features/topology/api", () => ({
  useTopologyObjectDossierQuery,
}));

const dossierPayload = {
  metadata: {
    service: "app-api" as const,
    version: "test",
    phase: "phase_2_read_only_foundation" as const,
    generated_at: "2025-01-01T00:00:00Z",
  },
  contract_id: "topology_object_dossier_v1" as const,
  object_identity: {
    object_kind: "node" as const,
    object_id: "PE1",
    display_label: "PE1",
    identity_detail_lines: ["role=pe"],
  },
  topology_posture_summary_lines: ["Coverage summary line."],
  failure_impact: {
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
      summary_disclaimer: "Not blast radius.",
    },
    subject: { kind: "node" as const, object_id: "PE1" },
    rollup_counts: {
      related_policies_total: 1,
      degraded_related_policies_total: 0,
      non_degraded_related_policies_total: 1,
      related_policies_path_analysis_supported_total: 1,
    },
    degraded_posture_breakdown: { ok: 1, degraded: 0, unknown: 0 },
    freshness: {
      assembly_generated_at: "2025-01-01T00:00:01Z",
      policy_inventory_observed_at: null,
      topology_snapshot_observed_at: null,
      policy_inventory_empty_reason: null,
      policy_serving_mode_echo: "live",
    },
    caveats: [],
    missing_evidence_notes: [],
  },
  risk_attention: {
    ranking_basis: "lexicographic",
    row: {
      rank_index: 1,
      object_kind: "node" as const,
      object_id: "PE1",
      ranking_inputs: {
        degraded_related_count: 0,
        unknown_related_count: 0,
        related_policy_breadth: 1,
        ok_related_count: 1,
      },
      degraded_posture_breakdown: { ok: 1, degraded: 0, unknown: 0 },
    },
    risk_row_gap_note: null,
  },
  related_policies: {
    metadata: {
      service: "app-api" as const,
      version: "test",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    object_kind: "node" as const,
    object_id: "PE1",
    derivation_summary: "String equality.",
    global_caveats: [],
    items: [],
  },
  degraded_related_policies_preview: [],
  navigation_targets: {
    investigation_shell_params: { inv_from: "topology" },
    situation_room_shell_params: { view: "situation-room" },
    topology_shell_params: { view: "topology" },
    related_policy_ids_for_policies_view: [],
  },
  freshness: {
    dossier_assembled_at: "2025-01-01T00:00:02Z",
    policy_inventory_observed_at: null,
    topology_snapshot_observed_at: null,
    policy_inventory_empty_reason: null,
    policy_serving_mode_echo: "live",
    topology_risk_summary_assembly_generated_at: "2025-01-01T00:00:01Z",
  },
  merged_caveats: ["Merged caveat line."],
};

describe("TopologyObjectDossierWorkspace", () => {
  it("prompts when no topology object is selected", () => {
    useTopologyObjectDossierQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyObjectDossierWorkspace objectId={null} objectKind={null} />,
    );

    expect(html).toContain("Object dossier workspace");
    expect(html).toContain("Select a");
  });

  it("shows loading on first fetch", () => {
    useTopologyObjectDossierQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyObjectDossierWorkspace objectId="PE1" objectKind="node" />,
    );

    expect(html).toContain("Loading topology object dossier");
  });

  it("shows a safe 404 explanation", () => {
    useTopologyObjectDossierQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("not found", 404, "http_error"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyObjectDossierWorkspace objectId="missing" objectKind="node" />,
    );

    expect(html).toContain("No topology object for this selection");
  });

  it("renders contract id and merged caveats when loaded", () => {
    useTopologyObjectDossierQuery.mockReturnValue({
      data: dossierPayload,
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(
      <TopologyObjectDossierWorkspace objectId="PE1" objectKind="node" />,
    );

    expect(html).toContain("topology_object_dossier_v1");
    expect(html).toContain("Merged caveat line.");
    expect(html).toContain("Failure impact (nested)");
    expect(html).toContain("data-testid=\"evidence-export-actions\"");
    expect(html).toContain("Export JSON");
  });
});

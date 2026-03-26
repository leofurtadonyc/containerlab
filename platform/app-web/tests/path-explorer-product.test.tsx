import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import { PathExplorerProduct } from "../src/features/path-explorer/path-explorer-product";

const { usePathExplorerWorkspaceQuery } = vi.hoisted(() => ({
  usePathExplorerWorkspaceQuery: vi.fn(),
}));

vi.mock("../src/features/path-explorer/api", () => ({
  usePathExplorerWorkspaceQuery,
}));

const pathAnalysisMinimal = {
  metadata: {
    service: "app-api" as const,
    version: "test",
    phase: "phase_2_read_only_foundation" as const,
    generated_at: "2025-01-01T00:00:00Z",
  },
  safety_framing: {
    contract_id: "path_analysis_phase2_v1",
    authority_posture: "interpretation_support_only" as const,
    explicit_non_claims: ["not_dataplane_forwarding_truth"] as const,
    phase: "phase_2_read_only_foundation" as const,
    summary_disclaimer: "Bounded hints only.",
  },
  subject: {
    anchor_kind: "policy" as const,
    policy_id: "p1",
    policy_name: "Pol",
    policy_type: "static_local" as const,
    color: 1,
    headend: "h",
    endpoint: "e",
    source_target: "s",
  },
  intended_path_hints: [],
  observed_path_hints: [],
  candidate_path_summaries: [],
  evidence_sources: [],
  freshness: {
    assembly_generated_at: "2025-01-01T00:00:00Z",
    policy_snapshot_observed_at: null,
    topology_snapshot_observed_at: null,
    inventory_snapshot_observed_at: null,
    serving_mode_echo: "live" as const,
  },
  truth_alignment: { posture: "uncertain" as const, summary: "Coarse alignment." },
  caveats: [],
};

const policyRecordMinimal = {
  policy_id: "p1",
  policy_name: "Pol",
  policy_type: "static_local" as const,
  headend: "h",
  endpoint: "e",
  color: 1,
  source_target: "s",
  source_target_role: null,
  candidate_paths: [],
  current_posture: "current" as const,
  intent_state: "declared" as const,
  observed_state: "active" as const,
  last_recorded_observed_state: "active" as const,
  support_state: "supported" as const,
  health_state: "healthy" as const,
  last_recorded_health_state: "healthy" as const,
  source: "gnmi",
  notes: [],
  degraded_policy_v1: {
    contract_id: "degraded_policy_v1" as const,
    posture: "ok" as const,
    reason_codes: [] as const,
    confidence: "medium" as const,
    summary: "Ok",
    explicit_non_claims: [],
  },
};

const explainabilityMinimal = {
  metadata: {
    service: "app-api" as const,
    version: "test",
    phase: "phase_2_read_only_foundation" as const,
    generated_at: "2025-01-01T00:00:00Z",
  },
  contract_id: "policy_explainability_workspace_v1" as const,
  policy_id: "p1",
  policy_record: policyRecordMinimal,
  path_analysis: pathAnalysisMinimal,
  topology_impact: {
    metadata: {
      service: "app-api" as const,
      version: "test",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    policy_id: "p1",
    policy_name: "Pol",
    derivation_summary: "d",
    global_caveats: [],
    items: [],
  },
  evidence_timeline: {
    metadata: {
      service: "app-api" as const,
      version: "test",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    policy_id: "p1",
    policy_name: "Pol",
    entries: [],
    missing_evidence_notes: [],
    safety_framing: {
      contract_id: "policy_evidence_timeline_v1",
      authority_posture: "interpretation_support_only" as const,
      explicit_non_claims: [],
      phase: "phase_2_read_only_foundation" as const,
      summary_disclaimer: "",
    },
  },
  evidence_delta: {
    metadata: {
      service: "app-api" as const,
      version: "test",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    policy_id: "p1",
    policy_name: "Pol",
    comparison_status: "delta_ready" as const,
    summary: "",
  },
  path_explanation_summary: "Summary line.",
  candidate_path_rollups: [],
  unknown_candidate_posture: "full" as const,
  sparse_signals: {
    topology_naming_alignment_unknown: true,
    evidence_timeline_sparse: true,
    evidence_delta_not_ready: false,
  },
  navigation_targets: {
    investigation_shell_params: {},
    situation_room_shell_params: {},
    policies_view_params: {},
    topology_object_hints: [],
    service_explorer_shell_params: { service_id: "policy:p1" },
    delta_digest_shell_params: {},
  },
  freshness: {
    policy_inventory_observed_at: null,
    topology_snapshot_observed_at: null,
    inventory_snapshot_observed_at: null,
    assembly_generated_at: "2025-01-01T00:00:00Z",
    row_current_posture: "current" as const,
  },
  merged_caveats: ["Topology naming alignment unknown for this policy."],
};

const workspacePayload = {
  metadata: {
    service: "app-api" as const,
    version: "test",
    phase: "phase_2_read_only_foundation" as const,
    generated_at: "2025-01-01T00:00:00Z",
  },
  contract_id: "path_explorer_v1" as const,
  policy_id: "p1",
  path_analysis: pathAnalysisMinimal,
  explainability: explainabilityMinimal,
  policy_dossier: null,
  merged_caveats: ["Topology naming alignment unknown for this policy."],
  explicit_non_claims: [
    "not_dataplane_forwarding_truth",
    "path_explorer_v1 is a composed read-only workspace; it is not dataplane proof or a TE solver.",
  ],
  source_contract_ids: ["path_analysis_phase2_v1", "policy_explainability_workspace_v1"],
};

describe("PathExplorerProduct", () => {
  it("renders path_explorer_v1 marker and sparse cues when data is present", () => {
    usePathExplorerWorkspaceQuery.mockReturnValue({
      data: workspacePayload,
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<PathExplorerProduct policyId="p1" />);
    expect(html).toContain("path_explorer_v1");
    expect(html).toContain("Policy dossier");
    expect(html).toContain("Explainability");
    expect(html).toContain("Topology naming alignment unknown");
    expect(html).toContain("Unknown-candidate posture");
  });

  it("renders 404-style copy when policy is missing", () => {
    usePathExplorerWorkspaceQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("missing", 404, "not_found"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<PathExplorerProduct policyId="nope" />);
    expect(html).toContain("Path Explorer not available");
  });
});

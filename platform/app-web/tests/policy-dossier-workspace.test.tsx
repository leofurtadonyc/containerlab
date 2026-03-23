import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import { PolicyDossierWorkspace } from "../src/features/policies/policy-dossier-workspace";

const { usePolicyDossierQuery } = vi.hoisted(() => ({
  usePolicyDossierQuery: vi.fn(),
}));

vi.mock("../src/features/policies/api", () => ({
  usePolicyDossierQuery,
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

const dossierPayload = {
  metadata: {
    service: "app-api" as const,
    version: "test",
    phase: "phase_2_read_only_foundation" as const,
    generated_at: "2025-01-01T00:00:00Z",
  },
  contract_id: "policy_dossier_v1" as const,
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
    derivation_summary: "Pivot rows.",
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
    contract_id: "policy_evidence_timeline_v1",
    safety_framing: {
      contract_id: "policy_evidence_timeline_v1",
      authority_posture: "interpretation_support_only" as const,
      explicit_non_claims: [],
      phase: "phase_2_read_only_foundation" as const,
      summary_disclaimer: "Ordering only.",
    },
    policy_id: "p1",
    scope_summary: "Current window.",
    entries: [],
    missing_evidence_notes: [],
  },
  evidence_delta: {
    metadata: {
      service: "app-api" as const,
      version: "test",
      phase: "phase_2_read_only_foundation" as const,
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "policy_evidence_delta_v1",
    safety_framing: {
      contract_id: "policy_evidence_delta_v1",
      authority_posture: "interpretation_support_only" as const,
      explicit_non_claims: [],
      phase: "phase_2_read_only_foundation" as const,
      summary_disclaimer: "Delta hints.",
    },
    policy_id: "p1",
    comparison_status: "no_comparable_anchor" as const,
    scope_summary: "No anchor.",
    current_anchor: {
      anchor_role: "current_inventory" as const,
      observed_at: null,
      row_posture: "current",
      serving_mode: "live",
    },
    previous_anchor: null,
    delta_items: [],
    caveats: [],
  },
  navigation_targets: {
    investigation_shell_params: { inv_from: "policies" },
    situation_room_shell_params: { view: "situation-room" },
    policies_view_params: { view: "policies" },
    topology_object_hints: [],
  },
  freshness: {
    dossier_assembled_at: "2025-01-01T00:00:02Z",
    policy_inventory_observed_at: null,
    topology_snapshot_observed_at: null,
    policy_inventory_empty_reason: null,
    policy_serving_mode_echo: "live",
  },
  merged_caveats: ["Merged line."],
};

describe("PolicyDossierWorkspace", () => {
  it("prompts when no policy is selected", () => {
    usePolicyDossierQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyDossierWorkspace policyId={null} />);

    expect(html).toContain("Policy dossier workspace");
    expect(html).toContain("Select a");
  });

  it("shows loading on first fetch", () => {
    usePolicyDossierQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyDossierWorkspace policyId="p1" />);

    expect(html).toContain("Loading policy dossier");
  });

  it("shows a safe 404 explanation", () => {
    usePolicyDossierQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("not found", 404, "http_error"),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyDossierWorkspace policyId="missing" />);

    expect(html).toContain("No policy record for this selection");
  });

  it("renders contract id and merged caveats when loaded", () => {
    usePolicyDossierQuery.mockReturnValue({
      data: dossierPayload,
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<PolicyDossierWorkspace policyId="p1" />);

    expect(html).toContain("policy_dossier_v1");
    expect(html).toContain("Merged line.");
    expect(html).toContain("Path analysis (nested)");
    expect(html).toContain("data-testid=\"evidence-export-actions\"");
    expect(html).toContain("Export JSON");
    expect(html).toContain("Export Markdown");
  });
});

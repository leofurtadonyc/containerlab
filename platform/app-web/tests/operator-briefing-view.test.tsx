import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OperatorBriefingWorkspaceResponse } from "../src/api/contracts";
import { OperatorBriefingView } from "../src/features/operator-briefing/view";

const { useOperatorBriefingQuery } = vi.hoisted(() => ({
  useOperatorBriefingQuery: vi.fn(),
}));

vi.mock("../src/features/operator-briefing/api", () => ({
  useOperatorBriefingQuery,
}));

function minimalBriefing(): OperatorBriefingWorkspaceResponse {
  return {
    metadata: {
      service: "app-api",
      version: "0.1.0",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "operator_briefing_workspace_v1",
    safety: {
      contract_id: "operator_briefing_workspace_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: ["not_change_approval"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Briefing safety disclaimer for tests.",
    },
    sync_runs_limit_applied: 20,
    briefing_context: {
      sync_runs_limit_requested: 20,
      policy_id: null,
      topology_object: null,
      topology_object_kind: null,
      inv_from_client_hint: null,
      global_search_q_client_hint: null,
    },
    delta_digest: null,
    delta_digest_error: null,
    policy_dossier: null,
    policy_dossier_note: "not_requested",
    topology_object_dossier: null,
    topology_object_dossier_note: "not_requested",
    situation_pack: null,
    situation_pack_error: null,
    investigation_workspace: null,
    investigation_workspace_error: null,
    section_meta: [],
    merged_caveats: [],
    recommended_pivots: ["Live shell: view=delta-digest"],
  };
}

describe("OperatorBriefingView", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the product hero when data loads", () => {
    useOperatorBriefingQuery.mockReturnValue({
      data: minimalBriefing(),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });

    const html = renderToStaticMarkup(<OperatorBriefingView />);
    expect(html).toContain("Operator briefing workspace");
    expect(html).toContain("operator_briefing_workspace_v1");
    expect(html).toContain("Live pivots");
    expect(html).toContain("Briefing archive (bundle)");
    expect(html).toContain("briefing_export_bundle_v1");
    expect(html).toContain("Per-surface exports");
    expect(html).toContain("briefing-bundle-export-actions");
    expect(html).toContain("maintenance_evidence_workspace_v1");
    expect(html).toContain("included in briefing bundle members");
  });
});

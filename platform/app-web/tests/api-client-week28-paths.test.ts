import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClient } from "../src/api/client";

describe("ApiClient week 28 bounded paths", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("getPolicyEvidenceDelta encodes policy id in the URL path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          metadata: {
            service: "app-api",
            version: "0.1.0",
            phase: "phase_2_read_only_foundation",
            generated_at: "2025-01-01T00:00:00Z",
          },
          contract_id: "policy_evidence_delta_v1",
          safety_framing: {
            contract_id: "policy_evidence_delta_v1",
            authority_posture: "interpretation_support_only",
            explicit_non_claims: ["not_drift_truth"],
            phase: "phase_2_read_only_foundation",
            summary_disclaimer: "x",
          },
          policy_id: "PE1:static:1:100",
          comparison_status: "no_comparable_anchor",
          scope_summary: "y",
          current_anchor: {
            anchor_role: "current_inventory",
            observed_at: null,
            row_posture: "current",
            serving_mode: "live",
          },
          previous_anchor: null,
          delta_items: [],
          caveats: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getPolicyEvidenceDelta("PE1:static:1:100");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/policies/PE1%3Astatic%3A1%3A100/evidence-delta");
  });

  it("getTopologyRiskSummary uses the week 28 risk-summary route", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          metadata: {
            service: "app-api",
            version: "0.1.0",
            phase: "phase_2_read_only_foundation",
            generated_at: "2025-01-01T00:00:00Z",
          },
          contract_id: "topology_risk_summary_v1",
          ranking_basis: "test",
          safety_framing: {
            contract_id: "topology_risk_summary_v1",
            authority_posture: "interpretation_support_only",
            explicit_non_claims: [],
            phase: "phase_2_read_only_foundation",
            summary_disclaimer: "d",
          },
          assembly_confidence: "medium",
          ranked_objects: [],
          total_objects: 0,
          freshness: {
            assembly_generated_at: "2025-01-01T00:00:00Z",
            policy_serving_mode_echo: "live",
          },
          caveats: [],
          missing_evidence_notes: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getTopologyRiskSummary();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe("http://api/api/v1/topology/risk-summary");
  });

  it("getTopologyObjectDossier encodes object id in the URL path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          metadata: {
            service: "app-api",
            version: "0.1.0",
            phase: "phase_2_read_only_foundation",
            generated_at: "2025-01-01T00:00:00Z",
          },
          contract_id: "topology_object_dossier_v1",
          object_identity: {
            object_kind: "node",
            object_id: "PE1",
            display_label: "PE1",
            identity_detail_lines: [],
          },
          topology_posture_summary_lines: [],
          failure_impact: {
            metadata: {
              service: "app-api",
              version: "0.1.0",
              phase: "phase_2_read_only_foundation",
              generated_at: "2025-01-01T00:00:00Z",
            },
            contract_id: "failure_impact_v1",
            safety_framing: {
              contract_id: "failure_impact_v1",
              authority_posture: "interpretation_support_only",
              explicit_non_claims: ["not_graph_simulation"],
              phase: "phase_2_read_only_foundation",
              summary_disclaimer: "x",
            },
            subject: { kind: "node", object_id: "PE1" },
            rollup_counts: {
              related_policies_total: 0,
              degraded_related_policies_total: 0,
              non_degraded_related_policies_total: 0,
              related_policies_path_analysis_supported_total: 0,
            },
            degraded_posture_breakdown: { ok: 0, degraded: 0, unknown: 0 },
            freshness: {
              assembly_generated_at: "2025-01-01T00:00:00Z",
              policy_serving_mode_echo: "live",
            },
            caveats: [],
            missing_evidence_notes: [],
          },
          risk_attention: {
            ranking_basis: "test",
            row: null,
            risk_row_gap_note: null,
          },
          related_policies: {
            metadata: {
              service: "app-api",
              version: "0.1.0",
              phase: "phase_2_read_only_foundation",
              generated_at: "2025-01-01T00:00:00Z",
            },
            object_kind: "node",
            object_id: "PE1",
            derivation_summary: "d",
            global_caveats: [],
            items: [],
          },
          degraded_related_policies_preview: [],
          navigation_targets: {
            investigation_shell_params: {},
            situation_room_shell_params: {},
            topology_shell_params: {},
            related_policy_ids_for_policies_view: [],
          },
          freshness: {
            dossier_assembled_at: "2025-01-01T00:00:00Z",
            policy_serving_mode_echo: "live",
            topology_risk_summary_assembly_generated_at: null,
          },
          merged_caveats: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getTopologyObjectDossier("A:B");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/topology/objects/A%3AB/dossier");
  });
});

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

  it("getPolicyDossier encodes policy id in the URL path", async () => {
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
          contract_id: "policy_dossier_v1",
          policy_record: {
            policy_id: "PE1:static:1:100",
            policy_name: "P",
            policy_type: "static_local",
            headend: "h",
            endpoint: "e",
            color: 1,
            source_target: "s",
            source_target_role: null,
            candidate_paths: [],
            current_posture: "current",
            intent_state: "declared",
            observed_state: "active",
            last_recorded_observed_state: "active",
            support_state: "supported",
            health_state: "healthy",
            last_recorded_health_state: "healthy",
            source: "gnmi",
            notes: [],
            degraded_policy_v1: {
              contract_id: "degraded_policy_v1",
              posture: "ok",
              reason_codes: [],
              confidence: "medium",
              summary: "x",
              explicit_non_claims: [],
            },
          },
          path_analysis: {
            metadata: {
              service: "app-api",
              version: "0.1.0",
              phase: "phase_2_read_only_foundation",
              generated_at: "2025-01-01T00:00:00Z",
            },
            safety_framing: {
              contract_id: "path_analysis_phase2_v1",
              authority_posture: "interpretation_support_only",
              explicit_non_claims: [],
              phase: "phase_2_read_only_foundation",
              summary_disclaimer: "x",
            },
            subject: {
              anchor_kind: "policy",
              policy_id: "PE1:static:1:100",
              policy_name: "P",
              policy_type: "static_local",
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
              serving_mode_echo: "live",
            },
            truth_alignment: { posture: "uncertain", summary: "y" },
            caveats: [],
          },
          topology_impact: {
            metadata: {
              service: "app-api",
              version: "0.1.0",
              phase: "phase_2_read_only_foundation",
              generated_at: "2025-01-01T00:00:00Z",
            },
            policy_id: "PE1:static:1:100",
            policy_name: "P",
            derivation_summary: "d",
            global_caveats: [],
            items: [],
          },
          evidence_timeline: {
            metadata: {
              service: "app-api",
              version: "0.1.0",
              phase: "phase_2_read_only_foundation",
              generated_at: "2025-01-01T00:00:00Z",
            },
            contract_id: "policy_evidence_timeline_v1",
            safety_framing: {
              contract_id: "policy_evidence_timeline_v1",
              authority_posture: "interpretation_support_only",
              explicit_non_claims: [],
              phase: "phase_2_read_only_foundation",
              summary_disclaimer: "x",
            },
            policy_id: "PE1:static:1:100",
            scope_summary: "s",
            entries: [],
            missing_evidence_notes: [],
          },
          evidence_delta: {
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
              explicit_non_claims: [],
              phase: "phase_2_read_only_foundation",
              summary_disclaimer: "x",
            },
            policy_id: "PE1:static:1:100",
            comparison_status: "no_comparable_anchor",
            scope_summary: "s",
            current_anchor: {
              anchor_role: "current_inventory",
              observed_at: null,
              row_posture: "current",
              serving_mode: "live",
            },
            previous_anchor: null,
            delta_items: [],
            caveats: [],
          },
          navigation_targets: {
            investigation_shell_params: {},
            situation_room_shell_params: {},
            policies_view_params: {},
            topology_object_hints: [],
          },
          freshness: {
            dossier_assembled_at: "2025-01-01T00:00:00Z",
            policy_serving_mode_echo: "live",
          },
          merged_caveats: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getPolicyDossier("PE1:static:1:100");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/policies/PE1%3Astatic%3A1%3A100/dossier");
  });

  it("getDeltaDigest uses the delta-digest route and bounds sync_runs_limit", async () => {
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
          contract_id: "cross_domain_delta_digest_v1",
          safety: {
            contract_id: "cross_domain_delta_digest_v1",
            authority_posture: "interpretation_support_only",
            explicit_non_claims: [],
            phase: "phase_2_read_only_foundation",
            summary_disclaimer: "x",
          },
          sync_runs_limit_applied: 100,
          completeness_posture: "best_effort_visible_signals_only",
          recent_change_summary: {
            metadata: {
              service: "app-api",
              version: "0.1.0",
              phase: "phase_2_read_only_foundation",
              generated_at: "2025-01-01T00:00:00Z",
            },
            safety: {
              contract_id: "change_intelligence_phase2_v1",
              authority_posture: "evidence_aggregated_non_authoritative",
              explicit_non_claims: [],
              phase: "phase_2_read_only_foundation",
              summary_disclaimer: "y",
            },
            window_semantics: "backend_defined_bounded_lookback",
            completeness_posture: "bounded_partial",
            sync_runs_limit_applied: 100,
            readiness_snapshots_considered: 0,
            domains: [],
            aggregation_notes: [],
          },
          source_provenance: [],
          sections: [],
          digest_framing_notes: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getDeltaDigest(500);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe("http://api/api/v1/delta-digest?sync_runs_limit=100");
  });

  it("getOperatorSearch encodes the query parameter", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          service: "app-api",
          version: "0.1.0",
          phase: "phase_2_read_only_foundation",
          generated_at: "2025-01-01T00:00:00Z",
          contract_id: "operator_search_pivot_v1",
          q: "PE1:static",
          result_state: "no_hits",
          guidance: "No matches.",
          groups: [],
          explicit_non_claims: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getOperatorSearch("PE1:static");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/operator-search?q=");
    expect(url).toContain("PE1%3Astatic");
  });
});

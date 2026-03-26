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

  it("getTopologyObjectEvidenceTimeline encodes object id in the URL path", async () => {
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
          contract_id: "topology_object_evidence_timeline_v1",
          safety_framing: {
            contract_id: "topology_object_evidence_timeline_v1",
            authority_posture: "interpretation_support_only",
            explicit_non_claims: ["not_unified_forensic_chronology"],
            phase: "phase_2_read_only_foundation",
            summary_disclaimer: "d",
          },
          object_kind: "node",
          object_id: "A:B",
          scope_summary: "s",
          entries: [],
          missing_evidence_notes: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getTopologyObjectEvidenceTimeline("A:B");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/topology/objects/A%3AB/evidence-timeline");
  });

  it("getTopologyObjectEvidenceDelta encodes object id in the URL path", async () => {
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
          contract_id: "topology_object_evidence_delta_v1",
          safety_framing: {
            contract_id: "topology_object_evidence_delta_v1",
            authority_posture: "interpretation_support_only",
            explicit_non_claims: ["not_topology_drift_truth"],
            phase: "phase_2_read_only_foundation",
            summary_disclaimer: "d",
          },
          object_kind: "node",
          object_id: "A:B",
          comparison_status: "no_comparable_anchor",
          scope_summary: "s",
          current_anchor: {
            anchor_role: "current_topology_object_assembly",
            generated_at: "2025-01-01T00:00:00Z",
            reference: "GET /api/v1/topology/objects/{object_id}/related-policies",
          },
          previous_anchor: null,
          delta_items: [],
          member_policy_delta_pointers: [],
          caveats: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getTopologyObjectEvidenceDelta("A:B");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/topology/objects/A%3AB/evidence-delta");
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

  it("getPolicyExplainability encodes policy id in the URL path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "{}",
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getPolicyExplainability("PE1:static:1:100");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/policies/PE1%3Astatic%3A1%3A100/explainability");
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

  it("getEvidenceConsistencySummary uses evidence-consistency/summary and bounds sync_runs_limit", async () => {
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
          contract_id: "evidence_consistency_summary_v1",
          safety_framing: {
            contract_id: "evidence_consistency_summary_v1",
            authority_posture: "interpretation_support_only",
            explicit_non_claims: [],
            phase: "phase_2_read_only_foundation",
            summary_disclaimer: "x",
          },
          scope_summary: "s",
          sync_runs_limit_applied: 100,
          domain_freshness_echo: [],
          items: [],
          caveats: [],
          assembly_notes: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getEvidenceConsistencySummary(500);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe("http://api/api/v1/evidence-consistency/summary?sync_runs_limit=100");
  });

  it("getOperatorBriefing builds operator-briefing query string", async () => {
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
          contract_id: "operator_briefing_workspace_v1",
          safety: {
            contract_id: "operator_briefing_workspace_v1",
            authority_posture: "interpretation_support_only",
            explicit_non_claims: [],
            phase: "phase_2_read_only_foundation",
            summary_disclaimer: "x",
          },
          sync_runs_limit_applied: 5,
          briefing_context: {
            sync_runs_limit_requested: 5,
            policy_id: "P1",
            topology_object: null,
            topology_object_kind: null,
            inv_from_client_hint: "overview",
            global_search_q_client_hint: null,
          },
          delta_digest: null,
          delta_digest_error: null,
          policy_dossier: null,
          policy_dossier_note: null,
          topology_object_dossier: null,
          topology_object_dossier_note: null,
          situation_pack: null,
          situation_pack_error: null,
          investigation_workspace: null,
          investigation_workspace_error: null,
          section_meta: [],
          merged_caveats: [],
          recommended_pivots: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getOperatorBriefing({
      syncRunsLimit: 5,
      policyId: "P1",
      invFrom: "overview",
    });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/operator-briefing?");
    expect(url).toContain("sync_runs_limit=5");
    expect(url).toContain("policy_id=P1");
    expect(url).toContain("inv_from=overview");
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

  it("getServices uses optional limit query", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          service: "app-api",
          version: "0.1.0",
          phase: "phase_2_read_only_foundation",
          generated_at: "2025-01-01T00:00:00Z",
          contract_id: "service_explorer_v1",
          policy_inventory: {
            data_status: "live",
            serving_mode: "live_collector",
            empty_reason: "none",
            summary: "s",
            observed_policy_count: 0,
            policy_items_total: 0,
          },
          items: [],
          read_side_query: {
            limit_requested: 10,
            items_total: 0,
            items_returned: 0,
            history_recent_limit_requested: null,
            history_recent_limit_effective: null,
            history_recent_snapshots_returned: null,
            sync_runs_limit_requested: null,
            sync_runs_limit_effective: null,
            readiness_snapshot_history_limit_requested: null,
            readiness_snapshot_history_limit_effective: null,
            readiness_blocker_filter_requested: null,
          },
          caveats: [],
          recommended_pivots: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getServices(10);
    expect(fetchMock.mock.calls[0][0] as string).toBe("http://api/api/v1/services?limit=10");
  });

  it("getService encodes service_id in the path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          service: "app-api",
          version: "0.1.0",
          phase: "phase_2_read_only_foundation",
          generated_at: "2025-01-01T00:00:00Z",
          contract_id: "service_explorer_v1",
          service_id: "policy:a:b",
          kind: "policy",
          policy_inventory: {
            data_status: "live",
            serving_mode: "live_collector",
            empty_reason: "none",
            summary: "s",
            observed_policy_count: 1,
            policy_items_total: 1,
          },
          members: [],
          members_total: 0,
          degraded_service: {
            posture: "ok",
            reason_codes: [],
            reason_codes_truncated: false,
          },
          topology_evidence_status: "partial",
          topology_links: [],
          topology_caveats: [],
          caveats: [],
          recommended_pivots: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getService("policy:a:b");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/services/policy%3Aa%3Ab");
  });

  it("getServiceDossier encodes service_id and uses dossier path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          service: "app-api",
          version: "0.1.0",
          phase: "phase_2_read_only_foundation",
          generated_at: "2025-01-01T00:00:00Z",
          contract_id: "service_dossier_v1",
          safety_framing: {
            contract_id: "service_dossier_v1",
            authority_posture: "interpretation_support_only",
            explicit_non_claims: [],
            phase: "phase_2_read_only_foundation",
            summary_disclaimer: "s",
          },
          service_explorer_detail: {
            service: "app-api",
            version: "0.1.0",
            phase: "phase_2_read_only_foundation",
            generated_at: "2025-01-01T00:00:00Z",
            contract_id: "service_explorer_v1",
            service_id: "policy:a:b",
            kind: "policy",
            policy_inventory: {
              data_status: "live",
              serving_mode: "live_collector",
              empty_reason: "none",
              summary: "s",
              observed_policy_count: 0,
              policy_items_total: 0,
            },
            members: [],
            members_total: 0,
            degraded_service: { posture: "ok", reason_codes: [], reason_codes_truncated: false },
            topology_evidence_status: "partial",
            topology_links: [],
            topology_caveats: [],
            caveats: [],
            recommended_pivots: [],
          },
          default_member_policy_id: "",
          member_posture_counts: {},
          policy_explainability: null,
          explainability_unavailable_note: null,
          maintenance_preview: null,
          maintenance_preview_subject_node_id: null,
          maintenance_unavailable_note: null,
          merged_caveats: [],
          missing_evidence_notes: [],
          source_contract_ids: ["service_dossier_v1"],
          recommended_api_pivots: [],
          investigation_pivot_hint: "hint",
          sparse_dossier: false,
          sparse_reasons: [],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getServiceDossier("policy:a:b");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/services/policy%3Aa%3Ab/dossier");
  });

  it("getMaintenancePreview builds query for node_id and preview_context", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ contract_id: "maintenance_preview_v1" }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "http://api" });
    await client.getMaintenancePreview({ nodeId: "PE1", previewContext: "planning_window" });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/maintenance-preview?");
    expect(url).toContain("node_id=PE1");
    expect(url).toContain("preview_context=planning_window");
  });
});

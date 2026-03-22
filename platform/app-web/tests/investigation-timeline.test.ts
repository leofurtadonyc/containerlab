import { describe, expect, it } from "vitest";

import type { InvestigationContextAssemblyResponse } from "../src/api/contracts";
import { buildInvestigationTimelineBeats } from "../src/lib/investigation-timeline";

function minimalAssembly(overrides: Partial<InvestigationContextAssemblyResponse> = {}): InvestigationContextAssemblyResponse {
  const base: InvestigationContextAssemblyResponse = {
    metadata: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2026-01-10T12:00:00Z",
    },
    safety: {
      contract_id: "investigation_workspace_phase2_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: [],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "s",
    },
    assembly_notes: [],
    recent_change: {
      metadata: {
        service: "app-api",
        version: "test",
        phase: "phase_2_read_only_foundation",
        generated_at: "2026-01-10T11:00:00Z",
      },
      safety: {
        contract_id: "change_intelligence_phase2_v1",
        authority_posture: "evidence_aggregated_non_authoritative",
        explicit_non_claims: [],
        phase: "phase_2_read_only_foundation",
        summary_disclaimer: "s",
      },
      window_semantics: "backend_defined_bounded_lookback",
      completeness_posture: "bounded_partial",
      sync_runs_limit_applied: 20,
      readiness_snapshots_considered: 0,
      domains: [],
      aggregation_notes: [],
    },
    platform_status: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2026-01-10T11:30:00Z",
      status: "ok",
      topology_name: "platform",
      summary: "p",
      recovery: {
        baseline_posture: "new_baseline",
        read_side_posture: "live_recollection_ready",
        summary: "r",
        persisted_artifacts: {
          inventory_snapshot: false,
          topology_snapshot: false,
          policy_snapshot: false,
          sync_history: false,
          readiness_snapshot: false,
        },
        notes: [],
      },
      components: [],
      read_paths: [],
    },
    capabilities: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2026-01-10T11:45:00Z",
      data_status: "bounded_matrix",
      summary: "c",
      count: 0,
      domain_counts: {},
      support_counts: {},
      implementation_counts: {},
      delivery_tier_counts: {},
      evidence_basis_counts: {},
      vendor_counts: {},
      vendor_posture_counts: {},
      workflow_readiness_counts: {},
      workflow_readiness_scope_counts: {},
      items: [],
    },
    next_inspection_framing: "Optional navigation prompts only.",
    next_inspection_suggestions: [],
  };
  return { ...base, ...overrides };
}

describe("buildInvestigationTimelineBeats", () => {
  it("orders nested response timestamps newest-first when assembly is latest", () => {
    const data = minimalAssembly();
    const beats = buildInvestigationTimelineBeats(data);
    expect(beats[0].id).toBe("assembly");
    expect(beats[0].timestampIso).toBe("2026-01-10T12:00:00Z");
  });

  it("includes read path newest observed and domain slice persisted anchors when present", () => {
    const base = minimalAssembly();
    const data = minimalAssembly({
      recent_change: {
        ...base.recent_change,
        domains: [
          {
            domain: "devices",
            signal_families: [],
            evidence_status: "present",
            headline: "h",
            detail_notes: [],
            latest_persisted_at: "2026-01-09T08:00:00Z",
          },
        ],
      },
      platform_status: {
        ...base.platform_status,
        read_paths: [
          {
            model_family: "inventory",
            observation_state: "ok",
            configured_target_count: 2,
            observed_target_count: 2,
            collection_success_count: 2,
            collection_partial_count: 0,
            collection_failure_count: 0,
            oldest_observed_at: "2026-01-10T10:00:00Z",
            newest_observed_at: "2026-01-10T11:50:00Z",
            policy_capable_target_count: null,
            detail_ready_target_count: null,
            inference_posture: null,
            endpoint_pairing_posture: null,
            collection_posture: null,
            node_participation_posture: null,
            paired_link_count: null,
            single_sided_link_count: null,
            linked_node_count: null,
            isolated_node_count: null,
            degraded_scope_summary: "ok",
            summary: "s",
            notes: [],
          },
        ],
      },
      capabilities: {
        ...base.capabilities,
        readiness_persisted_at: "2026-01-10T09:00:00Z",
      },
    });
    const beats = buildInvestigationTimelineBeats(data);
    const ids = new Set(beats.map((b) => b.id));
    expect(ids.has("readpath-newest-inventory")).toBe(true);
    expect(ids.has("domain-slice-devices")).toBe(true);
    expect(ids.has("readiness-persisted")).toBe(true);
  });
});

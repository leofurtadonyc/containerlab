import { describe, expect, it } from "vitest";

import { buildPolicyHistoryTrustCueRow } from "../src/lib/policy-history-trust";
import type { PoliciesListResponse } from "../src/api/contracts";

function basePolicies(overrides: Partial<PoliciesListResponse> = {}): PoliciesListResponse {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    data_status: "live",
    serving_mode: "live_collector",
    evidence_confidence: {
      source_posture: "live_observed",
      evidence_kind: "aggregate_only",
      confidence_posture: "bounded_partial",
      freshness_posture: "current",
      blocked_reason: "none",
      summary: "Policy summary.",
      notes: [],
    },
    summary: "Policies summary.",
    served_persisted_at: null,
    sync_source: "collector",
    sync_status: "ok",
    completeness: "partial",
    detail_mode: "counters_only",
    detail_source_readiness: {
      posture: "ready",
      no_policies_observed_target_count: 0,
      detail_unavailable_target_count: 0,
      partial_detail_target_count: 0,
    },
    empty_reason: "none",
    observed_at: "2025-01-01T00:00:00Z",
    observed_target_count: 4,
    policy_capable_target_count: 4,
    observed_target_role_counts: {},
    policy_capable_target_role_counts: {},
    observed_policy_count: 0,
    active_policy_count: 0,
    static_policy_count: 0,
    static_local_policy_count: 0,
    static_non_local_policy_count: 0,
    bgp_policy_count: 0,
    ttm_preference_count: 0,
    binding_sid_count: 0,
    srv6_binding_sid_count: 0,
    count: 0,
    notes: [],
    target_footprints: [],
    items: [],
    comparison_to_latest_persisted: {
      status: "unavailable",
      summary: "No comparison.",
      comparison_snapshot_id: null,
      comparison_persisted_at: null,
      current_observed_at: null,
      current_observed_policy_count: 0,
      persisted_observed_policy_count: 0,
      current_detail_record_count: 0,
      persisted_detail_record_count: 0,
      observed_policy_delta: 0,
      detail_record_delta: 0,
      added_policy_count: 0,
      removed_policy_count: 0,
      changed_policy_count: 0,
      change_preview: [],
      notes: [],
    },
    history: {
      status: "unavailable",
      summary: "No history.",
      recent_snapshots: [],
      comparison_to_previous: null,
    },
    ...overrides,
  };
}

describe("buildPolicyHistoryTrustCueRow", () => {
  it("returns loading when the policies query is still loading", () => {
    const row = buildPolicyHistoryTrustCueRow(undefined, true, false);
    expect(row.value).toBe("Loading");
    expect(row.note).toContain("still loading");
  });

  it("returns unavailable when the policies query failed or has no data", () => {
    expect(buildPolicyHistoryTrustCueRow(null, false, true).value).toBe("Unavailable");
    expect(buildPolicyHistoryTrustCueRow(undefined, false, false).value).toBe("Unavailable");
  });

  it("combines snapshot count, history status, and source-readiness posture", () => {
    const row = buildPolicyHistoryTrustCueRow(basePolicies(), false, false);
    expect(row.value).toBe("No snapshots • unavailable • ready");
    expect(row.note).toContain("current Policies response");
    expect(row.note).toContain("Live-empty targets");
  });

  it("prefers nested readiness from the latest persisted snapshot when present", () => {
    const row = buildPolicyHistoryTrustCueRow(
      basePolicies({
        history: {
          status: "comparison_ready",
          summary: "ok",
          recent_snapshots: [
            {
              snapshot_id: "p1",
              persisted_at: "2025-01-01T00:00:00Z",
              observed_at: null,
              data_status: "live",
              sync_source: "x",
              sync_status: "ok",
              completeness: "partial",
              detail_mode: "counters_only",
              empty_reason: "none",
              observed_policy_count: 1,
              active_policy_count: 1,
              detail_record_count: 0,
              detail_source_readiness: {
                posture: "no_policies_observed",
                no_policies_observed_target_count: 4,
                detail_unavailable_target_count: 0,
                partial_detail_target_count: 0,
              },
            },
          ],
          comparison_to_previous: null,
        },
      }),
      false,
      false,
    );
    expect(row.value).toContain("1 snapshot");
    expect(row.value).toContain("comparison ready");
    expect(row.value).toContain("no policies observed");
    expect(row.note).toContain("latest persisted snapshot");
  });

  it("mentions latest-versus-previous when comparison is available", () => {
    const row = buildPolicyHistoryTrustCueRow(
      basePolicies({
        history: {
          status: "comparison_ready",
          summary: "ok",
          recent_snapshots: [
            {
              snapshot_id: "a",
              persisted_at: "2025-01-01T00:00:00Z",
              observed_at: null,
              data_status: "live",
              sync_source: "x",
              sync_status: "ok",
              completeness: "partial",
              detail_mode: "counters_only",
              empty_reason: "none",
              observed_policy_count: 1,
              active_policy_count: 1,
              detail_record_count: 0,
            },
          ],
          comparison_to_previous: {
            current_snapshot_id: "a",
            previous_snapshot_id: "b",
            current_persisted_at: "2025-01-01T00:00:00Z",
            previous_persisted_at: "2024-12-31T00:00:00Z",
            current_observed_policy_count: 1,
            previous_observed_policy_count: 1,
            current_detail_record_count: 0,
            previous_detail_record_count: 0,
            observed_policy_delta: 0,
            detail_record_delta: 0,
            added_policy_count: 0,
            removed_policy_count: 0,
            changed_policy_count: 0,
            change_preview: [],
            notes: [],
          },
        },
      }),
      false,
      false,
    );
    expect(row.note).toContain("Latest-versus-previous comparison is available");
  });
});

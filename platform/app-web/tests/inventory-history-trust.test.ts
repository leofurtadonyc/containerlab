import { describe, expect, it } from "vitest";

import type { DevicesListResponse } from "../src/api/contracts";
import { buildInventoryHistoryTrustCueRow } from "../src/lib/inventory-history-trust";

function baseDevices(overrides: Partial<DevicesListResponse> = {}): DevicesListResponse {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    data_status: "live",
    serving_mode: "live_collector",
    evidence_confidence: {
      source_posture: "live_observed",
      evidence_kind: "direct_observed",
      confidence_posture: "strong_for_current_slice",
      freshness_posture: "current",
      blocked_reason: "none",
      summary: "s",
      notes: [],
    },
    summary: "s",
    served_persisted_at: null,
    count: 0,
    items: [],
    comparison_to_latest_persisted: {
      status: "unavailable",
      summary: "x",
      comparison_snapshot_id: null,
      comparison_persisted_at: null,
      current_device_count: 0,
      persisted_device_count: 0,
      device_count_delta: 0,
      added_device_count: 0,
      removed_device_count: 0,
      changed_device_count: 0,
      current_role_counts: {},
      persisted_role_counts: {},
      current_collector_status_counts: {},
      persisted_collector_status_counts: {},
      current_capability_summary_counts: {},
      persisted_capability_summary_counts: {},
      notes: [],
    },
    history: {
      status: "unavailable",
      summary: "x",
      recent_snapshots: [],
      comparison_to_previous: null,
    },
    ...overrides,
  };
}

describe("buildInventoryHistoryTrustCueRow", () => {
  it("returns loading state", () => {
    const row = buildInventoryHistoryTrustCueRow(null, true, false);
    expect(row.value).toBe("Loading");
  });

  it("returns unavailable when query failed", () => {
    const row = buildInventoryHistoryTrustCueRow(null, false, true);
    expect(row.value).toBe("Unavailable");
  });

  it("describes comparison-ready history with snapshot count", () => {
    const row = buildInventoryHistoryTrustCueRow(
      baseDevices({
        history: {
          status: "comparison_ready",
          summary: "ok",
          recent_snapshots: [
            {
              snapshot_id: "a",
              sync_run_id: "s1",
              persisted_at: "2025-01-01T00:00:00Z",
              observed_at: null,
              sync_source: "x",
              sync_status: "ok",
              data_status: "live",
              source_endpoint: "http://x",
              device_count: 1,
              role_counts: {},
              collector_status_counts: {},
              capability_summary_counts: {},
            },
            {
              snapshot_id: "b",
              sync_run_id: "s2",
              persisted_at: "2024-01-01T00:00:00Z",
              observed_at: null,
              sync_source: "x",
              sync_status: "ok",
              data_status: "live",
              source_endpoint: "http://x",
              device_count: 1,
              role_counts: {},
              collector_status_counts: {},
              capability_summary_counts: {},
            },
          ],
          comparison_to_previous: {
            current_snapshot_id: "a",
            previous_snapshot_id: "b",
            current_persisted_at: "2025-01-01T00:00:00Z",
            previous_persisted_at: "2024-01-01T00:00:00Z",
            current_observed_at: null,
            previous_observed_at: null,
            current_sync_status: "ok",
            previous_sync_status: "ok",
            current_data_status: "live",
            previous_data_status: "live",
            current_device_count: 1,
            previous_device_count: 1,
            device_count_delta: 0,
            added_device_count: 0,
            removed_device_count: 0,
            changed_device_count: 0,
            change_preview: [],
            notes: [],
          },
        },
      }),
      false,
      false,
    );
    expect(row.value).toContain("2 snapshots");
    expect(row.value).toContain("comparison ready");
    expect(row.note).toContain("Latest-versus-previous comparison is available");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DevicesView } from "../src/features/devices/view";

const { useDevicesQuery } = vi.hoisted(() => ({
  useDevicesQuery: vi.fn(),
}));

vi.mock("../src/features/devices/api", () => ({
  useDevicesQuery,
}));

function createQueryState<T>(data: T | null) {
  return {
    data,
    error: null,
    isLoading: false,
    reload: vi.fn(async () => undefined),
  };
}

function createDevicesData() {
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
      summary: "Inventory summary.",
      notes: [],
    },
    summary: "Inventory summary.",
    served_persisted_at: null,
    comparison_to_latest_persisted: {
      status: "live_vs_latest_persisted_ready",
      summary: "Comparison ready.",
      comparison_snapshot_id: "inventory-snapshot-latest",
      comparison_persisted_at: "2025-01-01T00:00:00Z",
      current_device_count: 2,
      persisted_device_count: 1,
      device_count_delta: 1,
      added_device_count: 1,
      removed_device_count: 0,
      changed_device_count: 1,
      current_role_counts: { p: 1, pe: 1 },
      persisted_role_counts: { pe: 1 },
      current_collector_status_counts: { ok: 2 },
      persisted_collector_status_counts: { degraded: 1 },
      current_capability_summary_counts: { partially_supported: 2 },
      persisted_capability_summary_counts: { unknown: 1 },
      notes: [],
    },
    history: {
      status: "comparison_ready",
      summary:
        "Recent persisted normalized inventory snapshots are available for bounded current-versus-previous comparison.",
      recent_snapshots: [
        {
          snapshot_id: "inventory-snapshot-current",
          persisted_at: "2025-01-01T00:00:00Z",
          observed_at: null,
          sync_source: "gnmi_collector_inventory",
          sync_status: "partial_live_feed",
          data_status: "degraded",
          device_count: 1,
          role_counts: { pe: 1 },
          collector_status_counts: { degraded: 1 },
          capability_summary_counts: { unknown: 1 },
        },
        {
          snapshot_id: "inventory-snapshot-older",
          persisted_at: "2024-12-31T23:30:00Z",
          observed_at: null,
          sync_source: "gnmi_collector_inventory",
          sync_status: "live_normalized_feed",
          data_status: "live",
          device_count: 2,
          role_counts: { p: 1, pe: 1 },
          collector_status_counts: { ok: 2 },
          capability_summary_counts: { partially_supported: 2 },
        },
      ],
      comparison_to_previous: {
        current_snapshot_id: "inventory-snapshot-current",
        previous_snapshot_id: "inventory-snapshot-older",
        current_persisted_at: "2025-01-01T00:00:00Z",
        previous_persisted_at: "2024-12-31T23:30:00Z",
        current_device_count: 1,
        previous_device_count: 2,
        device_count_delta: -1,
        added_device_count: 0,
        removed_device_count: 1,
        changed_device_count: 1,
        notes: ["Bounded inventory history note."],
      },
    },
    count: 2,
    items: [
      {
        device_id: "PE1",
        vendor: "nokia",
        platform: "7750 SR-1",
        software_version: "B-25.10.R2",
        role: "pe",
        management_address: "172.20.20.107",
        current_posture: "current",
        collector_status: "ok",
        last_recorded_collector_status: "ok",
        capability_summary: "partially_supported",
        capability_detail: "Support remains bounded.",
      },
      {
        device_id: "P1",
        vendor: "nokia",
        platform: "7750 SR-1",
        software_version: "B-25.10.R2",
        role: "p",
        management_address: "172.20.20.109",
        current_posture: "current",
        collector_status: "ok",
        last_recorded_collector_status: "ok",
        capability_summary: "partially_supported",
        capability_detail: "Support remains bounded.",
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("devices view", () => {
  it("renders persisted inventory history and recent snapshot anchors", () => {
    useDevicesQuery.mockReturnValue(createQueryState(createDevicesData()));

    const html = renderToStaticMarkup(<DevicesView />);

    expect(html).toContain("Persisted History And Comparison");
    expect(html).toContain("Recent Persisted Snapshots");
    expect(html).toContain("inventory-snapshot-current");
    expect(html).toContain("inventory-snapshot-older");
    expect(html).toContain("Bounded inventory history note.");
  });
});
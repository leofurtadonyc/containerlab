import type { ReactElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuditHistoryItem } from "../src/api/contracts";
import { AuditView } from "../src/features/audit/view";

const useAuditHistoryQuery = vi.hoisted(() => vi.fn());

vi.mock("../src/features/audit/api", () => ({
  useAuditHistoryQuery,
}));

const INVENTORY_TRUST_SNIPPET = "Sync-derived read-only context only";
const INVENTORY_NO_COMPARISON_SNIPPET = "No latest-versus-previous comparison envelope is present";

const inventorySnapshotFixture = {
  snapshot_id: "snap-current",
  persisted_at: "2025-01-01T00:00:02Z",
  observed_at: "2025-01-01T00:00:00Z",
  sync_source: "gnmi_collector",
  sync_status: "ok",
  data_status: "live" as const,
  device_count: 12,
  role_counts: { edge: 12 },
  collector_status_counts: { ok: 12 },
  capability_summary_counts: { full_detail: 10 },
};

const inventoryComparisonFixture = {
  current_snapshot_id: "snap-current",
  previous_snapshot_id: "snap-previous",
  current_persisted_at: "2025-01-01T00:00:02Z",
  previous_persisted_at: "2024-12-31T00:00:00Z",
  current_device_count: 12,
  previous_device_count: 10,
  device_count_delta: 2,
  added_device_count: 2,
  removed_device_count: 0,
  changed_device_count: 1,
  notes: ["Audit comparison note for test."],
};

function createQueryState<T>(data: T | null) {
  return {
    data,
    error: null,
    isLoading: false,
    reload: vi.fn(async () => undefined),
  };
}

function createAuditDataWithBaseline(
  baselinePosture: "preserved_same_workspace_baseline" | "new_baseline",
) {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    data_status: baselinePosture === "preserved_same_workspace_baseline" ? "persisted_activity_history" : "empty",
    summary:
      baselinePosture === "preserved_same_workspace_baseline"
        ? "Audit history currently reflects platform-recorded read-side sync events."
        : "No persisted platform audit-style sync events are currently available.",
    baseline_summary: {
      baseline_posture: baselinePosture,
      summary:
        baselinePosture === "preserved_same_workspace_baseline"
          ? "This view reflects preserved sync-derived history from the current workspace baseline."
          : "This view is effectively starting from a new baseline.",
      notes: [
        "Baseline summary is derived from persisted sync-run and readiness-snapshot presence.",
        "These remain sync-derived and readiness-derived Phase 2 history views.",
      ],
    },
    count: baselinePosture === "preserved_same_workspace_baseline" ? 1 : 0,
    items:
      baselinePosture === "preserved_same_workspace_baseline"
        ? [
            {
              event_id: "sync-run:sync-1",
              event_type: "read_side_sync_recorded" as const,
              source: "app-api" as const,
              actor: "platform_system" as const,
              target_scope: "device_inventory_read_side",
              result: "succeeded",
              correlation_id: "sync-1",
              sync_run_id: "sync-1",
              readiness_snapshot_id: null,
              occurred_at: "2025-01-01T00:00:01Z",
              message: "Platform recorded a succeeded inventory read-side sync.",
              inventory_snapshot_summary: null,
              inventory_comparison_to_previous: null,
              topology_snapshot_summary: null,
              topology_comparison_to_previous: null,
              policy_snapshot_summary: null,
              policy_comparison_to_previous: null,
              readiness_snapshot_summary: null,
              notes: [],
            },
          ]
        : [],
  };
}

function baseAuditItem(): AuditHistoryItem {
  return {
    event_id: "sync-run:sync-inv-audit",
    event_type: "read_side_sync_recorded",
    source: "app-api",
    actor: "platform_system",
    target_scope: "device_inventory_read_side",
    result: "succeeded",
    correlation_id: "sync-inv-audit",
    sync_run_id: "sync-inv-audit",
    readiness_snapshot_id: null,
    occurred_at: "2025-01-01T00:00:01Z",
    message: "Platform recorded inventory sync.",
    inventory_snapshot_summary: null,
    inventory_comparison_to_previous: null,
    topology_snapshot_summary: null,
    topology_comparison_to_previous: null,
    policy_snapshot_summary: null,
    policy_comparison_to_previous: null,
    readiness_snapshot_summary: null,
    notes: [],
  };
}

function auditHistoryPayloadForItems(items: AuditHistoryItem[]) {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    data_status: "persisted_activity_history" as const,
    summary: "Audit history currently reflects platform-recorded read-side sync events.",
    baseline_summary: {
      baseline_posture: "preserved_same_workspace_baseline" as const,
      summary: "This view reflects preserved sync-derived history from the current workspace baseline.",
      notes: [
        "Baseline summary is derived from persisted sync-run and readiness-snapshot presence.",
        "These remain sync-derived and readiness-derived Phase 2 history views.",
      ],
    },
    count: items.length,
    items,
  };
}

function renderWithDom(ui: ReactElement) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => {
    root.render(ui);
  });
  return {
    host,
    cleanup() {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("audit view", () => {
  it("renders preserved baseline posture when baseline_summary indicates preserved", () => {
    useAuditHistoryQuery.mockReturnValue(
      createQueryState(createAuditDataWithBaseline("preserved_same_workspace_baseline")),
    );

    const html = renderToStaticMarkup(<AuditView />);

    expect(html).toContain("History baseline");
    expect(html).toContain("Baseline Posture");
    expect(html).toContain("Baseline Summary");
    expect(html).toContain("preserved same workspace baseline");
    expect(html).toContain("preserved sync-derived history");
    expect(html).toContain("Read-only sync- and readiness-derived audit-style visibility");
  });

  it("renders new baseline posture when baseline_summary indicates new baseline", () => {
    useAuditHistoryQuery.mockReturnValue(
      createQueryState(createAuditDataWithBaseline("new_baseline")),
    );

    const html = renderToStaticMarkup(<AuditView />);

    expect(html).toContain("History baseline");
    expect(html).toContain("Baseline Posture");
    expect(html).toContain("Baseline Summary");
    expect(html).toContain("new baseline");
    expect(html).toContain("This view is effectively starting from a new baseline");
    expect(html).toContain("Not approvals");
  });

  it("shows inventory trust copy and comparison when snapshot and comparison are present", () => {
    const item: AuditHistoryItem = {
      ...baseAuditItem(),
      inventory_snapshot_summary: inventorySnapshotFixture,
      inventory_comparison_to_previous: inventoryComparisonFixture,
    };
    useAuditHistoryQuery.mockReturnValue(createQueryState(auditHistoryPayloadForItems([item])));

    const { host, cleanup } = renderWithDom(<AuditView />);
    try {
      const btn = host.querySelector("button.table-select");
      expect(btn).toBeTruthy();
      act(() => {
        (btn as HTMLButtonElement).click();
      });
      const html = host.innerHTML;
      expect(html).toContain("Inventory persisted evidence");
      expect(html).toContain(INVENTORY_TRUST_SNIPPET);
      expect(html).toContain("Inventory snapshot summary");
      expect(html).toContain("Inventory latest-versus-previous comparison");
      expect(html).toContain("Sync source");
      expect(html).toContain("gnmi collector");
      expect(html).toContain("Capability summary distribution");
      expect(html).toContain("Audit comparison note for test.");
      expect(html).not.toContain(INVENTORY_NO_COMPARISON_SNIPPET);
    } finally {
      cleanup();
    }
  });

  it("shows inventory trust copy and honest absence note when snapshot exists without comparison", () => {
    const item: AuditHistoryItem = {
      ...baseAuditItem(),
      inventory_snapshot_summary: inventorySnapshotFixture,
      inventory_comparison_to_previous: null,
    };
    useAuditHistoryQuery.mockReturnValue(createQueryState(auditHistoryPayloadForItems([item])));

    const { host, cleanup } = renderWithDom(<AuditView />);
    try {
      const btn = host.querySelector("button.table-select");
      expect(btn).toBeTruthy();
      act(() => {
        (btn as HTMLButtonElement).click();
      });
      const html = host.innerHTML;
      expect(html).toContain("Inventory persisted evidence");
      expect(html).toContain(INVENTORY_TRUST_SNIPPET);
      expect(html).toContain("Inventory snapshot summary");
      expect(html).toContain(INVENTORY_NO_COMPARISON_SNIPPET);
      expect(html).toContain("incomplete persisted history for this event");
      expect(html).toContain("honest and expected");
      expect(html).not.toContain("Inventory Comparison Evidence");
    } finally {
      cleanup();
    }
  });
});

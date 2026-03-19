import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuditView } from "../src/features/audit/view";

const useAuditHistoryQuery = vi.hoisted(() => vi.fn());

vi.mock("../src/features/audit/api", () => ({
  useAuditHistoryQuery,
}));

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
              event_type: "read_side_sync_recorded",
              source: "app-api",
              actor: "platform_system",
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
});

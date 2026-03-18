import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkflowsView } from "../src/features/workflows/view";

const useWorkflowHistoryQuery = vi.hoisted(() => vi.fn());

vi.mock("../src/features/workflows/api", () => ({
  useWorkflowHistoryQuery,
}));

function createQueryState<T>(data: T | null) {
  return {
    data,
    error: null,
    isLoading: false,
    reload: vi.fn(async () => undefined),
  };
}

function createWorkflowDataWithBaseline(
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
        ? "Workflow history currently reflects platform-side read-only sync activity."
        : "No persisted platform-side sync activity is currently available.",
    baseline_summary: {
      baseline_posture: baselinePosture,
      summary:
        baselinePosture === "preserved_same_workspace_baseline"
          ? "This view reflects preserved sync-derived history from the current workspace baseline."
          : "This view is effectively starting from a new baseline.",
      notes: [
        "Baseline summary is derived from persisted sync-run and readiness-snapshot presence.",
        "These remain sync-derived Phase 2 history views, not workflow-grade lifecycle history.",
      ],
    },
    count: baselinePosture === "preserved_same_workspace_baseline" ? 2 : 0,
    items:
      baselinePosture === "preserved_same_workspace_baseline"
        ? [
            {
              workflow_id: "sync-1",
              sync_run_id: "sync-1",
              workflow_type: "read_side_sync",
              workflow_name: "inventory_snapshot_sync",
              scope: "device_inventory_read_side",
              status: "completed",
              source_type: "gnmi_collector",
              source_endpoint: "http://collector:9804",
              record_count: 34,
              observed_at: "2025-01-01T00:00:00Z",
              started_at: "2025-01-01T00:00:00Z",
              finished_at: "2025-01-01T00:00:01Z",
              persisted_artifacts: ["inventory_snapshot"],
              inventory_snapshot_summary: null,
              inventory_comparison_to_previous: null,
              topology_snapshot_summary: null,
              topology_comparison_to_previous: null,
              policy_snapshot_summary: null,
              policy_comparison_to_previous: null,
              notes: [],
            },
          ]
        : [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("workflows view", () => {
  it("renders preserved baseline posture when baseline_summary indicates preserved", () => {
    useWorkflowHistoryQuery.mockReturnValue(
      createQueryState(createWorkflowDataWithBaseline("preserved_same_workspace_baseline")),
    );

    const html = renderToStaticMarkup(<WorkflowsView />);

    expect(html).toContain("Baseline Posture");
    expect(html).toContain("Baseline Summary");
    expect(html).toContain("preserved same workspace baseline");
    expect(html).toContain("preserved sync-derived history");
  });

  it("renders new baseline posture when baseline_summary indicates new baseline", () => {
    useWorkflowHistoryQuery.mockReturnValue(
      createQueryState(createWorkflowDataWithBaseline("new_baseline")),
    );

    const html = renderToStaticMarkup(<WorkflowsView />);

    expect(html).toContain("Baseline Posture");
    expect(html).toContain("Baseline Summary");
    expect(html).toContain("new baseline");
    expect(html).toContain("This view is effectively starting from a new baseline");
  });
});

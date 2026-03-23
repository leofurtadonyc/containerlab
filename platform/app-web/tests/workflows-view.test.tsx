import type { ReactElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkflowHistoryItem } from "../src/api/contracts";
import { WorkflowsView } from "../src/features/workflows/view";

const useWorkflowHistoryQuery = vi.hoisted(() => vi.fn());

vi.mock("../src/features/workflows/api", () => ({
  useWorkflowHistoryQuery,
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
  notes: ["Comparison note for test."],
};

const policyComparisonWithPreviewFixture = {
  current_snapshot_id: "pol-a",
  previous_snapshot_id: "pol-b",
  current_persisted_at: "2025-01-01T00:00:02Z",
  previous_persisted_at: "2024-12-31T00:00:00Z",
  current_observed_policy_count: 4,
  previous_observed_policy_count: 4,
  current_detail_record_count: 4,
  previous_detail_record_count: 4,
  observed_policy_delta: 0,
  detail_record_delta: 0,
  added_policy_count: 0,
  removed_policy_count: 0,
  changed_policy_count: 1,
  change_preview: [
    {
      policy_id: "PE1:static_local:192.0.2.11:100",
      policy_name: "sample-policy",
      source_target: "PE1",
      source_target_role: "pe",
      change_kind: "changed" as const,
      changed_fields: ["observed_state"],
    },
  ],
  notes: [],
};

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

function baseWorkflowItem(): WorkflowHistoryItem {
  return {
    workflow_id: "wf-inv-1",
    sync_run_id: "sync-inv-1",
    workflow_type: "read_side_sync",
    workflow_name: "inventory_snapshot_sync",
    scope: "device_inventory_read_side",
    status: "completed",
    source_type: "gnmi_collector",
    source_endpoint: "http://collector:9804",
    record_count: 12,
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
  };
}

function workflowHistoryPayloadForItems(items: WorkflowHistoryItem[]) {
  return {
    service: "app-api",
    version: "test",
    phase: "phase_2_read_only_foundation",
    generated_at: "2025-01-01T00:00:00Z",
    data_status: "persisted_activity_history" as const,
    summary: "Workflow history currently reflects platform-side read-only sync activity.",
    baseline_summary: {
      baseline_posture: "preserved_same_workspace_baseline" as const,
      summary: "This view reflects preserved sync-derived history from the current workspace baseline.",
      notes: [
        "Baseline summary is derived from persisted sync-run and readiness-snapshot presence.",
        "These remain sync-derived Phase 2 history views, not workflow-grade lifecycle history.",
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

describe("workflows view", () => {
  it("surfaces bounded change-intelligence link to Overview while history is loading", () => {
    useWorkflowHistoryQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      reload: vi.fn(async () => undefined),
    });

    const html = renderToStaticMarkup(<WorkflowsView />);

    expect(html).toContain("Open Overview (recent change summary)");
    expect(html).toContain("row-level sync-derived workflow history");
  });

  it("renders preserved baseline posture when baseline_summary indicates preserved", () => {
    useWorkflowHistoryQuery.mockReturnValue(
      createQueryState(createWorkflowDataWithBaseline("preserved_same_workspace_baseline")),
    );

    const html = renderToStaticMarkup(<WorkflowsView />);

    expect(html).toContain("History baseline");
    expect(html).toContain("Baseline Posture");
    expect(html).toContain("Baseline Summary");
    expect(html).toContain("preserved same workspace baseline");
    expect(html).toContain("preserved sync-derived history");
    expect(html).toContain("Sync- and readiness-derived read-only history");
    expect(html).toContain("Recent change (bounded)");
    expect(html).toContain("Open Overview (recent change summary)");
    expect(html).toContain("row-level sync-derived workflow history");
  });

  it("renders new baseline posture when baseline_summary indicates new baseline", () => {
    useWorkflowHistoryQuery.mockReturnValue(
      createQueryState(createWorkflowDataWithBaseline("new_baseline")),
    );

    const html = renderToStaticMarkup(<WorkflowsView />);

    expect(html).toContain("History baseline");
    expect(html).toContain("Baseline Posture");
    expect(html).toContain("Baseline Summary");
    expect(html).toContain("new baseline");
    expect(html).toContain("This view is effectively starting from a new baseline");
    expect(html).toContain("Not workflow execution");
  });

  it("shows honest absence copy when no product drilldown applies to the selected sync", () => {
    const item: WorkflowHistoryItem = {
      ...baseWorkflowItem(),
      scope: "platform_read_side",
      persisted_artifacts: [],
    };
    useWorkflowHistoryQuery.mockReturnValue(createQueryState(workflowHistoryPayloadForItems([item])));

    const { host, cleanup } = renderWithDom(<WorkflowsView />);
    try {
      const btn = host.querySelector("button.table-select");
      expect(btn).toBeTruthy();
      act(() => {
        (btn as HTMLButtonElement).click();
      });
      expect(host.innerHTML).toContain(
        "No Devices, Topology, Policies, or Readiness drilldown applies",
      );
    } finally {
      cleanup();
    }
  });

  it("shows inventory trust copy and comparison when snapshot and comparison are present", () => {
    const item: WorkflowHistoryItem = {
      ...baseWorkflowItem(),
      inventory_snapshot_summary: inventorySnapshotFixture,
      inventory_comparison_to_previous: inventoryComparisonFixture,
    };
    useWorkflowHistoryQuery.mockReturnValue(createQueryState(workflowHistoryPayloadForItems([item])));

    const { host, cleanup } = renderWithDom(<WorkflowsView />);
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
      expect(html).toContain("Open related product surface");
      expect(html).toContain("Devices (inventory read-side)");
      expect(html).toContain("Sync source");
      expect(html).toContain("gnmi collector");
      expect(html).toContain("Comparison note for test.");
      expect(html).not.toContain(INVENTORY_NO_COMPARISON_SNIPPET);
    } finally {
      cleanup();
    }
  });

  it("shows policy evidence timeline drilldown when policy comparison preview lists policy ids", () => {
    const item: WorkflowHistoryItem = {
      ...baseWorkflowItem(),
      scope: "policy_inventory_read_side",
      persisted_artifacts: ["policy_snapshot"],
      policy_comparison_to_previous: policyComparisonWithPreviewFixture,
    };
    useWorkflowHistoryQuery.mockReturnValue(createQueryState(workflowHistoryPayloadForItems([item])));

    const { host, cleanup } = renderWithDom(<WorkflowsView />);
    try {
      const btn = host.querySelector("button.table-select");
      expect(btn).toBeTruthy();
      act(() => {
        (btn as HTMLButtonElement).click();
      });
      const html = host.innerHTML;
      expect(html).toContain("Policy evidence timeline (from comparison preview)");
      expect(html).toContain("Policy timeline · sample-policy");
    } finally {
      cleanup();
    }
  });

  it("shows inventory trust copy and honest absence note when snapshot exists without comparison", () => {
    const item: WorkflowHistoryItem = {
      ...baseWorkflowItem(),
      inventory_snapshot_summary: inventorySnapshotFixture,
      inventory_comparison_to_previous: null,
    };
    useWorkflowHistoryQuery.mockReturnValue(createQueryState(workflowHistoryPayloadForItems([item])));

    const { host, cleanup } = renderWithDom(<WorkflowsView />);
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
      expect(html).toContain("incomplete persisted history for this sync run");
      expect(html).toContain("honest and expected");
      expect(html).not.toContain("Inventory Comparison Evidence");
    } finally {
      cleanup();
    }
  });
});

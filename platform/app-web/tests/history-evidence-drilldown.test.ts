import { describe, expect, it } from "vitest";

import type { AuditHistoryItem, WorkflowHistoryItem } from "../src/api/contracts";
import {
  auditHistoryDrilldownTargets,
  workflowHistoryDrilldownTargets,
} from "../src/lib/history-evidence-drilldown";

const minimalWorkflow = (overrides: Partial<WorkflowHistoryItem>): WorkflowHistoryItem => ({
  workflow_id: "wf-1",
  sync_run_id: "sync-1",
  workflow_type: "read_side_sync",
  workflow_name: "inventory_snapshot_sync",
  scope: "device_inventory_read_side",
  status: "completed",
  source_type: "gnmi_collector",
  source_endpoint: "http://collector",
  record_count: 1,
  observed_at: null,
  started_at: "2025-01-01T00:00:00Z",
  finished_at: "2025-01-01T00:00:01Z",
  persisted_artifacts: [],
  inventory_snapshot_summary: null,
  inventory_comparison_to_previous: null,
  topology_snapshot_summary: null,
  topology_comparison_to_previous: null,
  policy_snapshot_summary: null,
  policy_comparison_to_previous: null,
  notes: [],
  ...overrides,
});

describe("workflowHistoryDrilldownTargets", () => {
  it("maps inventory scope and artifacts to Devices", () => {
    const t = workflowHistoryDrilldownTargets(
      minimalWorkflow({ persisted_artifacts: ["inventory_snapshot"] }),
    );
    expect(t.map((x) => x.view)).toEqual(["devices"]);
  });

  it("returns multiple surfaces when several snapshot families are present", () => {
    const t = workflowHistoryDrilldownTargets(
      minimalWorkflow({
        persisted_artifacts: ["inventory_snapshot", "topology_snapshot", "policy_snapshot"],
      }),
    );
    expect(t.map((x) => x.view)).toEqual(["devices", "topology", "policies"]);
  });

  it("returns empty targets when scope and evidence do not map to product surfaces", () => {
    const t = workflowHistoryDrilldownTargets(
      minimalWorkflow({
        scope: "platform_read_side",
        persisted_artifacts: [],
      }),
    );
    expect(t).toEqual([]);
  });
});

describe("auditHistoryDrilldownTargets", () => {
  it("routes readiness events to the Readiness page", () => {
    const item: AuditHistoryItem = {
      event_id: "r1",
      event_type: "readiness_snapshot_recorded",
      source: "app-api",
      actor: "platform_system",
      target_scope: "dry_run_readiness_support",
      result: "succeeded",
      correlation_id: "x",
      sync_run_id: null,
      readiness_snapshot_id: "rs",
      occurred_at: "2025-01-01T00:00:00Z",
      message: "m",
      inventory_snapshot_summary: null,
      inventory_comparison_to_previous: null,
      topology_snapshot_summary: null,
      topology_comparison_to_previous: null,
      policy_snapshot_summary: null,
      policy_comparison_to_previous: null,
      readiness_snapshot_summary: {
        snapshot_id: "rs",
        persisted_at: "2025-01-01T00:00:00Z",
        readiness_status: "x",
        planning_readiness: "x",
        phase_recommendation: "x",
        summary: "s",
        blocker_count: 0,
        strongest_blockers: [],
      },
      notes: [],
    };
    expect(auditHistoryDrilldownTargets(item).map((x) => x.view)).toEqual(["readiness"]);
  });

  it("maps sync events using target_scope like device_inventory_read_side", () => {
    const item: AuditHistoryItem = {
      event_id: "e1",
      event_type: "read_side_sync_recorded",
      source: "app-api",
      actor: "platform_system",
      target_scope: "policy_inventory_read_side",
      result: "succeeded",
      correlation_id: "c",
      sync_run_id: "s",
      readiness_snapshot_id: null,
      occurred_at: "2025-01-01T00:00:00Z",
      message: "m",
      inventory_snapshot_summary: null,
      inventory_comparison_to_previous: null,
      topology_snapshot_summary: null,
      topology_comparison_to_previous: null,
      policy_snapshot_summary: null,
      policy_comparison_to_previous: null,
      readiness_snapshot_summary: null,
      notes: [],
    };
    expect(auditHistoryDrilldownTargets(item).map((x) => x.view)).toEqual(["policies"]);
  });
});

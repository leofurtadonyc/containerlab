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

  it("adds Readiness when a readiness_snapshot artifact is persisted on the sync run", () => {
    const t = workflowHistoryDrilldownTargets(
      minimalWorkflow({
        persisted_artifacts: ["readiness_snapshot"],
        scope: "platform_read_side",
      }),
    );
    expect(t.map((x) => x.view)).toEqual(["readiness"]);
    expect(t[0].readinessParams).toBeUndefined();
  });

  it("keeps inventory surfaces alongside readiness when multiple artifacts are present", () => {
    const t = workflowHistoryDrilldownTargets(
      minimalWorkflow({
        persisted_artifacts: ["inventory_snapshot", "readiness_snapshot"],
      }),
    );
    expect(t.map((x) => x.view)).toEqual(["devices", "readiness"]);
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
    expect(auditHistoryDrilldownTargets(item)[0].readinessParams).toBeUndefined();
  });

  it("passes a bounded readiness blocker hint from strongest_blockers when present", () => {
    const item: AuditHistoryItem = {
      event_id: "r2",
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
        blocker_count: 1,
        strongest_blockers: ["dry_run_contract_missing"],
      },
      notes: [],
    };
    const targets = auditHistoryDrilldownTargets(item);
    expect(targets[0].readinessParams).toEqual({ blocker: "dry_run_contract_missing" });
  });

  it("adds Readiness with blocker hint when a sync event carries readiness_snapshot_summary", () => {
    const item: AuditHistoryItem = {
      event_id: "e-mixed",
      event_type: "read_side_sync_recorded",
      source: "app-api",
      actor: "platform_system",
      target_scope: "device_inventory_read_side",
      result: "succeeded",
      correlation_id: "c",
      sync_run_id: "s",
      readiness_snapshot_id: null,
      occurred_at: "2025-01-01T00:00:00Z",
      message: "m",
      inventory_snapshot_summary: {
        snapshot_id: "snap-current",
        sync_run_id: "s",
        persisted_at: "2025-01-01T00:00:02Z",
        observed_at: "2025-01-01T00:00:00Z",
        sync_source: "gnmi_collector",
        sync_status: "ok",
        data_status: "live",
        source_endpoint: "http://collector",
        device_count: 1,
        role_counts: {},
        collector_status_counts: {},
        capability_summary_counts: {},
      },
      inventory_comparison_to_previous: null,
      topology_snapshot_summary: null,
      topology_comparison_to_previous: null,
      policy_snapshot_summary: null,
      policy_comparison_to_previous: null,
      readiness_snapshot_summary: {
        snapshot_id: "rs2",
        persisted_at: "2025-01-01T00:00:00Z",
        readiness_status: "bounded_readiness_support",
        planning_readiness: "readiness_planning_supported",
        phase_recommendation: "remain_phase_2_read_only_foundation",
        summary: "s",
        blocker_count: 1,
        strongest_blockers: ["topology_truth_still_bounded"],
      },
      notes: [],
    };
    const targets = auditHistoryDrilldownTargets(item);
    expect(targets.map((x) => x.view)).toEqual(["devices", "readiness"]);
    expect(targets.find((x) => x.view === "readiness")?.readinessParams).toEqual({
      blocker: "topology_truth_still_bounded",
    });
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

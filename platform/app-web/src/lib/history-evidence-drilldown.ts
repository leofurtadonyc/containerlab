import type {
  AuditHistoryItem,
  AuditReadinessSnapshotSummary,
  PolicyHistoryComparison,
  WorkflowHistoryItem,
} from "../api/contracts";

function readinessTargetFromSummary(
  summary: AuditReadinessSnapshotSummary | null | undefined,
): EvidenceDrilldownTarget {
  const firstBlocker = summary?.strongest_blockers?.[0];
  return {
    view: "readiness",
    label: "Readiness (planning support)",
    readinessParams: firstBlocker ? { blocker: firstBlocker } : undefined,
  };
}

/** Product surfaces operators can open from history rows (read-only navigation). */
export type EvidenceProductViewId = "devices" | "topology" | "policies" | "readiness";

export interface EvidenceDrilldownTarget {
  view: EvidenceProductViewId;
  label: string;
  /**
   * When `view` is `readiness`, optional bounded URL hints for the Readiness page (scroll only;
   * does not filter backend payloads). Omitted when this history row has no usable blocker name.
   */
  readinessParams?: {
    blocker?: string;
    prerequisite?: string;
  };
}

/** One row per unique policy id from a persisted policy comparison preview (workflow/audit history). */
export interface PolicyEvidenceTimelineDrilldownRow {
  policyId: string;
  policyName: string;
}

/**
 * Builds stable, de-duplicated policy rows from `policy_comparison_to_previous.change_preview`
 * when the backend attached bounded comparison rows. Used for read-only navigation to the policy
 * evidence timeline—not a claim that the workflow touched only these policies.
 */
export function policyEvidenceTimelineRowsFromComparison(item: {
  policy_comparison_to_previous: PolicyHistoryComparison | null;
}): PolicyEvidenceTimelineDrilldownRow[] {
  const preview = item.policy_comparison_to_previous?.change_preview ?? [];
  const seen = new Set<string>();
  const out: PolicyEvidenceTimelineDrilldownRow[] = [];
  for (const row of preview) {
    if (!row.policy_id || seen.has(row.policy_id)) {
      continue;
    }
    seen.add(row.policy_id);
    out.push({ policyId: row.policy_id, policyName: row.policy_name });
  }
  return out;
}

function buildSyncDerivedTargets(
  scope: string,
  persistedArtifacts: string[],
  hasInventoryEvidence: boolean,
  hasTopologyEvidence: boolean,
  hasPolicyEvidence: boolean,
): EvidenceDrilldownTarget[] {
  const out: EvidenceDrilldownTarget[] = [];
  const seen = new Set<string>();

  const push = (view: EvidenceProductViewId, label: string) => {
    if (seen.has(view)) {
      return;
    }
    seen.add(view);
    out.push({ view, label });
  };

  const inventorySignal =
    scope === "device_inventory_read_side" ||
    persistedArtifacts.includes("inventory_snapshot") ||
    hasInventoryEvidence;
  const topologySignal =
    scope === "topology_read_side" ||
    persistedArtifacts.includes("topology_snapshot") ||
    hasTopologyEvidence;
  const policySignal =
    scope === "policy_inventory_read_side" ||
    persistedArtifacts.includes("policy_snapshot") ||
    hasPolicyEvidence;

  if (inventorySignal) {
    push("devices", "Devices (inventory read-side)");
  }
  if (topologySignal) {
    push("topology", "Topology (observed graph)");
  }
  if (policySignal) {
    push("policies", "Policies (inventory read-side)");
  }

  return out;
}

export function workflowHistoryDrilldownTargets(item: WorkflowHistoryItem): EvidenceDrilldownTarget[] {
  const targets = buildSyncDerivedTargets(
    item.scope,
    item.persisted_artifacts,
    item.inventory_snapshot_summary != null || item.inventory_comparison_to_previous != null,
    item.topology_snapshot_summary != null || item.topology_comparison_to_previous != null,
    item.policy_snapshot_summary != null || item.policy_comparison_to_previous != null,
  );
  if (
    item.persisted_artifacts.includes("readiness_snapshot") &&
    !targets.some((t) => t.view === "readiness")
  ) {
    targets.push({
      view: "readiness",
      label: "Readiness (planning support)",
      readinessParams: undefined,
    });
  }
  return targets;
}

export function auditHistoryDrilldownTargets(item: AuditHistoryItem): EvidenceDrilldownTarget[] {
  if (item.event_type === "readiness_snapshot_recorded") {
    return [readinessTargetFromSummary(item.readiness_snapshot_summary)];
  }

  const targets = buildSyncDerivedTargets(
    item.target_scope,
    [],
    item.inventory_snapshot_summary != null || item.inventory_comparison_to_previous != null,
    item.topology_snapshot_summary != null || item.topology_comparison_to_previous != null,
    item.policy_snapshot_summary != null || item.policy_comparison_to_previous != null,
  );
  if (
    item.readiness_snapshot_summary &&
    !targets.some((t) => t.view === "readiness")
  ) {
    targets.push(readinessTargetFromSummary(item.readiness_snapshot_summary));
  }
  return targets;
}

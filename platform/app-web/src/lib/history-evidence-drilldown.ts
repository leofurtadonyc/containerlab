import type { AuditHistoryItem, WorkflowHistoryItem } from "../api/contracts";

/** Product surfaces operators can open from history rows (read-only navigation). */
export type EvidenceProductViewId = "devices" | "topology" | "policies" | "readiness";

export interface EvidenceDrilldownTarget {
  view: EvidenceProductViewId;
  label: string;
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
  return buildSyncDerivedTargets(
    item.scope,
    item.persisted_artifacts,
    item.inventory_snapshot_summary != null || item.inventory_comparison_to_previous != null,
    item.topology_snapshot_summary != null || item.topology_comparison_to_previous != null,
    item.policy_snapshot_summary != null || item.policy_comparison_to_previous != null,
  );
}

export function auditHistoryDrilldownTargets(item: AuditHistoryItem): EvidenceDrilldownTarget[] {
  if (item.event_type === "readiness_snapshot_recorded") {
    return [{ view: "readiness", label: "Readiness (planning support)" }];
  }

  return buildSyncDerivedTargets(
    item.target_scope,
    [],
    item.inventory_snapshot_summary != null || item.inventory_comparison_to_previous != null,
    item.topology_snapshot_summary != null || item.topology_comparison_to_previous != null,
    item.policy_snapshot_summary != null || item.policy_comparison_to_previous != null,
  );
}

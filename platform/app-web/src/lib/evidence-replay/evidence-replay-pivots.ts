/**
 * Read-side helpers for pivoting from replayed `subject_ref` / nested blobs to live shell routes.
 */

import type { TopologyObjectKind } from "../../api/contracts";

/** Bounded sync-run window from export `subject_ref` (1–100). */
export function readSyncRunsFromSubjectRef(ref: Record<string, unknown>): number {
  const v = ref.sync_runs_limit;
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.min(100, Math.max(1, Math.floor(v)));
  }
  if (typeof v === "string") {
    const n = Number.parseInt(v, 10);
    if (!Number.isNaN(n)) {
      return Math.min(100, Math.max(1, n));
    }
  }
  return 20;
}

export function readPolicyIdFromSubjectRef(ref: Record<string, unknown>): string | null {
  const v = ref.policy_id;
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * Topology exports use `object_id` + `topology_object_kind` on `subject_ref` (see app-api evidence export).
 */
export function readTopologyPivotFromSubjectRef(
  ref: Record<string, unknown>,
): { objectId: string; kind: TopologyObjectKind } | null {
  const objectId =
    (typeof ref.object_id === "string" && ref.object_id.length > 0 ? ref.object_id : null) ??
    (typeof ref.objectId === "string" && ref.objectId.length > 0 ? ref.objectId : null);
  const rawKind =
    (typeof ref.topology_object_kind === "string" ? ref.topology_object_kind : null) ??
    (typeof ref.object_kind === "string" ? ref.object_kind : null);
  if (!objectId || (rawKind !== "node" && rawKind !== "link")) {
    return null;
  }
  return { objectId, kind: rawKind };
}

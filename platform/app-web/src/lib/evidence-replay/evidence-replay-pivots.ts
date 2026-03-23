/**
 * Read-side helpers for pivoting from replayed `subject_ref` / nested blobs to live shell routes.
 * Prefer `subject_ref` when present; fall back to nested shapes documented for `evidence_export_v1`
 * (e.g. `topology_object_dossier_v1` **`object_identity`**, **`policy_record.policy_id`**).
 */

import type { TopologyObjectKind } from "../../api/contracts";

export type PolicyPivotSource = "subject_ref" | "nested_policy_record";

export type TopologyPivotSource = "subject_ref" | "nested_object_identity";

export interface PolicyPivotResolved {
  policyId: string;
  source: PolicyPivotSource;
}

export interface TopologyPivotResolved {
  objectId: string;
  kind: TopologyObjectKind;
  source: TopologyPivotSource;
}

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

/**
 * Topology dossier nested payloads expose **`object_identity.object_id`** / **`object_kind`**
 * when `subject_ref` is incomplete (schema drift or partial export).
 */
export function readTopologyPivotFromNestedObjectIdentity(
  nested: Record<string, unknown> | null,
): { objectId: string; kind: TopologyObjectKind } | null {
  if (!nested) {
    return null;
  }
  const oi = nested.object_identity;
  if (!oi || typeof oi !== "object" || Array.isArray(oi)) {
    return null;
  }
  const o = oi as Record<string, unknown>;
  const objectId = typeof o.object_id === "string" && o.object_id.length > 0 ? o.object_id : null;
  const rawKind = typeof o.object_kind === "string" ? o.object_kind : null;
  if (!objectId || (rawKind !== "node" && rawKind !== "link")) {
    return null;
  }
  return { objectId, kind: rawKind };
}

export function readTopologyPivotForReplay(
  subjectRef: Record<string, unknown>,
  nested: Record<string, unknown> | null,
): TopologyPivotResolved | null {
  const fromRef = readTopologyPivotFromSubjectRef(subjectRef);
  if (fromRef) {
    return { ...fromRef, source: "subject_ref" };
  }
  const fromNested = readTopologyPivotFromNestedObjectIdentity(nested);
  if (fromNested) {
    return { ...fromNested, source: "nested_object_identity" };
  }
  return null;
}

/**
 * Prefer **`subject_ref.policy_id`**; else **`nested.policy_record.policy_id`** when the nested dossier is present.
 */
export function readPolicyIdForReplay(
  subjectRef: Record<string, unknown>,
  nested: Record<string, unknown> | null,
): PolicyPivotResolved | null {
  const direct = readPolicyIdFromSubjectRef(subjectRef);
  if (direct) {
    return { policyId: direct, source: "subject_ref" };
  }
  if (!nested) {
    return null;
  }
  const pr = nested.policy_record;
  if (pr && typeof pr === "object" && !Array.isArray(pr)) {
    const pid = (pr as Record<string, unknown>).policy_id;
    if (typeof pid === "string" && pid.length > 0) {
      return { policyId: pid, source: "nested_policy_record" };
    }
  }
  return null;
}

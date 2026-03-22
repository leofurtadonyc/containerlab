/**
 * Typed read-side query parameters aligned with `app-api` bounded ergonomics
 * (`read_side_query.py` / OpenAPI). Client-side bounds match backend maxima so we
 * avoid sending invalid requests; omitted params mean backend defaults apply.
 */

export const READ_SIDE_PRIMARY_LIST_LIMIT_MAX = 500;
export const READ_SIDE_HISTORY_RECENT_LIMIT_MAX = 50;
export const READ_SIDE_SYNC_RUNS_LIMIT_MAX = 100;
export const READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX = 50;

/** Optional query for `GET /api/v1/devices` and `GET /api/v1/policies`. */
export interface DevicesPoliciesReadSideQuery {
  limit?: number;
  history_recent_limit?: number;
}

/** Optional query for `GET /api/v1/workflow-history`. */
export interface WorkflowHistoryReadSideQuery {
  limit?: number;
  sync_runs_limit?: number;
}

/** Optional query for `GET /api/v1/audit-history`. */
export interface AuditHistoryReadSideQuery {
  limit?: number;
  sync_runs_limit?: number;
  readiness_snapshot_history_limit?: number;
}

function parseBoundedInt(
  raw: string | null,
  min: number,
  max: number,
): number | undefined {
  if (raw === null || raw === "") {
    return undefined;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < min || n > max) {
    return undefined;
  }
  return n;
}

export function parseDevicesPoliciesReadSideQuery(
  params: URLSearchParams,
): DevicesPoliciesReadSideQuery {
  const limit = parseBoundedInt(params.get("limit"), 1, READ_SIDE_PRIMARY_LIST_LIMIT_MAX);
  const history_recent_limit = parseBoundedInt(
    params.get("history_recent_limit"),
    1,
    READ_SIDE_HISTORY_RECENT_LIMIT_MAX,
  );
  const out: DevicesPoliciesReadSideQuery = {};
  if (limit !== undefined) out.limit = limit;
  if (history_recent_limit !== undefined) out.history_recent_limit = history_recent_limit;
  return out;
}

export function parseWorkflowHistoryReadSideQuery(
  params: URLSearchParams,
): WorkflowHistoryReadSideQuery {
  const limit = parseBoundedInt(params.get("limit"), 1, READ_SIDE_PRIMARY_LIST_LIMIT_MAX);
  const sync_runs_limit = parseBoundedInt(
    params.get("sync_runs_limit"),
    1,
    READ_SIDE_SYNC_RUNS_LIMIT_MAX,
  );
  const out: WorkflowHistoryReadSideQuery = {};
  if (limit !== undefined) out.limit = limit;
  if (sync_runs_limit !== undefined) out.sync_runs_limit = sync_runs_limit;
  return out;
}

export function parseAuditHistoryReadSideQuery(
  params: URLSearchParams,
): AuditHistoryReadSideQuery {
  const limit = parseBoundedInt(params.get("limit"), 1, READ_SIDE_PRIMARY_LIST_LIMIT_MAX);
  const sync_runs_limit = parseBoundedInt(
    params.get("sync_runs_limit"),
    1,
    READ_SIDE_SYNC_RUNS_LIMIT_MAX,
  );
  const readiness_snapshot_history_limit = parseBoundedInt(
    params.get("readiness_snapshot_history_limit"),
    1,
    READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX,
  );
  const out: AuditHistoryReadSideQuery = {};
  if (limit !== undefined) out.limit = limit;
  if (sync_runs_limit !== undefined) out.sync_runs_limit = sync_runs_limit;
  if (readiness_snapshot_history_limit !== undefined) {
    out.readiness_snapshot_history_limit = readiness_snapshot_history_limit;
  }
  return out;
}

function appendIfDefined(
  search: URLSearchParams,
  key: string,
  value: number | undefined,
): void {
  if (value !== undefined) {
    search.set(key, String(value));
  }
}

export function mergeDevicesPoliciesReadSideQuery(
  base: URLSearchParams,
  next: DevicesPoliciesReadSideQuery,
): URLSearchParams {
  const sp = new URLSearchParams(base.toString());
  if (next.limit === undefined) {
    sp.delete("limit");
  } else {
    sp.set("limit", String(next.limit));
  }
  if (next.history_recent_limit === undefined) {
    sp.delete("history_recent_limit");
  } else {
    sp.set("history_recent_limit", String(next.history_recent_limit));
  }
  return sp;
}

export function mergeWorkflowHistoryReadSideQuery(
  base: URLSearchParams,
  next: WorkflowHistoryReadSideQuery,
): URLSearchParams {
  const sp = new URLSearchParams(base.toString());
  if (next.limit === undefined) {
    sp.delete("limit");
  } else {
    sp.set("limit", String(next.limit));
  }
  if (next.sync_runs_limit === undefined) {
    sp.delete("sync_runs_limit");
  } else {
    sp.set("sync_runs_limit", String(next.sync_runs_limit));
  }
  return sp;
}

export function mergeAuditHistoryReadSideQuery(
  base: URLSearchParams,
  next: AuditHistoryReadSideQuery,
): URLSearchParams {
  const sp = new URLSearchParams(base.toString());
  if (next.limit === undefined) {
    sp.delete("limit");
  } else {
    sp.set("limit", String(next.limit));
  }
  if (next.sync_runs_limit === undefined) {
    sp.delete("sync_runs_limit");
  } else {
    sp.set("sync_runs_limit", String(next.sync_runs_limit));
  }
  if (next.readiness_snapshot_history_limit === undefined) {
    sp.delete("readiness_snapshot_history_limit");
  } else {
    sp.set(
      "readiness_snapshot_history_limit",
      String(next.readiness_snapshot_history_limit),
    );
  }
  return sp;
}

export function buildDevicesPoliciesQueryString(
  query: DevicesPoliciesReadSideQuery,
): string {
  const p = new URLSearchParams();
  appendIfDefined(p, "limit", query.limit);
  appendIfDefined(p, "history_recent_limit", query.history_recent_limit);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function buildWorkflowHistoryQueryString(
  query: WorkflowHistoryReadSideQuery,
): string {
  const p = new URLSearchParams();
  appendIfDefined(p, "limit", query.limit);
  appendIfDefined(p, "sync_runs_limit", query.sync_runs_limit);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function buildAuditHistoryQueryString(query: AuditHistoryReadSideQuery): string {
  const p = new URLSearchParams();
  appendIfDefined(p, "limit", query.limit);
  appendIfDefined(p, "sync_runs_limit", query.sync_runs_limit);
  appendIfDefined(p, "readiness_snapshot_history_limit", query.readiness_snapshot_history_limit);
  const s = p.toString();
  return s ? `?${s}` : "";
}

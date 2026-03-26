/**
 * URL helpers for Maintenance Window Workspace (`view=maintenance-window-workspace`).
 * Multi-subject selectors use repeated `mww_subject=node:{id}` / `mww_subject=link:{id}` (bounded; matches backend cap).
 */

import type { MaintenancePreviewContext } from "../api/contracts";
import { DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, readSyncRunsLimitFromSearch } from "./investigation-navigation";
import { MAINTENANCE_PREVIEW_CONTEXT_PARAM } from "./maintenance-preview-navigation";
import { mergeViewIntoSearch, replaceUrlSearchParams } from "./url-app-state";

/** Must match `MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS` in app-api. */
export const MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS = 16;

/** WebUI query param (distinct from API `subject=`; mapped in ApiClient). */
export const MAINTENANCE_WINDOW_SUBJECT_PARAM = "mww_subject";

const VIEW_ID = "maintenance-window-workspace";

function parsePreviewContext(raw: string | null): MaintenancePreviewContext {
  if (
    raw === "planning_window" ||
    raw === "topology_drilldown" ||
    raw === "change_adjacent" ||
    raw === "explicit_subject"
  ) {
    return raw;
  }
  return "planning_window";
}

export interface MaintenanceWindowSubjectRef {
  objectKind: "node" | "link";
  objectId: string;
}

export type MaintenanceWindowSubjectsUrlState =
  | { kind: "empty" }
  | { kind: "invalid"; reason: string }
  | {
      kind: "ready";
      subjects: MaintenanceWindowSubjectRef[];
      previewContext: MaintenancePreviewContext;
      syncRunsLimit: number;
    };

function parseSubjectToken(raw: string): MaintenanceWindowSubjectRef | null {
  const t = raw.trim();
  const parts = t.split(":", 2);
  if (parts.length !== 2 || !parts[1]?.trim()) {
    return null;
  }
  const kind = parts[0].trim();
  if (kind !== "node" && kind !== "link") {
    return null;
  }
  return { objectKind: kind, objectId: parts[1].trim() };
}

function dedupeSubjects(subjects: MaintenanceWindowSubjectRef[]): MaintenanceWindowSubjectRef[] {
  const map = new Map<string, MaintenanceWindowSubjectRef>();
  for (const s of subjects) {
    const k = `${s.objectKind}:${s.objectId}`;
    map.set(k, s);
  }
  return [...map.values()].sort((a, b) => {
    if (a.objectKind !== b.objectKind) {
      return a.objectKind.localeCompare(b.objectKind);
    }
    return a.objectId.localeCompare(b.objectId);
  });
}

export function readMaintenanceWindowSubjectsFromSearch(search: string): MaintenanceWindowSubjectsUrlState {
  const sp = new URLSearchParams(search);
  const raw = sp.getAll(MAINTENANCE_WINDOW_SUBJECT_PARAM);
  if (raw.length === 0) {
    return { kind: "empty" };
  }
  const parsed: MaintenanceWindowSubjectRef[] = [];
  for (const line of raw) {
    const p = parseSubjectToken(line);
    if (!p) {
      return { kind: "invalid", reason: `Invalid subject token (use node:id or link:id): ${line}` };
    }
    parsed.push(p);
  }
  const deduped = dedupeSubjects(parsed);
  if (deduped.length > MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS) {
    return {
      kind: "invalid",
      reason: `At most ${MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS} distinct subjects after dedupe.`,
    };
  }
  return {
    kind: "ready",
    subjects: deduped,
    previewContext: parsePreviewContext(sp.get(MAINTENANCE_PREVIEW_CONTEXT_PARAM)),
    syncRunsLimit: readSyncRunsLimitFromSearch(search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT),
  };
}

export interface NavigateToMaintenanceWindowWorkspaceOptions {
  subjects: MaintenanceWindowSubjectRef[];
  previewContext?: MaintenancePreviewContext | null;
  syncRunsLimit?: number | null;
}

export function navigateToMaintenanceWindowWorkspace(options: NavigateToMaintenanceWindowWorkspaceOptions): void {
  const sp = mergeViewIntoSearch(window.location.search, VIEW_ID);
  sp.delete(MAINTENANCE_WINDOW_SUBJECT_PARAM);
  const deduped = dedupeSubjects(options.subjects).filter((s) => s.objectId.length > 0);
  for (const s of deduped) {
    sp.append(MAINTENANCE_WINDOW_SUBJECT_PARAM, `${s.objectKind}:${s.objectId}`);
  }
  const pctx = options.previewContext ?? "planning_window";
  sp.set(MAINTENANCE_PREVIEW_CONTEXT_PARAM, pctx);
  const lim = options.syncRunsLimit ?? DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT;
  sp.set("sync_runs_limit", String(Math.min(100, Math.max(1, Math.floor(lim)))));
  replaceUrlSearchParams(sp);
}

/** Clear subject list; stay on maintenance window workspace setup. */
export function navigateToMaintenanceWindowWorkspaceSetup(): void {
  const sp = mergeViewIntoSearch(window.location.search, VIEW_ID);
  sp.delete(MAINTENANCE_WINDOW_SUBJECT_PARAM);
  replaceUrlSearchParams(sp);
}

export { dedupeSubjects };

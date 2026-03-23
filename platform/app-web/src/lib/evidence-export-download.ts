import { ApiClientError, appApiBaseUrl } from "../api/client";

export type EvidenceExportFormat = "json" | "markdown";

export type EvidenceExportTarget =
  | { kind: "policy_dossier"; policyId: string }
  | { kind: "topology_object_dossier"; objectId: string }
  | { kind: "situation_room"; syncRunsLimit: number }
  | { kind: "investigation_workspace"; syncRunsLimit: number };

/** Builds the path and query string (no base URL) for tests and callers. */
export function buildEvidenceExportRequestPath(
  target: EvidenceExportTarget,
  format: EvidenceExportFormat,
): string {
  const q = `format=${format}`;
  switch (target.kind) {
    case "policy_dossier":
      return `/api/v1/exports/policies/${encodeURIComponent(target.policyId)}/dossier?${q}`;
    case "topology_object_dossier":
      return `/api/v1/exports/topology-objects/${encodeURIComponent(target.objectId)}/dossier?${q}`;
    case "situation_room": {
      const lim = Math.min(100, Math.max(1, Math.floor(target.syncRunsLimit)));
      return `/api/v1/exports/situation-room/summary?sync_runs_limit=${lim}&${q}`;
    }
    case "investigation_workspace": {
      const lim = Math.min(100, Math.max(1, Math.floor(target.syncRunsLimit)));
      return `/api/v1/exports/investigation-workspace/summary?sync_runs_limit=${lim}&${q}`;
    }
  }
}

function filenameBaseForTarget(target: EvidenceExportTarget): string {
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  switch (target.kind) {
    case "policy_dossier":
      return `evidence-export-policy-${safeSeg(target.policyId)}-${ts}`;
    case "topology_object_dossier":
      return `evidence-export-topology-${safeSeg(target.objectId)}-${ts}`;
    case "situation_room":
      return `evidence-export-situation-room-sync${Math.min(100, Math.max(1, Math.floor(target.syncRunsLimit)))}-${ts}`;
    case "investigation_workspace":
      return `evidence-export-investigation-sync${Math.min(100, Math.max(1, Math.floor(target.syncRunsLimit)))}-${ts}`;
  }
}

function safeSeg(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 96);
}

async function errorFromFailedResponse(response: Response): Promise<ApiClientError> {
  const text = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = null;
  }
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message: unknown }).message === "string"
  ) {
    return new ApiClientError(
      (payload as { message: string }).message,
      response.status,
      "http_error",
    );
  }
  return new ApiClientError(
    text.trim() ? text : `Request failed with status ${response.status}.`,
    response.status,
  );
}

/**
 * Fetches an evidence export from app-api and triggers a browser download.
 * Does not add new semantics—serializes the same bounded assemblies as the live views.
 */
export async function downloadEvidenceExport(
  target: EvidenceExportTarget,
  format: EvidenceExportFormat,
): Promise<void> {
  const path = buildEvidenceExportRequestPath(target, format);
  const url = `${appApiBaseUrl}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw await errorFromFailedResponse(response);
  }
  const body = await response.text();
  const ext = format === "json" ? "json" : "md";
  const mime =
    format === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8";
  const filename = `${filenameBaseForTarget(target)}.${ext}`;
  const blob = new Blob([body], { type: mime });
  const objUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objUrl);
}

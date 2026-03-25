import { ApiClientError, appApiBaseUrl } from "../api/client";
import type { MaintenancePreviewQuery } from "../api/client";

export type ChangeSafetyCaseDownloadFormat = "json" | "markdown";

/** Download target for GET /api/v1/reports/change-safety-case/* — not evidence_export_v1. */
export type ChangeSafetyCaseDownloadTarget =
  | { kind: "policy_change_safety"; policyId: string }
  | { kind: "service_change_safety"; serviceId: string }
  | { kind: "topology_change_safety"; query: MaintenancePreviewQuery };

export function buildChangeSafetyCaseRequestPath(
  target: ChangeSafetyCaseDownloadTarget,
  format: ChangeSafetyCaseDownloadFormat,
): string {
  const q = `format=${format}`;
  switch (target.kind) {
    case "policy_change_safety":
      return `/api/v1/reports/change-safety-case/policy?policy_id=${encodeURIComponent(target.policyId)}&${q}`;
    case "service_change_safety":
      return `/api/v1/reports/change-safety-case/service?service_id=${encodeURIComponent(target.serviceId)}&${q}`;
    case "topology_change_safety": {
      const params = new URLSearchParams();
      params.set("format", format);
      const mq = target.query;
      const nid = mq.nodeId?.trim();
      const lid = mq.linkId?.trim();
      const oid = mq.objectId?.trim();
      const ok = mq.objectKind ?? null;
      params.set("preview_context", mq.previewContext ?? "explicit_subject");
      if (nid) {
        params.set("node_id", nid);
      } else if (lid) {
        params.set("link_id", lid);
      } else if (oid && ok) {
        params.set("object_id", oid);
        params.set("object_kind", ok);
      }
      return `/api/v1/reports/change-safety-case/maintenance?${params.toString()}`;
    }
  }
}

function filenameBase(target: ChangeSafetyCaseDownloadTarget): string {
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  switch (target.kind) {
    case "policy_change_safety":
      return `change-safety-case-policy-${safeSeg(target.policyId)}-${ts}`;
    case "service_change_safety":
      return `change-safety-case-service-${safeSeg(target.serviceId)}-${ts}`;
    case "topology_change_safety": {
      const q = target.query;
      const id = q.nodeId?.trim() ?? q.linkId?.trim() ?? q.objectId?.trim() ?? "subject";
      return `change-safety-case-topology-${safeSeg(id)}-${ts}`;
    }
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
    return new ApiClientError((payload as { message: string }).message, response.status, "http_error");
  }
  return new ApiClientError(
    text.trim() ? text : `Request failed with status ${response.status}.`,
    response.status,
  );
}

export async function downloadChangeSafetyCase(
  target: ChangeSafetyCaseDownloadTarget,
  format: ChangeSafetyCaseDownloadFormat,
): Promise<void> {
  const path = buildChangeSafetyCaseRequestPath(target, format);
  const url = `${appApiBaseUrl}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw await errorFromFailedResponse(response);
  }
  const body = await response.text();
  const ext = format === "json" ? "json" : "md";
  const mime =
    format === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8";
  const filename = `${filenameBase(target)}.${ext}`;
  const blob = new Blob([body], { type: mime });
  const objUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objUrl);
}

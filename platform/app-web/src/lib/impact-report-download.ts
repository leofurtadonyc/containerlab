import { ApiClientError, appApiBaseUrl } from "../api/client";
import type { MaintenancePreviewQuery } from "../api/client";

export type ImpactReportDownloadFormat = "json" | "markdown";

export type ImpactReportDownloadTarget =
  | { kind: "service_impact"; serviceId: string }
  | { kind: "policy_impact"; policyId: string }
  | { kind: "maintenance_impact"; query: MaintenancePreviewQuery };

export function buildImpactReportRequestPath(
  target: ImpactReportDownloadTarget,
  format: ImpactReportDownloadFormat,
): string {
  const q = `format=${format}`;
  switch (target.kind) {
    case "service_impact":
      return `/api/v1/reports/service-impact?service_id=${encodeURIComponent(target.serviceId)}&${q}`;
    case "policy_impact":
      return `/api/v1/reports/policy-impact?policy_id=${encodeURIComponent(target.policyId)}&${q}`;
    case "maintenance_impact": {
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
      return `/api/v1/reports/maintenance-impact?${params.toString()}`;
    }
  }
}

function filenameBase(target: ImpactReportDownloadTarget): string {
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  switch (target.kind) {
    case "service_impact":
      return `impact-report-service-${safeSeg(target.serviceId)}-${ts}`;
    case "policy_impact":
      return `impact-report-policy-${safeSeg(target.policyId)}-${ts}`;
    case "maintenance_impact": {
      const q = target.query;
      const id = q.nodeId?.trim() ?? q.linkId?.trim() ?? q.objectId?.trim() ?? "subject";
      return `impact-report-maintenance-${safeSeg(id)}-${ts}`;
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

export async function downloadImpactReport(
  target: ImpactReportDownloadTarget,
  format: ImpactReportDownloadFormat,
): Promise<void> {
  const path = buildImpactReportRequestPath(target, format);
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

import type { ChangeSafetyCaseDownloadFormat } from "./change-safety-case-download";
import type { EvidenceExportFormat } from "./evidence-export-download";
import type { ImpactReportDownloadFormat } from "./impact-report-download";

export type DownloadEnvelopeFamily =
  | "evidence_export_v1"
  | "briefing_export_bundle_v1"
  | "impact_report_v1"
  | "change_safety_case_v1";

export type DownloadBoundaryPosture = "consumed" | "download-only" | "backend-only" | "client-only";

export const PHASE7_SUPPORTED_DOWNLOAD_FORMATS: readonly EvidenceExportFormat[] = ["json", "markdown"] as const;
export const PHASE7_SUPPORTED_REPORT_FORMATS: readonly ImpactReportDownloadFormat[] = ["json", "markdown"] as const;
export const PHASE7_SUPPORTED_CHANGE_SAFETY_FORMATS: readonly ChangeSafetyCaseDownloadFormat[] = [
  "json",
  "markdown",
] as const;

export interface DownloadBoundaryEntry {
  family: DownloadEnvelopeFamily;
  endpoint: string;
  posture: DownloadBoundaryPosture;
  filenamePrefix: string;
  note: string;
}

export const PHASE7_DOWNLOAD_BOUNDARY_REGISTRY: readonly DownloadBoundaryEntry[] = [
  {
    family: "evidence_export_v1",
    endpoint: "/api/v1/exports/policies/{policy_id}/dossier",
    posture: "download-only",
    filenamePrefix: "evidence-export-policy-",
    note: "Policy dossier snapshot export; replay-eligible evidence export envelope.",
  },
  {
    family: "evidence_export_v1",
    endpoint: "/api/v1/exports/topology-objects/{object_id}/dossier",
    posture: "download-only",
    filenamePrefix: "evidence-export-topology-",
    note: "Topology dossier snapshot export; replay-eligible evidence export envelope.",
  },
  {
    family: "evidence_export_v1",
    endpoint: "/api/v1/exports/situation-room/summary",
    posture: "download-only",
    filenamePrefix: "evidence-export-situation-room-",
    note: "Situation workspace snapshot export; replay-eligible evidence export envelope.",
  },
  {
    family: "evidence_export_v1",
    endpoint: "/api/v1/exports/investigation-workspace/summary",
    posture: "download-only",
    filenamePrefix: "evidence-export-investigation-",
    note: "Investigation workspace snapshot export; replay-eligible evidence export envelope.",
  },
  {
    family: "briefing_export_bundle_v1",
    endpoint: "/api/v1/exports/operator-briefing",
    posture: "download-only",
    filenamePrefix: "briefing-export-bundle-",
    note: "Briefing bundle archive; distinct from single evidence_export_v1 members.",
  },
  {
    family: "impact_report_v1",
    endpoint: "/api/v1/reports/service-impact",
    posture: "consumed",
    filenamePrefix: "impact-report-service-",
    note: "Service impact report route; not replay envelope.",
  },
  {
    family: "impact_report_v1",
    endpoint: "/api/v1/reports/policy-impact",
    posture: "consumed",
    filenamePrefix: "impact-report-policy-",
    note: "Policy impact report route; not replay envelope.",
  },
  {
    family: "impact_report_v1",
    endpoint: "/api/v1/reports/maintenance-impact",
    posture: "consumed",
    filenamePrefix: "impact-report-maintenance-",
    note: "Maintenance impact report route; not replay envelope.",
  },
  {
    family: "change_safety_case_v1",
    endpoint: "/api/v1/reports/change-safety-case/policy",
    posture: "consumed",
    filenamePrefix: "change-safety-case-policy-",
    note: "Policy change safety report route; not replay envelope.",
  },
  {
    family: "change_safety_case_v1",
    endpoint: "/api/v1/reports/change-safety-case/service",
    posture: "consumed",
    filenamePrefix: "change-safety-case-service-",
    note: "Service change safety report route; not replay envelope.",
  },
  {
    family: "change_safety_case_v1",
    endpoint: "/api/v1/reports/change-safety-case/maintenance",
    posture: "consumed",
    filenamePrefix: "change-safety-case-topology-",
    note: "Topology/maintenance change safety report route; not replay envelope.",
  },
  {
    family: "evidence_export_v1",
    endpoint: "/api/v1/exports/maintenance-window-handoff",
    posture: "backend-only",
    filenamePrefix: "maintenance-window-handoff-",
    note: "Resolved as backend-only in frontend posture; no Phase 7 download helper added.",
  },
  {
    family: "evidence_export_v1",
    endpoint: "evidence-replay-parser",
    posture: "client-only",
    filenamePrefix: "n/a",
    note: "Client-only parser accepts evidence_export_v1 and rejects report/workspace envelopes.",
  },
] as const;

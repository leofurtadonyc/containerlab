import type { ChangeEvidenceDomain } from "../api/contracts";

/** Human labels for change-intelligence / investigation domain slices (read-only). */
export const CHANGE_INTELLIGENCE_DOMAIN_LABELS: Record<ChangeEvidenceDomain, string> = {
  devices: "Devices",
  topology: "Topology",
  policies: "Policies",
  readiness: "Readiness",
  workflow_history: "Workflow history",
  audit_history: "Audit history",
};

export function evidenceStatusPillClass(evidenceStatus: string): string {
  switch (evidenceStatus) {
    case "present":
      return "status-pill status-good";
    case "partial":
      return "status-pill status-warn";
    default:
      return "status-pill status-neutral";
  }
}

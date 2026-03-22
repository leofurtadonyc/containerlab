import type { RecentChangeDomainSlice } from "../api/contracts";

/** Counts how many domains reported each evidence posture in a change-intelligence summary. */
export function countRecentChangeEvidenceStatuses(domains: RecentChangeDomainSlice[]): {
  present: number;
  partial: number;
  absent: number;
} {
  return {
    present: domains.filter((d) => d.evidence_status === "present").length,
    partial: domains.filter((d) => d.evidence_status === "partial").length,
    absent: domains.filter((d) => d.evidence_status === "absent").length,
  };
}

import type { SituationPackAssemblyResponse } from "../api/contracts";
import { CHANGE_INTELLIGENCE_DOMAIN_LABELS } from "./change-intelligence-domain-labels";

/**
 * Bounded, evidence-backed gap callouts derived from fields already in the situation pack.
 * Does not synthesize forensic timelines, workflow chronology, or cross-domain scores.
 */
export function buildSituationEvidenceGapNotes(data: SituationPackAssemblyResponse): string[] {
  const out: string[] = [];
  const rc = data.investigation_context.recent_change;

  for (const slice of rc.domains) {
    if (slice.evidence_status === "absent" || slice.evidence_status === "partial") {
      const label = CHANGE_INTELLIGENCE_DOMAIN_LABELS[slice.domain];
      out.push(`${label} (${slice.evidence_status}): ${slice.headline}`);
    }
  }

  if (data.readiness.data_status === "empty") {
    out.push(
      "Readiness snapshot history: no persisted rows in this workspace for the list returned in this pack.",
    );
  }

  const degradedCore =
    data.devices.data_status === "degraded" ||
    data.topology.data_status === "degraded" ||
    data.policies.data_status === "degraded";

  if (degradedCore) {
    out.push(
      "Devices, topology, or policies include a degraded read-side posture in this assembly—see full pages for collector health and fallback detail.",
    );
  }

  if (data.workflow_history.data_status === "empty" && data.audit_history.data_status === "empty") {
    out.push(
      "Workflow history and audit history are both empty here—no persisted sync-substrate events in the bounded loads included in this pack.",
    );
  }

  return out.slice(0, 16);
}

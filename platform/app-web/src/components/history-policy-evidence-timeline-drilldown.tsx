import type { PolicyEvidenceTimelineDrilldownRow } from "../lib/history-evidence-drilldown";
import { navigateToPolicyDossierWorkspace } from "../lib/policy-dossier-navigation";
import { navigateToPoliciesPolicyEvidenceTimelineFocus } from "../lib/topology-policy-navigation";

export interface HistoryPolicyEvidenceTimelineDrilldownProps {
  rows: PolicyEvidenceTimelineDrilldownRow[];
  /** When set, **Open policy dossier** uses a bounded client-only entry hint (`policy_dossier_entry`). */
  dossierEntryHint?: "workflow_history_drilldown" | "audit_history_drilldown";
}

/**
 * Read-only drillthrough from workflow-history / audit-history rows that carry a persisted policy
 * comparison preview. Opens Policies with the policy selected and the evidence timeline panel in
 * focus (client-only URL hint)—not workflow execution scope.
 */
export function HistoryPolicyEvidenceTimelineDrilldown({
  rows,
  dossierEntryHint,
}: HistoryPolicyEvidenceTimelineDrilldownProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="history-evidence-drilldown">
      <p className="summary-label">Policy evidence timeline (from comparison preview)</p>
      <p className="table-note">
        These buttons use policy ids surfaced in this row&apos;s bounded persisted comparison preview.
        The timeline orders read-side anchors only—not workflow causality or validation.{" "}
        <strong>Open policy dossier</strong> lands on the composed policy briefing (same policy id).
      </p>
      <div className="history-evidence-drilldown-actions">
        {rows.map((row) => (
          <div key={row.policyId} className="history-evidence-drilldown-row">
            <button
              type="button"
              className="nav-drilldown-button"
              onClick={() => navigateToPoliciesPolicyEvidenceTimelineFocus(row.policyId)}
            >
              Policy timeline · {row.policyName.trim() ? row.policyName : row.policyId}
            </button>
            {dossierEntryHint ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToPolicyDossierWorkspace(row.policyId, dossierEntryHint)}
              >
                Policy dossier · {row.policyName.trim() ? row.policyName : row.policyId}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

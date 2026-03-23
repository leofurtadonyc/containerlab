import type { PolicyEvidenceTimelineDrilldownRow } from "../lib/history-evidence-drilldown";
import { navigateToPoliciesPolicyEvidenceTimelineFocus } from "../lib/topology-policy-navigation";

export interface HistoryPolicyEvidenceTimelineDrilldownProps {
  rows: PolicyEvidenceTimelineDrilldownRow[];
}

/**
 * Read-only drillthrough from workflow-history / audit-history rows that carry a persisted policy
 * comparison preview. Opens Policies with the policy selected and the evidence timeline panel in
 * focus (client-only URL hint)—not workflow execution scope.
 */
export function HistoryPolicyEvidenceTimelineDrilldown({
  rows,
}: HistoryPolicyEvidenceTimelineDrilldownProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="history-evidence-drilldown">
      <p className="summary-label">Policy evidence timeline (from comparison preview)</p>
      <p className="table-note">
        These buttons use policy ids surfaced in this row&apos;s bounded persisted comparison preview.
        The timeline orders read-side anchors only—not workflow causality or validation.
      </p>
      <div className="history-evidence-drilldown-actions">
        {rows.map((row) => (
          <button
            key={row.policyId}
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToPoliciesPolicyEvidenceTimelineFocus(row.policyId)}
          >
            Policy timeline · {row.policyName.trim() ? row.policyName : row.policyId}
          </button>
        ))}
      </div>
    </div>
  );
}

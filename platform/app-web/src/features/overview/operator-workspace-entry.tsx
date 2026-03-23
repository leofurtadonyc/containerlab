import { navigateToPolicyDossierWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToEvidenceView } from "../../lib/url-app-state";
import {
  navigateToPoliciesPolicyEvidenceDeltaFocus,
  navigateToPoliciesPolicyEvidenceTimelineFocus,
  navigateToTopologyObject,
} from "../../lib/topology-policy-navigation";

export interface OperatorWorkspaceEntryProps {
  /** First node id from the loaded topology slice, when present. */
  firstNodeId: string | null;
  /** First policy id from the loaded policies inventory, when present. */
  firstPolicyId: string | null;
}

/**
 * High-level operator pivots into week 28 read-side surfaces: topology risk attention, failure impact,
 * policy evidence timeline/delta, using only existing navigation helpers (no new backend contracts).
 */
export function OperatorWorkspaceEntry({ firstNodeId, firstPolicyId }: OperatorWorkspaceEntryProps) {
  return (
    <article className="detail-card operator-workspace-entry">
      <h3>Operator workspace</h3>
      <p className="table-note">
        Shortcuts into topology risk attention, failure impact on a concrete object, and policy evidence
        timeline and delta. The <strong>Investigation workspace</strong> card below opens the bounded read-only
        assembly with the same sync window as Recent change.
      </p>

      <div className="operator-workspace-entry__section">
        <p className="summary-label">Topology risk</p>
        <p className="table-note">
          Ranked attention is on the Topology view; a compact summary also appears further down this page.
        </p>
        <div className="operator-workspace-entry__actions">
          <a href="#topology-risk-attention" className="inline-action">
            Jump to topology risk on this page
          </a>
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("topology")}>
            Open topology view (full table)
          </button>
        </div>
      </div>

      <div className="operator-workspace-entry__section">
        <p className="summary-label">Failure impact</p>
        <p className="table-note">
          Opens Topology with the first available node selected so the failure-impact panel can ground on a
          concrete object identity.
        </p>
        <div className="operator-workspace-entry__actions">
          {firstNodeId ? (
            <button
              type="button"
              className="inline-action"
              onClick={() => navigateToTopologyObject(firstNodeId, "node")}
            >
              Open failure impact (first node)
            </button>
          ) : (
            <span className="table-note">No topology nodes on the current slice yet.</span>
          )}
        </div>
      </div>

      <div className="operator-workspace-entry__section">
        <p className="summary-label">Policy evidence</p>
        <p className="table-note">
          Timeline and delta are assembly panels on Policies; the first policy row is a stable entry when the
          inventory lists at least one id.
        </p>
        <div className="operator-workspace-entry__actions">
          {firstPolicyId ? (
            <>
              <button
                type="button"
                className="inline-action"
                onClick={() => navigateToPoliciesPolicyEvidenceTimelineFocus(firstPolicyId)}
              >
                Evidence timeline (first policy)
              </button>
              <button
                type="button"
                className="inline-action"
                onClick={() => navigateToPoliciesPolicyEvidenceDeltaFocus(firstPolicyId)}
              >
                Evidence delta (first policy)
              </button>
              <button
                type="button"
                className="inline-action"
                onClick={() =>
                  navigateToPolicyDossierWorkspace(firstPolicyId, "overview_operator_workspace")
                }
              >
                Policy dossier (first policy)
              </button>
            </>
          ) : (
            <span className="table-note">No policy rows on the current slice yet.</span>
          )}
        </div>
      </div>
    </article>
  );
}

import type {
  PoliciesListResponse,
  TopologyRiskSummaryResponse,
  TopologyRiskSummaryRow,
} from "../../api/contracts";
import { navigateToImpactReportForMaintenance, navigateToImpactReportForPolicy } from "../../lib/impact-report-navigation";
import { navigateToMaintenancePreviewForTopologyObject } from "../../lib/maintenance-preview-navigation";
import { pickStrongestPolicyId } from "../../lib/noc-cockpit-priority";
import { navigateToPolicyExplainabilityWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToServiceExplorer, navigateToServiceExplorerForPolicy } from "../../lib/service-explorer-navigation";
import { navigateToServiceDossierForPolicy } from "../../lib/service-dossier-navigation";

export interface NocCockpitOperatorLaunchGridProps {
  firstNodeId: string | null;
  firstPolicyId: string | null;
  policiesData: PoliciesListResponse | null;
  riskSummary: TopologyRiskSummaryResponse | null;
}

function openImpactReportForTopRisk(row: TopologyRiskSummaryRow): void {
  if (row.object_kind === "node") {
    navigateToImpactReportForMaintenance({
      nodeId: row.object_id,
      previewContext: "planning_window",
    });
  } else {
    navigateToImpactReportForMaintenance({
      linkId: row.object_id,
      previewContext: "planning_window",
    });
  }
}

/**
 * Cockpit 3.0 — primary launch surfaces into Service Explorer, explainability, maintenance preview, and impact
 * reports using the same strongest-row selection as priority navigation (composition-only; no new assemblies).
 */
export function NocCockpitOperatorLaunchGrid({
  firstNodeId,
  firstPolicyId,
  policiesData,
  riskSummary,
}: NocCockpitOperatorLaunchGridProps) {
  const topRisk = riskSummary?.ranked_objects?.[0] ?? null;
  const strongPolicyId = pickStrongestPolicyId(policiesData, firstPolicyId);

  return (
    <div className="noc-cockpit__launch-grid" data-testid="noc-cockpit-operator-launch">
      <p className="table-note noc-cockpit__launch-grid-preface">
        <strong>Primary launch surfaces</strong> — anchored on the same <strong>top risk-summary row</strong> and{" "}
        <strong>worst degraded_policy_v1</strong> inventory ordering as priority navigation below. Read-only routing,{" "}
        <strong>not</strong> incident priority or maintenance approval.
      </p>
      <div className="noc-cockpit__quick-grid">
        <article className="detail-card noc-cockpit-launch-card" data-testid="noc-cockpit-launch-service-explorer">
          <h3>Service Explorer</h3>
          <p className="table-note">
            Service-centric inventory and policy groupings — bounded read-side lens, <strong>not</strong> a new catalog
            or validation verdict.
          </p>
          <div className="noc-cockpit-launch-card__actions">
            <button type="button" className="nav-drilldown-button" onClick={() => navigateToServiceExplorer({})}>
              Open Service Explorer
            </button>
            {strongPolicyId ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToServiceExplorerForPolicy(strongPolicyId)}
              >
                Service lens (strongest policy row)
              </button>
            ) : (
              <span className="table-note">No policy id yet for a service lens shortcut.</span>
            )}
            {strongPolicyId ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToServiceDossierForPolicy(strongPolicyId)}
                title="service_dossier_v1 — composed workspace; same policy: anchor as Service Explorer"
              >
                Service dossier (strongest policy row)
              </button>
            ) : null}
          </div>
        </article>

        <article className="detail-card noc-cockpit-launch-card" data-testid="noc-cockpit-launch-explainability">
          <h3>Policy explainability</h3>
          <p className="table-note">
            Path story, candidates, and caveats for a single policy — interpretation support from existing assemblies,{" "}
            <strong>not</strong> dataplane proof.
          </p>
          <div className="noc-cockpit-launch-card__actions">
            {strongPolicyId ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToPolicyExplainabilityWorkspace(strongPolicyId)}
              >
                Open explainability (strongest policy row)
              </button>
            ) : (
              <span className="table-note">No policy row to anchor explainability yet.</span>
            )}
          </div>
        </article>

        <article className="detail-card noc-cockpit-launch-card" data-testid="noc-cockpit-launch-maintenance-preview">
          <h3>Maintenance preview</h3>
          <p className="table-note">
            Bounded co-occurring relationships around a topology subject — planning context, <strong>not</strong>{" "}
            scheduling authority.
          </p>
          <div className="noc-cockpit-launch-card__actions">
            {topRisk ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() =>
                  navigateToMaintenancePreviewForTopologyObject(topRisk.object_id, topRisk.object_kind, {
                    previewContext: "planning_window",
                  })
                }
              >
                Maintenance preview (top risk row)
              </button>
            ) : firstNodeId ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() =>
                  navigateToMaintenancePreviewForTopologyObject(firstNodeId, "node", {
                    previewContext: "explicit_subject",
                  })
                }
              >
                Maintenance preview (first topology node)
              </button>
            ) : (
              <span className="table-note">No topology anchor for maintenance preview yet.</span>
            )}
          </div>
        </article>

        <article className="detail-card noc-cockpit-launch-card" data-testid="noc-cockpit-launch-impact-report">
          <h3>Impact report</h3>
          <p className="table-note">
            Composed <code>impact_report_v1</code> handoff — narrative packaging over the same contracts,{" "}
            <strong>not</strong> a substitute for live dossiers or exports when you need frozen evidence replay.
          </p>
          <div className="noc-cockpit-launch-card__actions">
            {strongPolicyId ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToImpactReportForPolicy(strongPolicyId)}
              >
                Policy impact report (strongest row)
              </button>
            ) : null}
            {topRisk ? (
              <button type="button" className="nav-drilldown-button" onClick={() => openImpactReportForTopRisk(topRisk)}>
                Maintenance impact report (top risk row)
              </button>
            ) : null}
            {!strongPolicyId && !topRisk ? (
              <span className="table-note">No policy or ranked topology row to anchor an impact report yet.</span>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}

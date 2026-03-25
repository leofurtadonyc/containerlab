import type { PoliciesListResponse, TopologyRiskSummaryResponse } from "../../api/contracts";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  navigateToInvestigationView,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { navigateToImpactReportForMaintenance, navigateToImpactReportForPolicy } from "../../lib/impact-report-navigation";
import { worstDegradedPolicyFirst } from "../../lib/noc-cockpit-priority";
import { navigateToPolicyDossierWorkspace, navigateToPolicyExplainabilityWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToMaintenancePreviewForTopologyObject } from "../../lib/maintenance-preview-navigation";
import { navigateToTopologyDossier } from "../../lib/topology-dossier-navigation";
import { navigateToServiceExplorerForPolicy } from "../../lib/service-explorer-navigation";

export interface NocCockpitStrategicPivotsProps {
  riskSummary: TopologyRiskSummaryResponse | null;
  policiesData: PoliciesListResponse | null;
}

/**
 * One-click pivots from **strongest** cockpit signals: top risk-summary row + worst degraded policy row —
 * navigation only, same contracts as the tables below.
 */
export function NocCockpitStrategicPivots({ riskSummary, policiesData }: NocCockpitStrategicPivotsProps) {
  const topRisk = riskSummary?.ranked_objects?.[0] ?? null;
  const sortedPolicies =
    policiesData && policiesData.items.length > 0 ? worstDegradedPolicyFirst(policiesData.items) : [];
  const topDegraded = sortedPolicies[0] ?? null;

  const syncRuns =
    typeof window !== "undefined"
      ? readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)
      : DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT;

  if (!topRisk && !topDegraded) {
    return (
      <article className="detail-card noc-cockpit-strategic-pivots" data-testid="noc-cockpit-strategic-pivots">
        <h3>Priority navigation (cockpit)</h3>
        <p className="table-note">
          No ranked topology attention or policy inventory rows yet — use the workspace cards and tables below when
          data loads.
        </p>
      </article>
    );
  }

  return (
    <article className="detail-card noc-cockpit-strategic-pivots" data-testid="noc-cockpit-strategic-pivots">
      <h3>Priority navigation (cockpit)</h3>
      <p className="table-note">
        Derived from the <strong>top risk-summary row</strong> and <strong>worst degraded_policy_v1</strong> inventory
        row — read-only navigation suggestions, <strong>not</strong> incident priority or approval to change the
        network.
      </p>
      <div className="noc-cockpit-strategic-pivots__grid">
        {topRisk ? (
          <div className="noc-cockpit-strategic-pivots__cluster">
            <p className="summary-label">Top topology attention</p>
            <p className="table-note">
              <strong>{topRisk.object_kind}</strong> <code>{topRisk.object_id}</code> · rank {topRisk.rank_index}
            </p>
            <div className="noc-cockpit-strategic-pivots__actions">
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() =>
                  navigateToTopologyDossier(topRisk.object_id, topRisk.object_kind, "overview_risk")
                }
              >
                Topology dossier (top risk)
              </button>
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() =>
                  navigateToMaintenancePreviewForTopologyObject(topRisk.object_id, topRisk.object_kind, {
                    previewContext: "planning_window",
                  })
                }
              >
                Maintenance preview (top risk)
              </button>
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() =>
                  navigateToInvestigationView(syncRuns, {
                    invFrom: "overview",
                    topologyObject: { id: topRisk.object_id, kind: topRisk.object_kind },
                    riskSummaryEntry: true,
                  })
                }
              >
                Investigation (top risk)
              </button>
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() =>
                  topRisk.object_kind === "node"
                    ? navigateToImpactReportForMaintenance({
                        nodeId: topRisk.object_id,
                        previewContext: "planning_window",
                      })
                    : navigateToImpactReportForMaintenance({
                        linkId: topRisk.object_id,
                        previewContext: "planning_window",
                      })
                }
              >
                Impact report (maintenance, top risk)
              </button>
            </div>
          </div>
        ) : null}
        {topDegraded ? (
          <div className="noc-cockpit-strategic-pivots__cluster">
            <p className="summary-label">Worst degraded policy (inventory sort)</p>
            <p className="table-note">
              <strong>{topDegraded.policy_name.trim() ? topDegraded.policy_name : topDegraded.policy_id}</strong> ·{" "}
              <code>{topDegraded.policy_id}</code> · posture <strong>{topDegraded.degraded_policy_v1.posture}</strong>
            </p>
            <div className="noc-cockpit-strategic-pivots__actions">
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToPolicyDossierWorkspace(topDegraded.policy_id, "overview_noc_cockpit")}
              >
                Policy dossier (worst degraded)
              </button>
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToServiceExplorerForPolicy(topDegraded.policy_id)}
              >
                Service Explorer (same policy)
              </button>
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToPolicyExplainabilityWorkspace(topDegraded.policy_id)}
              >
                Policy explainability (worst degraded)
              </button>
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToImpactReportForPolicy(topDegraded.policy_id)}
              >
                Impact report (policy, worst degraded)
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

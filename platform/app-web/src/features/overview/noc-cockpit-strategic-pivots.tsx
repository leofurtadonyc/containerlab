import type { PoliciesListResponse, TopologyRiskSummaryResponse } from "../../api/contracts";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  navigateToInvestigationView,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { navigateToPolicyDossierWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToTopologyDossier } from "../../lib/topology-dossier-navigation";

const POSTURE_RANK: Record<string, number> = {
  degraded: 0,
  unknown: 1,
  ok: 2,
};

function worstPolicyFirst(items: PoliciesListResponse["items"]) {
  return [...items].sort((a, b) => {
    const pa = POSTURE_RANK[a.degraded_policy_v1.posture] ?? 99;
    const pb = POSTURE_RANK[b.degraded_policy_v1.posture] ?? 99;
    if (pa !== pb) {
      return pa - pb;
    }
    return a.policy_id.localeCompare(b.policy_id);
  });
}

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
    policiesData && policiesData.items.length > 0 ? worstPolicyFirst(policiesData.items) : [];
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
                  navigateToInvestigationView(syncRuns, {
                    invFrom: "overview",
                    topologyObject: { id: topRisk.object_id, kind: topRisk.object_kind },
                    riskSummaryEntry: true,
                  })
                }
              >
                Investigation (top risk)
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
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

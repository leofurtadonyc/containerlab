import type {
  PoliciesListResponse,
  RecentChangeSummaryResponse,
  TopologyRiskSummaryResponse,
} from "../../api/contracts";
import { InvestigationOverviewEntry } from "./investigation-entry";
import { OperatorWorkspaceEntry } from "./operator-workspace-entry";
import { SituationRoomOverviewEntry } from "./situation-room-entry";
import { RecentChangeIntelligencePanel } from "./recent-change";
import { DegradedPoliciesAttention } from "./degraded-policies-attention";
import { TopologyRiskAttentionPanel } from "../topology/topology-risk-attention-panel";

export interface NocCockpitSectionProps {
  syncRunsLimit: number;
  firstNodeId: string | null;
  firstPolicyId: string | null;
  policiesData: PoliciesListResponse | null;
  recentChange: {
    data: RecentChangeSummaryResponse | null;
    error: { message: string } | null;
    isLoading: boolean;
    reload: () => void | Promise<void>;
  };
  riskSummary: {
    data: TopologyRiskSummaryResponse | null;
    error: { message: string } | null;
    isLoading: boolean;
    isRefreshing: boolean;
    reload: () => void | Promise<void>;
  };
}

/**
 * NOC cockpit v1 — composes existing Phase 2 read surfaces only (see `platform/docs/noc-cockpit-contract.md`).
 */
export function NocCockpitSection({
  syncRunsLimit,
  firstNodeId,
  firstPolicyId,
  policiesData,
  recentChange,
  riskSummary,
}: NocCockpitSectionProps) {
  return (
    <div className="noc-cockpit" data-testid="noc-cockpit-section">
      <header className="noc-cockpit__hero">
        <p className="eyebrow">noc_cockpit_v1 · Phase 2 read-only</p>
        <h3 id="noc-cockpit-heading">NOC cockpit</h3>
        <p className="body-copy noc-cockpit__lede">
          Bounded situational awareness from the same inventory, risk summary, change intelligence, and workspace
          assemblies already exposed by app-api — <strong>not</strong> incident command, unified health scoring, or
          substitute for full Policies / Topology / Investigation / Situation room views.
        </p>
      </header>

      <p className="callout noc-cockpit__search-hint">
        <strong>Global search</strong> stays in the shell header above — same{" "}
        <code>operator_search_pivot_v1</code> contract; not log or metrics search.
      </p>

      <div className="noc-cockpit__quick-grid">
        <SituationRoomOverviewEntry syncRunsLimit={syncRunsLimit} />
        <InvestigationOverviewEntry syncRunsLimit={syncRunsLimit} />
      </div>

      <RecentChangeIntelligencePanel
        data={recentChange.data}
        error={recentChange.error}
        isLoading={recentChange.isLoading}
        onRetry={recentChange.reload}
      />

      <TopologyRiskAttentionPanel
        variant="overview"
        data={riskSummary.data}
        error={riskSummary.error}
        isLoading={riskSummary.isLoading}
        isRefreshing={riskSummary.isRefreshing}
        onRetry={riskSummary.reload}
      />

      <DegradedPoliciesAttention data={policiesData} />

      <OperatorWorkspaceEntry firstNodeId={firstNodeId} firstPolicyId={firstPolicyId} />

      <div className="callout">
        <strong>Navigation suggestions</strong>
        <p className="table-note">
          Quick entries and dossier buttons above derive from visible ranked rows and inventory classification — read-only
          pivots, <strong>not</strong> incident priority or change approval.
        </p>
      </div>
    </div>
  );
}

import type {
  PoliciesListResponse,
  TopologyRiskSummaryResponse,
  TopologyRiskSummaryRow,
} from "../../api/contracts";
import { navigateToImpactReportForMaintenance, navigateToImpactReportForPolicy } from "../../lib/impact-report-navigation";
import { navigateToChangeSafetyCaseForMaintenance, navigateToChangeSafetyCaseForPolicy } from "../../lib/change-safety-case-navigation";
import { navigateToMaintenanceEvidenceWorkspaceForTopologyObject } from "../../lib/maintenance-evidence-workspace-navigation";
import { navigateToMaintenancePreviewForTopologyObject } from "../../lib/maintenance-preview-navigation";
import { pickStrongestPolicyId } from "../../lib/noc-cockpit-priority";
import { navigateToPolicyExplainabilityWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToPathExplorer } from "../../lib/path-explorer-navigation";
import { navigateToServiceImpactWorkspace } from "../../lib/service-impact-workspace-navigation";
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

function openChangeSafetyCaseForTopRisk(row: TopologyRiskSummaryRow): void {
  if (row.object_kind === "node") {
    navigateToChangeSafetyCaseForMaintenance({
      nodeId: row.object_id,
      previewContext: "planning_window",
    });
  } else {
    navigateToChangeSafetyCaseForMaintenance({
      linkId: row.object_id,
      previewContext: "planning_window",
    });
  }
}

/**
 * Cockpit 3.0 — primary launch surfaces into Service Explorer, explainability, maintenance preview / evidence workspace, impact reports,
 * and change safety cases using the same strongest-row selection as priority navigation (composition-only; no new assemblies).
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
            {strongPolicyId ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToServiceImpactWorkspace(`policy:${strongPolicyId}`)}
                title="service_impact_workspace_v1 — composed Explorer + optional failure-impact; same policy: anchor as Service lens"
              >
                Service Impact workspace (strongest policy row)
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
            {strongPolicyId ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToPathExplorer(strongPolicyId)}
                title="path_explorer_v1 — composed path workspace; same policy anchor as explainability"
              >
                Open Path Explorer (strongest policy row)
              </button>
            ) : null}
          </div>
        </article>

        <article className="detail-card noc-cockpit-launch-card" data-testid="noc-cockpit-launch-maintenance-preview">
          <h3>Maintenance preview &amp; evidence</h3>
          <p className="table-note">
            <strong>Preview</strong> is the narrow maintenance assembly; <strong>evidence workspace</strong> adds dossier,
            timeline, delta, and change-safety nesting — both are read-only planning context, <strong>not</strong>{" "}
            scheduling authority, <code>evidence_export_v1</code>, or impact / CSC substitutes.
          </p>
          <div className="noc-cockpit-launch-card__actions">
            {topRisk ? (
              <>
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
                <button
                  type="button"
                  className="nav-drilldown-button"
                  onClick={() =>
                    navigateToMaintenanceEvidenceWorkspaceForTopologyObject(topRisk.object_id, topRisk.object_kind, {
                      previewContext: "planning_window",
                    })
                  }
                  title="maintenance_evidence_workspace_v1 — not evidence_export_v1"
                >
                  Maintenance evidence workspace (top risk row)
                </button>
              </>
            ) : firstNodeId ? (
              <>
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
                <button
                  type="button"
                  className="nav-drilldown-button"
                  onClick={() =>
                    navigateToMaintenanceEvidenceWorkspaceForTopologyObject(firstNodeId, "node", {
                      previewContext: "explicit_subject",
                    })
                  }
                  title="maintenance_evidence_workspace_v1 — not evidence_export_v1"
                >
                  Maintenance evidence workspace (first topology node)
                </button>
              </>
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

        <article className="detail-card noc-cockpit-launch-card" data-testid="noc-cockpit-launch-change-safety-case">
          <h3>Change safety case</h3>
          <p className="table-note">
            Composed <code>change_safety_case_v1</code> pre-change posture — evidence gaps and advisory follow-ups,{" "}
            <strong>not</strong> approval or safe-to-change truth.
          </p>
          <div className="noc-cockpit-launch-card__actions">
            {strongPolicyId ? (
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateToChangeSafetyCaseForPolicy(strongPolicyId)}
              >
                Policy change safety case (strongest row)
              </button>
            ) : null}
            {topRisk ? (
              <button type="button" className="nav-drilldown-button" onClick={() => openChangeSafetyCaseForTopRisk(topRisk)}>
                Topology change safety case (top risk row)
              </button>
            ) : null}
            {!strongPolicyId && !topRisk ? (
              <span className="table-note">No policy or ranked topology row to anchor a change safety case yet.</span>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}

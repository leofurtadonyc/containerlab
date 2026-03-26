import { ErrorState, LoadingState } from "../../components/query-states";
import { ApiClientError } from "../../api/client";
import type { ServiceImpactWorkspaceResponse } from "../../api/contracts";
import { formatDateTime, formatLabel } from "../../lib/presentation";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { navigateToInvestigationView } from "../../lib/investigation-navigation";
import { navigateToOperatorBriefingView } from "../../lib/operator-briefing-navigation";
import { navigateToPolicyDossierWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToImpactReportForService } from "../../lib/impact-report-navigation";
import { navigateToChangeSafetyCaseForPolicy, navigateToChangeSafetyCaseForService } from "../../lib/change-safety-case-navigation";
import { navigateToMaintenanceEvidenceWorkspaceForTopologyObject } from "../../lib/maintenance-evidence-workspace-navigation";
import { navigateToMaintenancePreview } from "../../lib/maintenance-preview-navigation";
import { navigateToServiceExplorer } from "../../lib/service-explorer-navigation";
import { navigateToServiceDossier } from "../../lib/service-dossier-navigation";
import { navigateToEvidenceConsistencyWorkspace } from "../../lib/evidence-consistency-navigation";
import { navigateToDeltaDigestView } from "../../lib/delta-digest-navigation";
import { navigateToEvidenceView } from "../../lib/url-app-state";
import { useServiceImpactWorkspaceQuery } from "./api";

export interface ServiceImpactWorkspaceProductProps {
  serviceId: string;
}

function posturePillClass(posture: string): string {
  if (posture === "degraded") {
    return "status-pill status-bad";
  }
  if (posture === "unknown") {
    return "status-pill status-warn";
  }
  return "status-pill status-good";
}

function topologyStatusPillClass(
  status: ServiceImpactWorkspaceResponse["service_explorer"]["topology_evidence_status"],
): string {
  if (status === "present") {
    return "status-pill status-good";
  }
  if (status === "partial") {
    return "status-pill status-warn";
  }
  return "status-pill status-bad";
}

export function ServiceImpactWorkspaceProduct({ serviceId }: ServiceImpactWorkspaceProductProps) {
  const { data, error, isLoading, isRefreshing, reload } = useServiceImpactWorkspaceQuery(serviceId);

  if (isLoading && !data) {
    return (
      <div className="service-impact-workspace-product" data-contract="service_impact_workspace_v1">
        <header className="service-impact-workspace-product__header">
          <p className="eyebrow">Phase 2 · service_impact_workspace_v1</p>
          <h2>Service Impact Workspace</h2>
        </header>
        <LoadingState label="Loading Service Impact workspace (composed read-only GET)…" />
      </div>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <div className="service-impact-workspace-product" data-contract="service_impact_workspace_v1">
        <header className="service-impact-workspace-product__header">
          <p className="eyebrow">Phase 2 · service_impact_workspace_v1</p>
          <h2>Service Impact Workspace</h2>
        </header>
        {isNotFound ? (
          <div className="query-message">
            <strong>Workspace not available for this service_id</strong>
            <p>
              The id is unsupported or has no members in the current inventory slice (same honesty as Service Explorer
              detail). Choose another anchor from Service Explorer or paste a known service_id.
            </p>
          </div>
        ) : (
          <ErrorState error={error} onRetry={() => void reload()} />
        )}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <ServiceImpactWorkspaceBody data={data} isRefreshing={isRefreshing} onReload={() => void reload()} />
  );
}

function ServiceImpactWorkspaceBody({
  data,
  isRefreshing,
  onReload,
}: {
  data: ServiceImpactWorkspaceResponse;
  isRefreshing: boolean;
  onReload: () => void;
}) {
  const ex = data.service_explorer;
  const fi = data.failure_impact;
  const syncLim = readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT);
  const firstPolicy = ex.members[0]?.policy_id;
  const firstNode = ex.topology_links[0]?.node_id;

  return (
    <div className="service-impact-workspace-product" data-contract="service_impact_workspace_v1">
      <header className="service-impact-workspace-product__header">
        <div>
          <p className="eyebrow">Phase 2 · service_impact_workspace_v1</p>
          <h2>Service Impact Workspace</h2>
          <p className="table-note">
            Composed workspace over Service Explorer and optional failure-impact — <strong>not</strong> blast-radius
            truth, incident command, or safe-to-change authority. Nested JSON remains authoritative per contract.{" "}
            <strong>Not</strong> Service dossier (no dossier explainability/maintenance assembly here) and{" "}
            <strong>not</strong> Impact Report (<code>impact_report_v1</code> communication envelope).
          </p>
        </div>
      </header>

      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing workspace…
        </p>
      ) : null}

      <section className="detail-card" aria-labelledby="siw-subject">
        <h3 id="siw-subject">Subject and scope</h3>
        <p>
          <code>{data.service_id}</code> · kind <strong>{ex.kind}</strong>
        </p>
        <p className="footnote">
          Source contracts: {data.source_contract_ids.join(", ")}
        </p>
        <p className="footnote">
          Explorer generated {formatDateTime(ex.generated_at)} · metadata phase {ex.phase}
        </p>
      </section>

      <section className="detail-card" aria-labelledby="siw-grouping">
        <h3 id="siw-grouping">Affected service grouping summary</h3>
        <p className="policy-detail-metric">
          <span className="policy-detail-metric__label">Members</span>
          <span className="policy-detail-metric__value">{ex.members_total}</span>
        </p>
        <p className="policy-detail-metric">
          <span className="policy-detail-metric__label">Group degraded posture</span>
          <span className={posturePillClass(ex.degraded_service.posture)}>{ex.degraded_service.posture}</span>
        </p>
        <p className="policy-detail-metric">
          <span className="policy-detail-metric__label">Topology evidence</span>
          <span className={topologyStatusPillClass(ex.topology_evidence_status)}>
            {ex.topology_evidence_status}
          </span>
        </p>
      </section>

      <section className="detail-card" aria-labelledby="siw-members">
        <h3 id="siw-members">Related policies (members)</h3>
        {ex.members.length === 0 ? (
          <p className="footnote">No members on this assembly (sparse).</p>
        ) : (
          <ul className="notes-list">
            {ex.members.map((m) => (
              <li key={m.policy_id}>
                <strong>{m.policy_name}</strong> · <code>{m.policy_id}</code> · degraded{" "}
                <span className={posturePillClass(m.degraded_policy_v1.posture)}>{m.degraded_policy_v1.posture}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-card" aria-labelledby="siw-topo">
        <h3 id="siw-topo">Topology anchors</h3>
        {ex.topology_links.length === 0 ? (
          <p className="footnote">
            No topology_links on this assembly — failure-impact rollup is omitted unless linkage appears in Explorer.
          </p>
        ) : (
          <ul className="notes-list">
            {ex.topology_links.map((l) => (
              <li key={`${l.policy_id}-${l.node_id}`}>
                <code>{l.node_id}</code> · from {formatLabel(l.matched_from_policy_field)} · matched_on{" "}
                {formatLabel(l.matched_on)} · policy <code>{l.policy_id}</code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-card" aria-labelledby="siw-fi">
        <h3 id="siw-fi">Failure-impact relationship (optional)</h3>
        {data.failure_impact_assembly_note ? (
          <p className="table-note">{data.failure_impact_assembly_note}</p>
        ) : null}
        {fi ? (
          <>
            <p>
              Anchor <code>{fi.subject.object_id}</code> · related policies (distinct){" "}
              <strong>{fi.rollup_counts.related_policies_total}</strong> · degraded related{" "}
              <strong>{fi.rollup_counts.degraded_related_policies_total}</strong>
            </p>
            <p className="footnote">
              failure_impact freshness: {formatDateTime(fi.freshness.assembly_generated_at)} ·{" "}
              {fi.safety_framing.summary_disclaimer.slice(0, 120)}…
            </p>
          </>
        ) : (
          <p className="footnote">
            No embedded failure_impact block on this response — see Topology failure-impact GET or Maintenance Preview
            for the same object when applicable.
          </p>
        )}
      </section>

      <section className="detail-card" aria-labelledby="siw-maint">
        <h3 id="siw-maint">Maintenance / change-safety / reports (pointers only)</h3>
        <p className="table-note">
          Separate bounded GETs — navigation only; not merged verdicts or approval semantics.
        </p>
        {data.recommended_api_pivots.length === 0 ? (
          <p className="footnote">No API pivot lines on this assembly.</p>
        ) : (
          <ul className="notes-list">
            {data.recommended_api_pivots.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-card" aria-labelledby="siw-gaps">
        <h3 id="siw-gaps">Evidence gaps &amp; merged caveats</h3>
        {data.merged_evidence_gap_notes.length === 0 ? (
          <p className="footnote">No merged evidence-gap lines on this assembly.</p>
        ) : (
          <ul className="notes-list">
            {data.merged_evidence_gap_notes.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        )}
        {data.merged_caveats.length === 0 ? (
          <p className="footnote">No merged caveat lines on this assembly.</p>
        ) : (
          <ul className="notes-list">
            {data.merged_caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-card" aria-labelledby="siw-nonclaims">
        <h3 id="siw-nonclaims">Explicit non-claims</h3>
        <ul className="notes-list">
          {data.explicit_non_claims.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="detail-card" aria-labelledby="siw-pivots">
        <h3 id="siw-pivots">Related product pivots (bounded)</h3>
        <p className="table-note">
          These navigate to <strong>separate</strong> read-only surfaces — not substitutes for this workspace.
        </p>
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToServiceExplorer({ serviceId: data.service_id })}>
            Service Explorer (same service_id)
          </button>
          <button type="button" className="inline-action" onClick={() => navigateToServiceDossier({ serviceId: data.service_id })}>
            Service dossier
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToImpactReportForService(data.service_id)}
          >
            Impact report (service)
          </button>
          {firstNode ? (
            <button
              type="button"
              className="inline-action"
              onClick={() =>
                navigateToMaintenanceEvidenceWorkspaceForTopologyObject(firstNode, "node", {
                  previewContext: "topology_drilldown",
                })
              }
            >
              Maintenance evidence workspace (first topology node)
            </button>
          ) : null}
          {firstNode ? (
            <button
              type="button"
              className="inline-action"
              onClick={() =>
                navigateToMaintenancePreview({
                  nodeId: firstNode,
                  previewContext: "topology_drilldown",
                })
              }
            >
              Maintenance preview (first topology node)
            </button>
          ) : null}
          {firstPolicy ? (
            <button
              type="button"
              className="inline-action"
              onClick={() => navigateToPolicyDossierWorkspace(firstPolicy, "service_impact_workspace")}
            >
              Policy dossier (first member)
            </button>
          ) : null}
          {firstPolicy ? (
            <button
              type="button"
              className="inline-action"
              onClick={() => navigateToChangeSafetyCaseForPolicy(firstPolicy)}
            >
              Change safety case (policy)
            </button>
          ) : null}
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToChangeSafetyCaseForService(data.service_id)}
          >
            Change safety case (service)
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToInvestigationView(syncLim, {
                invFrom: "service-impact-workspace",
                policyId: firstPolicy,
              })
            }
          >
            Investigation
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToOperatorBriefingView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, { invFrom: "service-impact-workspace" })}
          >
            Operator briefing
          </button>
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("topology")}>
            Topology
          </button>
          <button type="button" className="inline-action" onClick={() => navigateToDeltaDigestView(syncLim)}>
            Delta digest
          </button>
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceConsistencyWorkspace(syncLim)}>
            Evidence consistency workspace
          </button>
        </p>
      </section>

      <p className="table-note">
        <button type="button" className="inline-action" onClick={onReload}>
          Reload workspace
        </button>
      </p>
    </div>
  );
}

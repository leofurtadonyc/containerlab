import type {
  ServiceDetailResponse,
  ServicesListResponse,
  ServiceTopologyLinkRecord,
} from "../../api/contracts";
import { navigateToDeltaDigestView } from "../../lib/delta-digest-navigation";
import { formatDateTime, formatLabel } from "../../lib/presentation";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { navigateToInvestigationView } from "../../lib/investigation-navigation";
import { navigateToOperatorBriefingView } from "../../lib/operator-briefing-navigation";
import {
  navigateToPolicyDossierWorkspace,
  navigateToPolicyExplainabilityWorkspace,
} from "../../lib/policy-dossier-navigation";
import { navigateToSituationRoomView } from "../../lib/situation-room-navigation";
import { navigateToImpactReportForService } from "../../lib/impact-report-navigation";
import { navigateToMaintenancePreview } from "../../lib/maintenance-preview-navigation";
import { navigateToTopologyDossier } from "../../lib/topology-dossier-navigation";
import { navigateToServiceExplorer } from "../../lib/service-explorer-navigation";
import { navigateToServiceDossier } from "../../lib/service-dossier-navigation";
import { navigateToEvidenceView } from "../../lib/url-app-state";

function posturePillClass(posture: string): string {
  if (posture === "degraded") {
    return "status-pill status-bad";
  }
  if (posture === "unknown") {
    return "status-pill status-warn";
  }
  return "status-pill status-good";
}

function topologyStatusPillClass(status: ServiceDetailResponse["topology_evidence_status"]): string {
  if (status === "present") {
    return "status-pill status-good";
  }
  if (status === "partial") {
    return "status-pill status-warn";
  }
  return "status-pill status-bad";
}

export interface ServiceExplorerListProductProps {
  data: ServicesListResponse;
  limitApplied: number | null;
  onReload: () => void | Promise<void>;
}

export function ServiceExplorerListProduct({ data, limitApplied, onReload }: ServiceExplorerListProductProps) {
  const sparse = data.items.length === 0 || data.policy_inventory.empty_reason !== "none";
  return (
    <div className="service-explorer-product">
      <header className="service-explorer-hero">
        <div className="service-explorer-hero__text">
          <p className="eyebrow">Phase 2 · service_explorer_v1</p>
          <h2 className="service-explorer-hero__title">Service Explorer</h2>
          <p className="body-copy service-explorer-hero__lede">
            Grouped read lens over the <strong>same</strong> policy inventory as Policies—not a second catalog.
            Rows are discoverable groupings (policy, color, headend, endpoint); membership is bounded to the current
            inventory slice.
          </p>
        </div>
        <div className="service-explorer-hero__actions">
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("policies")}>
            Open Policies
          </button>
          <button type="button" className="service-explorer-toolbar-reload" onClick={() => void onReload()}>
            Reload
          </button>
        </div>
      </header>

      <div className="service-explorer-metadata">
        <span>Generated {formatDateTime(data.generated_at)}</span>
        <span>
          Contract <code>{data.contract_id}</code>
        </span>
        <span>
          Policy inventory · data_status{" "}
          <span className="status-pill status-neutral">{data.policy_inventory.data_status}</span> · serving{" "}
          <span className="status-pill status-neutral">{data.policy_inventory.serving_mode.replace(/_/g, " ")}</span>
        </span>
        <span>
          Policies count (inventory){" "}
          <strong>{data.policy_inventory.policy_items_total}</strong> · observed{" "}
          <strong>{data.policy_inventory.observed_policy_count}</strong>
        </span>
      </div>

      <section className="service-explorer-inventory-echo" aria-labelledby="se-inv-heading">
        <h3 id="se-inv-heading">Policy inventory echo</h3>
        <p className="table-note">{data.policy_inventory.summary}</p>
      </section>

      {sparse ? (
        <p className="callout service-explorer-sparse-callout" role="status">
          List may be empty or sparse when the policy inventory is empty or degraded—this is honest bounded coverage,
          not a silent “all clear.” Open Policies for authoritative rows.
        </p>
      ) : null}

      {data.caveats.length > 0 ? (
        <section className="service-explorer-caveats" aria-labelledby="se-list-caveats">
          <h3 id="se-list-caveats">Caveats</h3>
          <ul>
            {data.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="service-explorer-pivots" aria-labelledby="se-pivots-heading">
        <h3 id="se-pivots-heading">Pivots</h3>
        <p className="table-note">Bounded navigation—same Phase 2 contracts as other surfaces.</p>
        <div className="service-explorer-pivots__grid">
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() =>
              navigateToInvestigationView(readSyncRunsLimitFromSearch(window.location.search), {
                invFrom: "service-explorer",
              })
            }
          >
            Investigation
          </button>
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToSituationRoomView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)}
          >
            Situation room
          </button>
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() =>
              navigateToOperatorBriefingView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, { invFrom: "service-explorer" })
            }
          >
            Operator briefing
          </button>
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToDeltaDigestView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)}
          >
            Delta digest
          </button>
        </div>
        {data.recommended_pivots.length > 0 ? (
          <ul className="service-explorer-pivot-notes">
            {data.recommended_pivots.map((p) => (
              <li key={p}>
                <code>{p}</code>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="service-explorer-read-side" aria-labelledby="se-rsq-heading">
        <h3 id="se-rsq-heading">Read-side query echo</h3>
        <p className="table-note">
          items_total={data.read_side_query.items_total} · items_returned={data.read_side_query.items_returned} ·
          limit_requested={data.read_side_query.limit_requested === null ? "none" : data.read_side_query.limit_requested}
          {limitApplied != null ? ` · URL limit applied: ${limitApplied}` : ""}
        </p>
      </section>

      <section className="service-explorer-table-section" aria-labelledby="se-table-heading">
        <h3 id="se-table-heading">Services</h3>
        {data.items.length === 0 ? (
          <p className="table-note">No service rows for the current inventory slice.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table service-explorer-table">
              <thead>
                <tr>
                  <th scope="col">service_id</th>
                  <th scope="col">Kind</th>
                  <th scope="col">Members</th>
                  <th scope="col">Group degraded (v1 roll-up)</th>
                  <th scope="col">Service dossier</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.service_id}>
                    <td>
                      <button
                        type="button"
                        className="table-link-button"
                        onClick={() => navigateToServiceExplorer({ serviceId: row.service_id })}
                      >
                        <code>{row.service_id}</code>
                      </button>
                    </td>
                    <td>{row.kind}</td>
                    <td>{row.member_count}</td>
                    <td>
                      <span className={posturePillClass(row.degraded_group_posture)}>
                        {row.degraded_group_posture}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="inline-action"
                        onClick={() => navigateToServiceDossier({ serviceId: row.service_id })}
                        title="service_dossier_v1 composed workspace for this service_id"
                      >
                        Open dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export interface ServiceExplorerDetailProductProps {
  data: ServiceDetailResponse;
  onReload: () => void | Promise<void>;
}

export function ServiceExplorerDetailProduct({ data, onReload }: ServiceExplorerDetailProductProps) {
  const syncLim = readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT);
  const firstPolicy = data.members[0]?.policy_id;

  return (
    <div className="service-explorer-product service-explorer-product--detail">
      <header className="service-explorer-hero">
        <div className="service-explorer-hero__text">
          <p className="eyebrow">Phase 2 · service_explorer_v1 · detail</p>
          <h2 className="service-explorer-hero__title">
            <code>{data.service_id}</code>
          </h2>
          <p className="body-copy service-explorer-hero__lede">
            Members are normalized policy rows from the current inventory only. Topology links are best-effort string
            matches—not adjacency or dataplane proof.
          </p>
        </div>
        <div className="service-explorer-hero__actions">
          <button type="button" className="inline-action" onClick={() => navigateToServiceExplorer({ serviceId: null })}>
            Back to list
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToServiceDossier({ serviceId: data.service_id })}
            title="service_dossier_v1 — composed workspace (explainability + optional maintenance); not a replacement for this Explorer detail"
          >
            Service dossier
          </button>
          <button type="button" className="service-explorer-toolbar-reload" onClick={() => void onReload()}>
            Reload
          </button>
        </div>
      </header>

      <div className="service-explorer-metadata">
        <span>Generated {formatDateTime(data.generated_at)}</span>
        <span>
          Kind <strong>{data.kind}</strong> · members <strong>{data.members_total}</strong>
        </span>
        <span>
          Group degraded (roll-up){" "}
          <span className={posturePillClass(data.degraded_service.posture)}>{data.degraded_service.posture}</span>
        </span>
        <span>
          Topology evidence{" "}
          <span className={topologyStatusPillClass(data.topology_evidence_status)}>
            {data.topology_evidence_status}
          </span>
        </span>
      </div>

      {data.degraded_service.reason_codes.length > 0 ? (
        <p className="table-note">
          Reason codes (union, capped): {data.degraded_service.reason_codes.map((c) => formatLabel(c)).join(" · ")}
          {data.degraded_service.reason_codes_truncated ? " · +more (see Policies for full rows)" : ""}
        </p>
      ) : null}

      <section className="service-explorer-pivots" aria-labelledby="se-detail-pivots">
        <h3 id="se-detail-pivots">Pivots</h3>
        <div className="service-explorer-pivots__grid">
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() =>
              navigateToInvestigationView(syncLim, {
                invFrom: "service-explorer",
                policyId: firstPolicy,
              })
            }
          >
            Investigation{firstPolicy ? " (policy pinned)" : ""}
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToSituationRoomView(syncLim)}>
            Situation room
          </button>
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() =>
              navigateToOperatorBriefingView(syncLim, {
                invFrom: "service-explorer",
                ...(firstPolicy ? { policyId: firstPolicy } : { clearPinnedScope: true }),
              })
            }
          >
            Operator briefing
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToDeltaDigestView(syncLim)}>
            Delta digest
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToEvidenceView("policies")}>
            Policies table
          </button>
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() => navigateToImpactReportForService(data.service_id)}
            title="impact_report_v1 — communication packaging; not evidence export or briefing bundle"
          >
            Impact report
          </button>
        </div>
      </section>

      {data.caveats.length > 0 || data.topology_caveats.length > 0 ? (
        <section className="service-explorer-caveats" aria-labelledby="se-detail-caveats">
          <h3 id="se-detail-caveats">Caveats</h3>
          <ul>
            {[...data.caveats, ...data.topology_caveats].map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="service-explorer-table-section" aria-labelledby="se-members-heading">
        <h3 id="se-members-heading">Member policies</h3>
        <div className="table-scroll">
          <table className="data-table service-explorer-table">
            <thead>
              <tr>
                <th scope="col">policy_id</th>
                <th scope="col">Color</th>
                <th scope="col">Headend</th>
                <th scope="col">Endpoint</th>
                <th scope="col">degraded_policy_v1</th>
                  <th scope="col">Dossier</th>
                  <th scope="col">Explainability</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m) => (
                  <tr key={m.policy_id}>
                  <td>
                    <code>{m.policy_id}</code>
                  </td>
                  <td>{m.color}</td>
                  <td>{m.headend}</td>
                  <td>{m.endpoint}</td>
                  <td>
                    <span className={posturePillClass(m.degraded_policy_v1.posture)}>
                      {m.degraded_policy_v1.posture}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="inline-action"
                      onClick={() => navigateToPolicyDossierWorkspace(m.policy_id, "service_explorer")}
                    >
                      Open dossier
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="inline-action"
                      onClick={() => navigateToPolicyExplainabilityWorkspace(m.policy_id, undefined, "candidates")}
                    >
                      Open explainability
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="service-explorer-table-section" aria-labelledby="se-topo-heading">
        <h3 id="se-topo-heading">Topology linkage (best-effort)</h3>
        {data.topology_links.length === 0 ? (
          <p className="table-note">
            No node matches for this detail view, or topology was unavailable. Open Topology for the full graph.
          </p>
        ) : (
          <>
            <p className="table-note">
              <button
                type="button"
                className="inline-action"
                onClick={() =>
                  navigateToMaintenancePreview({
                    nodeId: data.topology_links[0].node_id,
                    previewContext: "change_adjacent",
                  })
                }
                title="Uses the first matched node in this table (read-only planning assembly; not approval)"
              >
                Maintenance preview (first matched node)
              </button>
            </p>
          <div className="table-scroll">
            <table className="data-table service-explorer-table">
              <thead>
                <tr>
                  <th scope="col">policy_id</th>
                  <th scope="col">Node</th>
                  <th scope="col">Matched on</th>
                  <th scope="col">From field</th>
                  <th scope="col">Policy dossier</th>
                  <th scope="col">Explainability</th>
                </tr>
              </thead>
              <tbody>
                {data.topology_links.map((link: ServiceTopologyLinkRecord) => (
                  <tr key={`${link.policy_id}-${link.node_id}-${link.matched_from_policy_field}`}>
                    <td>
                      <code>{link.policy_id}</code>
                    </td>
                    <td>
                      <code>{link.node_id}</code> · {link.display_name}
                    </td>
                    <td>{link.matched_on}</td>
                    <td>{link.matched_from_policy_field}</td>
                    <td>
                      <button
                        type="button"
                        className="inline-action"
                        onClick={() => navigateToTopologyDossier(link.node_id, "node", "service_explorer")}
                      >
                        Open node dossier
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="inline-action"
                        onClick={() =>
                          navigateToPolicyExplainabilityWorkspace(link.policy_id, undefined, "candidates")
                        }
                      >
                        Policy explainability
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      {data.recommended_pivots.length > 0 ? (
        <section className="service-explorer-backend-pivots" aria-labelledby="se-be-pivots">
          <h3 id="se-be-pivots">Assembly hints (backend)</h3>
          <ul className="service-explorer-pivot-notes">
            {data.recommended_pivots.map((p) => (
              <li key={p}>
                <code>{p}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

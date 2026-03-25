import type { ServiceDossierResponse, ServiceDetailResponse, ServiceTopologyLinkRecord } from "../../api/contracts";
import { navigateToDeltaDigestView } from "../../lib/delta-digest-navigation";
import { formatDateTime, formatLabel } from "../../lib/presentation";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { navigateToInvestigationView } from "../../lib/investigation-navigation";
import { navigateToImpactReportForService } from "../../lib/impact-report-navigation";
import { navigateToMaintenancePreview } from "../../lib/maintenance-preview-navigation";
import {
  navigateToPolicyDossierWorkspace,
  navigateToPolicyExplainabilityWorkspace,
} from "../../lib/policy-dossier-navigation";
import { navigateToOperatorBriefingView } from "../../lib/operator-briefing-navigation";
import { navigateToSituationRoomView } from "../../lib/situation-room-navigation";
import { navigateToServiceDossier } from "../../lib/service-dossier-navigation";
import { navigateToServiceExplorer } from "../../lib/service-explorer-navigation";
import { navigateToTopologyDossier } from "../../lib/topology-dossier-navigation";
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

export interface ServiceDossierProductProps {
  data: ServiceDossierResponse;
  onReload: () => void | Promise<void>;
}

export function ServiceDossierProduct({ data, onReload }: ServiceDossierProductProps) {
  const d = data.service_explorer_detail;
  const expl = data.policy_explainability;
  const syncLim = readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT);
  const defaultPid = data.default_member_policy_id;
  const firstTopoNode = d.topology_links[0]?.node_id;

  return (
    <div className="service-dossier-product">
      <header className="service-dossier-hero">
        <div className="service-dossier-hero__text">
          <p className="eyebrow">Phase 2 · service_dossier_v1</p>
          <h2 className="service-dossier-hero__title">
            <code>{d.service_id}</code>
          </h2>
          <p className="body-copy service-dossier-hero__lede">
            Composed read-side workspace over Service Explorer detail, optional explainability for one default member,
            and optional maintenance preview when topology linkage resolves—<strong>not</strong> SLA proof, workflow
            authority, or a substitute for full Policies / topology panels.
          </p>
        </div>
        <div className="service-dossier-hero__actions">
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToServiceExplorer({ serviceId: d.service_id })}
            title="Same inventory slice as this dossier — list/index lens"
          >
            Open in Service Explorer
          </button>
          <button type="button" className="service-dossier-toolbar-reload" onClick={() => void onReload()}>
            Reload
          </button>
        </div>
      </header>

      <div className="service-dossier-metadata">
        <span>Generated {formatDateTime(data.generated_at)}</span>
        <span>
          Nested Explorer contract <code>{d.contract_id}</code>
        </span>
        <span>
          Default explainability member{" "}
          <strong>
            <code>{defaultPid}</code>
          </strong>
        </span>
        <span>
          Sparse{" "}
          <span className={data.sparse_dossier ? "status-pill status-warn" : "status-pill status-good"}>
            {data.sparse_dossier ? "yes (see reasons)" : "no"}
          </span>
        </span>
      </div>

      <section className="service-dossier-framing" aria-labelledby="sd-nonclaims-heading">
        <h3 id="sd-nonclaims-heading">Explicit non-claims (safety framing)</h3>
        <p className="table-note">{data.safety_framing.summary_disclaimer}</p>
        <ul>
          {data.safety_framing.explicit_non_claims.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ul>
      </section>

      {data.sparse_dossier ? (
        <div className="callout service-dossier-sparse-callout" role="status">
          <strong>Sparse or partial assembly.</strong>
          <ul>
            {data.sparse_reasons.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.merged_caveats.length > 0 ? (
        <section className="service-dossier-caveats" aria-labelledby="sd-merged-caveats">
          <h3 id="sd-merged-caveats">Merged caveats</h3>
          <ul>
            {data.merged_caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.missing_evidence_notes.length > 0 ? (
        <section className="service-dossier-missing" aria-labelledby="sd-missing-heading">
          <h3 id="sd-missing-heading">Missing evidence notes</h3>
          <ul>
            {data.missing_evidence_notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="service-dossier-pivots" aria-labelledby="sd-pivots-heading">
        <h3 id="sd-pivots-heading">Cross-surface pivots</h3>
        <p className="table-note">Each destination remains a separate bounded product—not hidden behind this screen.</p>
        <div className="service-dossier-pivots__grid">
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() =>
              navigateToInvestigationView(syncLim, {
                invFrom: "service-dossier",
                policyId: defaultPid || undefined,
              })
            }
          >
            Investigation
          </button>
          <button type="button" className="nav-drilldown-button" onClick={() => navigateToSituationRoomView(syncLim)}>
            Situation room
          </button>
          <button
            type="button"
            className="nav-drilldown-button"
            onClick={() =>
              navigateToOperatorBriefingView(syncLim, {
                invFrom: "service-dossier",
                ...(defaultPid ? { policyId: defaultPid } : { clearPinnedScope: true }),
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
            onClick={() => navigateToImpactReportForService(d.service_id)}
            title="impact_report_v1 — communication packaging; not the same JSON as this dossier"
          >
            Impact report
          </button>
        </div>
        <p className="meta-copy">Investigation hint: {data.investigation_pivot_hint}</p>
      </section>

      <section className="service-dossier-inventory" aria-labelledby="sd-inv-heading">
        <h3 id="sd-inv-heading">Service inventory (from Explorer)</h3>
        <p className="table-note">{d.policy_inventory.summary}</p>
        <p className="table-note">
          Group roll-up{" "}
          <span className={posturePillClass(d.degraded_service.posture)}>{d.degraded_service.posture}</span> · topology
          evidence{" "}
          <span className={topologyStatusPillClass(d.topology_evidence_status)}>{d.topology_evidence_status}</span> ·
          member posture counts:{" "}
          {Object.entries(data.member_posture_counts)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}
        </p>
      </section>

      <section className="service-dossier-table-section" aria-labelledby="sd-members-heading">
        <h3 id="sd-members-heading">Member policies</h3>
        <div className="table-scroll">
          <table className="data-table service-dossier-table">
            <thead>
              <tr>
                <th scope="col">policy_id</th>
                <th scope="col">degraded_policy_v1</th>
                <th scope="col">Policy dossier</th>
                <th scope="col">Explainability</th>
              </tr>
            </thead>
            <tbody>
              {d.members.map((m) => (
                <tr key={m.policy_id}>
                  <td>
                    <code>{m.policy_id}</code>
                    {m.policy_id === defaultPid ? (
                      <span className="service-dossier-default-badge" title="Default member for embedded explainability">
                        {" "}
                        default
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <span className={posturePillClass(m.degraded_policy_v1.posture)}>
                      {m.degraded_policy_v1.posture}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="inline-action"
                      onClick={() => navigateToPolicyDossierWorkspace(m.policy_id, "service_dossier")}
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

      <section className="service-dossier-table-section" aria-labelledby="sd-topo-heading">
        <h3 id="sd-topo-heading">Topology linkage (Explorer)</h3>
        {d.topology_links.length === 0 ? (
          <p className="table-note">No topology linkage rows in this Explorer detail.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table service-dossier-table">
              <thead>
                <tr>
                  <th scope="col">policy_id</th>
                  <th scope="col">Node</th>
                  <th scope="col">Matched on</th>
                  <th scope="col">Topology dossier</th>
                </tr>
              </thead>
              <tbody>
                {d.topology_links.map((link: ServiceTopologyLinkRecord) => (
                  <tr key={`${link.policy_id}-${link.node_id}-${link.matched_from_policy_field}`}>
                    <td>
                      <code>{link.policy_id}</code>
                    </td>
                    <td>
                      <code>{link.node_id}</code> · {link.display_name}
                    </td>
                    <td>{link.matched_on}</td>
                    <td>
                      <button
                        type="button"
                        className="inline-action"
                        onClick={() => navigateToTopologyDossier(link.node_id, "node", "service_dossier")}
                      >
                        Open node dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="service-dossier-explainability" aria-labelledby="sd-explain-heading">
        <h3 id="sd-explain-heading">Explainability (default member)</h3>
        {expl ? (
          <>
            <p className="table-note">
              <strong>One-line summary:</strong> {expl.path_explanation_summary}
            </p>
            <p className="table-note">
              <button
                type="button"
                className="inline-action"
                onClick={() => navigateToPolicyExplainabilityWorkspace(expl.policy_id, undefined, "candidates")}
              >
                Open full explainability workspace
              </button>{" "}
              — full <code>policy_explainability_workspace_v1</code> remains on Policies.
            </p>
          </>
        ) : (
          <p className="table-note" role="status">
            {data.explainability_unavailable_note ?? "Explainability is not embedded for this response."}
          </p>
        )}
      </section>

      <section className="service-dossier-maintenance" aria-labelledby="sd-maint-heading">
        <h3 id="sd-maint-heading">Maintenance preview (optional)</h3>
        {data.maintenance_preview ? (
          <>
            <p className="table-note">
              Subject: {data.maintenance_preview.subject.object_kind}{" "}
              <code>{data.maintenance_preview.subject.object_id}</code> · {data.maintenance_preview.subject.display_name}
            </p>
            <p className="table-note">
              <button
                type="button"
                className="inline-action"
                onClick={() =>
                  navigateToMaintenancePreview({
                    nodeId: data.maintenance_preview_subject_node_id ?? firstTopoNode ?? undefined,
                    previewContext: "explicit_subject",
                  })
                }
              >
                Open full maintenance preview
              </button>{" "}
              — <code>maintenance_preview_v1</code> is the full assembly; this dossier only embeds a copy when available.
            </p>
          </>
        ) : (
          <p className="table-note" role="status">
            {data.maintenance_unavailable_note ?? "Maintenance preview not embedded."}
          </p>
        )}
      </section>

      <section className="service-dossier-impact" aria-labelledby="sd-impact-heading">
        <h3 id="sd-impact-heading">Impact report relationship</h3>
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToImpactReportForService(d.service_id)}>
            Open service impact report
          </button>{" "}
          — <code>impact_report_v1</code> packages communication context; it is <strong>not</strong> the same JSON as
          this dossier and not a substitute for live read APIs when freshness matters.
        </p>
      </section>

      {data.recommended_api_pivots.length > 0 ? (
        <section className="service-dossier-backend-pivots" aria-labelledby="sd-pivots-api">
          <h3 id="sd-pivots-api">Recommended API pivots (backend)</h3>
          <ul className="service-dossier-pivot-notes">
            {data.recommended_api_pivots.map((p) => (
              <li key={p}>
                <code>{p}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.source_contract_ids.length > 0 ? (
        <section className="service-dossier-sources" aria-labelledby="sd-sources-heading">
          <h3 id="sd-sources-heading">Source contract IDs</h3>
          <p className="meta-copy">{data.source_contract_ids.join(" · ")}</p>
        </section>
      ) : null}
    </div>
  );
}

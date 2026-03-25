import type { MaintenancePreviewResponse } from "../../api/contracts";
import { EvidenceExportActions } from "../../components/evidence-export-actions";
import { formatDateTime } from "../../lib/presentation";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { navigateToInvestigationView } from "../../lib/investigation-navigation";
import { navigateToPolicyExplainabilityWorkspace } from "../../lib/policy-dossier-navigation";
import { navigateToServiceExplorer } from "../../lib/service-explorer-navigation";
import { navigateToServiceDossier } from "../../lib/service-dossier-navigation";
import { navigateToImpactReportForMaintenance } from "../../lib/impact-report-navigation";
import { navigateToChangeSafetyCaseForMaintenance } from "../../lib/change-safety-case-navigation";
import { navigateToTopologyDossier } from "../../lib/topology-dossier-navigation";

export interface MaintenancePreviewProductProps {
  data: MaintenancePreviewResponse;
  onReload: () => void | Promise<void>;
}

export function MaintenancePreviewProduct({ data, onReload }: MaintenancePreviewProductProps) {
  const syncLim = readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT);
  const subj = data.subject;
  const cov = data.topology_impact.coverage_summary;

  return (
    <div className="maintenance-preview-product">
      <header className="maintenance-preview-hero">
        <div className="maintenance-preview-hero__text">
          <p className="eyebrow">Phase 2 · maintenance_preview_v1</p>
          <h2 className="maintenance-preview-hero__title">Maintenance Preview</h2>
          <p className="body-copy maintenance-preview-hero__lede">
            Planning support only: this workspace <strong>reuses</strong> existing read-side contracts (related policies,
            failure-impact rollups, Service Explorer groupings over the related set, topology partiality). It does{" "}
            <strong>not</strong> simulate outages, score safe-to-change, approve work, or prove dataplane impact.
          </p>
        </div>
        <div className="maintenance-preview-hero__actions">
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToImpactReportForMaintenance(
                subj.object_kind === "node"
                  ? { nodeId: subj.object_id, previewContext: data.preview_context }
                  : { linkId: subj.object_id, previewContext: data.preview_context },
              )
            }
            title="Open impact_report_v1 workspace for this subject (not evidence export)"
          >
            Impact report
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToChangeSafetyCaseForMaintenance(
                subj.object_kind === "node"
                  ? { nodeId: subj.object_id, previewContext: data.preview_context }
                  : { linkId: subj.object_id, previewContext: data.preview_context },
              )
            }
            title="change_safety_case_v1 — pre-change posture; not blast-radius or approval"
          >
            Change safety case
          </button>
          <button type="button" className="maintenance-preview-toolbar-reload" onClick={() => void onReload()}>
            Reload
          </button>
        </div>
      </header>

      <div className="maintenance-preview-metadata">
        <span>Generated {formatDateTime(data.metadata.generated_at)}</span>
        <span>
          Contract <code>{data.contract_id}</code>
        </span>
        <span>
          Preview context <code>{data.preview_context}</code>
        </span>
        <span>
          Subject ·{" "}
          <strong>
            {subj.object_kind} {subj.display_name}
          </strong>{" "}
          <code>{subj.object_id}</code>
        </span>
      </div>

      <section className="maintenance-preview-safety" aria-labelledby="mp-safety-heading">
        <h3 id="mp-safety-heading">Explicit non-claims (read-only assembly)</h3>
        <p className="table-note">{data.safety_framing.summary_disclaimer}</p>
        <ul className="maintenance-preview-non-claims">
          {data.safety_framing.explicit_non_claims.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ul>
      </section>

      {data.sparse_preview ? (
        <p className="callout maintenance-preview-sparse-callout" role="status">
          <strong>Sparse preview.</strong> Some sections may be empty or truncated—this is honest bounded coverage, not
          “no impact.”
          {data.sparse_reasons.length > 0 ? (
            <ul className="maintenance-preview-sparse-reasons">
              {data.sparse_reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}
        </p>
      ) : null}

      <section className="maintenance-preview-export" aria-labelledby="mp-export-heading">
        <h3 id="mp-export-heading">Export / report entry points</h3>
        <p className="table-note">
          There is no dedicated <code>maintenance_preview</code> export kind in Phase 2. You can download a bounded{" "}
          <strong>topology object dossier</strong> snapshot for this subject (same honesty limits as the dossier API).
        </p>
        <EvidenceExportActions target={{ kind: "topology_object_dossier", objectId: subj.object_id }} variant="dossier" />
      </section>

      <section className="maintenance-preview-failure-impact" aria-labelledby="mp-fi-heading">
        <h3 id="mp-fi-heading">Failure-impact reuse (subset-scoped)</h3>
        <p className="table-note">
          Embedded <code>{data.failure_impact.contract_id}</code> for this subject—not duplicated scoring authority.
        </p>
        <dl className="maintenance-preview-dl">
          <dt>Related policies (distinct)</dt>
          <dd>{data.failure_impact.rollup_counts.related_policies_total}</dd>
          <dt>Degraded (related set)</dt>
          <dd>{data.failure_impact.rollup_counts.degraded_related_policies_total}</dd>
          <dt>Path-analysis supported (related set)</dt>
          <dd>{data.failure_impact.rollup_counts.related_policies_path_analysis_supported_total}</dd>
        </dl>
        <p className="table-note">
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToTopologyDossier(subj.object_id, subj.object_kind, "maintenance_preview")
            }
          >
            Open topology dossier for this object
          </button>
        </p>
      </section>

      <section className="maintenance-preview-topology-impact" aria-labelledby="mp-topo-heading">
        <h3 id="mp-topo-heading">Topology context (partiality echo)</h3>
        <p className="table-note">
          Coverage signals from the same topology read as elsewhere—not completeness or simulation.
        </p>
        <dl className="maintenance-preview-dl">
          <dt>inference_posture</dt>
          <dd>{cov.inference_posture}</dd>
          <dt>endpoint_pairing_posture</dt>
          <dd>{cov.endpoint_pairing_posture}</dd>
          <dt>collection_posture</dt>
          <dd>{cov.collection_posture}</dd>
          <dt>node_participation_posture</dt>
          <dd>{cov.node_participation_posture}</dd>
        </dl>
        {data.topology_impact.topology_snapshot_observed_at ? (
          <p className="meta-copy">Topology snapshot observed_at {data.topology_impact.topology_snapshot_observed_at}</p>
        ) : null}
      </section>

      <section className="maintenance-preview-related-policies" aria-labelledby="mp-rp-heading">
        <h3 id="mp-rp-heading">Related policies (string-equality set)</h3>
        <p className="table-note">{data.related_policies.derivation_summary}</p>
        {data.related_policies.global_caveats.length > 0 ? (
          <ul className="maintenance-preview-caveats">
            {data.related_policies.global_caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        ) : null}
        {data.related_policies.items.length === 0 ? (
          <p className="table-note">No related policies in this slice for this subject.</p>
        ) : (
          <table className="data-table maintenance-preview-table">
            <thead>
              <tr>
                <th>policy_id</th>
                <th>relationship</th>
                <th>matched field</th>
              </tr>
            </thead>
            <tbody>
              {data.related_policies.items.map((row) => (
                <tr key={`${row.policy_id}-${row.matched_field}-${row.matched_policy_value}`}>
                  <td>
                    <button
                      type="button"
                      className="table-link-button"
                      onClick={() => navigateToPolicyExplainabilityWorkspace(row.policy_id)}
                    >
                      {row.policy_id}
                    </button>
                  </td>
                  <td>{row.relationship_kind}</td>
                  <td>
                    {row.matched_field}={row.matched_policy_value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="maintenance-preview-related-services" aria-labelledby="mp-rs-heading">
        <h3 id="mp-rs-heading">Related services (Explorer groupings over the related-policy subset)</h3>
        <p className="table-note">
          Rows total before cap: <strong>{data.related_services_total}</strong>
          {data.related_services_truncated ? (
            <>
              {" "}
              · truncated to <strong>{data.related_services.length}</strong> rows in this response
            </>
          ) : null}
        </p>
        {data.related_services.length === 0 ? (
          <p className="table-note">No service groupings derived (empty related set or inventory).</p>
        ) : (
          <table className="data-table maintenance-preview-table">
            <thead>
              <tr>
                <th>service_id</th>
                <th>kind</th>
                <th>members</th>
                <th>group posture</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.related_services.map((row) => (
                <tr key={row.service_id}>
                  <td>
                    <code>{row.service_id}</code>
                  </td>
                  <td>{row.kind}</td>
                  <td>{row.member_count}</td>
                  <td>{row.degraded_group_posture}</td>
                  <td>
                    <button
                      type="button"
                      className="table-link-button"
                      onClick={() => navigateToServiceExplorer({ serviceId: row.service_id })}
                    >
                      Open in Service Explorer
                    </button>{" "}
                    <button
                      type="button"
                      className="table-link-button"
                      onClick={() => navigateToServiceDossier({ serviceId: row.service_id })}
                      title="service_dossier_v1 — composed assembly for this service_id"
                    >
                      Service dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="maintenance-preview-explainability" aria-labelledby="mp-ex-heading">
        <h3 id="mp-ex-heading">Explainability pointers</h3>
        <p className="table-note">Navigation hints only—not proof of operational impact.</p>
        {data.explainability_pointers.length === 0 ? (
          <p className="table-note">No pointers (empty related set).</p>
        ) : (
          <ul className="maintenance-preview-pointer-list">
            {data.explainability_pointers.map((p) => (
              <li key={p.policy_id}>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => navigateToPolicyExplainabilityWorkspace(p.policy_id)}
                >
                  Explainability · {p.policy_id}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="maintenance-preview-pivots" aria-labelledby="mp-pivots-heading">
        <h3 id="mp-pivots-heading">Recommended pivots</h3>
        <ul className="maintenance-preview-pivot-notes">
          {data.recommended_pivots.map((line) => (
            <li key={line}>
              <code>{line}</code>
            </li>
          ))}
        </ul>
        <p className="table-note">
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToInvestigationView(syncLim, {
                invFrom: "maintenance-preview",
                topologyObject: { id: subj.object_id, kind: subj.object_kind },
              })
            }
          >
            Open investigation with this topology object
          </button>
        </p>
      </section>

      <section className="maintenance-preview-assembly-caveats" aria-labelledby="mp-ac-heading">
        <h3 id="mp-ac-heading">Assembly caveats</h3>
        <ul className="maintenance-preview-caveats">
          {data.assembly_caveats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="table-note">Composed contracts: {data.source_contract_ids.join(", ")}</p>
      </section>
    </div>
  );
}

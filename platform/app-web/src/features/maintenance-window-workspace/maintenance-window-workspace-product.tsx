import type { MaintenanceWindowWorkspaceResponse } from "../../api/contracts";
import { navigateToEvidenceConsistencyWorkspace } from "../../lib/evidence-consistency-navigation";
import { navigateToMaintenanceEvidenceWorkspaceForTopologyObject } from "../../lib/maintenance-evidence-workspace-navigation";
import { navigateToMaintenancePreviewForTopologyObject } from "../../lib/maintenance-preview-navigation";
import { navigateToServiceImpactWorkspace } from "../../lib/service-impact-workspace-navigation";
import { navigateToServiceExplorer } from "../../lib/service-explorer-navigation";
import { navigateToStabilityWorkspace } from "../../lib/stability-workspace-navigation";
import { navigateToPoliciesPolicy } from "../../lib/topology-policy-navigation";

const SERVICES_TABLE_CAP = 48;
const POLICIES_TABLE_CAP = 64;
const PIVOT_LIST_CAP = 14;

export interface MaintenanceWindowWorkspaceProductProps {
  data: MaintenanceWindowWorkspaceResponse;
  onReload: () => void;
  onChangeSubjects: () => void;
}

function parseSubjectLabel(label: string): { objectKind: "node" | "link"; objectId: string } | null {
  const parts = label.trim().split(":", 2);
  if (parts.length !== 2 || !parts[1]) {
    return null;
  }
  const k = parts[0].trim();
  if (k !== "node" && k !== "link") {
    return null;
  }
  return { objectKind: k, objectId: parts[1].trim() };
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

/**
 * Multi-subject deduped rollup UI for `maintenance_window_workspace_v1` — interpretation layer only;
 * not approval, blast-radius authority, or substitute for per-subject GET assemblies.
 */
export function MaintenanceWindowWorkspaceProduct({ data, onReload, onChangeSubjects }: MaintenanceWindowWorkspaceProductProps) {
  const syncLim = data.sync_runs_limit_applied;
  const servicesShown = data.deduped_affected_services.slice(0, SERVICES_TABLE_CAP);
  const policiesShown = data.deduped_related_policies.slice(0, POLICIES_TABLE_CAP);
  const anySparseSubject = data.subject_strip.some((s) => s.sparse_preview);

  return (
    <div className="maintenance-window-workspace-product" data-contract="maintenance_window_workspace_v1">
      <header className="maintenance-window-workspace-product__header">
        <p className="eyebrow">Phase 2 · maintenance_window_workspace_v1</p>
        <p className="table-note maintenance-window-workspace-product__toolbar">
          <span>
            <code>maintenance_window_workspace_v1</code> · {data.subjects_resolved} subject(s) resolved · requested{" "}
            <strong>{data.subjects_requested}</strong> · cap <strong>{data.subject_cap_applied}</strong> · preview_context{" "}
            <code>{data.preview_context}</code> · sync_runs_limit_applied <code>{data.sync_runs_limit_applied}</code>
          </span>
          <span className="maintenance-window-workspace-product__toolbar-actions">
            <button type="button" className="inline-action" onClick={onChangeSubjects}>
              Change subjects
            </button>
            <button type="button" className="inline-action" onClick={onReload}>
              Reload
            </button>
          </span>
        </p>
        <p className="body-copy">{data.window_framing_summary}</p>
        <p className="meta-copy maintenance-window-workspace-product__nonauthority">
          Deduped rows below are <strong>union summaries</strong> across the selected topology subjects — planning support
          only. They do not prove completeness, disjoint impact, or safe-to-change posture. Use per-subject{" "}
          <strong>Maintenance preview</strong> / <strong>Maintenance evidence</strong> for authoritative single-subject JSON.
        </p>
      </header>

      {data.subject_resolution_failures.length > 0 ? (
        <section className="maintenance-window-workspace-product__section" data-section="partial-resolution">
          <h3 className="maintenance-window-workspace-product__h">Partial resolution</h3>
          <p className="meta-copy">
            Some URL subjects did not resolve; the assembly below reflects <strong>successful</strong> subjects only.
          </p>
          <ul className="maintenance-window-workspace-product__list">
            {data.subject_resolution_failures.map((f) => (
              <li key={`${f.object_kind}:${f.object_id}`}>
                <code>{f.object_kind}</code> · <code>{f.object_id}</code> — {f.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="maintenance-window-workspace-product__section" data-section="selected-subjects">
        <h3 className="maintenance-window-workspace-product__h">Selected topology subjects</h3>
        {anySparseSubject ? (
          <p className="table-note">
            At least one subject has a <strong>sparse</strong> maintenance preview (empty related-policy slice or inventory
            caveats) — not hidden completeness.
          </p>
        ) : null}
        <div className="maintenance-window-workspace-product__table-wrap">
          <table className="data-table maintenance-window-workspace-product__table">
            <thead>
              <tr>
                <th>Kind</th>
                <th>Object</th>
                <th>Label</th>
                <th>Related policies</th>
                <th>Services (total)</th>
                <th>Drill-down</th>
              </tr>
            </thead>
            <tbody>
              {data.subject_strip.map((row) => (
                <tr key={`${row.object_kind}:${row.object_id}`}>
                  <td>
                    <code>{row.object_kind}</code>
                  </td>
                  <td>
                    <code>{row.object_id}</code>
                  </td>
                  <td>{row.display_name}</td>
                  <td>{row.related_policy_count}</td>
                  <td>{row.related_services_total}</td>
                  <td className="maintenance-window-workspace-product__pivots">
                    <button
                      type="button"
                      className="inline-action"
                      onClick={() =>
                        navigateToMaintenancePreviewForTopologyObject(row.object_id, row.object_kind, {
                          previewContext: data.preview_context,
                        })
                      }
                    >
                      Maintenance preview
                    </button>
                    <button
                      type="button"
                      className="inline-action"
                      onClick={() =>
                        navigateToMaintenanceEvidenceWorkspaceForTopologyObject(row.object_id, row.object_kind, {
                          previewContext: data.preview_context,
                        })
                      }
                    >
                      Maintenance evidence
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="maintenance-window-workspace-product__section" data-section="deduped-services">
        <h3 className="maintenance-window-workspace-product__h">Deduped affected services</h3>
        <p className="meta-copy">
          Union of Service Explorer–style rows from each subject&apos;s maintenance preview; <code>degraded_group_posture</code>{" "}
          merges conservatively across subjects.
        </p>
        {data.deduped_affected_services.length === 0 ? (
          <p className="table-note">No service groupings appeared in the related-policy-derived slice for this window.</p>
        ) : (
          <>
            {data.deduped_affected_services.length > SERVICES_TABLE_CAP ? (
              <p className="table-note">
                Showing first <strong>{SERVICES_TABLE_CAP}</strong> of <strong>{data.deduped_affected_services.length}</strong>{" "}
                rows (bounded table).
              </p>
            ) : null}
            <div className="maintenance-window-workspace-product__table-wrap">
              <table className="data-table maintenance-window-workspace-product__table">
                <thead>
                  <tr>
                    <th>service_id</th>
                    <th>Kind</th>
                    <th>Members</th>
                    <th>Group posture</th>
                    <th>Touched by subjects</th>
                    <th>Pivots</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesShown.map((row) => (
                    <tr key={row.service_id}>
                      <td>
                        <code>{row.service_id}</code>
                      </td>
                      <td>
                        <code>{row.kind}</code>
                      </td>
                      <td>{row.member_count}</td>
                      <td>
                        <span className={posturePillClass(row.degraded_group_posture)}>{row.degraded_group_posture}</span>
                      </td>
                      <td>
                        {row.touched_by_subjects.map((lab) => (
                          <span key={lab} className="identifier-chip">
                            {lab}
                          </span>
                        ))}
                      </td>
                      <td className="maintenance-window-workspace-product__pivots">
                        <button
                          type="button"
                          className="inline-action"
                          onClick={() => navigateToServiceImpactWorkspace(row.service_id)}
                        >
                          Service Impact
                        </button>
                        <button
                          type="button"
                          className="inline-action"
                          onClick={() => navigateToServiceExplorer({ serviceId: row.service_id })}
                        >
                          Service Explorer
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

      <section className="maintenance-window-workspace-product__section" data-section="deduped-policies">
        <h3 className="maintenance-window-workspace-product__h">Deduped related policies</h3>
        <p className="meta-copy">Union of related-policy identities across subjects; policy inventory remains authoritative.</p>
        {data.deduped_related_policies.length === 0 ? (
          <p className="table-note">No related policy rows were aligned to these subjects in the current snapshot slice.</p>
        ) : (
          <>
            {data.deduped_related_policies.length > POLICIES_TABLE_CAP ? (
              <p className="table-note">
                Showing first <strong>{POLICIES_TABLE_CAP}</strong> of <strong>{data.deduped_related_policies.length}</strong>{" "}
                rows.
              </p>
            ) : null}
            <div className="maintenance-window-workspace-product__table-wrap">
              <table className="data-table maintenance-window-workspace-product__table">
                <thead>
                  <tr>
                    <th>policy_id</th>
                    <th>Name</th>
                    <th>Touched by subjects</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {policiesShown.map((row) => (
                    <tr key={row.policy_id}>
                      <td>
                        <code>{row.policy_id}</code>
                      </td>
                      <td>{row.policy_name}</td>
                      <td>
                        {row.touched_by_subjects.map((lab) => (
                          <span key={lab} className="identifier-chip">
                            {lab}
                          </span>
                        ))}
                      </td>
                      <td>
                        <button type="button" className="inline-action" onClick={() => navigateToPoliciesPolicy(row.policy_id)}>
                          Policies (row)
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

      <section className="maintenance-window-workspace-product__section" data-section="evidence-gaps">
        <h3 className="maintenance-window-workspace-product__h">Evidence gaps &amp; assembly notes</h3>
        {data.merged_evidence_gap_notes.length === 0 ? (
          <p className="table-note">No merged gap lines for this assembly (nested sources may still be partial).</p>
        ) : (
          <ul className="maintenance-window-workspace-product__list">
            {data.merged_evidence_gap_notes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="maintenance-window-workspace-product__section" data-section="stability-cues">
        <h3 className="maintenance-window-workspace-product__h">Stability cues (global window)</h3>
        <p className="meta-copy">
          Pointer to <code>operational_stability_summary_v1</code> — not a substitute for Stability workspace drill-down.
        </p>
        {data.stability_cue_summary ? <p className="body-copy">{data.stability_cue_summary}</p> : null}
        {data.stability_summary_unavailable_note ? (
          <p className="table-note">{data.stability_summary_unavailable_note}</p>
        ) : null}
        <p>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToStabilityWorkspace({ syncRunsLimit: syncLim, topologyObject: null, serviceId: null })}
          >
            Open Stability workspace (global)
          </button>
          {data.selected_subjects[0] ? (
            <>
              {" "}
              <button
                type="button"
                className="inline-action"
                onClick={() => {
                  const p = parseSubjectLabel(data.selected_subjects[0]);
                  if (p) {
                    navigateToStabilityWorkspace({
                      syncRunsLimit: syncLim,
                      topologyObject: { id: p.objectId, kind: p.objectKind },
                      serviceId: null,
                    });
                  }
                }}
              >
                Pin first subject in Stability
              </button>
            </>
          ) : null}
        </p>
      </section>

      <section className="maintenance-window-workspace-product__section" data-section="tension-cues">
        <h3 className="maintenance-window-workspace-product__h">Cross-domain tension cues (subset)</h3>
        <p className="meta-copy">
          Deduped from <code>evidence_consistency_summary_v1</code> tension rows — not a full consistency matrix and not a
          safety verdict.
        </p>
        {data.tension_cue_rows.length === 0 && !data.evidence_consistency_unavailable_note ? (
          <p className="table-note">No tension-flagged rows in the bounded consistency assembly for this window.</p>
        ) : null}
        {data.evidence_consistency_unavailable_note ? (
          <p className="table-note">{data.evidence_consistency_unavailable_note}</p>
        ) : null}
        {data.tension_cue_rows.length > 0 ? (
          <ul className="maintenance-window-workspace-product__list">
            {data.tension_cue_rows.map((row, i) => (
              <li key={`${i}-${row.category}`}>
                <span className="meta-copy">
                  <code>{row.category}</code>
                </span>{" "}
                <strong>{row.summary}</strong>
                {row.detail ? <span> — {row.detail}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
        <p>
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceConsistencyWorkspace(syncLim)}>
            Open Evidence consistency workspace
          </button>
        </p>
      </section>

      {data.merged_assembly_caveats.length > 0 ? (
        <section className="maintenance-window-workspace-product__section" data-section="caveats">
          <h3 className="maintenance-window-workspace-product__h">Merged assembly caveats</h3>
          <ul className="maintenance-window-workspace-product__list">
            {data.merged_assembly_caveats.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="maintenance-window-workspace-product__section trust-cue-card trust-cue-card--compact" data-section="non-claims">
        <h3 className="maintenance-window-workspace-product__h">Explicit non-claims</h3>
        <ul className="maintenance-window-workspace-product__list">
          {data.explicit_non_claims.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <details className="maintenance-window-workspace-product__details">
        <summary>Recommended API pivots (read-only GET hints)</summary>
        <ul className="maintenance-window-workspace-product__list maintenance-window-workspace-product__mono-list">
          {data.recommended_api_pivots.slice(0, PIVOT_LIST_CAP).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {data.recommended_api_pivots.length > PIVOT_LIST_CAP ? (
          <p className="meta-copy">List truncated for display; see app-api OpenAPI for full route families.</p>
        ) : null}
      </details>
    </div>
  );
}

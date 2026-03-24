import { useMemo } from "react";

import { ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { ApiClientError } from "../../api/client";
import { formatLabel } from "../../lib/presentation";
import {
  navigateToInvestigationView,
  readSyncRunsLimitFromSearch,
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
} from "../../lib/investigation-navigation";
import { navigateToOperatorBriefingView } from "../../lib/operator-briefing-navigation";
import { mergeViewIntoSearch, navigateToEvidenceView, replaceUrlSearchParams } from "../../lib/url-app-state";
import {
  navigateToPoliciesPolicyEvidenceDeltaFocus,
  navigateToPoliciesPolicyEvidenceTimelineFocus,
  navigateToPoliciesPolicyPathAnalysis,
  navigateToTopologyObject,
} from "../../lib/topology-policy-navigation";
import { navigateToServiceExplorerForPolicy } from "../../lib/service-explorer-navigation";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";
import { usePolicyExplainabilityQuery } from "./api";

export interface PolicyExplainabilityWorkspaceProps {
  policyId: string | null;
}

function signalLabel(signal: string): string {
  switch (signal) {
    case "active_signal":
      return "Active / preferred signal";
    case "inactive_signal":
      return "Inactive / alternate signal";
    case "unknown_signal":
      return "Unknown signal";
    default:
      return formatLabel(signal);
  }
}

export function PolicyExplainabilityWorkspace({ policyId }: PolicyExplainabilityWorkspaceProps) {
  const { data, error, isLoading, isRefreshing, reload } = usePolicyExplainabilityQuery(policyId);
  const searchKey = useUrlSearchParamsKey();
  const explainabilityFromUrl = useMemo(
    () => new URLSearchParams(searchKey).get("policy_workspace") === "explainability",
    [searchKey],
  );

  if (policyId === null || policyId.length === 0) {
    return (
      <div className="policy-explainability-workspace" role="region" aria-labelledby="pex-heading">
        <header className="policy-explainability-workspace__header">
          <div>
            <p className="eyebrow">Policy explainability</p>
            <h3 id="pex-heading">Explainability workspace (v1)</h3>
          </div>
        </header>
        <p className="table-note">
          Select a <strong>policy</strong> in the table above. This workspace answers <strong>why</strong> the platform’s
          path story looks the way it does—using read-only evidence only. It is <strong>not</strong> a simulation, dry
          run, or dataplane proof, and it is <strong>distinct</strong> from the standard detail panels and the policy
          dossier briefing layout.
        </p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="policy-explainability-workspace" role="region" aria-labelledby="pex-heading">
        <header className="policy-explainability-workspace__header">
          <div>
            <p className="eyebrow">Policy explainability</p>
            <h3 id="pex-heading">Explainability workspace (v1)</h3>
          </div>
        </header>
        <LoadingState label="Loading policy explainability workspace (read-only narrative)…" />
      </div>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <div className="policy-explainability-workspace" role="region" aria-labelledby="pex-heading">
        <header className="policy-explainability-workspace__header">
          <div>
            <p className="eyebrow">Policy explainability</p>
            <h3 id="pex-heading">Explainability workspace (v1)</h3>
          </div>
        </header>
        {isNotFound ? (
          <div className="query-message">
            <strong>No policy record for this selection</strong>
            <p>
              The backend did not find this <code>policy_id</code> in the current normalized policy inventory slice, so
              explainability cannot be assembled. Choose a policy that exists in the list.
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

  const pr = data.policy_record;
  const pa = data.path_analysis;
  const ti = data.topology_impact;
  const tl = data.evidence_timeline;
  const de = data.evidence_delta;
  const sparse = data.sparse_signals;
  const syncRuns =
    typeof window !== "undefined"
      ? readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)
      : DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT;

  const openDeltaDigest = () => {
    const limit = data.navigation_targets.delta_digest_shell_params.sync_runs_limit ?? String(syncRuns);
    const sp = mergeViewIntoSearch(window.location.search, "delta-digest");
    sp.set("sync_runs_limit", limit);
    replaceUrlSearchParams(sp);
  };

  return (
    <div className="policy-explainability-workspace" role="region" aria-labelledby="pex-heading">
      <header className="policy-explainability-workspace__header policy-explainability-workspace__header--split">
        <div>
          <p className="eyebrow">Policy explainability · {data.contract_id}</p>
          <h3 id="pex-heading">{pr.policy_name}</h3>
          <p className="meta-copy">
            <code>{pr.policy_id}</code>
          </p>
        </div>
        <div className="policy-explainability-workspace__header-aside">
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToOperatorBriefingView(syncRuns, {
                policyId: pr.policy_id,
                invFrom: "policies",
              })
            }
          >
            Operator briefing
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToServiceExplorerForPolicy(pr.policy_id)}
            title={data.navigation_targets.service_explorer_shell_params.service_id}
          >
            Service Explorer
          </button>
          {isRefreshing ? (
            <p className="table-note" role="status">
              Refreshing explainability…
            </p>
          ) : null}
        </div>
      </header>

      <p className="table-note policy-explainability-workspace__intro">
        <strong>Explainability-first layout.</strong> Same underlying APIs as path analysis, topology impact, timeline,
        and delta—reordered for path/candidate narrative. <strong>Not</strong> forwarding proof, TE authority, workflow
        execution, or validation. <strong>Not</strong> the policy dossier workspace (breadth-first briefing).
      </p>

      {explainabilityFromUrl ? (
        <p className="table-note" role="status">
          Opened with <code>policy_workspace=explainability</code>
        </p>
      ) : null}

      <div className="policy-explainability-workspace__caveats callout" role="region" aria-label="Merged caveats">
        <strong>Merged caveats (read first)</strong>
        <ul className="notes-list">
          {data.merged_caveats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      {data.unknown_candidate_posture !== "none" ? (
        <div className="policy-explainability-workspace__unknown-banner callout">
          <strong>Candidate-path posture: {formatLabel(data.unknown_candidate_posture)}</strong>
          <p className="table-note">
            The platform cannot fully distinguish preferred vs alternate paths in this slice—see rollups and nested
            path-analysis caveats. Hints come from inventory and path-analysis notes only (no fabricated controller
            rejections).
          </p>
        </div>
      ) : null}

      <section className="policy-explainability-workspace__hero" aria-labelledby="pex-path-story-heading">
        <h4 id="pex-path-story-heading">Current path explanation</h4>
        <p className="policy-explainability-workspace__hero-summary">{data.path_explanation_summary}</p>
        <div className="key-value-list">
          <div className="key-value-row">
            <span>Truth alignment (path analysis)</span>
            <strong>{formatLabel(pa.truth_alignment.posture)}</strong>
          </div>
          <div className="key-value-row">
            <span>Inventory intent / observed</span>
            <strong>
              <StatusPill value={pr.intent_state} /> / <StatusPill value={pr.observed_state} />
            </strong>
          </div>
          <div className="key-value-row">
            <span>Degraded policy (v1)</span>
            <strong>
              <StatusPill value={pr.degraded_policy_v1.posture} />
            </strong>
          </div>
        </div>
        <p className="footnote">{pa.safety_framing.summary_disclaimer}</p>
        <button type="button" className="table-select" onClick={() => navigateToPoliciesPolicyPathAnalysis(policyId)}>
          Open full path analysis panel
        </button>
      </section>

      <div className="policy-explainability-workspace__sparse" aria-label="Sparse or partial evidence flags">
        <span
          className={`status-pill ${sparse.topology_naming_alignment_unknown ? "status-warn" : "status-good"}`}
        >
          Topology naming: {sparse.topology_naming_alignment_unknown ? "unknown scope" : "rows present"}
        </span>
        <span className={`status-pill ${sparse.evidence_timeline_sparse ? "status-warn" : "status-good"}`}>
          Timeline: {sparse.evidence_timeline_sparse ? "sparse / gaps" : "anchors present"}
        </span>
        <span className={`status-pill ${sparse.evidence_delta_not_ready ? "status-warn" : "status-good"}`}>
          Delta: {sparse.evidence_delta_not_ready ? "not ready" : "comparison ready"}
        </span>
      </div>

      <section className="policy-explainability-workspace__section" aria-labelledby="pex-candidates-heading">
        <h4 id="pex-candidates-heading">Candidate paths (signals &amp; hints)</h4>
        {data.candidate_path_rollups.length === 0 ? (
          <p className="table-note">
            <strong>No candidate rollups</strong> in this assembly—unknown active path; see inventory and path analysis
            when detail exists.
          </p>
        ) : (
          <ul className="policy-explainability-workspace__rollup-list">
            {data.candidate_path_rollups.map((r) => (
              <li key={`${r.name}-${r.path_state}-${r.signal}`} className="policy-explainability-workspace__rollup">
                <div className="policy-explainability-workspace__rollup-head">
                  <strong>{r.name}</strong>
                  <span className="policy-explainability-workspace__signal">{signalLabel(r.signal)}</span>
                </div>
                <p className="table-note">
                  <code>path_state</code>: {r.path_state}
                  {r.preference != null ? (
                    <>
                      {" "}
                      · preference {r.preference}
                    </>
                  ) : null}
                </p>
                {r.hint_lines.length > 0 ? (
                  <ul className="notes-list">
                    {r.hint_lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="table-note">No per-candidate notes in this slice.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="policy-explainability-workspace__grid">
        <article className="detail-card" aria-labelledby="pex-topo-heading">
          <h4 id="pex-topo-heading">Topology naming alignment</h4>
          <p className="table-note">{ti.derivation_summary}</p>
          {ti.items.length === 0 ? (
            <p className="table-note">
              <strong>No topology rows</strong> — naming alignment is unknown here, not “no dependencies.”
            </p>
          ) : (
            <ul className="notes-list">
              {ti.items.slice(0, 8).map((row) => (
                <li key={`${row.topology_object_kind}-${row.topology_object_id}-${row.matched_field}`}>
                  <button
                    type="button"
                    className="table-select"
                    onClick={() => navigateToTopologyObject(row.topology_object_id, row.topology_object_kind)}
                  >
                    {formatLabel(row.topology_object_kind)} {row.topology_object_id}
                  </button>
                  <span className="table-note">
                    {" "}
                    · {formatLabel(row.matched_field)} · {row.relationship_kind}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="detail-card" aria-labelledby="pex-pivots-heading">
          <h4 id="pex-pivots-heading">Related workspaces</h4>
          <p className="table-note">Read-only pivots—same bounded semantics as other shells.</p>
          <ul className="notes-list">
            <li>
              <button
                type="button"
                className="table-select"
                onClick={() =>
                  navigateToInvestigationView(syncRuns, {
                    invFrom: "policy_explainability",
                    policyId: pr.policy_id,
                  })
                }
              >
                Investigation
              </button>
              <span className="table-note"> · inv_from=policy_explainability (breadcrumb)</span>
            </li>
            <li>
              <button type="button" className="table-select" onClick={() => navigateToEvidenceView("situation-room")}>
                Situation room
              </button>
            </li>
            <li>
              <button type="button" className="table-select" onClick={openDeltaDigest}>
                Delta digest
              </button>
              <span className="table-note"> · sync_runs_limit from workspace hint</span>
            </li>
            <li>
              <button type="button" className="table-select" onClick={() => navigateToEvidenceView("overview")}>
                Overview (recent change context)
              </button>
            </li>
          </ul>
        </article>
      </div>

      <section className="policy-explainability-workspace__section" aria-labelledby="pex-timeline-heading">
        <h4 id="pex-timeline-heading">Evidence timeline anchors</h4>
        <p className="table-note">{tl.scope_summary}</p>
        {tl.entries.length === 0 ? (
          <p className="table-note">No timeline anchors in this window (honest sparse).</p>
        ) : (
          <ul className="notes-list">
            {tl.entries.slice(0, 6).map((e) => (
              <li key={`${e.sort_key}-${e.tie_break}-${e.entry_kind}`}>
                <strong>{formatLabel(e.entry_kind)}</strong> — {e.summary}
                <div className="table-note">
                  {e.provenance} · {e.reference}
                </div>
              </li>
            ))}
          </ul>
        )}
        {tl.missing_evidence_notes.length > 0 ? (
          <div className="callout">
            <strong>Timeline gaps</strong>
            <ul className="notes-list">
              {tl.missing_evidence_notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <button
          type="button"
          className="table-select"
          onClick={() => navigateToPoliciesPolicyEvidenceTimelineFocus(policyId)}
        >
          Open full evidence timeline panel
        </button>
      </section>

      <section className="policy-explainability-workspace__section" aria-labelledby="pex-delta-heading">
        <h4 id="pex-delta-heading">Evidence delta anchors</h4>
        <p className="table-note">{de.scope_summary}</p>
        <div className="key-value-list">
          <div className="key-value-row">
            <span>Comparison status</span>
            <strong>{formatLabel(de.comparison_status)}</strong>
          </div>
        </div>
        {de.comparison_status !== "delta_ready" ? (
          <div className="callout">
            <strong>Comparison posture</strong>
            <p className="table-note">
              <code>{de.comparison_status}</code> — see nested contract for honest scope (not drift approval).
            </p>
          </div>
        ) : null}
        {de.delta_items.length > 0 ? (
          <ul className="notes-list">
            {de.delta_items.slice(0, 8).map((item, idx) => (
              <li key={`${item.category}-${idx}`}>
                <strong>{formatLabel(item.category)}</strong> — {item.summary}
                {item.detail ? <div className="table-note">{item.detail}</div> : null}
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          className="table-select"
          onClick={() => navigateToPoliciesPolicyEvidenceDeltaFocus(policyId)}
        >
          Open full evidence delta panel
        </button>
      </section>

      <section className="policy-explainability-workspace__section" aria-labelledby="pex-fresh-heading">
        <h4 id="pex-fresh-heading">Freshness</h4>
        <div className="key-value-list">
          <div className="key-value-row">
            <span>Workspace assembled</span>
            <strong>{data.freshness.dossier_assembled_at}</strong>
          </div>
          <div className="key-value-row">
            <span>Policy serving echo</span>
            <strong>{data.freshness.policy_serving_mode_echo}</strong>
          </div>
          {data.freshness.policy_inventory_empty_reason ? (
            <div className="key-value-row">
              <span>Inventory empty_reason</span>
              <strong>{data.freshness.policy_inventory_empty_reason}</strong>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

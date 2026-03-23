import { useMemo } from "react";

import { EvidenceExportActions } from "../../components/evidence-export-actions";
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
import { navigateToEvidenceView } from "../../lib/url-app-state";
import {
  navigateToPoliciesPolicyEvidenceDeltaFocus,
  navigateToPoliciesPolicyEvidenceTimelineFocus,
  navigateToPoliciesPolicyPathAnalysis,
  navigateToTopologyObject,
} from "../../lib/topology-policy-navigation";
import { readPolicyDossierEntryFromSearch } from "../../lib/policy-dossier-navigation";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";
import { usePolicyDossierQuery } from "./api";

export interface PolicyDossierWorkspaceProps {
  policyId: string | null;
}

export function PolicyDossierWorkspace({ policyId }: PolicyDossierWorkspaceProps) {
  const { data, error, isLoading, isRefreshing, reload } = usePolicyDossierQuery(policyId);
  const searchKey = useUrlSearchParamsKey();
  const dossierEntry = useMemo(() => readPolicyDossierEntryFromSearch(searchKey), [searchKey]);

  if (policyId === null || policyId.length === 0) {
    return (
      <div className="policy-dossier-workspace" role="region" aria-labelledby="policy-dossier-heading">
        <header className="policy-dossier-workspace__header">
          <div>
            <p className="eyebrow">Policy dossier</p>
            <h3 id="policy-dossier-heading">Policy dossier workspace (v1)</h3>
          </div>
        </header>
        <p className="table-note">
          Select a <strong>policy</strong> row in the table above to load a composed, read-only briefing. This workspace
          unifies path analysis, degraded-policy (v1), topology impact, evidence timeline, and evidence delta—it does{" "}
          <strong>not</strong> replace the specialized panels in standard view.
        </p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="policy-dossier-workspace" role="region" aria-labelledby="policy-dossier-heading">
        <header className="policy-dossier-workspace__header">
          <div>
            <p className="eyebrow">Policy dossier</p>
            <h3 id="policy-dossier-heading">Policy dossier workspace (v1)</h3>
          </div>
        </header>
        <LoadingState label="Loading policy dossier (composed read-only evidence)…" />
      </div>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <div className="policy-dossier-workspace" role="region" aria-labelledby="policy-dossier-heading">
        <header className="policy-dossier-workspace__header">
          <div>
            <p className="eyebrow">Policy dossier</p>
            <h3 id="policy-dossier-heading">Policy dossier workspace (v1)</h3>
          </div>
        </header>
        {isNotFound ? (
          <div className="query-message">
            <strong>No policy record for this selection</strong>
            <p>
              The backend did not find this <code>policy_id</code> in the current normalized policy inventory slice, so
              the dossier cannot be assembled. Choose a policy that exists in the list.
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
  const syncRuns =
    typeof window !== "undefined"
      ? readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)
      : DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT;

  return (
    <div className="policy-dossier-workspace" role="region" aria-labelledby="policy-dossier-heading">
      <header className="policy-dossier-workspace__header policy-dossier-workspace__header--split">
        <div>
          <p className="eyebrow">Policy dossier · {data.contract_id}</p>
          <h3 id="policy-dossier-heading">{pr.policy_name}</h3>
          <p className="meta-copy">
            <code>{pr.policy_id}</code>
          </p>
        </div>
        <div className="policy-dossier-workspace__header-aside">
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
            Open operator briefing
          </button>
          <EvidenceExportActions variant="dossier" target={{ kind: "policy_dossier", policyId: pr.policy_id }} />
          {isRefreshing ? (
            <p className="table-note" role="status">
              Refreshing dossier…
            </p>
          ) : null}
        </div>
      </header>

      <p className="table-note">
        <strong>Read-only assembly.</strong> Nested <code>contract_id</code> values identify each source API. This
        workspace is <strong>not</strong> dataplane proof, SLA, workflow authority, or validation verdict.
      </p>

      {dossierEntry ? (
        <div className="callout">
          <strong>Navigation context</strong>
          <p className="table-note">
            Opened with <code>policy_dossier_entry={dossierEntry}</code> — optional shell hint; not sent to app-api.
          </p>
        </div>
      ) : null}

      <section className="policy-dossier-workspace__section" aria-labelledby="pd-identity-heading">
        <h4 id="pd-identity-heading">Inventory posture &amp; degraded policy (v1)</h4>
        <div className="key-value-list">
          <div className="key-value-row">
            <span>Intent / observed</span>
            <strong>
              <StatusPill value={pr.intent_state} /> / <StatusPill value={pr.observed_state} />
            </strong>
          </div>
          <div className="key-value-row">
            <span>Support</span>
            <strong>
              <StatusPill value={pr.support_state} />
            </strong>
          </div>
          <div className="key-value-row">
            <span>Degraded (v1)</span>
            <strong>
              <StatusPill value={pr.degraded_policy_v1.posture} />
            </strong>
          </div>
        </div>
        <p className="table-note">{pr.degraded_policy_v1.summary}</p>
      </section>

      <div className="policy-dossier-workspace__grid">
        <article className="detail-card" aria-labelledby="pd-path-heading">
          <h4 id="pd-path-heading">Path analysis (nested)</h4>
          <p className="footnote">{pa.safety_framing.summary_disclaimer}</p>
          <div className="key-value-list">
            <div className="key-value-row">
              <span>Truth alignment</span>
              <strong>{formatLabel(pa.truth_alignment.posture)}</strong>
            </div>
          </div>
          <p className="table-note">{pa.truth_alignment.summary}</p>
          <button type="button" className="table-select" onClick={() => navigateToPoliciesPolicyPathAnalysis(policyId)}>
            Open full path analysis panel
          </button>
        </article>

        <article className="detail-card" aria-labelledby="pd-impact-heading">
          <h4 id="pd-impact-heading">Topology impact (nested)</h4>
          <p className="table-note">{ti.derivation_summary}</p>
          {ti.items.length === 0 ? (
            <p className="table-note">
              <strong>No topology rows</strong> under string-equality rules for this policy—naming alignment scope, not
              blast radius.
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
      </div>

      <section className="policy-dossier-workspace__section" aria-labelledby="pd-timeline-heading">
        <h4 id="pd-timeline-heading">Evidence timeline (nested)</h4>
        <p className="table-note">{tl.scope_summary}</p>
        {tl.entries.length === 0 ? (
          <p className="table-note">No timeline anchors in this assembly (honest sparse window).</p>
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

      <section className="policy-dossier-workspace__section" aria-labelledby="pd-delta-heading">
        <h4 id="pd-delta-heading">Evidence delta (nested)</h4>
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
              <code>{de.comparison_status}</code> — see nested contract for honest scope (not drift truth).
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

      <section className="policy-dossier-workspace__section" aria-labelledby="pd-pivot-heading">
        <h4 id="pd-pivot-heading">Pivots</h4>
        <div className="key-value-list">
          <div className="key-value-row">
            <span>Investigation</span>
            <button
              type="button"
              className="table-select"
              onClick={() =>
                navigateToInvestigationView(syncRuns, {
                  invFrom: "policies",
                })
              }
            >
              Open investigation (from Policies)
            </button>
          </div>
          <div className="key-value-row">
            <span>Situation room</span>
            <button type="button" className="table-select" onClick={() => navigateToEvidenceView("situation-room")}>
              Open situation room
            </button>
          </div>
        </div>
      </section>

      <section className="policy-dossier-workspace__section" aria-labelledby="pd-fresh-heading">
        <h4 id="pd-fresh-heading">Freshness &amp; merged caveats</h4>
        <div className="key-value-list">
          <div className="key-value-row">
            <span>Dossier assembled</span>
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
        <div className="callout">
          <strong>Merged caveats (all composed sources)</strong>
          <ul className="notes-list">
            {data.merged_caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

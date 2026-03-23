import { useMemo } from "react";

import { EvidenceExportActions } from "../../components/evidence-export-actions";
import { ErrorState, LoadingState } from "../../components/query-states";
import { ApiClientError } from "../../api/client";
import type { TopologyObjectKind } from "../../api/contracts";
import { formatLabel } from "../../lib/presentation";
import {
  navigateToInvestigationView,
  readSyncRunsLimitFromSearch,
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
} from "../../lib/investigation-navigation";
import { navigateToOperatorBriefingView } from "../../lib/operator-briefing-navigation";
import { navigateToEvidenceView, navigateToPoliciesWithDegradedPolicyV1Posture } from "../../lib/url-app-state";
import { readDossierSourceFromSearch } from "../../lib/topology-dossier-navigation";
import { navigateToPoliciesPolicy } from "../../lib/topology-policy-navigation";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";
import { useTopologyObjectDossierQuery } from "./api";

export interface TopologyObjectDossierWorkspaceProps {
  objectId: string | null;
  objectKind: TopologyObjectKind | null;
}

export function TopologyObjectDossierWorkspace({ objectId, objectKind }: TopologyObjectDossierWorkspaceProps) {
  const { data, error, isLoading, isRefreshing, reload } = useTopologyObjectDossierQuery(objectId);
  const searchKey = useUrlSearchParamsKey();
  const dossierSource = useMemo(() => readDossierSourceFromSearch(searchKey), [searchKey]);

  if (objectId === null || objectKind === null) {
    return (
      <div className="topology-dossier-workspace" role="region" aria-labelledby="topology-dossier-heading">
        <header className="topology-dossier-workspace__header">
          <div>
            <p className="eyebrow">Topology object dossier</p>
            <h3 id="topology-dossier-heading">Object dossier workspace (v1)</h3>
          </div>
        </header>
        <p className="table-note">
          Select a <strong>node</strong> or <strong>link</strong> row in the tables above to load a composed,
          read-only briefing. This workspace unifies evidence from related policies, failure-impact, risk summary,
          and degraded-policy (v1) signals—it does <strong>not</strong> replace the specialized panels in standard
          view.
        </p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="topology-dossier-workspace" role="region" aria-labelledby="topology-dossier-heading">
        <header className="topology-dossier-workspace__header">
          <div>
            <p className="eyebrow">Topology object dossier</p>
            <h3 id="topology-dossier-heading">Object dossier workspace (v1)</h3>
          </div>
        </header>
        <LoadingState label="Loading topology object dossier (composed read-only evidence)…" />
      </div>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <div className="topology-dossier-workspace" role="region" aria-labelledby="topology-dossier-heading">
        <header className="topology-dossier-workspace__header">
          <div>
            <p className="eyebrow">Topology object dossier</p>
            <h3 id="topology-dossier-heading">Object dossier workspace (v1)</h3>
          </div>
        </header>
        {isNotFound ? (
          <div className="query-message">
            <strong>No topology object for this selection</strong>
            <p>
              The backend did not find this object in the current normalized topology snapshot, so the dossier cannot
              be assembled. Choose a node or link that exists in topology.
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

  const fi = data.failure_impact;
  const rc = fi.rollup_counts;
  const risk = data.risk_attention.row;
  const syncRuns =
    typeof window !== "undefined"
      ? readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)
      : DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT;

  return (
    <div className="topology-dossier-workspace" role="region" aria-labelledby="topology-dossier-heading">
      <header className="topology-dossier-workspace__header topology-dossier-workspace__header--split">
        <div>
          <p className="eyebrow">Topology object dossier · {data.contract_id}</p>
          <h3 id="topology-dossier-heading">{data.object_identity.display_label}</h3>
          <p className="meta-copy">
            <strong>{formatLabel(data.object_identity.object_kind)}</strong>{" "}
            <code>{data.object_identity.object_id}</code>
          </p>
        </div>
        <div className="topology-dossier-workspace__header-aside">
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToOperatorBriefingView(syncRuns, {
                topologyObject: {
                  id: data.object_identity.object_id,
                  kind: data.object_identity.object_kind,
                },
                invFrom: "topology",
              })
            }
          >
            Open operator briefing
          </button>
          <EvidenceExportActions
            variant="dossier"
            target={{ kind: "topology_object_dossier", objectId: data.object_identity.object_id }}
          />
          {isRefreshing ? (
            <p className="table-note" role="status">
              Refreshing dossier…
            </p>
          ) : null}
        </div>
      </header>

      <p className="table-note">
        <strong>Read-only assembly.</strong> This workspace composes existing Phase 2 contracts only. It is{" "}
        <strong>not</strong> blast-radius simulation, traffic or SLA risk, workflow authority, or a substitute for
        deep per-policy or per-path drill-downs.
      </p>

      {dossierSource ? (
        <div className="callout">
          <strong>Navigation context</strong>
          <p className="table-note">
            Opened with <code>dossier_source={dossierSource}</code> — client-only shell hint for where you entered
            the dossier; not sent to app-api and not a scoring signal.
          </p>
        </div>
      ) : null}

      <section className="topology-dossier-workspace__section" aria-labelledby="dossier-posture-heading">
        <h4 id="dossier-posture-heading">Topology posture summary</h4>
        <ul className="notes-list">
          {data.topology_posture_summary_lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <ul className="notes-list">
          {data.object_identity.identity_detail_lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <div className="topology-dossier-workspace__grid">
        <article className="detail-card" aria-labelledby="dossier-fi-heading">
          <h4 id="dossier-fi-heading">Failure impact (nested)</h4>
          <p className="footnote">{fi.safety_framing.summary_disclaimer}</p>
          <div className="key-value-list">
            <div className="key-value-row">
              <span>Related policies (distinct)</span>
              <strong>{rc.related_policies_total}</strong>
            </div>
            <div className="key-value-row">
              <span>Degraded (v1) — related subset</span>
              <strong>{rc.degraded_related_policies_total}</strong>
            </div>
            <div className="key-value-row">
              <span>Path-analysis supported (related)</span>
              <strong>{rc.related_policies_path_analysis_supported_total}</strong>
            </div>
            <div className="key-value-row">
              <span>Posture breakdown (ok / degraded / unknown)</span>
              <strong>
                {fi.degraded_posture_breakdown.ok} / {fi.degraded_posture_breakdown.degraded} /{" "}
                {fi.degraded_posture_breakdown.unknown}
              </strong>
            </div>
          </div>
          {fi.missing_evidence_notes.length > 0 ? (
            <div className="callout">
              <strong>Missing or partial evidence</strong>
              <ul className="notes-list">
                {fi.missing_evidence_notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>

        <article className="detail-card" aria-labelledby="dossier-risk-heading">
          <h4 id="dossier-risk-heading">Risk attention (this object)</h4>
          <p className="table-note">{data.risk_attention.ranking_basis}</p>
          {data.risk_attention.risk_row_gap_note ? (
            <div className="callout">
              <p>{data.risk_attention.risk_row_gap_note}</p>
            </div>
          ) : null}
          {risk ? (
            <div className="key-value-list">
              <div className="key-value-row">
                <span>Rank</span>
                <strong>{risk.rank_index}</strong>
              </div>
              <div className="key-value-row">
                <span>D / U / R / K</span>
                <strong>
                  {risk.ranking_inputs.degraded_related_count} / {risk.ranking_inputs.unknown_related_count} /{" "}
                  {risk.ranking_inputs.related_policy_breadth} / {risk.ranking_inputs.ok_related_count}
                </strong>
              </div>
            </div>
          ) : (
            <p className="table-note">No risk-summary row in this assembly.</p>
          )}
        </article>
      </div>

      <section className="topology-dossier-workspace__section" aria-labelledby="dossier-related-heading">
        <h4 id="dossier-related-heading">Related policies (preview)</h4>
        <p className="table-note">{data.related_policies.derivation_summary}</p>
        {data.related_policies.items.length === 0 ? (
          <p className="table-note">
            <strong>No related policies</strong> for this object under string-equality rules—this is naming alignment
            scope, not “healthy.”
          </p>
        ) : (
          <ul className="notes-list">
            {data.related_policies.items.map((item) => (
              <li key={`${item.policy_id}-${item.matched_field}-${item.matched_topology_identifier}`}>
                <button type="button" className="table-select" onClick={() => navigateToPoliciesPolicy(item.policy_id)}>
                  {item.policy_name}
                </button>{" "}
                <span className="table-note">
                  ({item.policy_id}) · {formatLabel(item.matched_field)} · {item.relationship_kind}
                </span>
                {item.caveats.length > 0 ? (
                  <ul className="notes-list">
                    {item.caveats.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="topology-dossier-workspace__section" aria-labelledby="dossier-degraded-heading">
        <h4 id="dossier-degraded-heading">Degraded policy (v1) — related subset</h4>
        {data.degraded_related_policies_preview.length === 0 ? (
          <p className="table-note">No related policies to classify in this dossier slice.</p>
        ) : (
          <ul className="notes-list">
            {data.degraded_related_policies_preview.map((row) => (
              <li key={row.policy_id}>
                <strong>{formatLabel(row.degraded_policy_v1.posture)}</strong> — {row.policy_name}{" "}
                <code>{row.policy_id}</code>
                <div className="table-note">{row.degraded_policy_v1.summary}</div>
              </li>
            ))}
          </ul>
        )}
        <p className="table-note">
          <button type="button" className="table-select" onClick={() => navigateToPoliciesWithDegradedPolicyV1Posture("degraded")}>
            Open Policies with degraded filter
          </button>{" "}
          (read-side navigation only)
        </p>
      </section>

      <section className="topology-dossier-workspace__section" aria-labelledby="dossier-nav-heading">
        <h4 id="dossier-nav-heading">Pivots</h4>
        <div className="key-value-list">
          <div className="key-value-row">
            <span>Investigation</span>
            <button
              type="button"
              className="table-select"
              onClick={() =>
                navigateToInvestigationView(syncRuns, {
                  invFrom: "topology",
                  topologyObject: { id: objectId, kind: objectKind },
                  failureImpactEntry: true,
                })
              }
            >
              Open investigation (failure-impact entry)
            </button>
          </div>
          <div className="key-value-row">
            <span>Risk summary entry</span>
            <button
              type="button"
              className="table-select"
              onClick={() =>
                navigateToInvestigationView(syncRuns, {
                  invFrom: "topology",
                  topologyObject: { id: objectId, kind: objectKind },
                  riskSummaryEntry: true,
                })
              }
            >
              Open investigation (risk-summary entry)
            </button>
          </div>
          <div className="key-value-row">
            <span>Situation room</span>
            <button
              type="button"
              className="table-select"
              onClick={() => {
                navigateToEvidenceView("situation-room");
              }}
            >
              Open situation room
            </button>
            <span className="table-note">sync_runs_limit aligns with shell defaults where omitted.</span>
          </div>
        </div>
      </section>

      <section className="topology-dossier-workspace__section" aria-labelledby="dossier-fresh-heading">
        <h4 id="dossier-fresh-heading">Freshness & merged caveats</h4>
        <div className="key-value-list">
          <div className="key-value-row">
            <span>Dossier assembled</span>
            <strong>{data.freshness.dossier_assembled_at}</strong>
          </div>
          <div className="key-value-row">
            <span>Policy serving echo</span>
            <strong>{data.freshness.policy_serving_mode_echo}</strong>
          </div>
          <div className="key-value-row">
            <span>Risk summary assembly</span>
            <strong>{data.freshness.topology_risk_summary_assembly_generated_at ?? "—"}</strong>
          </div>
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

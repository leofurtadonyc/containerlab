import { ErrorState, LoadingState } from "../../components/query-states";
import { ApiClientError } from "../../api/client";
import type { PathExplorerWorkspaceResponse } from "../../api/contracts";
import { formatLabel } from "../../lib/presentation";
import { navigateToDeltaDigestView } from "../../lib/delta-digest-navigation";
import { navigateToEvidenceConsistencyWorkspace } from "../../lib/evidence-consistency-navigation";
import { navigateToEvidenceQualityWorkspace } from "../../lib/evidence-quality-workspace-navigation";
import { navigateToEvidenceView } from "../../lib/url-app-state";
import { navigateToOperatorBriefingView } from "../../lib/operator-briefing-navigation";
import { DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, navigateToInvestigationView } from "../../lib/investigation-navigation";
import { navigateToServiceExplorerForPolicy } from "../../lib/service-explorer-navigation";
import {
  navigateToPolicyDossierWorkspace,
  navigateToPolicyExplainabilityWorkspace,
} from "../../lib/policy-dossier-navigation";
import { navigateToPoliciesPolicyPathAnalysis } from "../../lib/topology-policy-navigation";
import { usePathExplorerWorkspaceQuery } from "./api";

export interface PathExplorerProductProps {
  policyId: string;
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

export function PathExplorerProduct({ policyId }: PathExplorerProductProps) {
  const { data, error, isLoading, isRefreshing, reload } = usePathExplorerWorkspaceQuery(policyId);

  if (isLoading && !data) {
    return (
      <div className="path-explorer-product" data-contract="path_explorer_v1">
        <header className="path-explorer-product__header">
          <p className="eyebrow">Phase 2 · path_explorer_v1</p>
          <h2>Path Explorer</h2>
        </header>
        <LoadingState label="Loading Path Explorer workspace (composed read-only GET)…" />
      </div>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiClientError && error.status === 404;
    return (
      <div className="path-explorer-product" data-contract="path_explorer_v1">
        <header className="path-explorer-product__header">
          <p className="eyebrow">Phase 2 · path_explorer_v1</p>
          <h2>Path Explorer</h2>
        </header>
        {isNotFound ? (
          <div className="query-message">
            <strong>Path Explorer not available for this policy id</strong>
            <p>
              The policy id is not in the current bounded inventory slice, so the composed workspace cannot load.
              Choose another policy from Policies or paste a known id.
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
    <PathExplorerWorkspaceBody
      data={data}
      isRefreshing={isRefreshing}
      onReload={() => void reload()}
    />
  );
}

function PathExplorerWorkspaceBody({
  data,
  isRefreshing,
  onReload,
}: {
  data: PathExplorerWorkspaceResponse;
  isRefreshing: boolean;
  onReload: () => void;
}) {
  const pa = data.path_analysis;
  const ex = data.explainability;
  const sparse = ex.sparse_signals;

  return (
    <div className="path-explorer-product" data-contract="path_explorer_v1">
      <header className="path-explorer-product__header">
        <div>
          <p className="eyebrow">Phase 2 · path_explorer_v1</p>
          <h2>Path Explorer</h2>
          <p className="table-note">
            Composed workspace over existing path-analysis and explainability assemblies — <strong>not</strong>{" "}
            dataplane proof, TE solving, or workflow authority. Nested JSON remains authoritative per contract. On{" "}
            <strong>Policies</strong>, <strong>Policy dossier</strong> is breadth-first composed briefing;{" "}
            <strong>Explainability</strong> is path-story-first—this shell bundles both for the same policy anchor.
          </p>
        </div>
      </header>

      {isRefreshing ? (
        <p className="table-note" role="status">
          Refreshing Path Explorer…
        </p>
      ) : null}

      <section className="detail-card" aria-labelledby="pex-subject">
        <h3 id="pex-subject">Subject</h3>
        <p>
          <strong>{pa.subject.policy_name}</strong> · <code>{data.policy_id}</code>
        </p>
        <p className="footnote">
          Source contracts: {data.source_contract_ids.join(", ")}
        </p>
      </section>

      <section className="detail-card" aria-labelledby="pex-nonclaims">
        <h3 id="pex-nonclaims">Explicit non-claims (workspace + nested)</h3>
        <ul className="notes-list">
          {data.explicit_non_claims.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="detail-card" aria-labelledby="pex-io">
        <h3 id="pex-io">Intended vs observed (path analysis)</h3>
        <p className="policy-detail-metric">
          <span className="policy-detail-metric__label">Truth alignment</span>
          <span className="policy-detail-metric__value">{formatLabel(pa.truth_alignment.posture)}</span>
        </p>
        <p>{pa.truth_alignment.summary}</p>
        <p className="footnote">{pa.safety_framing.summary_disclaimer}</p>
      </section>

      <section className="detail-card" aria-labelledby="pex-candidates">
        <h3 id="pex-candidates">Candidate path reasoning</h3>
        <p className="table-note">{ex.path_explanation_summary}</p>
        <p className="footnote">
          Unknown-candidate posture: <strong>{ex.unknown_candidate_posture}</strong>
        </p>
        {ex.candidate_path_rollups.length === 0 ? (
          <p className="footnote">No candidate rollups on this assembly (sparse or empty inventory slice).</p>
        ) : (
          <ul className="notes-list">
            {ex.candidate_path_rollups.map((r) => (
              <li key={r.name}>
                <strong>{r.name}</strong> — {signalLabel(r.signal)} · state {r.path_state}
                {r.hint_lines.length > 0 ? (
                  <ul>
                    {r.hint_lines.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-card" aria-labelledby="pex-explain">
        <h3 id="pex-explain">Explainability cues (sparse signals)</h3>
        <ul className="notes-list">
          <li>Topology naming alignment unknown: {String(sparse.topology_naming_alignment_unknown)}</li>
          <li>Evidence timeline sparse: {String(sparse.evidence_timeline_sparse)}</li>
          <li>Evidence delta not ready: {String(sparse.evidence_delta_not_ready)}</li>
        </ul>
      </section>

      <section className="detail-card" aria-labelledby="pex-gaps">
        <h3 id="pex-gaps">Evidence gaps &amp; merged caveats</h3>
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

      {data.policy_dossier ? (
        <section className="detail-card" aria-labelledby="pex-dossier">
          <h3 id="pex-dossier">Policy dossier (embedded)</h3>
          <p className="footnote">
            Optional nested dossier present — same semantics as{" "}
            <code>GET /api/v1/policies/…/dossier</code>; use Policies dossier workspace for the full layout.
          </p>
        </section>
      ) : (
        <p className="table-note">Policy dossier not embedded on this response (optional assembly).</p>
      )}

      <section className="detail-card" aria-labelledby="pex-pivots">
        <h3 id="pex-pivots">Related product pivots (bounded)</h3>
        <p className="table-note">
          These navigate to <strong>separate</strong> read-only surfaces — not substitutes for Path Explorer.
        </p>
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToPoliciesPolicyPathAnalysis(data.policy_id)}>
            Open Policies (path-analysis panel)
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToPolicyExplainabilityWorkspace(data.policy_id, undefined, "candidates")}
          >
            Open explainability on Policies
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToPolicyDossierWorkspace(data.policy_id, "path_explorer")}
          >
            Open policy dossier
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToServiceExplorerForPolicy(data.policy_id)}
          >
            Service Explorer (policy grouping)
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToDeltaDigestView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)}
          >
            Delta digest
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToEvidenceConsistencyWorkspace(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)}
          >
            Evidence consistency workspace
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT })}
          >
            Evidence quality workspace
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() =>
              navigateToInvestigationView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, {
                invFrom: "path-explorer",
                policyId: data.policy_id,
              })
            }
          >
            Investigation
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => navigateToOperatorBriefingView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, { invFrom: "path-explorer" })}
          >
            Operator briefing
          </button>
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("topology")}>
            Topology
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

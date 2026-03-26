import type { ApiClientError } from "../../api/client";
import type { EvidenceConsistencySummaryResponse } from "../../api/contracts";
import { navigateEvidenceConsistencyPivotFromHint } from "../../lib/evidence-consistency-pivots";
import { navigateToEvidenceConsistencyWorkspace } from "../../lib/evidence-consistency-navigation";
import { navigateToDeltaDigestView } from "../../lib/delta-digest-navigation";

export interface EvidenceConsistencyOverviewEntryProps {
  syncRunsLimit: number;
  evidenceConsistency: {
    data: EvidenceConsistencySummaryResponse | null;
    error: ApiClientError | null;
    isLoading: boolean;
    reload: () => void | Promise<void>;
  };
}

function tensionRowCount(data: EvidenceConsistencySummaryResponse): number {
  return data.items.filter((i) => i.consistency_signal === "appears_in_tension").length;
}

/**
 * Overview / NOC entry for cross-domain evidence consistency (`evidence_consistency_summary_v1`).
 */
export function EvidenceConsistencyOverviewEntry({
  syncRunsLimit,
  evidenceConsistency,
}: EvidenceConsistencyOverviewEntryProps) {
  const { data, error, isLoading, reload } = evidenceConsistency;

  return (
    <article
      className="detail-card delta-digest-entry-card"
      data-testid="evidence-consistency-overview-entry"
    >
      <div className="delta-digest-entry-card__intro">
        <h3>Evidence consistency (cross-domain)</h3>
        <p className="table-note">
          Read-side <strong>alignment / tension</strong> hints across inventory, topology, policy, and recent-change
          signals—<strong>not</strong> validation, drift proof, root cause, or safe-to-change approval (
          <code>evidence_consistency_summary_v1</code>).
        </p>
      </div>

      {error && !data ? (
        <div className="delta-digest-entry-card__state delta-digest-entry-card__state--error">
          <p className="table-note">{error.message}</p>
          <button type="button" className="inline-action" onClick={() => void reload()}>
            Retry evidence consistency summary
          </button>
        </div>
      ) : null}

      {isLoading && !data && !error ? (
        <p className="table-note delta-digest-entry-card__state">Loading consistency summary from app-api…</p>
      ) : null}

      {data ? (
        <div className="delta-digest-entry-card__summary" data-testid="evidence-consistency-cockpit-summary">
          <p className="table-note">
            <strong>{data.contract_id}</strong> · sync window {data.sync_runs_limit_applied} (URL {syncRunsLimit})
          </p>
          <p className="table-note">{data.scope_summary}</p>
          <p className="table-note">
            Tension rows (appears_in_tension): <strong>{tensionRowCount(data)}</strong> — interpretation support only.
          </p>
          {data.items.length > 0 ? (
            <ul className="notes-list">
              {data.items.slice(0, 4).map((row, idx) => (
                <li key={`${row.category}-${idx}`}>
                  <span className="table-note">{row.consistency_signal}</span> · {row.summary}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {data && data.items[0]?.pivot_hints?.length ? (
        <div className="key-value-list">
          <p className="summary-label">Sample pivots (read-only)</p>
          <div className="delta-digest-pivots__grid">
            {data.items[0].pivot_hints.map((h) => (
              <button
                key={h.route_family}
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateEvidenceConsistencyPivotFromHint(h, syncRunsLimit)}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="delta-digest-entry-card__actions">
        <button
          type="button"
          className="delta-digest-entry-primary"
          onClick={() => navigateToEvidenceConsistencyWorkspace(syncRunsLimit)}
        >
          Open evidence consistency workspace
        </button>
        <button type="button" className="inline-action" onClick={() => navigateToDeltaDigestView(syncRunsLimit)}>
          Open delta digest (related context)
        </button>
        <p className="table-note delta-digest-entry-card__hint">
          Full non-claims and domain freshness echo are on the API response; this card is a cockpit-sized preview.
        </p>
      </div>
    </article>
  );
}

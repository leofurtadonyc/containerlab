import type { ApiClientError } from "../../api/client";
import type { OperationalStabilitySummaryResponse } from "../../api/contracts";
import { navigateToStabilityWorkspace } from "../../lib/stability-workspace-navigation";

export interface StabilityOverviewEntryProps {
  syncRunsLimit: number;
  operationalStability: {
    data: OperationalStabilitySummaryResponse | null;
    error: ApiClientError | null;
    isLoading: boolean;
    reload: () => void | Promise<void>;
  };
}

/**
 * Overview / NOC entry for operational stability (`operational_stability_summary_v1`).
 * Distinct from evidence-consistency (alignment/tension) and maintenance evidence (composed maintenance assembly).
 */
export function StabilityOverviewEntry({ syncRunsLimit, operationalStability }: StabilityOverviewEntryProps) {
  const { data, error, isLoading, reload } = operationalStability;

  return (
    <article className="detail-card delta-digest-entry-card" data-testid="stability-overview-entry">
      <div className="delta-digest-entry-card__intro">
        <h3>Operational stability (cross-surface)</h3>
        <p className="table-note">
          Read-side <strong>steadiness / churn / recurrence</strong> hints from bounded change evidence and inventory
          surfaces—<strong>not</strong> cross-domain alignment scoring, maintenance evidence packaging, or safe-to-change
          approval (<code>operational_stability_summary_v1</code>).
        </p>
      </div>

      {error && !data ? (
        <div className="delta-digest-entry-card__state delta-digest-entry-card__state--error">
          <p className="table-note">{error.message}</p>
          <button type="button" className="inline-action" onClick={() => void reload()}>
            Retry operational stability summary
          </button>
        </div>
      ) : null}

      {isLoading && !data && !error ? (
        <p className="table-note delta-digest-entry-card__state">Loading operational stability summary from app-api…</p>
      ) : null}

      {data ? (
        <div className="delta-digest-entry-card__summary" data-testid="stability-overview-cockpit-summary">
          <p className="table-note">
            <strong>{data.contract_id}</strong> · sync window {data.sync_runs_limit_applied} (URL {syncRunsLimit})
          </p>
          <p className="table-note">{data.scope_summary}</p>
          <p className="table-note">
            Window posture: <strong>{data.operational_stability_posture.replace(/_/g, " ")}</strong> — interpretation
            support only.
          </p>
          {data.rows.length > 0 ? (
            <ul className="notes-list">
              {data.rows.slice(0, 4).map((row, idx) => (
                <li key={`${row.row_type}-${idx}`}>
                  <span className="table-note">{row.stability_posture_hint?.replace(/_/g, " ") ?? "—"}</span> ·{" "}
                  {row.summary}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="delta-digest-entry-card__actions">
        <button
          type="button"
          className="delta-digest-entry-primary"
          onClick={() => navigateToStabilityWorkspace({ syncRunsLimit })}
        >
          Open stability workspace
        </button>
        <p className="table-note delta-digest-entry-card__hint">
          Topology and service anchors on the workspace reuse the same shell params as Service Explorer and topology
          drill-down—not a new authority surface.
        </p>
      </div>
    </article>
  );
}

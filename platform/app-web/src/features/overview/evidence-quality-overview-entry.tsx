import type { ApiClientError } from "../../api/client";
import type { EvidenceQualitySummaryResponse } from "../../api/contracts";
import { navigateToEvidenceQualityWorkspace } from "../../lib/evidence-quality-workspace-navigation";

export interface EvidenceQualityOverviewEntryProps {
  syncRunsLimit: number;
  evidenceQuality: {
    data: EvidenceQualitySummaryResponse | null;
    error: ApiClientError | null;
    isLoading: boolean;
    reload: () => void | Promise<void>;
  };
}

/**
 * Overview / NOC entry for evidence quality workspace (`evidence_quality_workspace_v1`).
 * Distinct from evidence-consistency (cross-domain tension) and operational stability (volatility over time).
 */
export function EvidenceQualityOverviewEntry({ syncRunsLimit, evidenceQuality }: EvidenceQualityOverviewEntryProps) {
  const { data, error, isLoading, reload } = evidenceQuality;

  return (
    <article className="detail-card delta-digest-entry-card" data-testid="evidence-quality-overview-entry">
      <div className="delta-digest-entry-card__intro">
        <h3>Evidence quality (read paths)</h3>
        <p className="table-note">
          Bounded <strong>collection assurance</strong>, <strong>fallback</strong>, <strong>history gates</strong>, and{" "}
          <strong>comparison limits</strong> across domains—<strong>not</strong> cross-domain alignment scoring, churn
          analysis, or safe-to-change approval (<code>evidence_quality_workspace_v1</code>).
        </p>
      </div>

      {error && !data ? (
        <div className="delta-digest-entry-card__state delta-digest-entry-card__state--error">
          <p className="table-note">{error.message}</p>
          <button type="button" className="inline-action" onClick={() => void reload()}>
            Retry evidence quality workspace
          </button>
        </div>
      ) : null}

      {isLoading && !data && !error ? (
        <p className="table-note delta-digest-entry-card__state">Loading evidence quality workspace from app-api…</p>
      ) : null}

      {data ? (
        <div className="delta-digest-entry-card__summary" data-testid="evidence-quality-cockpit-summary">
          <p className="table-note">
            <strong>{data.contract_id}</strong> · sync window {data.sync_runs_limit_applied} (URL {syncRunsLimit})
          </p>
          <p className="table-note">{data.scope_summary}</p>
          <p className="table-note">
            Read-path posture: <strong>{data.read_path_reliability_posture.replace(/_/g, " ")}</strong> — navigation and
            interpretation only.
          </p>
          {data.rows.length > 0 ? (
            <ul className="notes-list">
              {data.rows.slice(0, 3).map((row, idx) => (
                <li key={`${row.evidence_quality_dimension}-${idx}`}>
                  <span className="table-note">{row.evidence_quality_dimension.replace(/_/g, " ")}</span> · {row.summary}
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
          onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit })}
        >
          Open evidence quality workspace
        </button>
        <p className="table-note delta-digest-entry-card__hint">
          Does not fix weak evidence automatically—surfaces cited limits and honest read-side posture only.
        </p>
      </div>
    </article>
  );
}

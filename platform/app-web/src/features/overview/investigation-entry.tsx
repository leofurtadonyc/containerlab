import { navigateToInvestigationView } from "../../lib/investigation-navigation";

export interface InvestigationOverviewEntryProps {
  /** Same bounded window as the Overview recent-change summary (forwarded to app-api). */
  syncRunsLimit: number;
}

/**
 * Primary landing entrypoint for starting a read-only investigation from Overview.
 * Does not prefetch the assembly payload; the Investigation view loads it.
 */
export function InvestigationOverviewEntry({ syncRunsLimit }: InvestigationOverviewEntryProps) {
  return (
    <article className="detail-card investigation-entry-card">
      <div className="investigation-entry-card__intro">
        <h3>Investigation workspace (bounded)</h3>
        <p className="table-note">
          Move from the summary below into a single read-only workspace that assembles the same backend-owned
          evidence the product already exposes: recent change intelligence, current platform status, and the
          capability matrix. This is interpretation support for operators—not validation, approval, drift
          detection, safe-to-change scoring, or workflow execution.
        </p>
      </div>
      <div className="investigation-entry-card__actions">
        <button
          type="button"
          className="investigation-entry-primary"
          onClick={() => navigateToInvestigationView(syncRunsLimit, { invFrom: "overview" })}
        >
          Open investigation workspace
        </button>
        <p className="table-note investigation-entry-card__hint">
          Uses the same <strong>sync run window</strong> as <strong>Recent change (bounded)</strong> below (
          {syncRunsLimit} sync runs). Deep time-series troubleshooting stays in Grafana.
        </p>
      </div>
    </article>
  );
}

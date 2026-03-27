import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { navigateToEvidenceQualityWorkspace } from "../../lib/evidence-quality-workspace-navigation";

/**
 * Compact cross-surface entry to the evidence quality workspace (read-path / collection / anchor limits).
 * Distinct from evidence-consistency (alignment/tension) and operational stability (churn/recurrence).
 */
export function EvidenceQualitySurfaceEntry() {
  const syncRuns =
    typeof window !== "undefined"
      ? readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)
      : DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT;

  return (
    <p className="table-note evidence-quality-surface-entry" data-testid="evidence-quality-surface-entry">
      <button
        type="button"
        className="inline-action"
        onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncRuns })}
      >
        Evidence quality workspace
      </button>
      <span className="evidence-quality-surface-entry__hint">
        {" "}
        Collection assurance and read-path honesty across domains—interpretation support only; not remediation or
        validation.
      </span>
    </p>
  );
}

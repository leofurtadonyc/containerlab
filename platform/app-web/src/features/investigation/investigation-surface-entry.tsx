import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  navigateToInvestigationView,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import type { InvestigationNavSourceId } from "../../lib/investigation-url-context";

export interface InvestigationSurfaceEntryProps {
  invFrom: InvestigationNavSourceId;
}

/**
 * Compact cross-surface entry to the investigation workspace; preserves existing shell query parameters
 * and sets `inv_from` for breadcrumb context on the investigation route.
 */
export function InvestigationSurfaceEntry({ invFrom }: InvestigationSurfaceEntryProps) {
  const syncRuns =
    typeof window !== "undefined"
      ? readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)
      : DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT;

  return (
    <p className="table-note investigation-surface-entry">
      <button
        type="button"
        className="inline-action"
        onClick={() => navigateToInvestigationView(syncRuns, { invFrom })}
      >
        Investigation workspace
      </button>
      <span className="investigation-surface-entry__hint">
        {" "}
        Opens the bounded assembly; shell query parameters (filters, selected objects) stay in the URL.
      </span>
    </p>
  );
}

import { useCallback, useEffect, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { APP_URL_SEARCH_CHANGED, navigateToEvidenceView } from "../../lib/url-app-state";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";
import { InvestigationNavContextBanner } from "./investigation-nav-context-banner";
import { InvestigationWorkspaceProduct } from "./investigation-workspace-product";
import { useInvestigationWorkspaceContextQuery } from "./api";

function readSyncRunsLimitFromWindow(): number {
  return readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT);
}

export function InvestigationView() {
  const searchKey = useUrlSearchParamsKey();
  const [syncRunsLimit, setSyncRunsLimit] = useState(readSyncRunsLimitFromWindow);

  const syncFromUrl = useCallback(() => {
    setSyncRunsLimit(readSyncRunsLimitFromWindow());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const query = useInvestigationWorkspaceContextQuery(syncRunsLimit);

  if (query.isLoading && !query.data) {
    return (
      <section className="investigation-workspace-route investigation-workspace-route--loading">
        <InvestigationNavContextBanner search={searchKey} />
        <h2>Investigation workspace</h2>
        <LoadingState label="Loading bounded investigation context from app-api (nested existing responses only)." />
      </section>
    );
  }

  if (query.error) {
    return (
      <section className="investigation-workspace-route investigation-workspace-route--error">
        <InvestigationNavContextBanner search={searchKey} />
        <h2>Investigation workspace</h2>
        <ErrorState error={query.error} onRetry={query.reload} />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
            Back to Overview
          </button>
        </p>
      </section>
    );
  }

  if (!query.data) {
    return (
      <section className="investigation-workspace-route investigation-workspace-route--empty">
        <InvestigationNavContextBanner search={searchKey} />
        <h2>Investigation workspace</h2>
        <EmptyState
          title="No investigation context"
          description="The backend did not return an investigation assembly for the current request."
        />
      </section>
    );
  }

  return (
    <section className="investigation-workspace-route">
      <InvestigationNavContextBanner search={searchKey} />
      <InvestigationWorkspaceProduct data={query.data} syncRunsLimit={syncRunsLimit} onReload={query.reload} />
    </section>
  );
}

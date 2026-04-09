import { useCallback, useEffect, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { WorkspaceHeader } from "../../components/workspace-header";
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
      <section className="workspace-page investigation-workspace-route investigation-workspace-route--loading">
        <WorkspaceHeader
          eyebrow="Investigate"
          title="Investigation"
          summary="Guide structured troubleshooting across current bounded evidence, platform posture, and next-inspection hints."
        />
        <InvestigationNavContextBanner search={searchKey} />
        <LoadingState label="Loading bounded investigation context from app-api (nested existing responses only)." />
      </section>
    );
  }

  if (query.error) {
    return (
      <section className="workspace-page investigation-workspace-route investigation-workspace-route--error">
        <WorkspaceHeader
          eyebrow="Investigate"
          title="Investigation"
          summary="Guide structured troubleshooting across current bounded evidence, platform posture, and next-inspection hints."
        />
        <InvestigationNavContextBanner search={searchKey} />
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
      <section className="workspace-page investigation-workspace-route investigation-workspace-route--empty">
        <WorkspaceHeader
          eyebrow="Investigate"
          title="Investigation"
          summary="Guide structured troubleshooting across current bounded evidence, platform posture, and next-inspection hints."
        />
        <InvestigationNavContextBanner search={searchKey} />
        <EmptyState
          title="No investigation context"
          description="The backend did not return an investigation assembly for the current request."
        />
      </section>
    );
  }

  return (
    <section className="workspace-page investigation-workspace-route">
      <InvestigationNavContextBanner search={searchKey} />
      <InvestigationWorkspaceProduct data={query.data} syncRunsLimit={syncRunsLimit} onReload={query.reload} />
    </section>
  );
}

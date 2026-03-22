import { useCallback, useEffect, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { APP_URL_SEARCH_CHANGED, navigateToEvidenceView } from "../../lib/url-app-state";
import { OVERVIEW_RECENT_CHANGE_SYNC_LIMIT } from "../overview/api";
import { InvestigationWorkspaceProduct } from "./investigation-workspace-product";
import { useInvestigationWorkspaceContextQuery } from "./api";

function readSyncRunsLimitFromSearch(): number {
  const sp = new URLSearchParams(window.location.search);
  const raw = sp.get("sync_runs_limit");
  if (!raw) {
    return OVERVIEW_RECENT_CHANGE_SYNC_LIMIT;
  }
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) {
    return OVERVIEW_RECENT_CHANGE_SYNC_LIMIT;
  }
  return Math.min(100, Math.max(1, n));
}

export function InvestigationView() {
  const [syncRunsLimit, setSyncRunsLimit] = useState(readSyncRunsLimitFromSearch);

  const syncFromUrl = useCallback(() => {
    setSyncRunsLimit(readSyncRunsLimitFromSearch());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const query = useInvestigationWorkspaceContextQuery(syncRunsLimit);

  if (query.isLoading && !query.data) {
    return (
      <section className="investigation-workspace-route investigation-workspace-route--loading">
        <h2>Investigation workspace</h2>
        <LoadingState label="Loading bounded investigation context from app-api (nested existing responses only)." />
      </section>
    );
  }

  if (query.error) {
    return (
      <section className="investigation-workspace-route investigation-workspace-route--error">
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
      <InvestigationWorkspaceProduct data={query.data} syncRunsLimit={syncRunsLimit} onReload={query.reload} />
    </section>
  );
}

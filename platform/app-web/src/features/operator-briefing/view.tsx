import { useCallback, useEffect, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { APP_URL_SEARCH_CHANGED, navigateToEvidenceView } from "../../lib/url-app-state";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";
import {
  DEFAULT_OPERATOR_BRIEFING_SYNC_RUNS_LIMIT,
  readOperatorBriefingQueryFromSearch,
} from "../../lib/operator-briefing-navigation";
import { OperatorBriefingProduct } from "./operator-briefing-product";
import { useOperatorBriefingQuery } from "./api";

function readQueryFromWindow() {
  return readOperatorBriefingQueryFromSearch(window.location.search);
}

export function OperatorBriefingView() {
  const searchKey = useUrlSearchParamsKey();
  const [query, setQuery] = useState(readQueryFromWindow);

  const syncFromUrl = useCallback(() => {
    setQuery(readQueryFromWindow());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const apiQuery = useOperatorBriefingQuery(query);

  if (apiQuery.isLoading && !apiQuery.data) {
    return (
      <section className="operator-briefing-route operator-briefing-route--loading">
        <h2>Operator briefing workspace</h2>
        <LoadingState label="Loading operator_briefing_workspace_v1 from app-api (composed read-only assemblies)." />
        <p className="table-note">
          URL: <code>{searchKey || "—"}</code>
        </p>
      </section>
    );
  }

  if (apiQuery.error) {
    return (
      <section className="operator-briefing-route operator-briefing-route--error">
        <h2>Operator briefing workspace</h2>
        <ErrorState error={apiQuery.error} onRetry={apiQuery.reload} />
        <p className="table-note">
          <button type="button" className="inline-action" onClick={() => navigateToEvidenceView("overview")}>
            Back to Overview
          </button>
        </p>
      </section>
    );
  }

  if (!apiQuery.data) {
    return (
      <section className="operator-briefing-route operator-briefing-route--empty">
        <h2>Operator briefing workspace</h2>
        <EmptyState
          title="No briefing payload"
          description="The backend did not return an operator briefing assembly for the current request."
        />
      </section>
    );
  }

  return (
    <section className="operator-briefing-route">
      <OperatorBriefingProduct
        data={apiQuery.data}
        syncRunsLimit={query.syncRunsLimit ?? DEFAULT_OPERATOR_BRIEFING_SYNC_RUNS_LIMIT}
        onReload={apiQuery.reload}
      />
    </section>
  );
}

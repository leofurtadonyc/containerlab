import { useCallback, useEffect, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { WorkspaceHeader } from "../../components/workspace-header";
import {
  DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT,
  readSyncRunsLimitFromSearch,
} from "../../lib/investigation-navigation";
import { APP_URL_SEARCH_CHANGED, navigateToEvidenceView } from "../../lib/url-app-state";
import { DeltaDigestProduct } from "./delta-digest-product";
import { useDeltaDigestQuery } from "./api";

function readSyncRunsLimitFromWindow(): number {
  return readSyncRunsLimitFromSearch(window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT);
}

export function DeltaDigestView() {
  const [syncRunsLimit, setSyncRunsLimit] = useState(readSyncRunsLimitFromWindow);

  const syncFromUrl = useCallback(() => {
    setSyncRunsLimit(readSyncRunsLimitFromWindow());
  }, []);

  useEffect(() => {
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
  }, [syncFromUrl]);

  const query = useDeltaDigestQuery(syncRunsLimit);

  if (query.isLoading && !query.data) {
    return (
      <section className="workspace-page delta-digest-route delta-digest-route--loading">
        <WorkspaceHeader
          eyebrow="Investigate"
          title="Delta Digest"
          summary="Summarize bounded cross-domain deltas and evidence shifts across existing read-side surfaces."
        />
        <LoadingState label="Loading cross-domain delta digest from app-api (bounded read-side assembly)." />
      </section>
    );
  }

  if (query.error) {
    return (
      <section className="workspace-page delta-digest-route delta-digest-route--error">
        <WorkspaceHeader
          eyebrow="Investigate"
          title="Delta Digest"
          summary="Summarize bounded cross-domain deltas and evidence shifts across existing read-side surfaces."
        />
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
      <section className="workspace-page delta-digest-route delta-digest-route--empty">
        <WorkspaceHeader
          eyebrow="Investigate"
          title="Delta Digest"
          summary="Summarize bounded cross-domain deltas and evidence shifts across existing read-side surfaces."
        />
        <EmptyState
          title="No digest payload"
          description="The backend did not return a delta digest for the current request."
        />
      </section>
    );
  }

  const sparseSections = query.data.sections.filter((s) =>
    ["partial", "absent", "unavailable"].includes(s.evidence_status),
  );
  const isSparsePayload = sparseSections.length >= 4;

  return (
    <section className={`workspace-page delta-digest-route${isSparsePayload ? " delta-digest-route--sparse" : ""}`}>
      {isSparsePayload ? (
        <p className="callout delta-digest-route-sparse-callout" role="status">
          Several digest sections report partial or missing evidence—this is expected when upstream lists are empty or
          collectors are degraded. Use pivots above to open full surfaces.
        </p>
      ) : null}
      <DeltaDigestProduct data={query.data} syncRunsLimit={syncRunsLimit} onReload={query.reload} />
    </section>
  );
}

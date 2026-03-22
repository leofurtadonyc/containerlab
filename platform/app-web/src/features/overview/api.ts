import { useCallback } from "react";

import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

/** Bounded window for sync-run substrate in the overview recent-change summary (matches backend default). */
export const OVERVIEW_RECENT_CHANGE_SYNC_LIMIT = 20;

export function useRecentChangeSummaryQuery(enabled = true) {
  const queryFn = useCallback(
    () => apiClient.getRecentChangeSummary(OVERVIEW_RECENT_CHANGE_SYNC_LIMIT),
    [],
  );

  return useApiQuery(queryFn, { enabled });
}

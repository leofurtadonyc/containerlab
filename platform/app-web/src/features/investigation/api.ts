import { useCallback } from "react";

import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useInvestigationWorkspaceContextQuery(syncRunsLimit: number) {
  const queryFn = useCallback(
    () => apiClient.getInvestigationWorkspaceContext(syncRunsLimit),
    [syncRunsLimit],
  );

  return useApiQuery(queryFn, { enabled: true });
}

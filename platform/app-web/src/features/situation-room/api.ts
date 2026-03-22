import { useCallback } from "react";

import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useSituationPackQuery(syncRunsLimit: number) {
  const queryFn = useCallback(
    () => apiClient.getEvidencePackSituation(syncRunsLimit),
    [syncRunsLimit],
  );

  return useApiQuery(queryFn, { enabled: true });
}

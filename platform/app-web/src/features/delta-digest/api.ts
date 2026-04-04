import { useCallback } from "react";

import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useDeltaDigestQuery(syncRunsLimit: number, enabled = true) {
  const queryFn = useCallback(() => apiClient.getDeltaDigest(syncRunsLimit), [syncRunsLimit]);

  return useApiQuery(queryFn, { enabled });
}

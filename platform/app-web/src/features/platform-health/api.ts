import { useCallback } from "react";

import type { PlatformStatusResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function usePlatformStatusQuery() {
  const queryFn = useCallback<() => Promise<PlatformStatusResponse>>(
    () => apiClient.getPlatformStatus(),
    [],
  );

  return useApiQuery(queryFn);
}

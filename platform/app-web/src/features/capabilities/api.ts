import { useCallback } from "react";

import type { CapabilitiesListResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useCapabilitiesQuery(enabled = true) {
  const queryFn = useCallback<() => Promise<CapabilitiesListResponse>>(
    () => apiClient.getCapabilities(),
    [],
  );

  return useApiQuery(queryFn, { enabled });
}

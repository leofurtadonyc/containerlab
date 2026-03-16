import { useCallback } from "react";

import type { PoliciesListResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function usePoliciesQuery(enabled = true) {
  const queryFn = useCallback<() => Promise<PoliciesListResponse>>(
    () => apiClient.getPolicies(),
    [],
  );

  return useApiQuery(queryFn, { enabled });
}

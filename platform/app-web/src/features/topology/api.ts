import { useCallback } from "react";

import type { TopologyResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useTopologyQuery() {
  const queryFn = useCallback<() => Promise<TopologyResponse>>(
    () => apiClient.getTopology(),
    [],
  );

  return useApiQuery(queryFn);
}

import { useCallback, useMemo } from "react";

import type { OperatorBriefingQuery } from "../../api/client";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useOperatorBriefingQuery(params: OperatorBriefingQuery) {
  const stable = useMemo(
    () => ({
      syncRunsLimit: params.syncRunsLimit,
      policyId: params.policyId,
      topologyObject: params.topologyObject,
      topologyObjectKind: params.topologyObjectKind,
      invFrom: params.invFrom,
      globalSearchQ: params.globalSearchQ,
    }),
    [
      params.syncRunsLimit,
      params.policyId,
      params.topologyObject,
      params.topologyObjectKind,
      params.invFrom,
      params.globalSearchQ,
    ],
  );

  const queryFn = useCallback(() => apiClient.getOperatorBriefing(stable), [stable]);

  return useApiQuery(queryFn, { enabled: true });
}

import { useCallback } from "react";

import type { AuditHistoryResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useAuditHistoryQuery() {
  const queryFn = useCallback<() => Promise<AuditHistoryResponse>>(
    () => apiClient.getAuditHistory(),
    [],
  );

  return useApiQuery(queryFn);
}

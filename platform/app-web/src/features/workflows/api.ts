import { useCallback } from "react";

import type { WorkflowHistoryResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useWorkflowHistoryQuery() {
  const queryFn = useCallback<() => Promise<WorkflowHistoryResponse>>(
    () => apiClient.getWorkflowHistory(),
    [],
  );

  return useApiQuery(queryFn);
}

import { useCallback, useMemo } from "react";

import type { WorkflowHistoryResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { parseWorkflowHistoryReadSideQuery } from "../../api/read-side-query-params";
import { useApiQuery } from "../../api/use-api-query";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";

export function useWorkflowHistoryQuery() {
  const searchKey = useUrlSearchParamsKey();
  const readSide = useMemo(
    () => parseWorkflowHistoryReadSideQuery(new URLSearchParams(searchKey)),
    [searchKey],
  );

  const queryFn = useCallback<() => Promise<WorkflowHistoryResponse>>(
    () => apiClient.getWorkflowHistory(readSide),
    [readSide],
  );

  return useApiQuery(queryFn);
}

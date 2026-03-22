import { useCallback, useMemo } from "react";

import type { AuditHistoryResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { parseAuditHistoryReadSideQuery } from "../../api/read-side-query-params";
import { useApiQuery } from "../../api/use-api-query";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";

export function useAuditHistoryQuery() {
  const searchKey = useUrlSearchParamsKey();
  const readSide = useMemo(
    () => parseAuditHistoryReadSideQuery(new URLSearchParams(searchKey)),
    [searchKey],
  );

  const queryFn = useCallback<() => Promise<AuditHistoryResponse>>(
    () => apiClient.getAuditHistory(readSide),
    [readSide],
  );

  return useApiQuery(queryFn);
}

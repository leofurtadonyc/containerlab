import { useCallback, useMemo } from "react";

import type { DevicesListResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { parseDevicesPoliciesReadSideQuery } from "../../api/read-side-query-params";
import { useApiQuery } from "../../api/use-api-query";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";

export function useDevicesQuery(enabled = true) {
  const searchKey = useUrlSearchParamsKey();
  const readSide = useMemo(
    () => parseDevicesPoliciesReadSideQuery(new URLSearchParams(searchKey)),
    [searchKey],
  );

  const queryFn = useCallback<() => Promise<DevicesListResponse>>(
    () => apiClient.getDevices(readSide),
    [readSide],
  );

  return useApiQuery(queryFn, { enabled });
}

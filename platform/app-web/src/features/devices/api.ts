import { useCallback } from "react";

import type { DevicesListResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useDevicesQuery(enabled = true) {
  const queryFn = useCallback<() => Promise<DevicesListResponse>>(
    () => apiClient.getDevices(),
    [],
  );

  return useApiQuery(queryFn, { enabled });
}

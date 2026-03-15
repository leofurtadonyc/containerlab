import { useCallback } from "react";

import type { PlatformReadPathStatus, PlatformStatusResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function usePlatformStatusQuery() {
  const queryFn = useCallback<() => Promise<PlatformStatusResponse>>(
    () => apiClient.getPlatformStatus(),
    [],
  );

  return useApiQuery(queryFn);
}

export function getPlatformReadPath(
  readPaths: PlatformReadPathStatus[] | undefined,
  modelFamily: PlatformReadPathStatus["model_family"],
) {
  return readPaths?.find((readPath) => readPath.model_family === modelFamily) ?? null;
}

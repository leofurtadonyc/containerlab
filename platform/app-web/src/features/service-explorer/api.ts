import { useCallback } from "react";

import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useServicesListQuery(limit: number | null, enabled: boolean) {
  const queryFn = useCallback(
    () => apiClient.getServices(limit ?? undefined),
    [limit],
  );
  return useApiQuery(queryFn, { enabled });
}

export function useServiceDetailQuery(serviceId: string | null, enabled: boolean) {
  const queryFn = useCallback(() => {
    if (!serviceId) {
      throw new Error("serviceId is required");
    }
    return apiClient.getService(serviceId);
  }, [serviceId]);
  return useApiQuery(queryFn, { enabled: enabled && !!serviceId });
}

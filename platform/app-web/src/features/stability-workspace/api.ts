import { useCallback } from "react";

import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useOperationalStabilitySummaryQuery(syncRunsLimit: number, enabled = true) {
  const queryFn = useCallback(
    () => apiClient.getOperationalStabilitySummary(syncRunsLimit),
    [syncRunsLimit],
  );
  return useApiQuery(queryFn, { enabled });
}

export function useTopologyObjectStabilityProfileQuery(objectId: string | null, enabled = true) {
  const queryFn = useCallback(() => {
    if (!objectId?.trim()) {
      throw new Error("objectId required");
    }
    return apiClient.getTopologyObjectStabilityProfile(objectId.trim());
  }, [objectId]);
  return useApiQuery(queryFn, { enabled: enabled && !!objectId?.trim() });
}

export function useServiceStabilityProfileQuery(serviceId: string | null, enabled = true) {
  const queryFn = useCallback(() => {
    if (!serviceId?.trim()) {
      throw new Error("serviceId required");
    }
    return apiClient.getServiceStabilityProfile(serviceId.trim());
  }, [serviceId]);
  return useApiQuery(queryFn, { enabled: enabled && !!serviceId?.trim() });
}

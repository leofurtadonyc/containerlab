import { useCallback } from "react";

import type { ServiceImpactWorkspaceResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useServiceImpactWorkspaceQuery(serviceId: string | null) {
  const enabled = serviceId !== null && serviceId.length > 0;
  const queryFn = useCallback<() => Promise<ServiceImpactWorkspaceResponse>>(
    () => apiClient.getServiceImpactWorkspace(serviceId as string),
    [serviceId],
  );
  return useApiQuery(queryFn, { enabled });
}

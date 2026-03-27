import { useCallback } from "react";

import { apiClient, type MaintenanceWindowWorkspaceQuery } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useMaintenanceWindowWorkspaceQuery(query: MaintenanceWindowWorkspaceQuery | null, enabled: boolean) {
  const queryFn = useCallback(() => {
    if (!query) {
      throw new Error("maintenance window workspace query is required");
    }
    return apiClient.getMaintenanceWindowWorkspace(query);
  }, [query]);
  return useApiQuery(queryFn, { enabled: enabled && !!query });
}

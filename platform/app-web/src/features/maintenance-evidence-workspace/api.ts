import { useCallback } from "react";

import { apiClient, type MaintenancePreviewQuery } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useMaintenanceEvidenceWorkspaceQuery(query: MaintenancePreviewQuery | null, enabled: boolean) {
  const queryFn = useCallback(() => {
    if (!query) {
      throw new Error("maintenance evidence workspace query is required");
    }
    return apiClient.getMaintenanceEvidenceWorkspace(query);
  }, [query]);
  return useApiQuery(queryFn, { enabled: enabled && !!query });
}

import { useCallback } from "react";

import { apiClient, type MaintenancePreviewQuery } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useMaintenancePreviewQuery(query: MaintenancePreviewQuery | null, enabled: boolean) {
  const queryFn = useCallback(() => {
    if (!query) {
      throw new Error("maintenance preview query is required");
    }
    return apiClient.getMaintenancePreview(query);
  }, [query]);
  return useApiQuery(queryFn, { enabled: enabled && !!query });
}

import { useCallback } from "react";

import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function useEvidenceQualityWorkspaceQuery(syncRunsLimit: number, enabled = true) {
  const queryFn = useCallback(
    () => apiClient.getEvidenceQualityWorkspace(syncRunsLimit),
    [syncRunsLimit],
  );
  return useApiQuery(queryFn, { enabled });
}

export function useEvidenceWeaknessExplanationQuery(syncRunsLimit: number, enabled = true) {
  const queryFn = useCallback(
    () => apiClient.getEvidenceWeaknessExplanation(syncRunsLimit),
    [syncRunsLimit],
  );
  return useApiQuery(queryFn, { enabled });
}

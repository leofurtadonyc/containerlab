import { useCallback } from "react";

import type { PathExplorerWorkspaceResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";

export function usePathExplorerWorkspaceQuery(policyId: string | null) {
  const enabled = policyId !== null && policyId.length > 0;
  const queryFn = useCallback<() => Promise<PathExplorerWorkspaceResponse>>(
    () => apiClient.getPathExplorerWorkspace(policyId as string),
    [policyId],
  );
  return useApiQuery(queryFn, { enabled });
}

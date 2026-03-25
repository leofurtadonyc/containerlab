import { useCallback } from "react";

import { apiClient } from "../../api/client";
import type { ChangeSafetyCaseRoute } from "../../lib/change-safety-case-navigation";
import { useApiQuery } from "../../api/use-api-query";

export function useChangeSafetyCaseQuery(route: ChangeSafetyCaseRoute | null, enabled: boolean) {
  const queryFn = useCallback(() => {
    if (!route || route.kind === "setup" || route.kind === "invalid") {
      throw new Error("change safety case route not ready");
    }
    if (route.kind === "policy_change_safety") {
      return apiClient.getPolicyChangeSafetyCase(route.policyId);
    }
    if (route.kind === "service_change_safety") {
      return apiClient.getServiceChangeSafetyCase(route.serviceId);
    }
    return apiClient.getTopologyChangeSafetyCase(route.query);
  }, [route]);
  const canRun =
    enabled && route != null && route.kind !== "setup" && route.kind !== "invalid";
  return useApiQuery(queryFn, { enabled: canRun });
}

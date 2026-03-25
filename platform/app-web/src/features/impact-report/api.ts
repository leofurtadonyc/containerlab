import { useCallback } from "react";

import { apiClient } from "../../api/client";
import type { ImpactReportRoute } from "../../lib/impact-report-navigation";
import { useApiQuery } from "../../api/use-api-query";

export function useImpactReportQuery(route: ImpactReportRoute | null, enabled: boolean) {
  const queryFn = useCallback(() => {
    if (!route || route.kind === "setup" || route.kind === "invalid") {
      throw new Error("impact report route not ready");
    }
    if (route.kind === "service_impact") {
      return apiClient.getServiceImpactReport(route.serviceId);
    }
    if (route.kind === "policy_impact") {
      return apiClient.getPolicyImpactReport(route.policyId);
    }
    return apiClient.getMaintenanceImpactReport(route.query);
  }, [route]);
  const canRun =
    enabled &&
    route != null &&
    route.kind !== "setup" &&
    route.kind !== "invalid";
  return useApiQuery(queryFn, { enabled: canRun });
}

import { useCallback, useMemo } from "react";

import type {
  PathAnalysisViewResponse,
  PoliciesListResponse,
  PolicyDossierResponse,
  PolicyEvidenceDeltaResponse,
  PolicyEvidenceTimelineResponse,
  PolicyExplainabilityResponse,
  PolicyTopologyImpactResponse,
} from "../../api/contracts";
import { apiClient } from "../../api/client";
import { parseDevicesPoliciesReadSideQuery } from "../../api/read-side-query-params";
import { useApiQuery } from "../../api/use-api-query";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";

export function usePoliciesQuery(enabled = true) {
  const searchKey = useUrlSearchParamsKey();
  const readSide = useMemo(
    () => parseDevicesPoliciesReadSideQuery(new URLSearchParams(searchKey)),
    [searchKey],
  );

  const queryFn = useCallback<() => Promise<PoliciesListResponse>>(
    () => apiClient.getPolicies(readSide),
    [readSide],
  );

  return useApiQuery(queryFn, { enabled });
}

export function usePolicyPathAnalysisQuery(policyId: string | null) {
  const enabled = policyId !== null && policyId.length > 0;
  const queryFn = useCallback<() => Promise<PathAnalysisViewResponse>>(
    () => apiClient.getPolicyPathAnalysis(policyId as string),
    [policyId],
  );
  return useApiQuery(queryFn, { enabled });
}

export function usePolicyTopologyImpactQuery(policyId: string | null) {
  const enabled = policyId !== null && policyId.length > 0;
  const queryFn = useCallback<() => Promise<PolicyTopologyImpactResponse>>(
    () => apiClient.getPolicyTopologyImpact(policyId as string),
    [policyId],
  );
  return useApiQuery(queryFn, { enabled });
}

export function usePolicyEvidenceTimelineQuery(policyId: string | null) {
  const enabled = policyId !== null && policyId.length > 0;
  const queryFn = useCallback<() => Promise<PolicyEvidenceTimelineResponse>>(
    () => apiClient.getPolicyEvidenceTimeline(policyId as string),
    [policyId],
  );
  return useApiQuery(queryFn, { enabled });
}

export function usePolicyEvidenceDeltaQuery(policyId: string | null) {
  const enabled = policyId !== null && policyId.length > 0;
  const queryFn = useCallback<() => Promise<PolicyEvidenceDeltaResponse>>(
    () => apiClient.getPolicyEvidenceDelta(policyId as string),
    [policyId],
  );
  return useApiQuery(queryFn, { enabled });
}

export function usePolicyDossierQuery(policyId: string | null) {
  const enabled = policyId !== null && policyId.length > 0;
  const queryFn = useCallback<() => Promise<PolicyDossierResponse>>(
    () => apiClient.getPolicyDossier(policyId as string),
    [policyId],
  );
  return useApiQuery(queryFn, { enabled });
}

export function usePolicyExplainabilityQuery(policyId: string | null) {
  const enabled = policyId !== null && policyId.length > 0;
  const queryFn = useCallback<() => Promise<PolicyExplainabilityResponse>>(
    () => apiClient.getPolicyExplainability(policyId as string),
    [policyId],
  );
  return useApiQuery(queryFn, { enabled });
}

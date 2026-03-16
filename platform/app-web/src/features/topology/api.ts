import { useCallback } from "react";

import type { TopologyLinkRecord, TopologyResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";
import {
  resolveTopologyCoverageSummary,
  resolveTopologyLinkEndpointEvidenceCount,
  resolveTopologyLinkEndpointPairingState,
} from "../../lib/presentation";

export function useTopologyQuery(enabled = true) {
  const queryFn = useCallback<() => Promise<TopologyResponse>>(
    () => apiClient.getTopology(),
    [],
  );

  return useApiQuery(queryFn, { enabled });
}

export function getTopologyCoverageSummary(topologyResponse: TopologyResponse) {
  return resolveTopologyCoverageSummary(topologyResponse);
}

export function getTopologyLinkEndpointPairingState(link: TopologyLinkRecord) {
  return resolveTopologyLinkEndpointPairingState(link);
}

export function getTopologyLinkEndpointEvidenceCount(link: TopologyLinkRecord) {
  return resolveTopologyLinkEndpointEvidenceCount(link);
}

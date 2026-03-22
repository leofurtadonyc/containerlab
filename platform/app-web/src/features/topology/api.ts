import { useCallback } from "react";

import type { TopologyLinkRecord, TopologyObjectRelatedPoliciesResponse, TopologyResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";
import {
  describeTopologyNodeParticipationPosture,
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

export function useTopologyRelatedPoliciesQuery(objectId: string | null) {
  const enabled = objectId !== null && objectId.length > 0;
  const queryFn = useCallback<() => Promise<TopologyObjectRelatedPoliciesResponse>>(
    () => apiClient.getTopologyObjectRelatedPolicies(objectId as string),
    [objectId],
  );

  return useApiQuery(queryFn, { enabled });
}

export function getTopologyCoverageSummary(topologyResponse: TopologyResponse) {
  return resolveTopologyCoverageSummary(topologyResponse);
}

export function getTopologyNodeParticipationReadout(topologyResponse: TopologyResponse) {
  const coverageSummary = resolveTopologyCoverageSummary(topologyResponse);
  return describeTopologyNodeParticipationPosture(
    coverageSummary,
    topologyResponse.topology.nodes.length,
  );
}

export function getTopologyLinkEndpointPairingState(link: TopologyLinkRecord) {
  return resolveTopologyLinkEndpointPairingState(link);
}

export function getTopologyLinkEndpointEvidenceCount(link: TopologyLinkRecord) {
  return resolveTopologyLinkEndpointEvidenceCount(link);
}

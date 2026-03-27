import { useCallback, useMemo } from "react";

import type {
  WorkflowLifecycleDetailResponse,
  WorkflowLifecycleListResponse,
  WorkflowLifecycleTimelineResponse,
} from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";

const WORKFLOW_LIFECYCLE_ID_PARAM = "workflow_lifecycle_id";

export function readWorkflowLifecycleIdFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get(WORKFLOW_LIFECYCLE_ID_PARAM)?.trim();
  return raw || null;
}

export function useWorkflowLifecycleListQuery() {
  const queryFn = useCallback(() => apiClient.getWorkflowLifecycleList(50), []);
  return useApiQuery(queryFn);
}

export function useWorkflowLifecycleDetailQuery(workflowId: string | null) {
  const queryFn = useCallback(() => {
    if (!workflowId) {
      return Promise.reject(new Error("workflow_id_required"));
    }
    return apiClient.getWorkflowLifecycleDetail(workflowId);
  }, [workflowId]);
  return useApiQuery(queryFn, { enabled: workflowId !== null });
}

export function useWorkflowLifecycleTimelineQuery(workflowId: string | null) {
  const queryFn = useCallback(() => {
    if (!workflowId) {
      return Promise.reject(new Error("workflow_id_required"));
    }
    return apiClient.getWorkflowLifecycleTimeline(workflowId);
  }, [workflowId]);
  return useApiQuery(queryFn, { enabled: workflowId !== null });
}

export function useWorkflowLifecycleUrlSelection(): {
  searchKey: string;
  selectedId: string | null;
} {
  const searchKey = useUrlSearchParamsKey();
  const selectedId = useMemo(
    () => readWorkflowLifecycleIdFromSearch(searchKey),
    [searchKey],
  );
  return { searchKey, selectedId };
}

export type {
  WorkflowLifecycleDetailResponse,
  WorkflowLifecycleListResponse,
  WorkflowLifecycleTimelineResponse,
};

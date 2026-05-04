import { useCallback, useMemo } from "react";

import type {
  ValidationDetailResponse,
  ValidationListResponse,
  ValidationTimelineResponse,
} from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";

const VALIDATION_ID_PARAM = "validation_id";

export function readValidationIdFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get(VALIDATION_ID_PARAM)?.trim();
  return raw || null;
}

export function useValidationListQuery() {
  const queryFn = useCallback(() => apiClient.getValidationList(50), []);
  return useApiQuery(queryFn);
}

export function useValidationDetailQuery(validationId: string | null) {
  const queryFn = useCallback(() => {
    if (!validationId) {
      return Promise.reject(new Error("validation_id_required"));
    }
    return apiClient.getValidationDetail(validationId);
  }, [validationId]);
  return useApiQuery(queryFn, { enabled: validationId !== null });
}

export function useValidationTimelineQuery(validationId: string | null) {
  const queryFn = useCallback(() => {
    if (!validationId) {
      return Promise.reject(new Error("validation_id_required"));
    }
    return apiClient.getValidationTimeline(validationId);
  }, [validationId]);
  return useApiQuery(queryFn, { enabled: validationId !== null });
}

export function useValidationUrlSelection(): { searchKey: string; selectedId: string | null } {
  const searchKey = useUrlSearchParamsKey();
  const selectedId = useMemo(() => readValidationIdFromSearch(searchKey), [searchKey]);
  return { searchKey, selectedId };
}

export type { ValidationDetailResponse, ValidationListResponse, ValidationTimelineResponse };

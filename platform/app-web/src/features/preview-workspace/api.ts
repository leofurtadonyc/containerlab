import { useCallback, useMemo } from "react";

import type { PreviewDetailResponse, PreviewListResponse, PreviewTimelineResponse } from "../../api/contracts";
import { apiClient } from "../../api/client";
import { useApiQuery } from "../../api/use-api-query";
import { useUrlSearchParamsKey } from "../../lib/use-url-search-params";

const PREVIEW_ID_PARAM = "preview_id";

export function readPreviewIdFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get(PREVIEW_ID_PARAM)?.trim();
  return raw || null;
}

export function usePreviewListQuery() {
  const queryFn = useCallback(() => apiClient.getPreviewList(50), []);
  return useApiQuery(queryFn);
}

export function usePreviewDetailQuery(previewId: string | null) {
  const queryFn = useCallback(() => {
    if (!previewId) {
      return Promise.reject(new Error("preview_id_required"));
    }
    return apiClient.getPreviewDetail(previewId);
  }, [previewId]);
  return useApiQuery(queryFn, { enabled: previewId !== null });
}

export function usePreviewTimelineQuery(previewId: string | null) {
  const queryFn = useCallback(() => {
    if (!previewId) {
      return Promise.reject(new Error("preview_id_required"));
    }
    return apiClient.getPreviewTimeline(previewId);
  }, [previewId]);
  return useApiQuery(queryFn, { enabled: previewId !== null });
}

export function usePreviewUrlSelection(): { searchKey: string; selectedId: string | null } {
  const searchKey = useUrlSearchParamsKey();
  const selectedId = useMemo(() => readPreviewIdFromSearch(searchKey), [searchKey]);
  return { searchKey, selectedId };
}

export type { PreviewDetailResponse, PreviewListResponse, PreviewTimelineResponse };

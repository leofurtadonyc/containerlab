import { useCallback, useEffect, useRef, useState } from "react";

import { ApiClientError } from "./client";

export interface ApiQueryState<T> {
  data: T | null;
  error: ApiClientError | null;
  isLoading: boolean;
  isRefreshing: boolean;
  reload: () => Promise<void>;
}

interface UseApiQueryOptions {
  enabled?: boolean;
}

export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  options: UseApiQueryOptions = {},
): ApiQueryState<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const response = await queryFn();

      if (isMountedRef.current && requestId === latestRequestIdRef.current) {
        setData(response);
      }
    } catch (caughtError) {
      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) {
        return;
      }

      if (caughtError instanceof ApiClientError) {
        setError(caughtError);
        return;
      }

      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unexpected error while loading data.";
      setError(new ApiClientError(message, 0, "unexpected_error"));
    } finally {
      if (isMountedRef.current && requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [queryFn]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void load();
  }, [enabled, load]);

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }

    await load();
  }, [enabled, load]);

  return {
    data,
    error,
    isLoading,
    isRefreshing: isLoading && data !== null,
    reload,
  };
}

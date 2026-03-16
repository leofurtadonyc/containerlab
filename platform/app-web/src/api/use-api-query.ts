import { useCallback, useEffect, useState } from "react";

import { ApiClientError } from "./client";

export interface ApiQueryState<T> {
  data: T | null;
  error: ApiClientError | null;
  isLoading: boolean;
  isRefreshing: boolean;
  reload: () => void;
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
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((currentValue: number) => currentValue + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!enabled) {
      return () => {
        isCancelled = true;
      };
    }

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await queryFn();

        if (!isCancelled) {
          setData(response);
        }
      } catch (caughtError) {
        if (isCancelled) {
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
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, [enabled, queryFn, reloadToken]);

  return {
    data,
    error,
    isLoading,
    isRefreshing: isLoading && data !== null,
    reload,
  };
}

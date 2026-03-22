import { useCallback, useEffect, useMemo, useState } from "react";

import { APP_URL_SEARCH_CHANGED, replaceUrlSearchParams } from "./url-app-state";

/**
 * Subscribe to the current window location search string and bump when the SPA
 * replaces search params or the user navigates history.
 */
export function useUrlSearchParamsKey(): string {
  const [search, setSearch] = useState(() => window.location.search);

  useEffect(() => {
    const bump = () => setSearch(window.location.search);
    window.addEventListener("popstate", bump);
    window.addEventListener(APP_URL_SEARCH_CHANGED, bump);
    return () => {
      window.removeEventListener("popstate", bump);
      window.removeEventListener(APP_URL_SEARCH_CHANGED, bump);
    };
  }, []);

  return search;
}

export function useUrlSearchParams(): URLSearchParams {
  const key = useUrlSearchParamsKey();
  return useMemo(() => new URLSearchParams(key), [key]);
}

export function useReplaceUrlSearchParams() {
  return useCallback((params: URLSearchParams) => {
    replaceUrlSearchParams(params);
  }, []);
}

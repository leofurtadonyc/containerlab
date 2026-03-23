import { describe, expect, it } from "vitest";

import {
  GLOBAL_SEARCH_QUERY_PARAM,
  applyGlobalSearchQueryEcho,
} from "../src/lib/global-search-deeplink";

describe("global search deeplink", () => {
  it("applyGlobalSearchQueryEcho sets and clears global_search_q", () => {
    const sp = new URLSearchParams("?view=policies");
    applyGlobalSearchQueryEcho(sp, "  hello  ");
    expect(sp.get(GLOBAL_SEARCH_QUERY_PARAM)).toBe("hello");
    applyGlobalSearchQueryEcho(sp, undefined);
    expect(sp.get(GLOBAL_SEARCH_QUERY_PARAM)).toBeNull();
  });
});

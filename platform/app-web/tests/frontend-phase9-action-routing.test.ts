import { describe, expect, it } from "vitest";

import {
  maybeCanonicalizeActionAlias,
  mergeActionRouteIntoSearch,
  readActionRouteFlagsFromSearch,
  readViewIdFromSearchWithActionRoutes,
} from "../src/lib/phase9-action-routing";

describe("Phase 9 safe-action and rollback routing", () => {
  it("canonicalizes safe-action and rollback aliases to route ids", () => {
    const flags = readActionRouteFlagsFromSearch("", {});
    expect(maybeCanonicalizeActionAlias("?ui=next&view=safe-action-workspace", flags)?.get("route")).toBe(
      "action.safeAction",
    );
    expect(maybeCanonicalizeActionAlias("?ui=next&view=rollback-workspace", flags)?.get("route")).toBe(
      "action.rollback",
    );
  });

  it("maps canonical action routes back to legacy view outlets", () => {
    const flags = readActionRouteFlagsFromSearch("", {});
    expect(readViewIdFromSearchWithActionRoutes("?route=action.safeAction", flags)).toBe(
      "safe-action-workspace",
    );
    expect(readViewIdFromSearchWithActionRoutes("?route=action.rollback", flags)).toBe(
      "rollback-workspace",
    );
  });

  it("supports domain/per-route rollback flags and keeps context params", () => {
    const flags = readActionRouteFlagsFromSearch("?next_action=0", {});
    expect(maybeCanonicalizeActionAlias("?view=safe-action-workspace", flags)).toBeNull();

    const merged = mergeActionRouteIntoSearch(
      "?ui=next&policy_id=PE1:static_local:192.0.2.11:100&workflow_id=wf-1",
      "action.safeAction",
    );
    expect(merged.get("route")).toBe("action.safeAction");
    expect(merged.get("view")).toBe("safe-action-workspace");
    expect(merged.get("policy_id")).toBe("PE1:static_local:192.0.2.11:100");
    expect(merged.get("workflow_id")).toBe("wf-1");
  });
});

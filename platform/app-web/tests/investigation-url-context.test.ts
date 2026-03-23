import { describe, expect, it } from "vitest";

import {
  INV_FROM_PARAM,
  parseInvestigationNavContext,
} from "../src/lib/investigation-url-context";

describe("parseInvestigationNavContext", () => {
  it("returns null invFrom when param absent", () => {
    expect(parseInvestigationNavContext("?view=investigation").invFrom).toBeNull();
  });

  it("returns null invFrom for unknown values", () => {
    expect(parseInvestigationNavContext(`?${INV_FROM_PARAM}=workflows`).invFrom).toBeNull();
  });

  it("parses known inv_from and object params", () => {
    const q =
      `?view=investigation&${INV_FROM_PARAM}=topology&topology_object=node-a&topology_object_kind=node&device_id=dev-1&policy_id=pol-9`;
    const p = parseInvestigationNavContext(q);
    expect(p.invFrom).toBe("topology");
    expect(p.topologyObjectId).toBe("node-a");
    expect(p.topologyObjectKind).toBe("node");
    expect(p.deviceId).toBe("dev-1");
    expect(p.policyId).toBe("pol-9");
  });

  it("accepts situation-room as a source", () => {
    const p = parseInvestigationNavContext(`?${INV_FROM_PARAM}=situation-room`);
    expect(p.invFrom).toBe("situation-room");
  });
});

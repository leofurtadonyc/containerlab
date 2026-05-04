import { describe, expect, it } from "vitest";

import {
  findEvidenceRouteByViewId,
  maybeCanonicalizeEvidenceAlias,
  mergeEvidenceRouteIntoSearch,
  readEvidenceRouteFlagsFromSearch,
  readViewIdFromSearchWithEvidenceRoutes,
} from "../src/lib/phase6-evidence-routing";

describe("Phase 6 evidence and handoff routing", () => {
  it("keeps each evidence workspace as a distinct canonical route", () => {
    const routes = [
      "investigation",
      "situation-room",
      "operator-briefing",
      "delta-digest",
      "evidence-consistency",
      "evidence-quality-workspace",
      "stability-workspace",
      "evidence-replay",
    ].map((viewId) => findEvidenceRouteByViewId(viewId)?.id);
    expect(new Set(routes).size).toBe(8);
  });

  it("canonicalizes old evidence aliases to route ids and preserves context params", () => {
    const flags = readEvidenceRouteFlagsFromSearch("", {});
    const canonical = maybeCanonicalizeEvidenceAlias(
      "?ui=next&view=operator-briefing&sync_runs_limit=30&global_search_q=PE1",
      flags,
    );
    expect(canonical?.get("route")).toBe("evidence.operatorBriefing");
    expect(canonical?.get("view")).toBe("operator-briefing");
    expect(canonical?.get("sync_runs_limit")).toBe("30");
    expect(canonical?.get("global_search_q")).toBe("PE1");
  });

  it("resolves canonical evidence routes back to legacy view outlets", () => {
    const flags = readEvidenceRouteFlagsFromSearch("", {});
    expect(readViewIdFromSearchWithEvidenceRoutes("?route=evidence.investigation", flags)).toBe(
      "investigation",
    );
    expect(readViewIdFromSearchWithEvidenceRoutes("?route=evidence.replay", flags)).toBe(
      "evidence-replay",
    );
  });

  it("supports evidence domain and workspace rollback flags", () => {
    const domainOff = readEvidenceRouteFlagsFromSearch("?next_evidence=0", {});
    expect(maybeCanonicalizeEvidenceAlias("?view=investigation", domainOff)).toBeNull();

    const replayOff = readEvidenceRouteFlagsFromSearch("?next_evidence_replay=false", {});
    expect(maybeCanonicalizeEvidenceAlias("?view=evidence-replay", replayOff)).toBeNull();
    expect(
      readViewIdFromSearchWithEvidenceRoutes("?route=evidence.replay&view=evidence-replay", replayOff),
    ).toBeNull();
  });

  it("writes canonical evidence route ids while preserving existing params", () => {
    const sp = mergeEvidenceRouteIntoSearch(
      "?ui=next&sync_runs_limit=25&inv_from=service-impact-workspace",
      "evidence.investigation",
    );
    expect(sp.get("route")).toBe("evidence.investigation");
    expect(sp.get("view")).toBe("investigation");
    expect(sp.get("sync_runs_limit")).toBe("25");
    expect(sp.get("inv_from")).toBe("service-impact-workspace");
  });
});

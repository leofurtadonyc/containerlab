import { describe, expect, it } from "vitest";

import {
  CORE_DOMAIN_ROUTE_IDS,
  findCoreDomainRouteByViewId,
  maybeCanonicalizeCoreDomainAlias,
  mergeCoreDomainRouteIntoSearch,
  readCoreDomainFlagsFromSearch,
  readViewIdFromSearchWithCoreRoutes,
} from "../src/lib/phase4-core-domain-routing";
import { PLATFORM_NAV_VIEW_IDS } from "../src/nav-views";

describe("Phase 4 read-only core-domain routing", () => {
  it("declares canonical route ids for all migrated read-only views", () => {
    expect(CORE_DOMAIN_ROUTE_IDS).toEqual(
      new Set([
        "home.overview",
        "home.platformHealth",
        "network.devices",
        "network.topology",
        "governance.capabilities",
        "governance.readiness",
        "policyService.policies",
        "policyService.serviceExplorer",
      ]),
    );
    expect(findCoreDomainRouteByViewId("overview")?.id).toBe("home.overview");
    expect(findCoreDomainRouteByViewId("service-explorer")?.id).toBe(
      "policyService.serviceExplorer",
    );
    expect(findCoreDomainRouteByViewId("investigation")).toBeNull();
  });

  it("maps canonical route ids to legacy view ids while keeping old alias compatibility", () => {
    const flags = readCoreDomainFlagsFromSearch("", {});
    expect(
      readViewIdFromSearchWithCoreRoutes(
        "?ui=next&route=home.platformHealth",
        PLATFORM_NAV_VIEW_IDS,
        flags,
      ),
    ).toBe("platform-health");
    expect(
      readViewIdFromSearchWithCoreRoutes("?view=overview", PLATFORM_NAV_VIEW_IDS, flags),
    ).toBe("overview");
    expect(
      readViewIdFromSearchWithCoreRoutes(
        "?view=investigation",
        PLATFORM_NAV_VIEW_IDS,
        flags,
      ),
    ).toBe("investigation");
  });

  it("canonicalizes old aliases and preserves existing query context", () => {
    const flags = readCoreDomainFlagsFromSearch("", {});
    const canonical = maybeCanonicalizeCoreDomainAlias(
      "?ui=next&view=topology&topology_object=node:PE1",
      flags,
    );
    expect(canonical?.toString()).toContain("route=network.topology");
    expect(canonical?.get("view")).toBe("topology");
    expect(canonical?.get("topology_object")).toBe("node:PE1");
  });

  it("honors per-domain disable flags for rollback posture", () => {
    const flags = readCoreDomainFlagsFromSearch("?next_network=0", {});
    expect(
      maybeCanonicalizeCoreDomainAlias("?view=topology&topology_object=node:PE1", flags),
    ).toBeNull();
    expect(
      readViewIdFromSearchWithCoreRoutes(
        "?route=network.topology&view=topology",
        PLATFORM_NAV_VIEW_IDS,
        flags,
      ),
    ).toBe("topology");
  });

  it("writes canonical route + legacy alias for migrated view navigation", () => {
    const nextSearch = mergeCoreDomainRouteIntoSearch(
      "?ui=next&policy_id=PE1:static:1:100",
      "policyService.policies",
    );
    expect(nextSearch.get("route")).toBe("policyService.policies");
    expect(nextSearch.get("view")).toBe("policies");
    expect(nextSearch.get("policy_id")).toBe("PE1:static:1:100");
  });
});

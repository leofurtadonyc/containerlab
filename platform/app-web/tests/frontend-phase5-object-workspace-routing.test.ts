import { describe, expect, it } from "vitest";

import {
  maybeCanonicalizeObjectWorkspaceAlias,
  mergeObjectWorkspaceRouteIntoSearch,
  readObjectWorkspaceFlagsFromSearch,
  readViewIdFromSearchWithObjectRoutes,
} from "../src/lib/phase5-object-workspace-routing";

describe("Phase 5 object-centered workspace routing", () => {
  it("aliases policy and topology object deep links to canonical object routes", () => {
    const flags = readObjectWorkspaceFlagsFromSearch("", {});
    const policyCanonical = maybeCanonicalizeObjectWorkspaceAlias(
      "?ui=next&view=policies&policy_id=PE1:static:1:100&policy_workspace=dossier",
      flags,
    );
    expect(policyCanonical?.get("route")).toBe("policy.object");
    expect(policyCanonical?.get("policy_tab")).toBe("dossier");
    expect(policyCanonical?.get("view")).toBe("policies");

    const topologyCanonical = maybeCanonicalizeObjectWorkspaceAlias(
      "?ui=next&view=topology&topology_object=node:PE1&topology_workspace=dossier",
      flags,
    );
    expect(topologyCanonical?.get("route")).toBe("topology.object");
    expect(topologyCanonical?.get("topology_tab")).toBe("dossier");
    expect(topologyCanonical?.get("view")).toBe("topology");
  });

  it("aliases service and maintenance legacy views to canonical object routes", () => {
    const flags = readObjectWorkspaceFlagsFromSearch("", {});
    const serviceCanonical = maybeCanonicalizeObjectWorkspaceAlias(
      "?ui=next&view=service-impact-workspace&service_impact_workspace_service_id=policy:PE1:static:1:100",
      flags,
    );
    expect(serviceCanonical?.get("route")).toBe("service.object");
    expect(serviceCanonical?.get("service_tab")).toBe("impact");
    expect(serviceCanonical?.get("view")).toBe("service-impact-workspace");
    expect(serviceCanonical?.get("service_id")).toBe("policy:PE1:static:1:100");

    const maintenanceCanonical = maybeCanonicalizeObjectWorkspaceAlias(
      "?ui=next&view=maintenance-window-workspace&mww_subject=node:PE1&mww_subject=link:P1--PE1",
      flags,
    );
    expect(maintenanceCanonical?.get("route")).toBe("maintenance.subjectSet");
    expect(maintenanceCanonical?.get("maintenance_tab")).toBe("window");
    expect(maintenanceCanonical?.get("view")).toBe("maintenance-window-workspace");
  });

  it("maps canonical object routes back to legacy view outlets", () => {
    const flags = readObjectWorkspaceFlagsFromSearch("", {});
    expect(
      readViewIdFromSearchWithObjectRoutes("?route=service.object&service_tab=impact", flags),
    ).toBe("service-impact-workspace");
    expect(
      readViewIdFromSearchWithObjectRoutes("?route=service.object&service_tab=dossier", flags),
    ).toBe("service-dossier");
    expect(
      readViewIdFromSearchWithObjectRoutes("?route=maintenance.subjectSet&maintenance_tab=evidence", flags),
    ).toBe("maintenance-evidence-workspace");
  });

  it("supports per-slice rollback by disabling canonicalization", () => {
    const flags = readObjectWorkspaceFlagsFromSearch("?next_service_object=0&next_policy_object=false", {});
    expect(
      maybeCanonicalizeObjectWorkspaceAlias(
        "?view=service-dossier&service_id=policy:PE1:static:1:100",
        flags,
      ),
    ).toBeNull();
    expect(
      maybeCanonicalizeObjectWorkspaceAlias("?view=policies&policy_id=PE1:static:1:100", flags),
    ).toBeNull();
  });

  it("writes canonical route with explicit tab and legacy alias", () => {
    const merged = mergeObjectWorkspaceRouteIntoSearch(
      "?ui=next&topology_object=node:PE1",
      "topology.object",
      "dossier",
    );
    expect(merged.get("route")).toBe("topology.object");
    expect(merged.get("topology_tab")).toBe("dossier");
    expect(merged.get("view")).toBe("topology");
    expect(merged.get("topology_object")).toBe("node:PE1");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { NextShell } from "../src/components/next-shell";
import {
  buildRouteContextChips,
  findGroupLabelForView,
  NEXT_SHELL_NAV_GROUPS,
} from "../src/lib/next-shell-navigation";
import {
  readShellModeFromSearch,
  shouldUseNextShell,
} from "../src/lib/shell-mode";
import { PLATFORM_NAV_VIEW_IDS } from "../src/nav-views";

describe("Phase 3 shell flag and IA", () => {
  it("resolves to next shell and deprecates legacy flag", () => {
    expect(readShellModeFromSearch("")).toBe("next");
    expect(readShellModeFromSearch("?ui=next")).toBe("next");
    expect(readShellModeFromSearch("?ui=legacy", "next")).toBe("next");
    expect(readShellModeFromSearch("", "next")).toBe("next");
    expect(shouldUseNextShell("?ui=next")).toBe(true);
    expect(shouldUseNextShell("")).toBe(true);
  });

  it("maps every legacy view id into the new primary IA groups", () => {
    const listed = NEXT_SHELL_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id));
    expect(new Set(listed).size).toBe(listed.length);
    expect(new Set(listed)).toEqual(PLATFORM_NAV_VIEW_IDS);
    expect(findGroupLabelForView("overview")).toBe("Home");
    expect(findGroupLabelForView("devices")).toBe("Network");
    expect(findGroupLabelForView("safe-action-workspace")).toBe("Workflow Controls");
  });

  it("builds explicit object/context breadcrumb chips from route params", () => {
    const chips = buildRouteContextChips(
      "?view=policies&policy_id=PE1%3Astatic%3A1%3A100&policy_workspace=dossier",
    );
    expect(chips).toEqual([
      { label: "Object", value: "PE1:static:1:100" },
      { label: "Context", value: "dossier" },
    ]);
  });

  it("renders next shell breadcrumb, global command slot, and fallback notice", () => {
    const html = renderToStaticMarkup(
      <NextShell
        title="Platform"
        navigationGroups={NEXT_SHELL_NAV_GROUPS}
        activeItemId="overview"
        onSelect={() => undefined}
        currentGroupLabel="Home"
        currentPageLabel="Overview"
        currentPageDescription="Start here."
        routeContextChips={[{ label: "Object", value: "PE1" }]}
        environmentSummary="http://api"
        onCopyLink={vi.fn()}
        copyState="idle"
        onResetContext={vi.fn()}
        fallbackNote="Unrecognized view opened."
        commandSlot={<div>search-slot</div>}
      >
        <section>old-view-outlet</section>
      </NextShell>,
    );
    expect(html).toContain("Breadcrumb");
    expect(html).toContain("Home");
    expect(html).toContain("Object: PE1");
    expect(html).toContain("search-slot");
    expect(html).toContain("Unrecognized view opened.");
    expect(html).toContain("old-view-outlet");
    expect(html).toContain("Copy link");
    expect(html).toContain("Reset context");
  });
});

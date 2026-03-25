import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChangeSafetyCaseView } from "../src/features/change-safety-case/view";

describe("ChangeSafetyCaseView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders setup when no change_safety_context", () => {
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=change-safety-case",
      search: "?view=change-safety-case",
    });
    const html = renderToStaticMarkup(<ChangeSafetyCaseView />);
    expect(html).toContain("change_safety_case_v1");
    expect(html).toContain("Quick open");
  });
});

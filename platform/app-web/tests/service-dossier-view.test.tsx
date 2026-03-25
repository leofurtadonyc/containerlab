import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceDossierView } from "../src/features/service-dossier/view";

describe("ServiceDossierView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders empty state when service_id is absent", () => {
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=service-dossier",
      search: "?view=service-dossier",
    });
    const html = renderToStaticMarkup(<ServiceDossierView />);
    expect(html).toContain("service-dossier-empty");
    expect(html).toContain("No service selected");
  });
});

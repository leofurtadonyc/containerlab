import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EvidenceQualitySurfaceEntry } from "../src/features/evidence-quality-workspace/surface-entry";

describe("EvidenceQualitySurfaceEntry", () => {
  it("renders bounded entry copy and test id", () => {
    const html = renderToStaticMarkup(<EvidenceQualitySurfaceEntry />);
    expect(html).toContain('data-testid="evidence-quality-surface-entry"');
    expect(html).toContain("Evidence quality workspace");
    expect(html).toContain("interpretation support only");
  });
});

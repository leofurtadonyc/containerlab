import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { EvidenceQualityRow } from "../src/api/contracts";
import { EvidenceQualityDomainSections } from "../src/features/evidence-quality-workspace/domain-sections";

function makeRows(): EvidenceQualityRow[] {
  return [
    {
      evidence_quality_dimension: "fallback_conditions",
      evidence_subject_domain: "devices",
      summary: "Devices fallback.",
      detail: null,
      source_citations: ["GET /api/v1/devices"],
    },
    {
      evidence_quality_dimension: "collection_assurance",
      evidence_subject_domain: "platform_read_paths",
      summary: "Policy path degraded.",
      detail: null,
      source_citations: ["GET /api/v1/platform/status"],
    },
  ];
}

describe("EvidenceQualityDomainSections", () => {
  it("renders domain section test ids and groups rows", () => {
    const html = renderToStaticMarkup(
      <EvidenceQualityDomainSections rows={makeRows()} syncRunsLimit={20} />,
    );
    expect(html).toContain("data-testid=\"evidence-quality-domain-sections\"");
    expect(html).toContain("data-testid=\"eqw-domain-devices\"");
    expect(html).toContain("data-testid=\"eqw-domain-platform\"");
    expect(html).toContain("Devices fallback.");
    expect(html).toContain("Policy path degraded.");
    expect(html).toContain("data-cue=\"fallback_conditions\"");
  });

  it("renders pivot-only sections for services, maintenance, stability", () => {
    const html = renderToStaticMarkup(<EvidenceQualityDomainSections rows={[]} syncRunsLimit={15} />);
    expect(html).toContain("data-testid=\"eqw-domain-services\"");
    expect(html).toContain("data-testid=\"eqw-domain-maintenance\"");
    expect(html).toContain("data-testid=\"eqw-domain-stability\"");
    expect(html).toContain("Open Service Explorer");
    expect(html).toContain("Open Maintenance evidence workspace");
    expect(html).toContain("Open Stability workspace");
  });
});

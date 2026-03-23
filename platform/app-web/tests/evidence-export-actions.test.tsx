import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EvidenceExportActions } from "../src/components/evidence-export-actions";

describe("EvidenceExportActions", () => {
  it("renders JSON and Markdown export controls with bounded operator copy (policy dossier)", () => {
    const html = renderToStaticMarkup(
      <EvidenceExportActions variant="dossier" target={{ kind: "policy_dossier", policyId: "p1" }} />,
    );
    expect(html).toContain("data-testid=\"evidence-export-actions\"");
    expect(html).toContain("Export JSON");
    expect(html).toContain("Export Markdown");
    expect(html).toContain("compliance hold");
    expect(html).toContain("tamper evidence");
  });

  it("renders for situation room and investigation targets", () => {
    const situation = renderToStaticMarkup(
      <EvidenceExportActions variant="situation" target={{ kind: "situation_room", syncRunsLimit: 10 }} />,
    );
    expect(situation).toContain("Export JSON");

    const investigation = renderToStaticMarkup(
      <EvidenceExportActions
        variant="investigation"
        target={{ kind: "investigation_workspace", syncRunsLimit: 10 }}
      />,
    );
    expect(investigation).toContain("Export Markdown");
  });
});

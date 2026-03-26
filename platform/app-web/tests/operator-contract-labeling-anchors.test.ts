import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Regression anchors for week 35 operator contract labeling (copy-only; traces to
 * week-33-bounded-next-slice-recommendation.md confusion pairs).
 */
describe("operator contract labeling anchors (week 35)", () => {
  it("service explorer product contrasts list/index vs dossier and impact workspace", () => {
    const src = readFileSync(join(__dirname, "../src/features/service-explorer/service-explorer-product.tsx"), "utf8");
    expect(src).toContain("List/index only");
    expect(src).toContain("Service dossier");
    expect(src).toContain("Service Impact workspace");
  });

  it("change safety case product contrasts impact report and evidence export envelopes", () => {
    const src = readFileSync(
      join(__dirname, "../src/features/change-safety-case/change-safety-case-product.tsx"),
      "utf8",
    );
    expect(src).toContain("impact_report_v1");
    expect(src).toContain("evidence_export_v1");
  });

  it("impact report product contrasts change safety case and evidence export", () => {
    const src = readFileSync(join(__dirname, "../src/features/impact-report/impact-report-product.tsx"), "utf8");
    expect(src).toContain("change_safety_case_v1");
    expect(src).toContain("evidence_export_v1");
  });

  it("download action hints stay mutually distinguishing", () => {
    const csc = readFileSync(join(__dirname, "../src/components/change-safety-case-actions.tsx"), "utf8");
    const ir = readFileSync(join(__dirname, "../src/components/impact-report-actions.tsx"), "utf8");
    expect(csc).toContain("impact_report_v1");
    expect(ir).toContain("change_safety_case_v1");
  });
});

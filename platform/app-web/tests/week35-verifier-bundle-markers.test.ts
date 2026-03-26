import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Parity with `verify-core-runtime.sh` grep -F 'evidence_consistency_summary_v1' on shipped /assets/*.js:
 * the minified bundle must retain this contract id string (Overview, workspace, contracts).
 */
describe("week 35 verifier bundle markers", () => {
  it("retains evidence_consistency_summary_v1 in sources wired into the app bundle", () => {
    const nav = readFileSync(join(__dirname, "../src/nav-views.ts"), "utf8");
    const view = readFileSync(join(__dirname, "../src/features/evidence-consistency/view.tsx"), "utf8");
    const contracts = readFileSync(join(__dirname, "../src/api/contracts.ts"), "utf8");
    expect(nav).toContain("evidence-consistency");
    expect(view).toContain("evidence_consistency_summary_v1");
    expect(contracts).toContain("evidence_consistency_summary_v1");
  });
});

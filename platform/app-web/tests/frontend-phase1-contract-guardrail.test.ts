import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONTRACT_GUARDRAIL_DECISION = {
  phase1Choice: "drift-check-harness",
  generatedClientStatus: "defer-until-after-route-api-parity",
  reason:
    "Phase 1 preserves the handwritten ApiClient while adding executable drift checks over exported contracts and client return types.",
} as const;

describe("Phase 1 contract guardrail decision", () => {
  it("records drift-check harness as the Phase 1 contract guardrail", () => {
    expect(CONTRACT_GUARDRAIL_DECISION).toEqual({
      phase1Choice: "drift-check-harness",
      generatedClientStatus: "defer-until-after-route-api-parity",
      reason:
        "Phase 1 preserves the handwritten ApiClient while adding executable drift checks over exported contracts and client return types.",
    });
  });

  it("indexes exported frontend contracts for drift-check coverage", () => {
    const contracts = readFileSync(join(__dirname, "../src/api/contracts.ts"), "utf8");
    const exportedNames = extractExportedNames(contracts);

    expect(exportedNames.length).toBeGreaterThanOrEqual(300);
    expect(new Set(exportedNames).size).toBe(exportedNames.length);
    expect(exportedNames).toContain("PlatformStatusResponse");
    expect(exportedNames).toContain("ControllerEvidenceResponse");
    expect(exportedNames).toContain("ImpactReportResponse");
    expect(exportedNames).toContain("ChangeSafetyCaseResponse");
    expect(exportedNames).toContain("ActionSafetyCaseResponse");
    expect(exportedNames).toContain("RollbackDetailResponse");
  });

  it("keeps every ApiClient response type backed by a contracts.ts export", () => {
    const contracts = readFileSync(join(__dirname, "../src/api/contracts.ts"), "utf8");
    const client = readFileSync(join(__dirname, "../src/api/client.ts"), "utf8");
    const exportedNames = new Set(extractExportedNames(contracts));
    const apiClientReturnTypes = [...client.matchAll(/async\s+\w+\([^)]*\):\s+Promise<([A-Za-z0-9_]+)>/g)].map(
      (match) => match[1],
    );

    expect(apiClientReturnTypes.length).toBeGreaterThanOrEqual(70);
    expect(apiClientReturnTypes.filter((typeName) => !exportedNames.has(typeName))).toEqual([]);
  });
});

function extractExportedNames(source: string): string[] {
  return [...source.matchAll(/^export\s+(?:interface|type|const)\s+([A-Za-z0-9_]+)/gm)]
    .map((match) => match[1])
    .sort();
}

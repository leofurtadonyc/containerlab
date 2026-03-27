import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Parity with `verify-core-runtime.sh`:
 * - `grep -F 'mww_subject'` on shipped /assets/*.js (maintenance window URL state)
 * - structural app-api checks for `GET /api/v1/maintenance-window-workspace` and handoff export (script-side)
 */
describe("week 38 verifier bundle markers", () => {
  it("retains mww_subject param and navigation wiring for maintenance window workspace", () => {
    const nav = readFileSync(join(__dirname, "../src/lib/maintenance-window-workspace-navigation.ts"), "utf8");
    const client = readFileSync(join(__dirname, "../src/api/client.ts"), "utf8");
    const noc = readFileSync(join(__dirname, "../src/features/overview/noc-cockpit-strategic-pivots.tsx"), "utf8");
    const search = readFileSync(join(__dirname, "../src/features/global-search/global-operator-search.tsx"), "utf8");
    expect(nav).toContain("mww_subject");
    expect(nav).toContain("MAINTENANCE_WINDOW_SUBJECT_PARAM");
    expect(client).toContain("/api/v1/maintenance-window-workspace");
    expect(noc).toContain("navigateToMaintenanceWindowWorkspaceForTopologyObject");
    expect(search).toContain("Maintenance window workspace");
  });
});

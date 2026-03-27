import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Parity with verify-core-runtime.sh `maintenance_window_workspace_v1` expectations in shipped JS. */
describe("week 38 maintenance window workspace bundle markers", () => {
  it("retains maintenance_window_workspace_v1 in nav, contracts, and view", () => {
    const nav = readFileSync(join(__dirname, "../src/nav-views.ts"), "utf8");
    const contracts = readFileSync(join(__dirname, "../src/api/contracts.ts"), "utf8");
    const view = readFileSync(join(__dirname, "../src/features/maintenance-window-workspace/view.tsx"), "utf8");
    const product = readFileSync(
      join(__dirname, "../src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx"),
      "utf8",
    );
    expect(nav).toContain("maintenance-window-workspace");
    expect(contracts).toContain("maintenance_window_workspace_v1");
    expect(view).toContain("maintenance_window_workspace_v1");
    expect(product).toContain("maintenance_window_workspace_v1");
  });
});

import { describe, expect, it } from "vitest";

import {
  NEXT_UI_MODE_VALUE,
  readShellModeFromSearch,
  shouldUseNextShell,
  UI_MODE_PARAM,
} from "../src/lib/shell-mode";

describe("Phase 11 old UI deprecation", () => {
  it("keeps next shell as the only runtime shell mode", () => {
    expect(readShellModeFromSearch("")).toBe("next");
    expect(readShellModeFromSearch("?ui=next")).toBe("next");
    expect(readShellModeFromSearch("?ui=legacy")).toBe("next");
    expect(shouldUseNextShell("")).toBe(true);
    expect(shouldUseNextShell("?ui=legacy")).toBe(true);
  });

  it("retains canonical next-shell query param constants for compatibility", () => {
    expect(UI_MODE_PARAM).toBe("ui");
    expect(NEXT_UI_MODE_VALUE).toBe("next");
  });
});

export type ShellMode = "legacy" | "next";

export const UI_MODE_PARAM = "ui";
export const NEXT_UI_MODE_VALUE = "next";
export const LEGACY_UI_MODE_VALUE = "legacy";

export function readShellModeFromSearch(
  search: string,
  runtimeDefaultMode?: string,
): ShellMode {
  const mode = new URLSearchParams(search).get(UI_MODE_PARAM);
  if (mode === NEXT_UI_MODE_VALUE) {
    return "next";
  }
  if (mode === LEGACY_UI_MODE_VALUE) {
    return "legacy";
  }
  return runtimeDefaultMode === NEXT_UI_MODE_VALUE ? "next" : "legacy";
}

export function shouldUseNextShell(
  search: string,
  runtimeDefaultMode?: string,
): boolean {
  return readShellModeFromSearch(search, runtimeDefaultMode) === "next";
}

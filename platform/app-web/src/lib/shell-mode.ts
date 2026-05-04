export type ShellMode = "next";

export const UI_MODE_PARAM = "ui";
export const NEXT_UI_MODE_VALUE = "next";
export const LEGACY_UI_MODE_VALUE = "legacy";

export function readShellModeFromSearch(
  _search: string,
  runtimeDefaultMode?: string,
): ShellMode {
  // Phase 11 deprecates legacy shell branches. Keep API surface for tests and compatibility,
  // but always resolve to next shell regardless of incoming query or runtime flag.
  void runtimeDefaultMode;
  return "next";
}

export function shouldUseNextShell(
  _search: string,
  runtimeDefaultMode?: string,
): boolean {
  void runtimeDefaultMode;
  return true;
}

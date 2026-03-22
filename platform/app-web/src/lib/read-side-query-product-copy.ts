import type { ReadSideQueryEcho } from "../api/contracts";

function boundedHistoryAbsenceSuffix(
  echo: ReadSideQueryEcho,
  historyStatus: "unavailable" | "current_only" | "comparison_ready",
): string {
  if (historyStatus === "unavailable") {
    return "";
  }
  if (
    echo.history_recent_snapshots_returned === 0 &&
    echo.history_recent_limit_effective != null
  ) {
    return ` For history_recent_limit ${echo.history_recent_limit_effective}, the API returned no snapshot summary rows in this bounded window—read-side absence, not a validation verdict.`;
  }
  return "";
}

/**
 * Footnote under an empty `history.recent_snapshots` list, aligned with backend history status
 * and optional bounded query echo (week 22 read-side ergonomics).
 */
export function recentSnapshotsEmptyFootnote(
  historyStatus: "unavailable" | "current_only" | "comparison_ready",
  echo: ReadSideQueryEcho,
  slice: "devices" | "policies",
): string {
  if (slice === "devices") {
    if (historyStatus === "unavailable") {
      return (
        "No persisted inventory history window is available from the backend in this posture." +
        boundedHistoryAbsenceSuffix(echo, historyStatus)
      );
    }
    if (historyStatus === "current_only") {
      return (
        "Only one persisted normalized inventory snapshot exists in this bounded window; a second " +
        "persisted sync is required before comparison and richer snapshot lists can appear." +
        boundedHistoryAbsenceSuffix(echo, historyStatus)
      );
    }
    return (
      "No persisted normalized inventory snapshots are currently listed for this bounded view." +
      boundedHistoryAbsenceSuffix(echo, historyStatus)
    );
  }

  if (historyStatus === "unavailable") {
    return (
      "No persisted policy-history window is currently available from the backend." +
      boundedHistoryAbsenceSuffix(echo, historyStatus)
    );
  }
  if (historyStatus === "current_only") {
    return (
      "Only one persisted snapshot exists on file; a second persisted sync is required before " +
      "comparison and richer history readouts can appear." + boundedHistoryAbsenceSuffix(echo, historyStatus)
    );
  }
  return (
    "No persisted normalized policy snapshots are currently available for this bounded view." +
    boundedHistoryAbsenceSuffix(echo, historyStatus)
  );
}

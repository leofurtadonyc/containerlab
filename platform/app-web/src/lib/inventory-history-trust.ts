import type { DevicesListResponse } from "../api/contracts";

import { formatLabel } from "./presentation";

/**
 * Builds a single TrustCueCard row describing bounded persisted inventory history
 * from the Devices API (`history` on `DevicesListResponse`). Coarse entry-surface cue only—
 * detailed history stays on the Devices page.
 */
export function buildInventoryHistoryTrustCueRow(
  devicesData: DevicesListResponse | null | undefined,
  isLoading: boolean,
  hasError: boolean,
): { label: string; kind: "text"; value: string; note: string } {
  if (isLoading) {
    return {
      label: "Inventory history",
      kind: "text",
      value: "Loading",
      note:
        "The supporting Devices query is still loading persisted inventory history posture for this entry surface.",
    };
  }

  if (hasError || !devicesData) {
    return {
      label: "Inventory history",
      kind: "text",
      value: "Unavailable",
      note:
        "This entry surface could not load the supporting Devices response, so persisted inventory history posture is not summarized here.",
    };
  }

  const history = devicesData.history;
  const snapshotCount = history.recent_snapshots.length;
  const statusLabel = formatLabel(history.status);

  const value =
    snapshotCount === 0
      ? `No snapshots • ${statusLabel}`
      : `${snapshotCount} snapshot${snapshotCount === 1 ? "" : "s"} • ${statusLabel}`;

  let comparisonHint: string;
  if (history.comparison_to_previous) {
    comparisonHint =
      "Latest-versus-previous comparison is available; see the Devices page for anchors and bounded change preview.";
  } else if (history.status === "current_only") {
    comparisonHint =
      "Only one snapshot in this bounded window—comparison to the immediately previous snapshot is not available yet (often an honest first-persist or narrow window).";
  } else if (history.status === "unavailable") {
    comparisonHint =
      "No persisted history window in this posture—fresh baseline, empty history, or backend limitation.";
  } else {
    comparisonHint = "See the Devices page for snapshot rows and comparison details.";
  }

  const note =
    `Bounded persisted inventory history from the Devices API (${snapshotCount} recent snapshot${snapshotCount === 1 ? "" : "s"} in this window). ${comparisonHint} ` +
    "Read-side evidence from stored reads—not controller ground truth, workflow state, or approval to change the network.";

  return {
    label: "Inventory history",
    kind: "text",
    value,
    note,
  };
}

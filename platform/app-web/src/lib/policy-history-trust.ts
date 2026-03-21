import type { PoliciesListResponse } from "../api/contracts";

import { formatLabel } from "./presentation";

/**
 * Coarse persisted policy-history + source-readiness cue for entry surfaces (Overview,
 * Platform Health). Mirrors {@link buildInventoryHistoryTrustCueRow} for the Policies API
 * `history` envelope. Detailed readouts stay on the Policies page.
 */
export function buildPolicyHistoryTrustCueRow(
  policiesData: PoliciesListResponse | null | undefined,
  isLoading: boolean,
  hasError: boolean,
): { label: string; kind: "text"; value: string; note: string } {
  if (isLoading) {
    return {
      label: "Policy history",
      kind: "text",
      value: "Loading",
      note:
        "The supporting Policies query is still loading persisted policy history and source-readiness posture for this entry surface.",
    };
  }

  if (hasError || !policiesData) {
    return {
      label: "Policy history",
      kind: "text",
      value: "Unavailable",
      note:
        "This entry surface could not load the supporting Policies response, so persisted policy history and source-readiness posture are not summarized here.",
    };
  }

  const history = policiesData.history;
  const snapshotCount = history.recent_snapshots.length;
  const statusLabel = formatLabel(history.status);
  const latestSnapshot = history.recent_snapshots[0];
  const persistedReadinessPosture =
    latestSnapshot?.detail_source_readiness?.posture ??
    latestSnapshot?.detail_source_readiness_posture;
  const readinessPosture = persistedReadinessPosture ?? policiesData.detail_source_readiness.posture;
  const readinessLabel = formatLabel(readinessPosture);

  const snapshotPart =
    snapshotCount === 0 ? "No snapshots" : `${snapshotCount} snapshot${snapshotCount === 1 ? "" : "s"}`;

  const value = `${snapshotPart} • ${statusLabel} • ${readinessLabel}`;

  let comparisonHint: string;
  if (history.comparison_to_previous) {
    comparisonHint =
      "Latest-versus-previous comparison is available between persisted snapshots; see the Policies page for anchors, nested readiness, and bounded change preview.";
  } else if (history.status === "current_only") {
    comparisonHint =
      "Only one snapshot in this bounded window—comparison to the immediately previous snapshot is not available yet (often an honest first-persist or narrow window).";
  } else if (history.status === "unavailable") {
    comparisonHint =
      "No persisted history window in this posture—fresh baseline, empty history, or backend limitation.";
  } else {
    comparisonHint = "See the Policies page for snapshot rows and comparison details.";
  }

  const readinessBasis =
    snapshotCount > 0 && persistedReadinessPosture
      ? "latest persisted snapshot"
      : snapshotCount === 0
        ? "current Policies response"
        : "current Policies response (persisted rows omit nested readiness here)";

  const note =
    `Bounded persisted policy history from the Policies API (${snapshotCount} recent snapshot${snapshotCount === 1 ? "" : "s"} in this window). ` +
    `Source-readiness posture ${readinessLabel} summarizes the bounded policy slice for this summary (${readinessBasis}). ${comparisonHint} ` +
    "Live-empty targets are healthy but observed-empty; detail-ready targets expose bounded per-policy detail—not the same axis. Read-side evidence from stored reads—not controller ground truth, drift analysis, or workflow state.";

  return {
    label: "Policy history",
    kind: "text",
    value,
    note,
  };
}

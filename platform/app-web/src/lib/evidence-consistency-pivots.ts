/**
 * Read-only pivot navigation for evidence_consistency_summary_v1 rows — same semantics as Overview/NOC card.
 */

import type { EvidenceConsistencyPivotHint } from "../api/contracts";
import { navigateToDeltaDigestView } from "./delta-digest-navigation";
import { navigateToEvidenceView } from "./url-app-state";

export function navigateEvidenceConsistencyPivotFromHint(
  hint: EvidenceConsistencyPivotHint,
  syncRunsLimit: number,
): void {
  const r = hint.route_family;
  if (r.includes("/policies") && !r.includes("change-intelligence")) {
    navigateToEvidenceView("policies");
    return;
  }
  if (r.includes("/devices")) {
    navigateToEvidenceView("devices");
    return;
  }
  if (r.includes("/topology")) {
    navigateToEvidenceView("topology");
    return;
  }
  if (r.includes("delta-digest")) {
    navigateToDeltaDigestView(syncRunsLimit);
    return;
  }
  if (r.includes("change-intelligence")) {
    navigateToEvidenceView("overview");
  }
}

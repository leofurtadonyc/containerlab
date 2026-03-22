import type { DryRunReadinessSummary } from "../api/contracts";
import { formatLabel } from "./presentation";
import { describeDryRunReadinessStatus } from "./readiness";

/**
 * Coarse copy for Overview / Platform Health entry surfaces only.
 * Detailed interpretation remains on Capabilities and Readiness.
 */
export function formatEntrySurfaceReadinessSummaryLines(readiness: DryRunReadinessSummary): {
  headline: string;
  supportingLine: string;
  trustNote: string;
} {
  return {
    headline: formatLabel(readiness.status),
    supportingLine: `${formatLabel(readiness.planning_readiness)} • ${readiness.blockers.length} explicit blocker records`,
    trustNote: describeDryRunReadinessStatus(readiness.status),
  };
}

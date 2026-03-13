import type { EvidenceConfidenceSummary } from "../api/contracts";

export function normalizeEvidenceConfidence(
  value: EvidenceConfidenceSummary | null | undefined,
  fallback: EvidenceConfidenceSummary,
): EvidenceConfidenceSummary {
  return {
    ...fallback,
    ...value,
    notes: value?.notes ?? fallback.notes,
  };
}

export function describeEvidenceSource(
  value: EvidenceConfidenceSummary["source_posture"],
): string {
  switch (value) {
    case "live_observed":
      return "The page is being backed by the current live observed normalized read path.";
    case "persisted_fallback":
      return "The page is currently being backed by persisted normalized evidence because live collection is unavailable.";
    default:
      return "The page only has an empty scaffold because neither live nor persisted backend-owned evidence is available.";
  }
}

export function describeEvidenceKind(
  value: EvidenceConfidenceSummary["evidence_kind"],
): string {
  switch (value) {
    case "direct_observed":
      return "Current evidence is derived directly from normalized observed records.";
    case "observed_plus_inferred":
      return "Current evidence combines direct observed records with bounded backend-owned inference.";
    case "aggregate_only":
      return "Current evidence is limited to aggregate counters or totals rather than stable per-record detail.";
    case "aggregate_plus_bounded_records":
      return "Current evidence combines aggregate signals with bounded normalized record detail where supported.";
    default:
      return "The backend did not provide enough evidence-kind detail to classify this response more precisely.";
  }
}

export function describeConfidencePosture(
  value: EvidenceConfidenceSummary["confidence_posture"],
): string {
  switch (value) {
    case "strong_for_current_slice":
      return "The current read-only slice is strong enough to support direct operator interpretation for what this page currently claims.";
    case "bounded_partial":
      return "The page is useful, but some truth remains intentionally bounded, incomplete, or interpretive.";
    case "degraded":
      return "The page remains usable, but the evidence path is degraded enough that operators should treat the current view more cautiously.";
    default:
      return "The page is blocked from expressing the intended truth slice with enough confidence to claim more than bounded scaffolding.";
  }
}

export function describeFreshnessPosture(
  value: EvidenceConfidenceSummary["freshness_posture"],
): string {
  switch (value) {
    case "current":
      return "The current page evidence is being presented as current for the bounded read-only slice.";
    case "stale":
      return "The page is relying on older persisted evidence rather than a current live read.";
    default:
      return "The backend could not provide enough timestamp posture to classify freshness more precisely.";
  }
}

export function describeBlockedReason(
  value: EvidenceConfidenceSummary["blocked_reason"],
): string {
  switch (value) {
    case "none":
      return "No additional blocked reason is currently being asserted for this response.";
    case "collector_unavailable":
      return "The live collector path is unavailable, so the page must fall back to older persisted evidence.";
    case "collector_unavailable_and_no_persisted_snapshot":
      return "Neither live collector evidence nor a persisted fallback snapshot could be loaded for this page.";
    case "per_record_detail_unavailable":
      return "The backend can still show aggregate evidence, but cannot yet derive stable per-record detail for the current slice.";
    default:
      return "The backend indicated that some evidence remains blocked or unknown, but did not provide a more precise blocked reason.";
  }
}

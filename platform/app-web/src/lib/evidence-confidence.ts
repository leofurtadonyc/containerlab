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

export function buildTopologyEvidenceFallback(
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold",
  dataStatus: "normalized_scaffold" | "live" | "degraded",
): EvidenceConfidenceSummary {
  if (servingMode === "live_collector") {
    return {
      source_posture: "live_observed",
      evidence_kind: "observed_plus_inferred",
      confidence_posture: dataStatus === "live" ? "bounded_partial" : "degraded",
      freshness_posture: "current",
      blocked_reason: "none",
      summary:
        dataStatus === "live"
          ? "Topology is backed by current live observed evidence plus bounded backend-owned inference."
          : "Topology remains live observed plus inferred, but the current collector evidence is degraded.",
      notes: [
        "This fallback UI summary is used when the backend response does not yet include explicit evidence-confidence details.",
      ],
    };
  }
  if (servingMode === "persisted_fallback") {
    return {
      source_posture: "persisted_fallback",
      evidence_kind: "observed_plus_inferred",
      confidence_posture: "degraded",
      freshness_posture: "stale",
      blocked_reason: "collector_unavailable",
      summary:
        "Topology is being served from a persisted normalized fallback snapshot because the live collector path is unavailable.",
      notes: [
        "This fallback UI summary is used when the backend response does not yet include explicit evidence-confidence details.",
      ],
    };
  }
  return {
    source_posture: "empty_scaffold",
    evidence_kind: "unknown",
    confidence_posture: "blocked",
    freshness_posture: "unknown",
    blocked_reason: "collector_unavailable_and_no_persisted_snapshot",
    summary:
      "The topology page only has empty-scaffold posture because neither live collector evidence nor a persisted fallback snapshot is available.",
    notes: [
      "This fallback UI summary is used when the backend response does not yet include explicit evidence-confidence details.",
    ],
  };
}

export function buildPolicyEvidenceFallback(
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold",
  dataStatus: "live" | "degraded",
  detailMode: "counters_only" | "static_policies_when_present" | "mixed" | "unknown",
  emptyReason:
    | "none"
    | "no_policies_observed"
    | "per_policy_details_unavailable"
    | "collector_unavailable",
): EvidenceConfidenceSummary {
  const evidenceKind =
    emptyReason === "per_policy_details_unavailable" || detailMode === "counters_only"
      ? "aggregate_only"
      : detailMode === "static_policies_when_present" || detailMode === "mixed"
        ? "aggregate_plus_bounded_records"
        : "unknown";
  if (servingMode === "live_collector") {
    return {
      source_posture: "live_observed",
      evidence_kind: evidenceKind,
      confidence_posture:
        emptyReason === "per_policy_details_unavailable"
          ? "blocked"
          : dataStatus === "degraded"
            ? "degraded"
            : "bounded_partial",
      freshness_posture: "current",
      blocked_reason:
        emptyReason === "per_policy_details_unavailable"
          ? "per_record_detail_unavailable"
          : "none",
      summary:
        emptyReason === "per_policy_details_unavailable"
          ? "Policy state is backed by current live aggregate evidence, but stable per-policy detail remains blocked."
          : "Policy state is backed by current live observed evidence, with confidence bounded by the current normalized detail coverage.",
      notes: [
        "This fallback UI summary is used when the backend response does not yet include explicit evidence-confidence details.",
      ],
    };
  }
  if (servingMode === "persisted_fallback") {
    return {
      source_posture: "persisted_fallback",
      evidence_kind: evidenceKind,
      confidence_posture: "degraded",
      freshness_posture: "stale",
      blocked_reason: "collector_unavailable",
      summary:
        "Policy state is being served from a persisted normalized fallback snapshot because the live collector path is unavailable.",
      notes: [
        "This fallback UI summary is used when the backend response does not yet include explicit evidence-confidence details.",
      ],
    };
  }
  return {
    source_posture: "empty_scaffold",
    evidence_kind: "unknown",
    confidence_posture: "blocked",
    freshness_posture: "unknown",
    blocked_reason: "collector_unavailable_and_no_persisted_snapshot",
    summary:
      "The policies page only has empty-scaffold posture because neither live collector evidence nor a persisted fallback snapshot is available.",
    notes: [
      "This fallback UI summary is used when the backend response does not yet include explicit evidence-confidence details.",
    ],
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

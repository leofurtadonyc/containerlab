import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { IdentifierChip } from "../../components/identifier-chip";
import { StatusPill } from "../../components/status-pill";
import {
  buildCrossSliceConsistencyReadout,
  buildPolicySupportObservedReadout,
} from "../../lib/cross-slice-consistency";
import {
  buildFallbackAwareStatusDisplay,
  buildRowPostureStatusDisplay,
  countBy,
  formatRowCurrentPosture,
  formatDateTime,
  formatLabel,
} from "../../lib/presentation";
import {
  buildPolicyEvidenceFallback,
  buildTopologyEvidenceFallback,
  describeBlockedReason,
  describeConfidencePosture,
  describeEvidenceKind,
  describeEvidenceSource,
  normalizeEvidenceConfidence,
} from "../../lib/evidence-confidence";
import { useTopologyQuery } from "../topology/api";
import { usePoliciesQuery } from "./api";

type PolicyDetailBlockerReason =
  | "none"
  | "policy_capability_unavailable"
  | "no_policies_observed"
  | "per_policy_details_unavailable"
  | "partial_detail_coverage"
  | "collection_failed"
  | "collection_partial"
  | "not_recorded";

interface PolicyDetailBlockerReadout {
  pillValue: "ok" | "degraded" | "blocked" | "unknown";
  label: string;
  detail: string;
}

interface PolicyDetailBlockerSummary {
  label: string;
  detail: string;
  breakdown: string;
  blockedTargetCount: number;
  detailReadyTargetCount: number;
  notRecordedTargetCount: number;
}

function buildFreshnessSummary(observedAt: string | null, generatedAt: string) {
  if (!observedAt) {
    return {
      label: "Unknown",
      detail: "The policy response does not currently include an observed timestamp.",
    };
  }

  const observedDate = new Date(observedAt);
  const generatedDate = new Date(generatedAt);

  if (Number.isNaN(observedDate.getTime()) || Number.isNaN(generatedDate.getTime())) {
    return {
      label: "Unclear",
      detail: "The policy timestamps could not be interpreted in the current browser.",
    };
  }

  const ageMinutes = Math.max(0, Math.round((generatedDate.getTime() - observedDate.getTime()) / 60000));
  if (ageMinutes <= 5) {
    return {
      label: "Fresh",
      detail: `Observed ${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} before the API response was generated.`,
    };
  }
  if (ageMinutes <= 30) {
    return {
      label: "Aging",
      detail: `Observed ${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} before the API response was generated.`,
    };
  }
  return {
    label: "Stale",
    detail: `Observed ${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} before the API response was generated.`,
  };
}

function describeSupportState(value: string): string {
  switch (value) {
    case "supported":
      return "The bounded platform path can interpret this record shape without known support gaps.";
    case "partially_supported":
      return "The platform can expose useful evidence, but some policy semantics remain intentionally incomplete.";
    case "unsupported":
      return "The current bounded platform path does not support this policy record shape.";
    case "not_implemented_in_platform":
      return "The platform recognizes the state category, but this bounded read-only slice does not model it yet.";
    default:
      return "The current bounded slice cannot yet determine complete support semantics for this record.";
  }
}

function formatRoleCoverage(roleCounts: Record<string, number>): string {
  const entries = Object.entries(roleCounts).filter(([, count]) => count > 0);
  if (entries.length === 0) {
    return "No role coverage is currently available.";
  }
  return entries
    .sort(([leftRole], [rightRole]) => leftRole.localeCompare(rightRole))
    .map(([role, count]) => `${formatLabel(role)}: ${count}`)
    .join(" • ");
}

function formatSignedDelta(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}

function getServingModeReadout(
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold",
): { label: string; detail: string } {
  if (servingMode === "live_collector") {
    return {
      label: "Live collector",
      detail:
        "Current policy state is being served from the live collector-backed normalized read path.",
    };
  }
  if (servingMode === "persisted_fallback") {
    return {
      label: "Persisted fallback",
      detail:
        "Current policy state is being served from the latest persisted normalized policy snapshot because the live collector path is unavailable.",
    };
  }
  return {
    label: "Empty scaffold",
    detail:
      "Neither a live collector snapshot nor a persisted fallback snapshot could be loaded beyond the empty scaffold.",
  };
}

function describeTimeGap(start: string | null, end: string | null): string {
  if (!start || !end) {
    return "Not available";
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Timestamp could not be interpreted";
  }

  const gapSeconds = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000));
  if (gapSeconds < 60) {
    return `${gapSeconds}s`;
  }

  const gapMinutes = Math.round(gapSeconds / 60);
  return `${gapMinutes}m`;
}

function getDetailModeReadout(
  detailMode: "counters_only" | "static_policies_when_present" | "mixed" | "unknown",
): { label: string; detail: string } {
  switch (detailMode) {
    case "counters_only":
      return {
        label: "Counters only",
        detail:
          "The bounded slice can show aggregate policy presence and footprint, but not stable per-policy detail records.",
      };
    case "static_policies_when_present":
      return {
        label: "Static detail when present",
        detail:
          "The bounded slice can expose per-policy records when supported static policy evidence is present.",
      };
    case "mixed":
      return {
        label: "Mixed detail",
        detail:
          "The current response includes both aggregate counters and bounded per-policy detail where the normalized path supports it.",
      };
    default:
      return {
        label: "Unknown detail mode",
        detail:
          "The backend did not provide enough detail-mode context to describe how policy evidence was derived.",
      };
  }
}

function getEmptyReasonReadout(
  emptyReason: "none" | "no_policies_observed" | "per_policy_details_unavailable" | "collector_unavailable",
): { label: string; detail: string } {
  switch (emptyReason) {
    case "no_policies_observed":
      return {
        label: "Live empty",
        detail:
          "The bounded live slice is healthy enough to observe targets, but it currently contains no SR policy records.",
      };
    case "per_policy_details_unavailable":
      return {
        label: "Detail limited",
        detail:
          "Policies are being counted, but the current bounded path could not derive stable per-policy detail records for the observed types.",
      };
    case "collector_unavailable":
      return {
        label: "Collector unavailable",
        detail:
          "The collector path is unavailable, so the page cannot claim current live policy truth from collector-backed evidence.",
      };
    default:
      return {
        label: "No empty-state qualifier",
        detail: "Current policy evidence includes bounded detail without an empty-state qualifier.",
      };
  }
}

export function describePolicyDetailBlockerReason(
  reason: PolicyDetailBlockerReason,
): PolicyDetailBlockerReadout {
  switch (reason) {
    case "none":
      return {
        pillValue: "ok",
        label: "Detail ready",
        detail:
          "This target currently exposes stable bounded per-policy detail records in the current read-only slice.",
      };
    case "policy_capability_unavailable":
      return {
        pillValue: "blocked",
        label: "Policy capability unavailable",
        detail:
          "This target does not currently expose bounded policy-capability evidence, so per-target detail cannot be derived here.",
      };
    case "no_policies_observed":
      return {
        pillValue: "blocked",
        label: "No policies observed",
        detail:
          "Stable counters are visible, but no SR policies are currently observed on this target.",
      };
    case "per_policy_details_unavailable":
      return {
        pillValue: "blocked",
        label: "Per-policy detail unavailable",
        detail:
          "Counters show policy presence on this target, but the bounded path cannot yet derive stable per-policy records.",
      };
    case "partial_detail_coverage":
      return {
        pillValue: "degraded",
        label: "Partial detail coverage",
        detail:
          "Only a subset of the observed policies on this target currently has bounded normalized detail records.",
      };
    case "collection_failed":
      return {
        pillValue: "blocked",
        label: "Collection failed",
        detail:
          "Live policy collection failed for this target, so current per-target policy detail is unavailable.",
      };
    case "collection_partial":
      return {
        pillValue: "degraded",
        label: "Collection partial",
        detail:
          "Policy collection was partial for this target, so degraded and unknown policy states remain explicit.",
      };
    default:
      return {
        pillValue: "unknown",
        label: "Not recorded",
        detail:
          "The backend did not supply a per-target detail blocker reason on this response.",
      };
  }
}

export function buildPolicyDetailBlockerSummary(
  blockerReasons: PolicyDetailBlockerReason[],
): PolicyDetailBlockerSummary {
  const explicitReasons = blockerReasons.filter((reason) => reason !== "not_recorded");
  const blockedReasons = explicitReasons.filter((reason) => reason !== "none");
  const blockedCounts = countBy(blockedReasons, (reason) => reason);
  const breakdown = Object.entries(blockedCounts)
    .sort(([leftReason], [rightReason]) => leftReason.localeCompare(rightReason))
    .map(
      ([reason, count]) =>
        `${describePolicyDetailBlockerReason(reason as PolicyDetailBlockerReason).label}: ${count}`,
    )
    .join(" • ");

  if (explicitReasons.length === 0) {
    return {
      label: "Not recorded",
      detail:
        "The backend did not expose explicit per-target detail blocker reasons on this response.",
      breakdown: "",
      blockedTargetCount: 0,
      detailReadyTargetCount: 0,
      notRecordedTargetCount: blockerReasons.length,
    };
  }

  const blockedTargetCount = blockedReasons.length;
  const detailReadyTargetCount = explicitReasons.filter((reason) => reason === "none").length;
  const notRecordedTargetCount = blockerReasons.length - explicitReasons.length;

  if (blockedTargetCount === 0) {
    return {
      label: "No explicit blockers",
      detail:
        "Every target with an exposed blocker reason is currently detail-ready in the bounded policy slice.",
      breakdown: "",
      blockedTargetCount,
      detailReadyTargetCount,
      notRecordedTargetCount,
    };
  }

  return {
    label: `${blockedTargetCount} blocked`,
    detail:
      `${blockedTargetCount} of ${explicitReasons.length} targets with explicit blocker posture remain blocked from stable per-policy detail records. ${detailReadyTargetCount} targets are currently detail-ready.`,
    breakdown,
    blockedTargetCount,
    detailReadyTargetCount,
    notRecordedTargetCount,
  };
}

function getCurrentPostureReadout(
  hasObservedPolicies: boolean,
  emptyReason: "none" | "no_policies_observed" | "per_policy_details_unavailable" | "collector_unavailable",
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold",
): { label: string; detail: string } {
  if (servingMode === "persisted_fallback") {
    return {
      label: "Persisted fallback",
      detail:
        "The page is currently usable through the latest persisted normalized snapshot rather than current live collector evidence.",
    };
  }
  if (servingMode === "empty_scaffold") {
    return {
      label: "Empty scaffold",
      detail:
        "Neither live collector evidence nor persisted fallback evidence is currently available for a meaningful policy readout.",
    };
  }
  if (hasObservedPolicies) {
    return {
      label: "Observed detail",
      detail: "The bounded current slice has per-policy records that can be inspected individually.",
    };
  }
  return getEmptyReasonReadout(emptyReason);
}

function getCurrentComparisonReadout(
  status: "unavailable" | "current_vs_latest_persisted_ready",
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold",
): { label: string; detail: string } {
  if (status === "current_vs_latest_persisted_ready") {
    return {
      label: "Comparison ready",
      detail:
        "Bounded normalized comparison is available between the current policy response and the latest persisted policy snapshot.",
    };
  }
  if (servingMode === "persisted_fallback") {
    return {
      label: "Fallback serving",
      detail:
        "Current-versus-persisted comparison is unavailable here because the current response already reflects the persisted fallback snapshot.",
    };
  }
  return {
    label: "Comparison unavailable",
    detail:
      "The backend does not currently have the extra persisted policy evidence needed for a bounded comparison.",
  };
}

export function PoliciesView() {
  const { data, error, isLoading, reload } = usePoliciesQuery();
  const {
    data: topologyData,
    error: topologyError,
    isLoading: isTopologyLoading,
  } = useTopologyQuery();
  const [healthFilter, setHealthFilter] = useState("all");
  const [supportFilter, setSupportFilter] = useState("all");
  const [observedFilter, setObservedFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceRoleFilter, setSourceRoleFilter] = useState("all");
  const [candidatePathFilter, setCandidatePathFilter] = useState("all");
  const [sortBy, setSortBy] = useState("health_then_name");
  const [searchValue, setSearchValue] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const items = data?.items ?? [];
  const healthCounts = countBy(items, (policy) => policy.health_state);
  const observedStateCounts = countBy(items, (policy) => policy.observed_state);
  const supportCounts = countBy(items, (policy) => policy.support_state);
  const policyTypeCounts = countBy(items, (policy) => policy.policy_type);
  const candidatePathPostureCounts = countBy(items, (policy) =>
    policy.candidate_paths.length > 0 ? "with_candidate_paths" : "without_candidate_paths",
  );
  const hasObservedPolicies = items.length > 0;
  const freshness = useMemo(
    () => buildFreshnessSummary(data?.observed_at ?? null, data?.generated_at ?? ""),
    [data?.generated_at, data?.observed_at],
  );
  const filteredPolicies = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((policy) => {
      const matchesHealth = healthFilter === "all" || policy.health_state === healthFilter;
      const matchesSupport = supportFilter === "all" || policy.support_state === supportFilter;
      const matchesObserved = observedFilter === "all" || policy.observed_state === observedFilter;
      const matchesType = typeFilter === "all" || policy.policy_type === typeFilter;
      const matchesSourceRole =
        sourceRoleFilter === "all" || (policy.source_target_role ?? "unknown") === sourceRoleFilter;
      const matchesCandidatePaths =
        candidatePathFilter === "all" ||
        (candidatePathFilter === "with_candidate_paths"
          ? policy.candidate_paths.length > 0
          : policy.candidate_paths.length === 0);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          policy.policy_name,
          policy.policy_id,
          policy.headend,
          policy.endpoint,
          policy.source_target,
          policy.source_target_role ?? "",
          policy.policy_type,
          ...policy.notes,
          ...policy.candidate_paths.flatMap((candidatePath) => [
            candidatePath.name,
            ...(candidatePath.notes ?? []),
          ]),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesHealth &&
        matchesSupport &&
        matchesObserved &&
        matchesType &&
        matchesSourceRole &&
        matchesCandidatePaths &&
        matchesSearch
      );
    });
  }, [
    items,
    candidatePathFilter,
    healthFilter,
    observedFilter,
    searchValue,
    sourceRoleFilter,
    supportFilter,
    typeFilter,
  ]);
  const sortedPolicies = useMemo(() => {
    const healthOrder = { healthy: 0, degraded: 1, down: 2, unknown: 3 };
    const supportOrder = {
      supported: 0,
      partially_supported: 1,
      unknown: 2,
      not_implemented_in_platform: 3,
      unsupported: 4,
    };
    const observedOrder = { active: 0, inactive: 1, degraded: 2, unknown: 3 };

    return [...filteredPolicies].sort((left, right) => {
      switch (sortBy) {
        case "name":
          return left.policy_name.localeCompare(right.policy_name);
        case "endpoint":
          return left.endpoint.localeCompare(right.endpoint);
        case "source_target":
          return left.source_target.localeCompare(right.source_target);
        case "candidate_paths_then_name":
          return (
            right.candidate_paths.length - left.candidate_paths.length ||
            left.policy_name.localeCompare(right.policy_name)
          );
        case "support_then_name":
          return (
            (supportOrder[left.support_state] ?? 99) - (supportOrder[right.support_state] ?? 99) ||
            left.policy_name.localeCompare(right.policy_name)
          );
        case "observed_then_name":
          return (
            (observedOrder[left.observed_state] ?? 99) - (observedOrder[right.observed_state] ?? 99) ||
            left.policy_name.localeCompare(right.policy_name)
          );
        default:
          return (
            (healthOrder[left.health_state] ?? 99) - (healthOrder[right.health_state] ?? 99) ||
            left.policy_name.localeCompare(right.policy_name)
          );
      }
    });
  }, [filteredPolicies, sortBy]);
  const selectedPolicy =
    sortedPolicies.find((policy) => policy.policy_id === selectedPolicyId) ?? sortedPolicies[0] ?? null;
  const selectedObservedStateDisplay = selectedPolicy
    ? buildRowPostureStatusDisplay(
        selectedPolicy.current_posture,
        selectedPolicy.observed_state,
        selectedPolicy.last_recorded_observed_state,
        "Last recorded observed",
      )
    : null;
  const selectedHealthStateDisplay = selectedPolicy
    ? buildRowPostureStatusDisplay(
        selectedPolicy.current_posture,
        selectedPolicy.health_state,
        selectedPolicy.last_recorded_health_state,
        "Last recorded health",
      )
    : null;
  const detailCoveragePercentage =
    data && data.observed_policy_count > 0
      ? Math.round((data.count / data.observed_policy_count) * 100)
      : 0;
  const evidenceGapCount = data ? Math.max(data.observed_policy_count - data.count, 0) : 0;
  const detailBlockerSummary = buildPolicyDetailBlockerSummary(
    data?.target_footprints.map((footprint) => footprint.detail_blocker_reason) ?? [],
  );

  if (isLoading) {
    return (
      <section>
        <h2>Policies</h2>
        <LoadingState label="Loading normalized policy inventory." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Policies</h2>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Policies</h2>
        <EmptyState
          title="No policy inventory"
          description="The backend returned no policy inventory response."
        />
      </section>
    );
  }

  const comparison = data.history.comparison_to_previous;
  const currentComparison = data.comparison_to_latest_persisted;
  const servingMode = getServingModeReadout(data.serving_mode);
  const detailMode = getDetailModeReadout(data.detail_mode);
  const emptyReason = getEmptyReasonReadout(data.empty_reason);
  const currentPosture = getCurrentPostureReadout(
    hasObservedPolicies,
    data.empty_reason,
    data.serving_mode,
  );
  const evidenceConfidence = normalizeEvidenceConfidence(
    data.evidence_confidence,
    buildPolicyEvidenceFallback(
      data.serving_mode,
      data.data_status,
      data.detail_mode,
      data.empty_reason,
    ),
  );
  const topologyEvidenceConfidence = topologyData
    ? normalizeEvidenceConfidence(
        topologyData.evidence_confidence,
        buildTopologyEvidenceFallback(topologyData.serving_mode, topologyData.data_status),
      )
    : null;
  const comparisonReadout = getCurrentComparisonReadout(
    currentComparison.status,
    data.serving_mode,
  );
  const topologyConsistencyReadout = buildCrossSliceConsistencyReadout(
    {
      sliceLabel: "Policy",
      servingMode: data.serving_mode,
      evidenceConfidence,
    },
    {
      sliceLabel: "Topology",
      isLoading: isTopologyLoading,
      hasError: topologyError !== null,
      snapshot: topologyData && topologyEvidenceConfidence
        ? {
            sliceLabel: "Topology",
            servingMode: topologyData.serving_mode,
            evidenceConfidence: topologyEvidenceConfidence,
          }
        : null,
    },
  );
  const supportObservedReadout = buildPolicySupportObservedReadout({
    servingMode: data.serving_mode,
    observedTargetCount: data.observed_target_count,
    policyCapableTargetCount: data.policy_capable_target_count,
    observedPolicyCount: data.observed_policy_count,
    detailRecordCount: data.count,
  });
  const policySyncDisplay = buildFallbackAwareStatusDisplay(
    data.sync_status,
    data.serving_mode,
    "Last recorded sync",
  );
  const policySyncLabel =
    data.serving_mode === "persisted_fallback" ? "Sync posture" : "Sync status";
  const observedPoliciesLabel =
    data.serving_mode === "persisted_fallback"
      ? "Last Recorded Observed Policies"
      : "Observed Policies";
  const observedStateFilterLabel =
    data.serving_mode === "persisted_fallback"
      ? "Last recorded observed state"
      : "Observed state";
  const healthFilterLabel =
    data.serving_mode === "persisted_fallback" ? "Last recorded health state" : "Health state";
  const observedActiveLabel =
    data.serving_mode === "persisted_fallback"
      ? "Last recorded observed active"
      : "Observed active";
  const observedInactiveLabel =
    data.serving_mode === "persisted_fallback"
      ? "Last recorded observed inactive"
      : "Observed inactive";
  const observedDegradedLabel =
    data.serving_mode === "persisted_fallback"
      ? "Last recorded observed degraded"
      : "Observed degraded";
  const healthDegradedLabel =
    data.serving_mode === "persisted_fallback"
      ? "Last recorded health degraded"
      : "Health degraded";

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Policies</h2>
          <p>
            Policy inventory is read from the live backend contract.
            Workflow execution stays out of scope for this phase.
          </p>
        </div>
        <StatusPill value={data.data_status} />
      </div>

      <div className="metadata-row">
        <span>Data status: {data.data_status}</span>
        <span>Serving mode: {formatLabel(data.serving_mode)}</span>
        <span>Sync source: {data.sync_source}</span>
        <span>{policySyncLabel}: {formatLabel(policySyncDisplay.pillValue)}</span>
        <span>Completeness: {data.completeness}</span>
        <span>Detail mode: {formatLabel(data.detail_mode)}</span>
        <span>Detail records: {data.count}</span>
        <span>Observed: {formatDateTime(data.observed_at)}</span>
        <span>Served persisted at: {formatDateTime(data.served_persisted_at)}</span>
        <span>Generated: {formatDateTime(data.generated_at)}</span>
      </div>

      <p className="callout">{data.summary}</p>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Observed Targets</p>
          <strong>{data.observed_target_count}</strong>
          <p>{formatRoleCoverage(data.observed_target_role_counts)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Policy-Capable Targets</p>
          <strong>{data.policy_capable_target_count}</strong>
          <p>{formatRoleCoverage(data.policy_capable_target_role_counts)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Support vs Observed</p>
          <strong>{supportObservedReadout.label}</strong>
          <p>{supportObservedReadout.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Detail Coverage</p>
          <strong>{detailCoveragePercentage}%</strong>
          <p>
            Detailed records: {data.count} of {data.observed_policy_count} observed policies.
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">{observedPoliciesLabel}</p>
          <strong>{data.observed_policy_count}</strong>
          <p>
            Active: {data.active_policy_count} • Static local: {data.static_local_policy_count} •
            Static non-local: {data.static_non_local_policy_count} • BGP: {data.bgp_policy_count}
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Counter Footprint</p>
          <strong>{data.ttm_preference_count}</strong>
          <p>
            TTM preferences • Binding SIDs: {data.binding_sid_count} • SRv6 binding SIDs:{" "}
            {data.srv6_binding_sid_count}
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Detail-Ready Targets</p>
          <strong>{detailBlockerSummary.detailReadyTargetCount}</strong>
          <p>
            Explicit blocker posture is exposed for {data.target_footprints.length} targets on this
            response.
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Detail Blockers</p>
          <strong>{detailBlockerSummary.label}</strong>
          <p>{detailBlockerSummary.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Current Posture</p>
          <strong>{currentPosture.label}</strong>
          <p>{currentPosture.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Evidence Confidence</p>
          <strong>{formatLabel(evidenceConfidence.confidence_posture)}</strong>
          <p>{describeConfidencePosture(evidenceConfidence.confidence_posture)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Freshness</p>
          <strong>{freshness.label}</strong>
          <p>{freshness.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Serving Mode</p>
          <strong>{servingMode.label}</strong>
          <p>{servingMode.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Current vs Latest Persisted</p>
          <strong>{comparisonReadout.label}</strong>
          <p>{comparisonReadout.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Topology Slice Posture</p>
          <strong>{topologyConsistencyReadout.label}</strong>
          <p>{topologyConsistencyReadout.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">History Status</p>
          <strong>{formatLabel(data.history.status)}</strong>
          <p>{data.history.summary}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Detail Mode</p>
          <strong>{detailMode.label}</strong>
          <p>{detailMode.detail}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Observed to Generated</p>
          <strong>{describeTimeGap(data.observed_at, data.generated_at)}</strong>
          <p>How far the current observed timestamp lags behind API generation.</p>
        </article>
      </div>

      {data.data_status === "degraded" ? (
        <div className="callout">
          <strong>Degraded live policy visibility remains explicit</strong>
          <p>
            The current policy response is available, but one or more targets returned partial or
            degraded observations. The page continues to surface that bounded state rather than
            hiding it behind optimistic summaries.
          </p>
        </div>
      ) : null}

      {data.serving_mode === "persisted_fallback" ? (
        <div className="callout">
          <strong>Persisted fallback remains explicit</strong>
          <p>
            The live collector policy path is currently unavailable, so this page is showing the
            latest persisted normalized policy snapshot from{" "}
            {formatDateTime(data.served_persisted_at)} instead of pretending the current live lab
            posture is known.
          </p>
        </div>
      ) : null}

      {evidenceConfidence.freshness_posture === "stale" &&
      data.serving_mode !== "persisted_fallback" ? (
        <div className="callout">
          <strong>Stale policy posture remains explicit</strong>
          <p>
            The policies page is currently relying on older persisted evidence rather than a
            current live collector read. The UI keeps that stale posture visible instead of
            overstating current policy certainty.
          </p>
        </div>
      ) : null}

      {data.serving_mode === "live_collector" &&
      !hasObservedPolicies &&
      data.empty_reason === "no_policies_observed" ? (
        <div className="callout">
          <strong>Live-empty policy posture remains explicit</strong>
          <p>
            The page is receiving live collector-backed policy evidence, but that bounded live
            slice currently shows no SR policy records. This does not imply the policy feature is
            unavailable, only that no policy records are presently observed.
          </p>
        </div>
      ) : null}

      {data.empty_reason === "per_policy_details_unavailable" ? (
        <div className="callout">
          <strong>Detail-limited policy posture remains explicit</strong>
          <p>
            Aggregate policy presence is available, but this bounded Phase 2 path cannot yet derive
            stable per-policy detail for every observed type. The page keeps that coverage gap
            visible instead of implying full per-policy truth.
          </p>
        </div>
      ) : null}

      {detailBlockerSummary.blockedTargetCount > 0 ? (
        <div className="callout">
          <strong>Per-target detail blockers remain explicit</strong>
          <p>{detailBlockerSummary.detail}</p>
          {detailBlockerSummary.breakdown ? (
            <p className="table-note">Current blocker mix: {detailBlockerSummary.breakdown}</p>
          ) : null}
          {detailBlockerSummary.notRecordedTargetCount > 0 ? (
            <p className="table-note">
              {detailBlockerSummary.notRecordedTargetCount} targets still lack an explicit blocker
              code on this response.
            </p>
          ) : null}
        </div>
      ) : null}

      {evidenceGapCount > 0 ? (
        <div className="callout">
          <strong>Evidence gap remains explicit</strong>
          <p>
            The platform currently observes {data.observed_policy_count} policies but only has{" "}
            {data.count} detailed records. This is expected when the current bounded path can count
            policy presence but not derive stable per-policy detail for every observed type.
          </p>
        </div>
      ) : null}

      {currentComparison.status === "current_vs_latest_persisted_ready" ? (
        <div className="callout">
          <strong>Bounded current-versus-persisted comparison is available</strong>
          <p>
            The current policy response can be compared with the latest persisted normalized policy
            snapshot from {formatDateTime(currentComparison.comparison_persisted_at)}. This remains
            bounded normalized policy evidence, not full drift analysis.
          </p>
          <p className="table-note">
            Persisted snapshot anchor:{" "}
            <IdentifierChip
              value={currentComparison.comparison_snapshot_id}
              emptyLabel="Not exposed in this posture"
            />
          </p>
        </div>
      ) : null}

      {supportObservedReadout.label !== "Observed detail aligns" ? (
        <div className="callout">
          <strong>Support-versus-observed posture remains explicit</strong>
          <p>{supportObservedReadout.detail}</p>
        </div>
      ) : null}

      {topologyConsistencyReadout.label !== "Aligned live posture" ? (
        <div className="callout">
          <strong>Topology slice posture is being shown alongside policies</strong>
          <p>
            {topologyConsistencyReadout.detail} This stays explanatory and does not imply a
            topology-policy mismatch verdict.
          </p>
        </div>
      ) : null}

      <div className="content-grid">
        <article className="detail-card">
          <h3>Trust Readout</h3>
          <p>{evidenceConfidence.summary}</p>
          <ul className="compact-list">
            <li>
              <span>Backend policy status</span>
              <StatusPill value={data.data_status} />
            </li>
            <li>
              <span>Policy sync status</span>
              <div>
                <StatusPill value={policySyncDisplay.pillValue} />
                {policySyncDisplay.note ? (
                  <div className="table-note">{policySyncDisplay.note}</div>
                ) : null}
              </div>
            </li>
            <li>
              <span>Explicit completeness</span>
              <StatusPill value={data.completeness} />
            </li>
            <li>
              <span>Detail mode</span>
              <strong>{detailMode.label}</strong>
            </li>
            <li>
              <span>Empty reason</span>
              <strong>{emptyReason.label}</strong>
            </li>
            <li>
              <span>Freshness posture</span>
              <strong>{freshness.label}</strong>
            </li>
            <li>
              <span>Evidence confidence</span>
              <StatusPill value={evidenceConfidence.confidence_posture} />
            </li>
            <li>
              <span>Serving mode</span>
              <strong>{servingMode.label}</strong>
            </li>
            <li>
              <span>Source posture</span>
              <StatusPill value={evidenceConfidence.source_posture} />
            </li>
            <li>
              <span>Observed to generated gap</span>
              <strong>{describeTimeGap(data.observed_at, data.generated_at)}</strong>
            </li>
            <li>
              <span>Current posture</span>
              <strong>{currentPosture.label}</strong>
            </li>
            <li>
              <span>Comparison posture</span>
              <strong>{comparisonReadout.label}</strong>
            </li>
            <li>
              <span>Blocked reason</span>
              <strong>{formatLabel(evidenceConfidence.blocked_reason)}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Evidence Basis</h3>
          <p>
            The current policy response is a backend-owned normalized read model. It may reflect
            live collector evidence, a persisted fallback snapshot, or an explicitly partial
            current slice where counts are available but full per-policy detail is not.
          </p>
          <ul className="compact-list">
            <li>
              <span>Primary evidence basis</span>
              <strong>{formatLabel(evidenceConfidence.source_posture)}</strong>
            </li>
            <li>
              <span>Evidence kind</span>
              <strong>{formatLabel(evidenceConfidence.evidence_kind)}</strong>
            </li>
            <li>
              <span>Confidence posture</span>
              <strong>{formatLabel(evidenceConfidence.confidence_posture)}</strong>
            </li>
            <li>
              <span>Current posture</span>
              <strong>{currentPosture.label}</strong>
            </li>
            <li>
              <span>Detail mode</span>
              <strong>{detailMode.label}</strong>
            </li>
            <li>
              <span>Empty-state qualifier</span>
              <strong>{emptyReason.label}</strong>
            </li>
            <li>
              <span>Current comparison posture</span>
              <strong>{comparisonReadout.label}</strong>
            </li>
          </ul>
          <p className="table-note">
            {describeEvidenceSource(evidenceConfidence.source_posture)}{" "}
            {describeEvidenceKind(evidenceConfidence.evidence_kind)}{" "}
            {describeBlockedReason(evidenceConfidence.blocked_reason)}
          </p>
        </article>
        <article className="detail-card">
          <h3>Current Evidence</h3>
          <ul className="compact-list">
            <li>
              <span>Observed targets</span>
              <strong>{data.observed_target_count}</strong>
            </li>
            <li>
              <span>Policy-capable targets</span>
              <strong>{data.policy_capable_target_count}</strong>
            </li>
            <li>
              <span>Observed / capable target coverage</span>
              <strong>
                {data.observed_target_count} / {data.policy_capable_target_count}
              </strong>
            </li>
            <li>
              <span>Observed target roles</span>
              <strong>{formatRoleCoverage(data.observed_target_role_counts)}</strong>
            </li>
            <li>
              <span>Policy-capable roles</span>
              <strong>{formatRoleCoverage(data.policy_capable_target_role_counts)}</strong>
            </li>
            <li>
              <span>Observed policies</span>
              <strong>{data.observed_policy_count}</strong>
            </li>
            <li>
              <span>Active policies</span>
              <strong>
                {data.active_policy_count}
              </strong>
            </li>
            <li>
              <span>Static local / non-local / BGP</span>
              <strong>
                {data.static_local_policy_count} / {data.static_non_local_policy_count} /{" "}
                {data.bgp_policy_count}
              </strong>
            </li>
            <li>
              <span>Support vs observed posture</span>
              <strong>{supportObservedReadout.label}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Current vs Latest Persisted</h3>
          <p>{currentComparison.summary}</p>
          <ul className="compact-list">
            <li>
              <span>Comparison status</span>
              <strong>{comparisonReadout.label}</strong>
            </li>
            <li>
              <span>Compared persisted snapshot</span>
              <strong>{formatDateTime(currentComparison.comparison_persisted_at)}</strong>
            </li>
            <li>
              <span>Persisted snapshot anchor</span>
              <IdentifierChip
                value={currentComparison.comparison_snapshot_id}
                emptyLabel="Not exposed in this posture"
              />
            </li>
            <li>
              <span>Observed to compared snapshot gap</span>
              <strong>
                {describeTimeGap(currentComparison.comparison_persisted_at, currentComparison.current_observed_at)}
              </strong>
            </li>
            <li>
              <span>Observed policy delta</span>
              <strong>{formatSignedDelta(currentComparison.observed_policy_delta)}</strong>
            </li>
            <li>
              <span>Detailed record delta</span>
              <strong>{formatSignedDelta(currentComparison.detail_record_delta)}</strong>
            </li>
            <li>
              <span>Current / persisted observed policies</span>
              <strong>
                {currentComparison.current_observed_policy_count} /{" "}
                {currentComparison.persisted_observed_policy_count}
              </strong>
            </li>
            <li>
              <span>Current / persisted detail records</span>
              <strong>
                {currentComparison.current_detail_record_count} /{" "}
                {currentComparison.persisted_detail_record_count}
              </strong>
            </li>
            <li>
              <span>Added / removed detailed policies</span>
              <strong>
                {currentComparison.added_policy_count} / {currentComparison.removed_policy_count}
              </strong>
            </li>
            <li>
              <span>Changed detailed policies</span>
              <strong>{currentComparison.changed_policy_count}</strong>
            </li>
          </ul>
          {currentComparison.notes.length > 0 ? (
            <ul className="notes-list">
              {currentComparison.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </article>
        <article className="detail-card">
          <h3>Topology Slice Consistency</h3>
          <p>{topologyConsistencyReadout.detail}</p>
          {topologyData && topologyEvidenceConfidence ? (
            <ul className="compact-list">
              <li>
                <span>Topology data status</span>
                <StatusPill value={topologyData.data_status} />
              </li>
              <li>
                <span>Topology serving mode</span>
                <strong>{formatLabel(topologyData.serving_mode)}</strong>
              </li>
              <li>
                <span>Topology confidence posture</span>
                <StatusPill value={topologyEvidenceConfidence.confidence_posture} />
              </li>
              <li>
                <span>Topology evidence kind</span>
                <strong>{formatLabel(topologyEvidenceConfidence.evidence_kind)}</strong>
              </li>
              <li>
                <span>Topology completeness</span>
                <strong>{formatLabel(topologyData.topology.completeness)}</strong>
              </li>
              <li>
                <span>Topology comparison status</span>
                <strong>{formatLabel(topologyData.comparison_to_latest_persisted.status)}</strong>
              </li>
            </ul>
          ) : (
            <p className="table-note">
              The policies page remains usable even when the companion topology slice is
              still loading or temporarily unavailable.
            </p>
          )}
          <p className="table-note">
            This compares slice posture only. It does not claim that topology and policy
            data disagree on path or policy truth.
          </p>
        </article>
        <article className="detail-card">
          <h3>State Distribution</h3>
          <ul className="compact-list">
            <li>
              <span>{observedActiveLabel}</span>
              <strong>{observedStateCounts.active ?? 0}</strong>
            </li>
            <li>
              <span>{observedInactiveLabel}</span>
              <strong>{observedStateCounts.inactive ?? 0}</strong>
            </li>
            <li>
              <span>{observedDegradedLabel}</span>
              <strong>{observedStateCounts.degraded ?? 0}</strong>
            </li>
            <li>
              <span>{healthDegradedLabel}</span>
              <strong>{healthCounts.degraded ?? 0}</strong>
            </li>
            <li>
              <span>Support unknown</span>
              <strong>{supportCounts.unknown ?? 0}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Observation Footprint</h3>
          <ul className="compact-list">
            <li>
              <span>TTM preferences</span>
              <strong>{data.ttm_preference_count}</strong>
            </li>
            <li>
              <span>Binding SIDs allocated</span>
              <strong>{data.binding_sid_count}</strong>
            </li>
            <li>
              <span>SRv6 binding SIDs allocated</span>
              <strong>{data.srv6_binding_sid_count}</strong>
            </li>
            <li>
              <span>With candidate paths</span>
              <strong>{candidatePathPostureCounts.with_candidate_paths ?? 0}</strong>
            </li>
            <li>
              <span>Without candidate paths</span>
              <strong>{candidatePathPostureCounts.without_candidate_paths ?? 0}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Type And Support Mix</h3>
          <ul className="compact-list">
            <li>
              <span>Detailed static local</span>
              <strong>{policyTypeCounts.static_local ?? 0}</strong>
            </li>
            <li>
              <span>Detailed static non-local</span>
              <strong>{policyTypeCounts.static_non_local ?? 0}</strong>
            </li>
            <li>
              <span>Observed static total</span>
              <strong>{data.static_policy_count}</strong>
            </li>
            <li>
              <span>Partially supported</span>
              <strong>{supportCounts.partially_supported ?? 0}</strong>
            </li>
            <li>
              <span>Unsupported</span>
              <strong>{supportCounts.unsupported ?? 0}</strong>
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Support Semantics</h3>
          <p>
            Support states describe how much of the observed policy record the current bounded
            platform path can interpret, not whether the network itself is healthy or complete.
          </p>
          <ul className="notes-list">
            <li>
              <strong>Supported:</strong> the current bounded slice can interpret the record
              shape without known support gaps.
            </li>
            <li>
              <strong>Partially supported:</strong> the page has useful evidence, but some
              policy semantics remain intentionally incomplete.
            </li>
            <li>
              <strong>Unknown or not implemented:</strong> the platform still makes those gaps
              explicit instead of pretending the record is fully understood.
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Persisted History And Comparison</h3>
          <p>{data.history.summary}</p>
          {comparison ? (
            <>
              <ul className="compact-list">
                <li>
                  <span>Current snapshot anchor</span>
                  <IdentifierChip value={comparison.current_snapshot_id} />
                </li>
                <li>
                  <span>Previous snapshot anchor</span>
                  <IdentifierChip value={comparison.previous_snapshot_id} />
                </li>
                <li>
                  <span>Current / previous persisted</span>
                  <strong>
                    {formatDateTime(comparison.current_persisted_at)} /{" "}
                    {formatDateTime(comparison.previous_persisted_at)}
                  </strong>
                </li>
                <li>
                  <span>Observed policy delta</span>
                  <strong>{formatSignedDelta(comparison.observed_policy_delta)}</strong>
                </li>
                <li>
                  <span>Detailed record delta</span>
                  <strong>{formatSignedDelta(comparison.detail_record_delta)}</strong>
                </li>
                <li>
                  <span>Added / removed detailed policies</span>
                  <strong>
                    {comparison.added_policy_count} / {comparison.removed_policy_count}
                  </strong>
                </li>
                <li>
                  <span>Changed detailed policies</span>
                  <strong>{comparison.changed_policy_count}</strong>
                </li>
              </ul>
              {comparison.notes.length > 0 ? (
                <ul className="notes-list">
                  {comparison.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="footnote">
              Bounded comparison is only available once at least two persisted normalized policy
              snapshots exist.
            </p>
          )}
        </article>
        <article className="detail-card">
          <h3>Recent Persisted Snapshots</h3>
          {data.history.recent_snapshots.length > 0 ? (
            <ul className="notes-list">
              {data.history.recent_snapshots.map((entry) => (
                <li key={entry.snapshot_id}>
                  <strong>{formatDateTime(entry.persisted_at)}</strong>
                  {" • anchor "}
                  <IdentifierChip value={entry.snapshot_id} />
                  {" • "}
                  {formatLabel(entry.data_status)}
                  {" • observed "}
                  {entry.observed_policy_count}
                  {" • detail "}
                  {entry.detail_record_count}
                  {" • "}
                  {formatLabel(entry.detail_mode)}
                  {entry.observed_at ? ` • observed at ${formatDateTime(entry.observed_at)}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="footnote">
              No persisted normalized policy snapshots are currently available for this bounded view.
            </p>
          )}
        </article>
      </div>

      <div className="callout">
        <strong>How to read this page</strong>
        <p>
          Live collector data remains the primary current truth source. Persisted fallback
          snapshots keep the page usable when live collection is unavailable. Comparison summaries
          and recent snapshots show bounded normalized evidence only and should not be read as full
          policy-history, drift analysis, or workflow state.
        </p>
        <p className="table-note">
          Where the backend now exposes explicit persisted anchors, this page surfaces those
          snapshot identifiers as trust cues rather than as workflow state. Per-target detail
          blocker rows explain why policy detail is blocked on each target without pretending that
          the platform already has full per-policy truth.
        </p>
      </div>

      {evidenceConfidence.notes.length > 0 ? (
        <div className="callout">
          <strong>Evidence-confidence limits</strong>
          <ul className="notes-list">
            {evidenceConfidence.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.notes.length > 0 ? (
        <div className="callout">
          <strong>Current limits</strong>
          <ul className="notes-list">
            {data.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="table-card">
        <h3>Per-Target Detail Blockers</h3>
        <p className="table-note">
          The backend-owned target footprint contract explains why each target is or is not
          detail-ready. This remains a blocker view for the bounded read-only slice, not a claim of
          full per-policy truth.
        </p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Target</th>
              <th>Collection</th>
              <th>Observed Footprint</th>
              <th>Detail Records</th>
              <th>Blocker Posture</th>
            </tr>
          </thead>
          <tbody>
            {data.target_footprints.length > 0 ? (
              data.target_footprints.map((footprint) => {
                const blockerReadout = describePolicyDetailBlockerReason(
                  footprint.detail_blocker_reason,
                );
                const collectionDisplay =
                  footprint.current_posture === "stale"
                    ? {
                        pillValue: "stale",
                        note: `Last recorded collection: ${formatLabel(footprint.last_recorded_collection_status)}`,
                      }
                    : {
                        pillValue:
                          footprint.collection_status === "success"
                            ? "ok"
                            : footprint.collection_status === "partial"
                              ? "degraded"
                              : "blocked",
                        note: `Current collection: ${formatLabel(footprint.collection_status)}`,
                      };

                return (
                  <tr key={footprint.target_name}>
                    <td>
                      <strong>{footprint.target_name}</strong>
                      <div className="table-note">{footprint.target_role ?? "unknown role"}</div>
                    </td>
                    <td>
                      <StatusPill value={collectionDisplay.pillValue} />
                      {collectionDisplay.note ? (
                        <div className="table-note">{collectionDisplay.note}</div>
                      ) : null}
                    </td>
                    <td>
                      <div>{footprint.observed_policy_count} observed</div>
                      <div className="table-note">
                        Active {footprint.active_policy_count} • Static {footprint.static_policy_count}
                        • BGP {footprint.bgp_policy_count}
                      </div>
                    </td>
                    <td>
                      <strong>{footprint.detail_record_count}</strong>
                      <div className="table-note">
                        TTM {footprint.ttm_preference_count} • Binding SIDs {footprint.binding_sid_count}
                      </div>
                    </td>
                    <td>
                      <StatusPill value={blockerReadout.pillValue} />
                      <div className="table-note">
                        <strong>{blockerReadout.label}</strong>
                      </div>
                      <div className="table-note">{blockerReadout.detail}</div>
                      {footprint.notes.length > 0 ? (
                        <ul className="notes-list">
                          {footprint.notes.map((note) => (
                            <li key={`${footprint.target_name}-${note}`}>{note}</li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5}>
                  <span className="meta-copy">
                    No per-target policy footprint evidence is currently exposed on this response.
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="toolbar">
        <label className="field-group">
          <span>Search policies</span>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="policy, endpoint, source target, type, or note"
          />
        </label>
        <label className="field-group">
          <span>{healthFilterLabel}</span>
          <select
            value={healthFilter}
            onChange={(event) => setHealthFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="down">Down</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="field-group">
          <span>Support state</span>
          <select
            value={supportFilter}
            onChange={(event) => setSupportFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="supported">Supported</option>
            <option value="partially_supported">Partially supported</option>
            <option value="unsupported">Unsupported</option>
            <option value="unknown">Unknown</option>
            <option value="not_implemented_in_platform">Not implemented</option>
          </select>
        </label>
        <label className="field-group">
          <span>{observedStateFilterLabel}</span>
          <select
            value={observedFilter}
            onChange={(event) => setObservedFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="degraded">Degraded</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="field-group">
          <span>Policy type</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="static_local">Static local</option>
            <option value="static_non_local">Static non-local</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="field-group">
          <span>Source role</span>
          <select
            value={sourceRoleFilter}
            onChange={(event) => setSourceRoleFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="pe">PE</option>
            <option value="p">P</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="field-group">
          <span>Candidate paths</span>
          <select
            value={candidatePathFilter}
            onChange={(event) => setCandidatePathFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="with_candidate_paths">With candidate paths</option>
            <option value="without_candidate_paths">Without candidate paths</option>
          </select>
        </label>
        <label className="field-group">
          <span>Sort</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="health_then_name">Health then name</option>
            <option value="support_then_name">Support then name</option>
            <option value="observed_then_name">Observed then name</option>
            <option value="name">Name</option>
            <option value="endpoint">Endpoint</option>
            <option value="source_target">Source target</option>
            <option value="candidate_paths_then_name">Candidate paths then name</option>
          </select>
        </label>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          title={
            data.empty_reason === "per_policy_details_unavailable"
              ? "Per-policy details are not currently available"
              : "No SR policies currently observed"
          }
          description={
            data.empty_reason === "per_policy_details_unavailable"
              ? `The live policy slice counted ${data.observed_policy_count} observed policies across ${data.observed_target_count} targets, but the current bounded detail path could not derive per-policy records for the observed policy types.`
              : `The live policy slice observed ${data.observed_target_count} targets and ${data.policy_capable_target_count} policy-capable nodes, but no SR policy records are currently present in the lab.`
          }
        />
      ) : filteredPolicies.length === 0 ? (
        <EmptyState
          title="No policies match the current filter"
          description="Adjust the filters or search text to widen the current policy inventory view."
        />
      ) : (
        <>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Type</th>
                  <th>Observed On</th>
                  <th>Headend</th>
                  <th>Endpoint</th>
                  <th>Intent</th>
                  <th>Observed</th>
                  <th>Support</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {sortedPolicies.map((policy) => {
                  const isSelected = selectedPolicy?.policy_id === policy.policy_id;
                  const observedStateDisplay = buildRowPostureStatusDisplay(
                    policy.current_posture,
                    policy.observed_state,
                    policy.last_recorded_observed_state,
                    "Last recorded observed",
                  );
                  const healthStateDisplay = buildRowPostureStatusDisplay(
                    policy.current_posture,
                    policy.health_state,
                    policy.last_recorded_health_state,
                    "Last recorded health",
                  );
                  return (
                    <tr key={policy.policy_id} className={isSelected ? "data-row-selected" : undefined}>
                      <td>
                        <button
                          type="button"
                          className="table-select"
                          onClick={() => setSelectedPolicyId(policy.policy_id)}
                        >
                          <strong>{policy.policy_name}</strong>
                        </button>
                        <div className="table-note">
                          {policy.policy_id} • color {policy.color} •{" "}
                          {policy.candidate_paths.length} candidate paths
                        </div>
                      </td>
                      <td>{formatLabel(policy.policy_type)}</td>
                      <td>
                        {policy.source_target}
                        <div className="table-note">
                          {policy.source_target_role ?? "unknown role"}
                        </div>
                      </td>
                      <td>{policy.headend}</td>
                      <td>{policy.endpoint}</td>
                      <td>
                        <StatusPill value={policy.intent_state} />
                      </td>
                      <td>
                        <StatusPill value={observedStateDisplay.pillValue} />
                        {observedStateDisplay.note ? (
                          <div className="table-note">{observedStateDisplay.note}</div>
                        ) : null}
                      </td>
                      <td>
                        <StatusPill value={policy.support_state} />
                      </td>
                      <td>
                        <StatusPill value={healthStateDisplay.pillValue} />
                        {healthStateDisplay.note ? (
                          <div className="table-note">{healthStateDisplay.note}</div>
                        ) : null}
                        {policy.notes.length > 0 ? (
                          <div className="table-note">{policy.notes.join(" ")}</div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedPolicy ? (
            <div className="content-grid">
              <article className="detail-card">
                <h3>Selected Policy Detail</h3>
                <div className="metadata-row">
                  <span>Policy: {selectedPolicy.policy_name}</span>
                  <span>Type: {formatLabel(selectedPolicy.policy_type)}</span>
                  <span>Source target: {selectedPolicy.source_target}</span>
                  <span>Current posture: {formatRowCurrentPosture(selectedPolicy.current_posture)}</span>
                </div>
                <div className="content-grid">
                  <article>
                    <p className="summary-label">Operational Semantics</p>
                    <div className="key-value-list">
                      <div className="key-value-row">
                        <span>Intent state</span>
                        <strong>
                          <StatusPill value={selectedPolicy.intent_state} />
                        </strong>
                      </div>
                      <div className="key-value-row">
                        <span>Observed state</span>
                        <div>
                          <StatusPill value={selectedObservedStateDisplay?.pillValue ?? "unknown"} />
                          {selectedObservedStateDisplay?.note ? (
                            <div className="table-note">{selectedObservedStateDisplay.note}</div>
                          ) : null}
                        </div>
                      </div>
                      <div className="key-value-row">
                        <span>Support state</span>
                        <strong>
                          <StatusPill value={selectedPolicy.support_state} />
                        </strong>
                      </div>
                      <div className="key-value-row">
                        <span>Health state</span>
                        <div>
                          <StatusPill value={selectedHealthStateDisplay?.pillValue ?? "unknown"} />
                          {selectedHealthStateDisplay?.note ? (
                            <div className="table-note">{selectedHealthStateDisplay.note}</div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <p className="footnote">{describeSupportState(selectedPolicy.support_state)}</p>
                  </article>
                  <article>
                    <p className="summary-label">Identity And Scope</p>
                    <div className="key-value-list">
                      <div className="key-value-row">
                        <span>Policy ID</span>
                        <strong>{selectedPolicy.policy_id}</strong>
                      </div>
                      <div className="key-value-row">
                        <span>Headend</span>
                        <strong>{selectedPolicy.headend}</strong>
                      </div>
                      <div className="key-value-row">
                        <span>Endpoint</span>
                        <strong>{selectedPolicy.endpoint}</strong>
                      </div>
                      <div className="key-value-row">
                        <span>Color</span>
                        <strong>{selectedPolicy.color}</strong>
                      </div>
                      <div className="key-value-row">
                        <span>Source target</span>
                        <strong>{selectedPolicy.source_target}</strong>
                      </div>
                      <div className="key-value-row">
                        <span>Source role</span>
                        <strong>{selectedPolicy.source_target_role ?? "unknown"}</strong>
                      </div>
                      <div className="key-value-row">
                        <span>Source</span>
                        <strong>{selectedPolicy.source}</strong>
                      </div>
                    </div>
                  </article>
                </div>
                <p className="summary-label">Snapshot Context</p>
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span>Serving mode</span>
                    <strong>{formatLabel(data.serving_mode)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Observed timestamp</span>
                    <strong>{formatDateTime(data.observed_at)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Generated timestamp</span>
                    <strong>{formatDateTime(data.generated_at)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Served persisted at</span>
                    <strong>{formatDateTime(data.served_persisted_at)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Observed to generated gap</span>
                    <strong>{describeTimeGap(data.observed_at, data.generated_at)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Freshness posture</span>
                    <strong>{freshness.label}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Detail mode</span>
                    <strong>{formatLabel(data.detail_mode)}</strong>
                  </div>
                  <div className="key-value-row">
                    <span>Current comparison status</span>
                    <strong>{formatLabel(currentComparison.status)}</strong>
                  </div>
                </div>
                <p className="summary-label">Candidate Path Evidence</p>
                {selectedPolicy.candidate_paths.length === 0 ? (
                  <p className="footnote">
                    No candidate-path detail is currently available for this bounded policy record.
                  </p>
                ) : (
                  <ul className="notes-list">
                    {selectedPolicy.candidate_paths.map((candidatePath) => {
                      const candidatePathDisplay = buildRowPostureStatusDisplay(
                        candidatePath.current_posture,
                        candidatePath.path_state,
                        candidatePath.last_recorded_path_state,
                        "Last recorded path",
                      );

                      return (
                        <li key={`${selectedPolicy.policy_id}-${candidatePath.name}`}>
                          <strong>{candidatePath.name}</strong>
                          {" - "}
                          {formatLabel(candidatePathDisplay.pillValue)}
                          {candidatePathDisplay.note ? ` • ${candidatePathDisplay.note}` : ""}
                          {candidatePath.preference === null ? "" : `, pref ${candidatePath.preference}`}
                          {candidatePath.notes.length > 0
                            ? `, ${candidatePath.notes.join(", ")}`
                            : ""}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {selectedPolicy.notes.length > 0 ? (
                  <>
                    <p className="summary-label">Record Notes</p>
                    <ul className="notes-list">
                      {selectedPolicy.notes.map((note) => (
                        <li key={`${selectedPolicy.policy_id}-${note}`}>{note}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </article>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

import type { EvidenceConfidenceSummary } from "../api/contracts";
import { formatLabel } from "./presentation";

export interface CrossSliceSnapshot {
  sliceLabel: string;
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold";
  evidenceConfidence: EvidenceConfidenceSummary;
}

interface CrossSliceCompanionState {
  sliceLabel: string;
  isLoading: boolean;
  hasError: boolean;
  snapshot: CrossSliceSnapshot | null;
}

export interface CrossSliceReadout {
  label: string;
  detail: string;
}

function formatServingModeLabel(
  value: "live_collector" | "persisted_fallback" | "empty_scaffold",
): string {
  switch (value) {
    case "live_collector":
      return "live collector";
    case "persisted_fallback":
      return "persisted fallback";
    default:
      return "empty scaffold";
  }
}

export function buildCrossSliceConsistencyReadout(
  primary: CrossSliceSnapshot,
  companion: CrossSliceCompanionState,
): CrossSliceReadout {
  if (companion.isLoading) {
    return {
      label: `${companion.sliceLabel} loading`,
      detail: `Cross-slice consistency cues will appear once the ${companion.sliceLabel.toLowerCase()} slice finishes loading.`,
    };
  }

  if (companion.hasError || companion.snapshot === null) {
    return {
      label: `${companion.sliceLabel} unavailable`,
      detail: `The current ${primary.sliceLabel.toLowerCase()} view remains usable, but its companion ${companion.sliceLabel.toLowerCase()} slice could not be loaded for a bounded posture comparison.`,
    };
  }

  const secondary = companion.snapshot;

  if (primary.servingMode !== secondary.servingMode) {
    return {
      label: "Mixed serving posture",
      detail: `${primary.sliceLabel} is currently ${formatServingModeLabel(primary.servingMode)}, while ${secondary.sliceLabel} is ${formatServingModeLabel(secondary.servingMode)}. This is a bounded posture difference, not a mismatch verdict.`,
    };
  }

  const evidenceDiffers =
    primary.evidenceConfidence.source_posture !== secondary.evidenceConfidence.source_posture ||
    primary.evidenceConfidence.evidence_kind !== secondary.evidenceConfidence.evidence_kind ||
    primary.evidenceConfidence.confidence_posture !==
      secondary.evidenceConfidence.confidence_posture ||
    primary.evidenceConfidence.blocked_reason !== secondary.evidenceConfidence.blocked_reason;

  if (evidenceDiffers) {
    return {
      label: "Different evidence posture",
      detail: `${primary.sliceLabel} currently shows ${formatLabel(primary.evidenceConfidence.confidence_posture)} ${formatLabel(primary.evidenceConfidence.evidence_kind)} evidence, while ${secondary.sliceLabel} shows ${formatLabel(secondary.evidenceConfidence.confidence_posture)} ${formatLabel(secondary.evidenceConfidence.evidence_kind)} evidence. The platform keeps that cross-slice difference explicit rather than treating it as a verdict.`,
    };
  }

  if (primary.servingMode === "live_collector") {
    return {
      label: "Aligned live posture",
      detail: `${primary.sliceLabel} and ${secondary.sliceLabel} are both being served from live collector-backed evidence with similar trust posture for their current bounded slices.`,
    };
  }

  if (primary.servingMode === "persisted_fallback") {
    return {
      label: "Shared fallback posture",
      detail: `${primary.sliceLabel} and ${secondary.sliceLabel} are both relying on persisted fallback evidence. That keeps the cross-slice posture consistent, but still stale relative to a live read.`,
    };
  }

  return {
    label: "Shared blocked posture",
    detail: `${primary.sliceLabel} and ${secondary.sliceLabel} are both limited to empty-scaffold posture because neither live nor persisted evidence is currently available for a stronger cross-slice readout.`,
  };
}

export function buildPolicySupportObservedReadout(params: {
  servingMode: "live_collector" | "persisted_fallback" | "empty_scaffold";
  observedTargetCount: number;
  policyCapableTargetCount: number;
  observedPolicyCount: number;
  detailRecordCount: number;
}): CrossSliceReadout {
  const {
    servingMode,
    observedTargetCount,
    policyCapableTargetCount,
    observedPolicyCount,
    detailRecordCount,
  } = params;

  if (servingMode === "persisted_fallback") {
    return {
      label: "Fallback posture",
      detail:
        "Current support-versus-observed interpretation is bounded by persisted fallback serving rather than a fully current live collector read.",
    };
  }

  if (servingMode === "empty_scaffold") {
    return {
      label: "Current posture unavailable",
      detail:
        "Neither live collector evidence nor a persisted fallback snapshot is available for a stronger support-versus-observed readout.",
    };
  }

  if (observedTargetCount < policyCapableTargetCount) {
    return {
      label: "Partial target observation",
      detail: `${observedTargetCount} of ${policyCapableTargetCount} policy-capable targets are currently represented in the observed slice. That is a coverage cue, not a support verdict.`,
    };
  }

  if (observedPolicyCount === 0) {
    return {
      label: "Capability without observed policies",
      detail: `The current slice still sees ${policyCapableTargetCount} policy-capable targets, but no policy records are presently observed. This is consistent with a live-empty policy posture.`,
    };
  }

  if (detailRecordCount < observedPolicyCount) {
    return {
      label: "Observed detail remains bounded",
      detail: `${observedPolicyCount} policies are observed, but only ${detailRecordCount} have bounded detailed records. The platform keeps that support-versus-observed gap explicit instead of implying full policy truth.`,
    };
  }

  return {
    label: "Observed detail aligns",
    detail:
      "The current observed policy count and bounded detailed record count are aligned for the slice that the platform can honestly normalize today.",
  };
}

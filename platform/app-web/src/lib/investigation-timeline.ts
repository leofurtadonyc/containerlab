import type { InvestigationContextAssemblyResponse } from "../api/contracts";
import { CHANGE_INTELLIGENCE_DOMAIN_LABELS } from "./change-intelligence-domain-labels";

/** One sortable timestamp surfaced for operator orientation—not an event log entry. */
export interface InvestigationTimelineBeat {
  id: string;
  label: string;
  /** Coarse origin of the timestamp for transparency. */
  sourceKind: "assembly" | "nested_response" | "domain_slice" | "read_path" | "readiness_anchor";
  timestampIso: string;
  detailNote: string | null;
}

function compareIsoDesc(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
}

/**
 * Collects **bounded recency anchors** already present in nested API payloads.
 * Does **not** merge histories into a forensic timeline or workflow chronology.
 */
export function buildInvestigationTimelineBeats(
  data: InvestigationContextAssemblyResponse,
): InvestigationTimelineBeat[] {
  const beats: InvestigationTimelineBeat[] = [];

  beats.push({
    id: "assembly",
    label: "Investigation assembly response",
    sourceKind: "assembly",
    timestampIso: data.metadata.generated_at,
    detailNote: "Timestamp for this combined investigation-workspace response.",
  });

  beats.push({
    id: "nested-recent-change",
    label: "Nested recent change summary",
    sourceKind: "nested_response",
    timestampIso: data.recent_change.metadata.generated_at,
    detailNote: "Embedded change-intelligence summary payload.",
  });

  beats.push({
    id: "nested-platform",
    label: "Nested platform status",
    sourceKind: "nested_response",
    timestampIso: data.platform_status.generated_at,
    detailNote: "Embedded platform status payload.",
  });

  beats.push({
    id: "nested-capabilities",
    label: "Nested capabilities matrix",
    sourceKind: "nested_response",
    timestampIso: data.capabilities.generated_at,
    detailNote: "Embedded capabilities payload.",
  });

  for (const slice of data.recent_change.domains) {
    if (slice.latest_persisted_at) {
      beats.push({
        id: `domain-slice-${slice.domain}`,
        label: `${CHANGE_INTELLIGENCE_DOMAIN_LABELS[slice.domain]} · latest persisted snapshot (summary)`,
        sourceKind: "domain_slice",
        timestampIso: slice.latest_persisted_at,
        detailNote:
          "From the change-intelligence domain slice when a latest persisted time is exposed there—may be absent per domain.",
      });
    }
  }

  if (data.capabilities.readiness_persisted_at) {
    beats.push({
      id: "readiness-persisted",
      label: "Readiness snapshot persisted (capabilities anchor)",
      sourceKind: "readiness_anchor",
      timestampIso: data.capabilities.readiness_persisted_at,
      detailNote: "Capabilities response anchor for persisted readiness-support material when present.",
    });
  }

  for (const rp of data.platform_status.read_paths ?? []) {
    if (rp.newest_observed_at) {
      beats.push({
        id: `readpath-newest-${rp.model_family}`,
        label: `${rp.model_family} read path · newest observed`,
        sourceKind: "read_path",
        timestampIso: rp.newest_observed_at,
        detailNote: "Upper bound of the collector observation window for this model family.",
      });
    }
  }

  const withTime = beats.filter((b) => Boolean(b.timestampIso));
  return [...withTime].sort((a, b) => compareIsoDesc(a.timestampIso, b.timestampIso));
}

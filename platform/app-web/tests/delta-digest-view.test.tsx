import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../src/api/client";
import type { CrossDomainDeltaDigestResponse, RecentChangeSummaryResponse } from "../src/api/contracts";
import { DeltaDigestView } from "../src/features/delta-digest/view";

const { useDeltaDigestQuery } = vi.hoisted(() => ({
  useDeltaDigestQuery: vi.fn(),
}));

vi.mock("../src/features/delta-digest/api", () => ({
  useDeltaDigestQuery,
}));

function createEmbeddedRecentChangeSummary(): RecentChangeSummaryResponse {
  const absent = {
    signal_families: [] as string[],
    evidence_status: "absent" as const,
    headline: "Absent headline.",
    detail_notes: [] as string[],
  };
  return {
    metadata: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    safety: {
      contract_id: "change_intelligence_phase2_v1",
      authority_posture: "evidence_aggregated_non_authoritative",
      explicit_non_claims: ["not_validation_verdict"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Recent change summary disclaimer.",
    },
    window_semantics: "backend_defined_bounded_lookback",
    completeness_posture: "bounded_partial",
    sync_runs_limit_applied: 20,
    readiness_snapshots_considered: 0,
    domains: [
      { domain: "devices", ...absent },
      { domain: "topology", ...absent },
      { domain: "policies", ...absent },
      { domain: "readiness", ...absent },
      { domain: "workflow_history", ...absent },
      { domain: "audit_history", ...absent },
    ],
    aggregation_notes: [],
  };
}

function createDeltaDigestFixture(): CrossDomainDeltaDigestResponse {
  return {
    metadata: {
      service: "app-api",
      version: "test",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "cross_domain_delta_digest_v1",
    safety: {
      contract_id: "cross_domain_delta_digest_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: ["not_forensic_timeline"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Digest disclaimer text.",
    },
    sync_runs_limit_applied: 20,
    completeness_posture: "best_effort_visible_signals_only",
    recent_change_summary: createEmbeddedRecentChangeSummary(),
    source_provenance: [
      {
        source: "change_intelligence",
        note: "Embedded recent summary.",
        generated_at: "2025-01-01T00:00:00Z",
        data_status_or_serving_hint: "sync_runs_limit_applied=20",
      },
    ],
    digest_framing_notes: ["Additional framing line."],
    sections: [
      {
        section_key: "recent_sync_anchor",
        headline: "Recent sync anchor",
        evidence_status: "present",
        detail_notes: ["Note a."],
        caveats: [],
      },
      {
        section_key: "device_inventory_delta",
        headline: "Device inventory",
        evidence_status: "partial",
        detail_notes: ["Note b."],
        caveats: ["Caveat b."],
      },
      {
        section_key: "topology_coverage_posture",
        headline: "Topology coverage",
        evidence_status: "present",
        detail_notes: [],
        caveats: [],
      },
      {
        section_key: "policy_delta_degraded",
        headline: "Policy",
        evidence_status: "present",
        detail_notes: [],
        caveats: [],
      },
      {
        section_key: "change_intelligence_pointer",
        headline: "Change intelligence pointer",
        evidence_status: "present",
        detail_notes: [],
        caveats: [],
      },
      {
        section_key: "recommended_pivots",
        headline: "Pivots",
        evidence_status: "present",
        detail_notes: [
          "Example policy_id for drill-down: PE1:static:1:100.",
          "Example topology node_id for drill-down: NODE-1.",
        ],
        caveats: [],
      },
      {
        section_key: "caveats_missing_evidence",
        headline: "Caveats",
        evidence_status: "partial",
        detail_notes: ["Merged note."],
        caveats: ["Caveat list not exhaustive."],
      },
    ],
  };
}

describe("DeltaDigestView", () => {
  beforeEach(() => {
    useDeltaDigestQuery.mockReset();
  });

  it("renders loading state when the first fetch is in flight", () => {
    useDeltaDigestQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(),
    });
    const html = renderToStaticMarkup(<DeltaDigestView />);
    expect(html).toContain("delta-digest-route--loading");
    expect(html).toContain("Loading cross-domain delta digest");
  });

  it("renders error state when the API fails", () => {
    useDeltaDigestQuery.mockReturnValue({
      data: null,
      error: new ApiClientError("failed", 500),
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });
    const html = renderToStaticMarkup(<DeltaDigestView />);
    expect(html).toContain("delta-digest-route--error");
    expect(html).toContain("failed");
  });

  it("renders digest sections and pivot labels when data is available", () => {
    useDeltaDigestQuery.mockReturnValue({
      data: createDeltaDigestFixture(),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });
    const html = renderToStaticMarkup(<DeltaDigestView />);
    expect(html).toContain("delta-digest-route");
    expect(html).toContain("Recent sync anchor");
    expect(html).toContain("recommended_pivots");
    expect(html).toContain("Investigation workspace");
    expect(html).toContain("Example policy dossier");
    expect(html).toContain("Example topology dossier");
    expect(html).toContain("NOC cockpit (Overview)");
  });
});

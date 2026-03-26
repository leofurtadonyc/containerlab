import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { ServiceEvidenceTimelineResponse } from "../src/api/contracts";
import { ServiceEvidenceTimelinePanel } from "../src/features/service-explorer/service-evidence-timeline-panel";

const { useServiceEvidenceTimelineQuery } = vi.hoisted(() => ({
  useServiceEvidenceTimelineQuery: vi.fn(),
}));

vi.mock("../src/features/service-explorer/api", () => ({
  useServiceEvidenceTimelineQuery,
}));

function baseFixture(overrides: Partial<ServiceEvidenceTimelineResponse> = {}): ServiceEvidenceTimelineResponse {
  return {
    metadata: {
      service: "app-api",
      version: "0.1.0",
      phase: "phase_2_read_only_foundation",
      generated_at: "2025-01-01T00:00:00Z",
    },
    contract_id: "service_evidence_timeline_v1",
    safety_framing: {
      contract_id: "service_evidence_timeline_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: ["not_unified_incident_chronology"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Disclaimer",
    },
    service_id: "policy:p1",
    scope_summary: "Bounded window",
    entries: [],
    missing_evidence_notes: [],
    ...overrides,
  };
}

describe("ServiceEvidenceTimelinePanel", () => {
  it("renders loading state", () => {
    useServiceEvidenceTimelineQuery.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      isRefreshing: false,
      reload: vi.fn(),
    });
    const html = renderToStaticMarkup(<ServiceEvidenceTimelinePanel serviceId="policy:p1" />);
    expect(html).toContain("Loading bounded service evidence timeline");
  });

  it("renders entries with policy pivot", () => {
    useServiceEvidenceTimelineQuery.mockReturnValue({
      data: baseFixture({
        entries: [
          {
            entry_kind: "member_policy_timeline_entry",
            sort_key: "2025-01-01T00:00:00Z",
            tie_break: 0,
            summary: "[p1] summary",
            provenance: "policy_evidence_timeline_v1",
            reference: "GET …",
            policy_id: "p1",
            source_policy_entry_kind: "policy_inventory_snapshot_anchor",
          },
        ],
      }),
      error: null,
      isLoading: false,
      isRefreshing: false,
      reload: vi.fn(),
    });
    const html = renderToStaticMarkup(<ServiceEvidenceTimelinePanel serviceId="policy:p1" />);
    expect(html).toContain("Member policy timeline");
    expect(html).toContain("Policy timeline");
  });
});

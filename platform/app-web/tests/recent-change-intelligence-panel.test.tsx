import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { RecentChangeSummaryResponse } from "../src/api/contracts";
import { RecentChangeIntelligencePanel } from "../src/features/overview/recent-change";

function createRecentChangeSummaryFixture(): RecentChangeSummaryResponse {
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
      summary_disclaimer:
        "Recent change intelligence summarizes existing read-side evidence for operator visibility. It is not a validation verdict, drift detection result, safe-to-change recommendation, or workflow authorization.",
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

describe("RecentChangeIntelligencePanel", () => {
  it("renders read-only drilldown actions for product and history domains", () => {
    const html = renderToStaticMarkup(
      <RecentChangeIntelligencePanel
        data={createRecentChangeSummaryFixture()}
        error={null}
        isLoading={false}
        onRetry={() => undefined}
      />,
    );

    expect(html).toContain("Open Devices");
    expect(html).toContain("Open Topology");
    expect(html).toContain("Open Policies");
    expect(html).toContain("Open Workflow history");
    expect(html).toContain("Open Audit history");
    expect(html).toContain("not a validation verdict");
    expect(html).toContain("honest absence on those pages stays explicit");
  });

  it("renders error summary card when the API fails", () => {
    const html = renderToStaticMarkup(
      <RecentChangeIntelligencePanel
        data={null}
        error={{ message: "upstream unavailable" }}
        isLoading={false}
        onRetry={() => undefined}
      />,
    );

    expect(html).toContain("Unavailable");
    expect(html).toContain("upstream unavailable");
    expect(html).toContain("Retry recent change summary");
  });

  it("renders loading placeholder when the first fetch is in flight", () => {
    const html = renderToStaticMarkup(
      <RecentChangeIntelligencePanel
        data={null}
        error={null}
        isLoading={true}
        onRetry={() => undefined}
      />,
    );

    expect(html).toContain("Loading cross-domain persisted evidence summary");
  });
});

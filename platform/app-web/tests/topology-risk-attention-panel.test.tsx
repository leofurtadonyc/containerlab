import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TopologyRiskSummaryResponse } from "../src/api/contracts";
import { TopologyRiskAttentionPanel } from "../src/features/topology/topology-risk-attention-panel";

function baseRiskSummary(overrides: Partial<TopologyRiskSummaryResponse> = {}): TopologyRiskSummaryResponse {
  return {
    metadata: {
      service: "app-api",
      version: "0.1.0",
      phase: "phase_2_read_only_foundation",
      generated_at: "2026-03-09T19:25:08.500000+00:00",
    },
    contract_id: "topology_risk_summary_v1",
    ranking_basis: "test basis",
    safety_framing: {
      contract_id: "topology_risk_summary_v1",
      authority_posture: "interpretation_support_only",
      explicit_non_claims: ["not_failure_probability"],
      phase: "phase_2_read_only_foundation",
      summary_disclaimer: "Disclaimer text.",
    },
    assembly_confidence: "medium",
    ranked_objects: [
      {
        rank_index: 1,
        object_kind: "link",
        object_id: "P1--PE1",
        ranking_inputs: {
          degraded_related_count: 1,
          unknown_related_count: 0,
          related_policy_breadth: 2,
          ok_related_count: 1,
        },
        degraded_posture_breakdown: { ok: 1, degraded: 1, unknown: 0 },
      },
    ],
    total_objects: 1,
    freshness: {
      assembly_generated_at: "2026-03-09T19:25:08.500000+00:00",
      policy_inventory_observed_at: null,
      topology_snapshot_observed_at: null,
      policy_inventory_empty_reason: null,
      policy_serving_mode_echo: "live",
    },
    caveats: ["Caveat one"],
    missing_evidence_notes: [],
    ...overrides,
  };
}

describe("TopologyRiskAttentionPanel", () => {
  let lastRoot: Root | null = null;

  afterEach(() => {
    act(() => {
      lastRoot?.unmount();
      lastRoot = null;
    });
    document.body.replaceChildren();
  });

  it("renders loading state", () => {
    const html = renderToStaticMarkup(
      <TopologyRiskAttentionPanel
        variant="overview"
        data={null}
        error={null}
        isLoading
        isRefreshing={false}
        onRetry={() => {}}
      />,
    );
    expect(html).toContain("Loading ranked topology attention");
  });

  it("overview variant dossier button documents overview_risk source", () => {
    const html = renderToStaticMarkup(
      <TopologyRiskAttentionPanel
        variant="overview"
        data={baseRiskSummary()}
        error={null}
        isLoading={false}
        isRefreshing={false}
        onRetry={() => {}}
      />,
    );
    expect(html).toContain("Open dossier");
    expect(html).toContain("dossier_source=overview_risk");
  });

  it("renders error summary card", () => {
    const html = renderToStaticMarkup(
      <TopologyRiskAttentionPanel
        variant="overview"
        data={null}
        error={{ message: "network down" }}
        isLoading={false}
        isRefreshing={false}
        onRetry={() => {}}
      />,
    );
    expect(html).toContain("network down");
  });

  it("renders ranked rows and Open in Topology when drillToObject is absent", () => {
    const html = renderToStaticMarkup(
      <TopologyRiskAttentionPanel
        variant="topology"
        data={baseRiskSummary()}
        error={null}
        isLoading={false}
        isRefreshing={false}
        onRetry={() => {}}
      />,
    );
    expect(html).toContain("P1--PE1");
    expect(html).toContain("Open in Topology");
    expect(html).toContain("Open dossier");
    expect(html).toContain("dossier_source=risk_summary");
    expect(html).toContain("Open investigation");
  });

  it("invokes drillToObject when Select object is activated", () => {
    const drill = vi.fn();
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    lastRoot = root;

    act(() => {
      root.render(
        <TopologyRiskAttentionPanel
          variant="topology"
          data={baseRiskSummary({
            ranked_objects: [
              {
                rank_index: 1,
                object_kind: "node",
                object_id: "PE1",
                ranking_inputs: {
                  degraded_related_count: 0,
                  unknown_related_count: 0,
                  related_policy_breadth: 1,
                  ok_related_count: 1,
                },
                degraded_posture_breakdown: { ok: 1, degraded: 0, unknown: 0 },
              },
            ],
            caveats: [],
          })}
          error={null}
          isLoading={false}
          isRefreshing={false}
          onRetry={() => {}}
          drillToObject={drill}
        />,
      );
    });

    const btn = el.querySelector("button");
    expect(btn?.textContent).toContain("Select object");
    act(() => {
      btn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(drill).toHaveBeenCalledWith("PE1", "node");
  });
});

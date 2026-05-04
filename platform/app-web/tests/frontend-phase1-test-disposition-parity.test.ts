import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

type TestDisposition =
  | "keep-verbatim"
  | "port-to-new-route-harness"
  | "replace-with-stronger-parity-test"
  | "retire-with-reason";

const LEGACY_TEST_DISPOSITIONS: Record<string, TestDisposition> = {
  "api-client-week28-paths.test.ts": "replace-with-stronger-parity-test",
  "audit-view.test.tsx": "keep-verbatim",
  "capabilities-view.test.tsx": "keep-verbatim",
  "change-intelligence-cues.test.ts": "keep-verbatim",
  "change-intelligence-navigation.test.ts": "port-to-new-route-harness",
  "change-safety-case-download.test.ts": "replace-with-stronger-parity-test",
  "change-safety-case-navigation.test.ts": "port-to-new-route-harness",
  "change-safety-case-view.test.tsx": "keep-verbatim",
  "degraded-policy-v1-hint.test.ts": "port-to-new-route-harness",
  "delta-digest-navigation.test.ts": "port-to-new-route-harness",
  "delta-digest-pivots.test.ts": "keep-verbatim",
  "delta-digest-view.test.tsx": "keep-verbatim",
  "devices-view.test.tsx": "keep-verbatim",
  "entry-surface-readiness-trust.test.ts": "keep-verbatim",
  "evidence-consistency-navigation.test.ts": "port-to-new-route-harness",
  "evidence-consistency-view.test.tsx": "keep-verbatim",
  "evidence-export-actions.test.tsx": "keep-verbatim",
  "evidence-export-download.test.ts": "replace-with-stronger-parity-test",
  "evidence-quality-domain-sections.test.tsx": "keep-verbatim",
  "evidence-quality-surface-entry.test.tsx": "keep-verbatim",
  "evidence-quality-workspace-navigation.test.ts": "port-to-new-route-harness",
  "evidence-quality-workspace-view.test.tsx": "keep-verbatim",
  "evidence-replay-parse.test.ts": "replace-with-stronger-parity-test",
  "evidence-replay-pivots.test.ts": "keep-verbatim",
  "evidence-replay-replay-to-live.test.tsx": "keep-verbatim",
  "evidence-replay-view.test.tsx": "keep-verbatim",
  "fallback-status-display.test.ts": "keep-verbatim",
  "global-operator-search-week31.test.ts": "keep-verbatim",
  "global-search-deeplink.test.ts": "port-to-new-route-harness",
  "history-evidence-drilldown.test.ts": "port-to-new-route-harness",
  "impact-report-download.test.ts": "replace-with-stronger-parity-test",
  "impact-report-navigation.test.ts": "port-to-new-route-harness",
  "inventory-history-trust.test.ts": "keep-verbatim",
  "investigation-context-domain-nav.test.ts": "port-to-new-route-harness",
  "investigation-timeline.test.ts": "keep-verbatim",
  "investigation-url-context.test.ts": "port-to-new-route-harness",
  "investigation-view.test.tsx": "keep-verbatim",
  "maintenance-evidence-workspace-navigation.test.ts": "port-to-new-route-harness",
  "maintenance-evidence-workspace-product.test.tsx": "keep-verbatim",
  "maintenance-preview-navigation.test.ts": "port-to-new-route-harness",
  "maintenance-window-workspace-navigation.test.ts": "port-to-new-route-harness",
  "maintenance-window-workspace-product.test.tsx": "keep-verbatim",
  "maintenance-window-workspace-view.test.tsx": "keep-verbatim",
  "noc-cockpit-maintenance-evidence-week36.test.ts": "keep-verbatim",
  "noc-cockpit-priority.test.ts": "keep-verbatim",
  "operator-briefing-navigation.test.ts": "port-to-new-route-harness",
  "operator-briefing-view.test.tsx": "keep-verbatim",
  "operator-contract-labeling-anchors.test.ts": "replace-with-stronger-parity-test",
  "operator-search-navigation.test.ts": "port-to-new-route-harness",
  "overview-mode.test.ts": "port-to-new-route-harness",
  "overview-model.test.ts": "keep-verbatim",
  "overview-view.test.tsx": "keep-verbatim",
  "path-explorer-navigation.test.ts": "port-to-new-route-harness",
  "path-explorer-product.test.tsx": "keep-verbatim",
  "platform-health-view.test.tsx": "keep-verbatim",
  "policies-view.test.tsx": "keep-verbatim",
  "policy-dossier-navigation.test.ts": "port-to-new-route-harness",
  "policy-dossier-workspace.test.tsx": "keep-verbatim",
  "policy-evidence-delta-panel.test.tsx": "keep-verbatim",
  "policy-evidence-timeline-panel.test.tsx": "keep-verbatim",
  "policy-explainability-workspace.test.tsx": "keep-verbatim",
  "policy-history-trust.test.ts": "keep-verbatim",
  "policy-path-analysis-panel.test.tsx": "keep-verbatim",
  "policy-topology-impact-panel.test.tsx": "keep-verbatim",
  "read-side-query-params.test.ts": "keep-verbatim",
  "read-side-query-product-copy.test.ts": "keep-verbatim",
  "readiness-decision-support-contract.test.ts": "keep-verbatim",
  "readiness-navigation.test.ts": "port-to-new-route-harness",
  "readiness-view.test.tsx": "keep-verbatim",
  "recent-change-intelligence-panel.test.tsx": "keep-verbatim",
  "replay-report-export-route-honesty.test.ts": "replace-with-stronger-parity-test",
  "rollback-workspace-view.test.tsx": "keep-verbatim",
  "safe-action-workspace-view.test.tsx": "keep-verbatim",
  "service-dossier-navigation.test.ts": "port-to-new-route-harness",
  "service-dossier-product.test.tsx": "keep-verbatim",
  "service-dossier-view.test.tsx": "keep-verbatim",
  "service-evidence-delta-panel.test.tsx": "keep-verbatim",
  "service-evidence-timeline-panel.test.tsx": "keep-verbatim",
  "service-explorer-navigation.test.ts": "port-to-new-route-harness",
  "service-impact-workspace-navigation.test.ts": "port-to-new-route-harness",
  "service-impact-workspace-product.test.tsx": "keep-verbatim",
  "situation-room-navigation.test.ts": "port-to-new-route-harness",
  "situation-room-view.test.tsx": "keep-verbatim",
  "stability-workspace-navigation.test.ts": "port-to-new-route-harness",
  "stability-workspace-view.test.tsx": "keep-verbatim",
  "topology-dossier-navigation.test.ts": "port-to-new-route-harness",
  "topology-failure-impact-panel.test.tsx": "keep-verbatim",
  "topology-object-dossier-workspace.test.tsx": "keep-verbatim",
  "topology-related-policies-panel.test.tsx": "keep-verbatim",
  "topology-risk-attention-panel.test.tsx": "keep-verbatim",
  "topology-trust-cues.test.ts": "keep-verbatim",
  "topology-view.test.tsx": "keep-verbatim",
  "url-app-state.test.ts": "replace-with-stronger-parity-test",
  "week35-verifier-bundle-markers.test.ts": "keep-verbatim",
  "week36-verifier-bundle-markers.test.ts": "keep-verbatim",
  "week37-verifier-bundle-markers.test.ts": "keep-verbatim",
  "week38-maintenance-window-workspace-bundle-markers.test.ts": "keep-verbatim",
  "week38-maintenance-window-workspace-cross-surface-pivots.test.ts": "port-to-new-route-harness",
  "week38-verifier-bundle-markers.test.ts": "keep-verbatim",
  "workflow-lifecycle-view.test.tsx": "keep-verbatim",
  "workflows-view.test.tsx": "keep-verbatim",
};

const HIGH_RISK_LEGACY_TESTS = [
  "api-client-week28-paths.test.ts",
  "url-app-state.test.ts",
  "read-side-query-params.test.ts",
  "operator-contract-labeling-anchors.test.ts",
  "replay-report-export-route-honesty.test.ts",
  "safe-action-workspace-view.test.tsx",
  "rollback-workspace-view.test.tsx",
  "workflow-lifecycle-view.test.tsx",
  "evidence-export-download.test.ts",
  "impact-report-download.test.ts",
  "change-safety-case-download.test.ts",
];

const LEGACY_FILENAME_ALIASES: Record<string, string> = {
  "maintenance-window-workspace-cross-surface-pivots.test.ts":
    "week38-maintenance-window-workspace-cross-surface-pivots.test.ts",
};

function dispositionFor(testName: string): TestDisposition | undefined {
  return LEGACY_TEST_DISPOSITIONS[testName] ?? LEGACY_TEST_DISPOSITIONS[LEGACY_FILENAME_ALIASES[testName]];
}

describe("Phase 1 legacy test migration dispositions", () => {
  it("labels every pre-Phase-1 test file with a migration disposition", () => {
    const currentLegacyTests = readdirSync(__dirname)
      .filter((name) => /\.(test\.ts|test\.tsx)$/.test(name))
      .filter((name) => !name.startsWith("frontend-phase"))
      .sort();

    expect(currentLegacyTests.filter((testName) => dispositionFor(testName) === undefined)).toEqual([]);
  });

  it("does not retire high-risk tests in the first parity PR", () => {
    for (const testName of HIGH_RISK_LEGACY_TESTS) {
      expect(LEGACY_TEST_DISPOSITIONS[testName]).not.toBe("retire-with-reason");
    }
  });
});

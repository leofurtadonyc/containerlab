import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

function src(relativePath: string): string {
  return readFileSync(join(__dirname, "../src", relativePath), "utf8");
}

describe("Phase 1 high-risk safety-copy anchors", () => {
  it("anchors Safe Action as platform-only and not device/controller push or safe-to-execute proof", () => {
    const text = src("features/safe-action-workspace/view.tsx");
    expect(text).toContain("not</strong> device or controller configuration push");
    expect(text).toContain("not safe-to-execute");
    expect(text).toContain("bounded preview, validation, evidence, and rollback readiness");
  });

  it("anchors Rollback as compensation only, not universal undo or device restore", () => {
    const text = src("features/rollback-workspace/view.tsx");
    expect(text).toContain("compensate the platform");
    expect(text).toContain("not SR OS / device restore");
    expect(text).toContain("not</strong> universal undo");
  });

  it("anchors Preview and Validation as non-execution/non-approval evidence surfaces", () => {
    const contracts = src("api/contracts.ts");
    expect(contracts).toContain("Dry-run / preview engine v1 — not execution");
    expect(contracts).toContain("Validation engine v1 — not preview, not evidence delta, not execution");
    expect(src("features/readiness/view.tsx")).toContain("approvals, execution, rollback, or preview behavior");
  });

  it("anchors Evidence Replay as frozen/offline replay, not live truth", () => {
    const parser = src("lib/evidence-replay/parse-evidence-export.ts");
    const types = src("lib/evidence-replay/types.ts");
    expect(parser).toContain("Does **not** call app-api");
    expect(parser).toContain("does **not** upgrade replay bytes into live truth");
    expect(types).toContain("never** live platform truth");
  });

  it("anchors export/report/briefing boundaries", () => {
    expect(src("features/service-explorer/service-explorer-product.tsx")).toContain(
      "impact_report_v1 — communication packaging; not evidence export or briefing bundle",
    );
    expect(src("features/change-safety-case/change-safety-case-product.tsx")).toContain("evidence_export_v1");
    expect(src("features/impact-report/impact-report-product.tsx")).toContain("change_safety_case_v1");
  });

  it("anchors topology and path views as non-universal truth/proof", () => {
    const topology = src("features/topology/view.tsx");
    const policies = src("features/policies/view.tsx");
    expect(topology).toContain("not dataplane path");
    expect(topology).toContain("not sole ODL authority");
    expect(topology).toContain("should not be read as path-validation");
    expect(policies).toContain("do not assert controller truth, adjacency validation, or workflow eligibility");
  });

  it("anchors evidence quality, consistency, and stability as non-root-cause surfaces", () => {
    expect(src("features/evidence-quality-workspace/view.tsx")).toContain("they do not assign root cause");
    expect(src("api/contracts.ts")).toContain("not_controller_event_bus");
    expect(src("api/contracts.ts")).toContain("not_rollback_or_execution_planning");
  });

  it("anchors Controller/ODL as bounded helper evidence, not source of truth or control plane", () => {
    const health = src("features/platform-health/view.tsx");
    const topology = src("features/topology/view.tsx");
    expect(health).toContain("bounded controller-helper probe");
    expect(health).toContain("not a controller control plane");
    expect(topology).toContain("Controller southbound session truth and deeper topology truth are separate evidence families");
  });
});

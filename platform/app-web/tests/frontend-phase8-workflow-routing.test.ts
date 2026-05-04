import { describe, expect, it } from "vitest";

import {
  maybeCanonicalizeWorkflowAlias,
  mergeWorkflowRouteIntoSearch,
  readViewIdFromSearchWithWorkflowRoutes,
  readWorkflowRouteFlagsFromSearch,
} from "../src/lib/phase8-workflow-routing";

describe("Phase 8 workflow/preview/validation routing", () => {
  it("canonicalizes workflow lifecycle, preview, and validation aliases", () => {
    const flags = readWorkflowRouteFlagsFromSearch("", {});
    expect(maybeCanonicalizeWorkflowAlias("?ui=next&view=workflow-lifecycle", flags)?.get("route")).toBe(
      "workflow.lifecycle",
    );
    expect(maybeCanonicalizeWorkflowAlias("?ui=next&view=preview-workspace", flags)?.get("route")).toBe(
      "workflow.preview",
    );
    expect(maybeCanonicalizeWorkflowAlias("?ui=next&view=validation-workspace", flags)?.get("route")).toBe(
      "workflow.validation",
    );
  });

  it("maps canonical workflow routes back to legacy view outlets", () => {
    const flags = readWorkflowRouteFlagsFromSearch("", {});
    expect(readViewIdFromSearchWithWorkflowRoutes("?route=workflow.lifecycle", flags)).toBe(
      "workflow-lifecycle",
    );
    expect(readViewIdFromSearchWithWorkflowRoutes("?route=workflow.preview", flags)).toBe(
      "preview-workspace",
    );
    expect(readViewIdFromSearchWithWorkflowRoutes("?route=workflow.validation", flags)).toBe(
      "validation-workspace",
    );
  });

  it("supports domain and per-workspace rollback flags", () => {
    const domainOff = readWorkflowRouteFlagsFromSearch("?next_workflow=0", {});
    expect(maybeCanonicalizeWorkflowAlias("?view=workflow-lifecycle", domainOff)).toBeNull();

    const previewOff = readWorkflowRouteFlagsFromSearch("?next_preview_workspace=false", {});
    expect(maybeCanonicalizeWorkflowAlias("?view=preview-workspace", previewOff)).toBeNull();
  });

  it("writes canonical route ids while preserving params", () => {
    const sp = mergeWorkflowRouteIntoSearch("?ui=next&workflow_lifecycle_id=wf-1", "workflow.lifecycle");
    expect(sp.get("route")).toBe("workflow.lifecycle");
    expect(sp.get("view")).toBe("workflow-lifecycle");
    expect(sp.get("workflow_lifecycle_id")).toBe("wf-1");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkflowLifecycleView } from "../src/features/workflow-lifecycle/view";

const listReload = vi.fn();
const detailReload = vi.fn();
const timelineReload = vi.fn();

vi.mock("../src/features/workflow-lifecycle/api", () => ({
  useWorkflowLifecycleUrlSelection: () => ({ selectedId: null }),
  useWorkflowLifecycleListQuery: () => ({
    data: { items: [], contract_id: "workflow_lifecycle_list_v1" },
    error: null,
    isLoading: false,
    reload: listReload,
  }),
  useWorkflowLifecycleDetailQuery: () => ({
    data: null,
    error: null,
    isLoading: false,
    reload: detailReload,
  }),
  useWorkflowLifecycleTimelineQuery: () => ({
    data: null,
    error: null,
    isLoading: false,
    reload: timelineReload,
  }),
}));

describe("WorkflowLifecycleView", () => {
  beforeEach(() => {
    listReload.mockClear();
  });

  it("renders lifecycle framing distinct from sync workflow history", () => {
    const html = renderToStaticMarkup(<WorkflowLifecycleView />);
    expect(html).toContain("Workflow lifecycle");
    expect(html).toContain("not</strong> sync-run history");
    expect(html).toContain("Dry-run");
  });
});

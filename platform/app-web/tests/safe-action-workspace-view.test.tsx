import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SafeActionWorkspaceView } from "../src/features/safe-action-workspace/view";

vi.mock("../src/api/client", () => ({
  apiClient: {
    createWorkflowLifecycle: vi.fn(),
    transitionWorkflowLifecycle: vi.fn(),
    createPreview: vi.fn(),
    createValidation: vi.fn(),
    createSafeAction: vi.fn(),
    getSafeActionTimeline: vi.fn(),
    approveSafeAction: vi.fn(),
    executeSafeAction: vi.fn(),
  },
}));

describe("SafeActionWorkspaceView", () => {
  it("renders bounded safe-action framing", () => {
    const html = renderToStaticMarkup(<SafeActionWorkspaceView />);
    expect(html).toContain("Safe action workspace");
    expect(html).toContain("controller configuration push");
  });
});

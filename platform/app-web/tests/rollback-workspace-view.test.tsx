import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { RollbackWorkspaceView } from "../src/features/rollback-workspace/view";

vi.mock("../src/api/client", () => ({
  apiClient: {
    createValidation: vi.fn(),
    createRollback: vi.fn(),
    getRollbackTimeline: vi.fn(),
    approveRollback: vi.fn(),
    executeRollback: vi.fn(),
  },
}));

describe("RollbackWorkspaceView", () => {
  it("renders bounded rollback framing", () => {
    const html = renderToStaticMarkup(<RollbackWorkspaceView />);
    expect(html).toContain("Rollback workspace");
    expect(html).toContain("device restore");
  });
});

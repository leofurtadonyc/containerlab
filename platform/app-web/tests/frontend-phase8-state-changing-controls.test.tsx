import type { ReactElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../src/api/client";
import { PreviewWorkspaceView } from "../src/features/preview-workspace/view";
import { ValidationWorkspaceView } from "../src/features/validation-workspace/view";
import { WorkflowLifecycleView } from "../src/features/workflow-lifecycle/view";

const workflowSelection = vi.hoisted(() => ({ selectedId: "wf-1" as string | null }));
const workflowListQuery = vi.hoisted(() => ({
  data: {
    items: [
      {
        workflow_id: "wf-1",
        workflow_status: "requested",
        workflow_type: "platform_change",
        title: "Workflow 1",
        updated_at: "2026-05-04T13:00:00Z",
      },
    ],
  },
  error: null,
  isLoading: false,
  reload: vi.fn(async () => undefined),
}));
const workflowDetailQuery = vi.hoisted(() => ({
  data: {
    workflow: {
      workflow_id: "wf-1",
      workflow_status: "requested",
      workflow_type: "platform_change",
      title: "Workflow 1",
      description: null,
      actor_created: "operator_webui",
      actor_updated: null,
    },
  },
  error: null,
  isLoading: false,
  reload: vi.fn(async () => undefined),
}));
const workflowTimelineQuery = vi.hoisted(() => ({
  data: { events: [] },
  error: null,
  isLoading: false,
  reload: vi.fn(async () => undefined),
}));

const previewSelection = vi.hoisted(() => ({ selectedId: null as string | null }));
const previewListQuery = vi.hoisted(() => ({
  data: { items: [] },
  error: null,
  isLoading: false,
  reload: vi.fn(async () => undefined),
}));
const previewDetailQuery = vi.hoisted(() => ({
  data: null,
  error: null,
  isLoading: false,
  reload: vi.fn(async () => undefined),
}));
const previewTimelineQuery = vi.hoisted(() => ({
  data: { events: [] },
  error: null,
  isLoading: false,
  reload: vi.fn(async () => undefined),
}));

const validationSelection = vi.hoisted(() => ({ selectedId: null as string | null }));
const validationListQuery = vi.hoisted(() => ({
  data: { items: [] },
  error: null,
  isLoading: false,
  reload: vi.fn(async () => undefined),
}));
const validationDetailQuery = vi.hoisted(() => ({
  data: null,
  error: null,
  isLoading: false,
  reload: vi.fn(async () => undefined),
}));
const validationTimelineQuery = vi.hoisted(() => ({
  data: { events: [] },
  error: null,
  isLoading: false,
  reload: vi.fn(async () => undefined),
}));

vi.mock("../src/features/workflow-lifecycle/api", () => ({
  useWorkflowLifecycleUrlSelection: () => workflowSelection,
  useWorkflowLifecycleListQuery: () => workflowListQuery,
  useWorkflowLifecycleDetailQuery: () => workflowDetailQuery,
  useWorkflowLifecycleTimelineQuery: () => workflowTimelineQuery,
}));

vi.mock("../src/features/preview-workspace/api", () => ({
  usePreviewUrlSelection: () => previewSelection,
  usePreviewListQuery: () => previewListQuery,
  usePreviewDetailQuery: () => previewDetailQuery,
  usePreviewTimelineQuery: () => previewTimelineQuery,
}));

vi.mock("../src/features/validation-workspace/api", () => ({
  useValidationUrlSelection: () => validationSelection,
  useValidationListQuery: () => validationListQuery,
  useValidationDetailQuery: () => validationDetailQuery,
  useValidationTimelineQuery: () => validationTimelineQuery,
}));

function renderWithDom(ui: ReactElement) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => {
    root.render(ui);
  });
  return {
    host,
    cleanup() {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  };
}

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("Phase 8 state-changing controls", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows disabled/loading state for workflow create action", async () => {
    const createDeferred = new Promise(() => undefined);
    vi.spyOn(apiClient, "createWorkflowLifecycle").mockReturnValue(createDeferred as never);

    const { host, cleanup } = renderWithDom(<WorkflowLifecycleView />);
    try {
      const button = Array.from(host.querySelectorAll("button")).find((el) =>
        el.textContent?.includes("Create workflow record"),
      ) as HTMLButtonElement;
      expect(button).toBeTruthy();
      await act(async () => {
        button.click();
      });
      expect(button.disabled).toBe(true);
      expect(button.textContent).toContain("Creating");
    } finally {
      cleanup();
    }
  });

  it("shows disabled/loading state for preview create and validation create actions", async () => {
    const previewDeferred = new Promise(() => undefined);
    const validationDeferred = new Promise(() => undefined);
    vi.spyOn(apiClient, "createPreview").mockReturnValue(previewDeferred as never);
    vi.spyOn(apiClient, "createValidation").mockReturnValue(validationDeferred as never);

    const preview = renderWithDom(<PreviewWorkspaceView />);
    try {
      const policyInput = preview.host.querySelector("input.form-field__input") as HTMLInputElement;
      const button = Array.from(preview.host.querySelectorAll("button")).find((el) =>
        el.textContent?.includes("Run preview"),
      ) as HTMLButtonElement;
      await act(async () => {
        setInputValue(policyInput, "PE1:static_local:192.0.2.11:100");
      });
      await act(async () => {
        button.click();
      });
      expect(button.disabled).toBe(true);
      expect(button.textContent).toContain("Running");
    } finally {
      preview.cleanup();
    }

    const validation = renderWithDom(<ValidationWorkspaceView />);
    try {
      const policyInput = validation.host.querySelector("input.form-field__input") as HTMLInputElement;
      const button = Array.from(validation.host.querySelectorAll("button")).find((el) =>
        el.textContent?.includes("Run validation"),
      ) as HTMLButtonElement;
      await act(async () => {
        setInputValue(policyInput, "PE1:static_local:192.0.2.11:100");
      });
      await act(async () => {
        button.click();
      });
      expect(button.disabled).toBe(true);
      expect(button.textContent).toContain("Running");
    } finally {
      validation.cleanup();
    }
  });

  it("shows error messages for preview/validation request failures", async () => {
    vi.spyOn(apiClient, "createPreview").mockRejectedValue(new Error("preview failed"));
    vi.spyOn(apiClient, "createValidation").mockRejectedValue(new Error("validation failed"));

    const preview = renderWithDom(<PreviewWorkspaceView />);
    try {
      const input = preview.host.querySelector("input.form-field__input") as HTMLInputElement;
      const button = Array.from(preview.host.querySelectorAll("button")).find((el) =>
        el.textContent?.includes("Run preview"),
      ) as HTMLButtonElement;
      await act(async () => {
        setInputValue(input, "PE1:static_local:192.0.2.11:100");
      });
      await act(async () => {
        button.click();
      });
      expect(preview.host.innerHTML).toContain("preview failed");
    } finally {
      preview.cleanup();
    }

    const validation = renderWithDom(<ValidationWorkspaceView />);
    try {
      const input = validation.host.querySelector("input.form-field__input") as HTMLInputElement;
      const button = Array.from(validation.host.querySelectorAll("button")).find((el) =>
        el.textContent?.includes("Run validation"),
      ) as HTMLButtonElement;
      await act(async () => {
        setInputValue(input, "PE1:static_local:192.0.2.11:100");
      });
      await act(async () => {
        button.click();
      });
      expect(validation.host.innerHTML).toContain("validation failed");
    } finally {
      validation.cleanup();
    }
  });
});

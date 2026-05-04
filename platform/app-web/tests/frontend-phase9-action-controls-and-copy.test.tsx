import type { ReactElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../src/api/client";
import { RollbackWorkspaceView } from "../src/features/rollback-workspace/view";
import { SafeActionWorkspaceView } from "../src/features/safe-action-workspace/view";

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

function getInputByLabel(host: HTMLElement, labelText: string): HTMLInputElement {
  const labels = Array.from(host.querySelectorAll("label.form-field"));
  const label = labels.find((item) =>
    item.querySelector(".form-field__label")?.textContent?.toLowerCase().includes(labelText.toLowerCase()),
  );
  const input = label?.querySelector("input.form-field__input") as HTMLInputElement | null;
  if (!input) {
    throw new Error(`Input not found for label: ${labelText}`);
  }
  return input;
}

describe("Phase 9 controls and safety copy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders explicit method posture and safety copy anchors", () => {
    const safeHtml = renderToStaticMarkup(<SafeActionWorkspaceView />);
    const rollbackHtml = renderToStaticMarkup(<RollbackWorkspaceView />);

    expect(safeHtml).toContain("platform-only");
    expect(safeHtml).toContain("not");
    expect(safeHtml).toContain("controller configuration push");
    expect(safeHtml).toContain("Method posture");
    expect(safeHtml).toContain("/reject");
    expect(safeHtml).toContain("/cancel");

    expect(rollbackHtml).toContain("compensation-only");
    expect(rollbackHtml).toContain("not");
    expect(rollbackHtml).toContain("universal undo");
    expect(rollbackHtml).toContain("SR OS / device restore");
    expect(rollbackHtml).toContain("Method posture");
  });

  it("keeps approve+execute buttons disabled until create response exists", () => {
    const safeHtml = renderToStaticMarkup(<SafeActionWorkspaceView />);
    const rollbackHtml = renderToStaticMarkup(<RollbackWorkspaceView />);
    expect(safeHtml).toContain("Approve + execute");
    expect(safeHtml).toContain("disabled");
    expect(rollbackHtml).toContain("Approve + execute");
    expect(rollbackHtml).toContain("disabled");
  });

  it("shows failed prerequisite path when required ids are missing", async () => {
    const safe = renderWithDom(<SafeActionWorkspaceView />);
    try {
      const createButton = Array.from(safe.host.querySelectorAll("button")).find((el) =>
        el.textContent?.includes("POST /api/v1/actions"),
      ) as HTMLButtonElement;
      await act(async () => {
        createButton.click();
      });
      expect(safe.host.innerHTML).toContain("workflow_id, preview_id, validation_id, and policy_id required");
    } finally {
      safe.cleanup();
    }

    const rollback = renderWithDom(<RollbackWorkspaceView />);
    try {
      const createButton = Array.from(rollback.host.querySelectorAll("button")).find((el) =>
        el.textContent?.includes("POST /api/v1/rollbacks"),
      ) as HTMLButtonElement;
      await act(async () => {
        createButton.click();
      });
      expect(rollback.host.innerHTML).toContain(
        "parent_action_id, pre_rollback (post_change) validation_id, and policy_id required",
      );
    } finally {
      rollback.cleanup();
    }
  });

  it("shows backend error path on safe-action and rollback create", async () => {
    vi.spyOn(apiClient, "createSafeAction").mockRejectedValue(new Error("safe action backend failed"));
    vi.spyOn(apiClient, "createRollback").mockRejectedValue(new Error("rollback backend failed"));

    const safe = renderWithDom(<SafeActionWorkspaceView />);
    try {
      const workflowInput = getInputByLabel(safe.host, "workflow_id");
      const policyInput = getInputByLabel(safe.host, "policy_id");
      const previewInput = getInputByLabel(safe.host, "preview_id");
      const validationInput = getInputByLabel(safe.host, "validation_id");
      await act(async () => {
        setInputValue(workflowInput, "wf-1");
        setInputValue(policyInput, "PE1:static_local:192.0.2.11:100");
        setInputValue(previewInput, "pv-1");
        setInputValue(validationInput, "val-1");
      });
      const createButton = Array.from(safe.host.querySelectorAll("button")).find((el) =>
        el.textContent?.includes("POST /api/v1/actions"),
      ) as HTMLButtonElement;
      await act(async () => {
        createButton.click();
      });
      expect(safe.host.innerHTML).toContain("safe action backend failed");
    } finally {
      safe.cleanup();
    }

    const rollback = renderWithDom(<RollbackWorkspaceView />);
    try {
      const policyInput = getInputByLabel(rollback.host, "policy_id");
      const parentActionInput = getInputByLabel(rollback.host, "parent_action_id");
      const validationInput = getInputByLabel(rollback.host, "pre_rollback_validation_id");
      await act(async () => {
        setInputValue(policyInput, "PE1:static_local:192.0.2.11:100");
        setInputValue(parentActionInput, "act-1");
        setInputValue(validationInput, "val-post-1");
      });
      const createButton = Array.from(rollback.host.querySelectorAll("button")).find((el) =>
        el.textContent?.includes("POST /api/v1/rollbacks"),
      ) as HTMLButtonElement;
      await act(async () => {
        createButton.click();
      });
      expect(rollback.host.innerHTML).toContain("rollback backend failed");
    } finally {
      rollback.cleanup();
    }
  });
});

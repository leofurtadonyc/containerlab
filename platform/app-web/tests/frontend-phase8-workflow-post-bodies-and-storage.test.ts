import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClient } from "../src/api/client";

describe("Phase 8 POST body coverage and storage posture", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("covers workflow lifecycle create/transition POST bodies", async () => {
    const calls: Array<{ path: string; method: string; body: Record<string, unknown> | null }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
        const rawBody = typeof init?.body === "string" ? JSON.parse(init.body) : null;
        calls.push({
          path: String(url),
          method: String(init?.method ?? "GET"),
          body: rawBody,
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }),
    );
    const client = new ApiClient({ baseUrl: "" });

    await client.createWorkflowLifecycle({
      workflow_type: "platform_change",
      title: "Workflow title",
      description: "Workflow description",
      initial_status: "requested",
      actor: "operator_webui",
      provenance: "operator",
    });
    await client.transitionWorkflowLifecycle("wf-1", {
      next_status: "planned",
      reason: "progression",
      actor: "operator_webui",
      provenance: "operator",
    });

    expect(calls.map((call) => [call.method, call.path])).toEqual([
      ["POST", "/api/v1/workflow-lifecycle"],
      ["POST", "/api/v1/workflow-lifecycle/wf-1/transitions"],
    ]);
    expect(calls[0].body).toMatchObject({
      workflow_type: "platform_change",
      title: "Workflow title",
      description: "Workflow description",
      initial_status: "requested",
      actor: "operator_webui",
      provenance: "operator",
    });
    expect(calls[1].body).toMatchObject({
      next_status: "planned",
      reason: "progression",
      actor: "operator_webui",
      provenance: "operator",
    });
  });

  it("covers preview and validation POST bodies", async () => {
    const calls: Array<{ path: string; method: string; body: Record<string, unknown> | null }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
        const rawBody = typeof init?.body === "string" ? JSON.parse(init.body) : null;
        calls.push({
          path: String(url),
          method: String(init?.method ?? "GET"),
          body: rawBody,
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }),
    );
    const client = new ApiClient({ baseUrl: "" });

    await client.createPreview({
      preview_type: "policy_static_local_intent_preview_v1",
      target_kind: "policy",
      target_ids: ["PE1:static_local:192.0.2.11:100"],
      requested_action_type: "intent_state_change",
      requested_payload: { proposed_intent_state: "declared" },
      actor_type: "operator",
      actor_id: "operator_webui",
    });

    await client.createValidation({
      validation_type: "policy_read_model_observability_v1",
      validation_context: "pre_change",
      target_kind: "policy",
      target_ids: ["PE1:static_local:192.0.2.11:100"],
      created_by_actor_type: "operator",
      created_by_actor_id: "operator_webui",
    });

    expect(calls.map((call) => [call.method, call.path])).toEqual([
      ["POST", "/api/v1/previews"],
      ["POST", "/api/v1/validations"],
    ]);
    expect(calls[0].body).toMatchObject({
      preview_type: "policy_static_local_intent_preview_v1",
      requested_action_type: "intent_state_change",
      requested_payload: { proposed_intent_state: "declared" },
      actor_type: "operator",
      actor_id: "operator_webui",
    });
    expect(calls[1].body).toMatchObject({
      validation_type: "policy_read_model_observability_v1",
      validation_context: "pre_change",
      created_by_actor_type: "operator",
      created_by_actor_id: "operator_webui",
    });
  });

  it("does not persist workflow/preview/validation mutations to browser storage", async () => {
    const getItem = vi.fn();
    const setItem = vi.fn();
    const removeItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem, setItem, removeItem });
    vi.stubGlobal("sessionStorage", { getItem, setItem, removeItem });

    const calls: Array<{ path: string; method: string; body: Record<string, unknown> | null }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
        const rawBody = typeof init?.body === "string" ? JSON.parse(init.body) : null;
        calls.push({
          path: String(url),
          method: String(init?.method ?? "GET"),
          body: rawBody,
        });
        if (String(url).includes("/workflow-lifecycle")) {
          return new Response(
            JSON.stringify({
              workflow: {
                workflow_id: "wf-1",
                workflow_status: "requested",
                workflow_type: "platform_change",
                title: "Workflow title",
                description: null,
                actor_created: "operator_webui",
                actor_updated: null,
              },
            }),
            { status: 200 },
          );
        }
        if (String(url).includes("/previews")) {
          return new Response(
            JSON.stringify({
              preview: { preview_id: "pv-1" },
            }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({
            validation_id: "val-1",
          }),
          { status: 200 },
        );
      }),
    );
    const client = new ApiClient({ baseUrl: "" });

    await client.createWorkflowLifecycle({
      workflow_type: "platform_change",
      title: "Workflow title",
      initial_status: "requested",
      actor: "operator_webui",
      provenance: "operator",
    });
    await client.createPreview({
      preview_type: "policy_static_local_intent_preview_v1",
      target_kind: "policy",
      target_ids: ["PE1:static_local:192.0.2.11:100"],
      requested_action_type: "intent_state_change",
      requested_payload: { proposed_intent_state: "declared" },
    });
    await client.createValidation({
      validation_type: "policy_read_model_observability_v1",
      validation_context: "pre_change",
      target_kind: "policy",
      target_ids: ["PE1:static_local:192.0.2.11:100"],
    });

    expect(calls.length).toBe(3);
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });
});

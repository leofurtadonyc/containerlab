import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClient } from "../src/api/client";

describe("Phase 9 safe-action and rollback POST body coverage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("covers create/approve/execute/reject/cancel for safe action", async () => {
    const calls: Array<{ path: string; method: string; body: Record<string, unknown> | null }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
        calls.push({
          path: String(url),
          method: String(init?.method ?? "GET"),
          body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }),
    );
    const client = new ApiClient({ baseUrl: "" });

    await client.createSafeAction({
      workflow_id: "wf-1",
      preview_id: "pv-1",
      validation_id: "val-1",
      action_type: "policy_static_local_operator_intent_record_v1",
      target_kind: "policy",
      target_ids: ["PE1:static_local:192.0.2.11:100"],
      requested_payload: { proposed_intent_state: "declared" },
      requested_by_actor_type: "operator",
      requested_by_actor_id: "operator_webui",
    });
    await client.approveSafeAction("act-1", { actor_id: "operator_webui", provenance: "operator" });
    await client.executeSafeAction("act-1", { actor_id: "operator_webui", provenance: "operator" });
    await client.rejectSafeAction("act-1", {
      actor_id: "operator_webui",
      reason: "bounded reject",
      provenance: "operator",
    });
    await client.cancelSafeAction("act-1", { actor_id: "operator_webui", reason: "bounded cancel" });

    expect(calls.map((call) => [call.method, call.path])).toEqual([
      ["POST", "/api/v1/actions"],
      ["POST", "/api/v1/actions/act-1/approve"],
      ["POST", "/api/v1/actions/act-1/execute"],
      ["POST", "/api/v1/actions/act-1/reject"],
      ["POST", "/api/v1/actions/act-1/cancel"],
    ]);
    expect(calls[0].body).toMatchObject({
      workflow_id: "wf-1",
      preview_id: "pv-1",
      validation_id: "val-1",
      action_type: "policy_static_local_operator_intent_record_v1",
    });
    expect(calls[3].body).toMatchObject({ reason: "bounded reject" });
    expect(calls[4].body).toMatchObject({ reason: "bounded cancel" });
  });

  it("covers create/approve/execute/reject/cancel for rollback", async () => {
    const calls: Array<{ path: string; method: string; body: Record<string, unknown> | null }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
        calls.push({
          path: String(url),
          method: String(init?.method ?? "GET"),
          body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }),
    );
    const client = new ApiClient({ baseUrl: "" });

    await client.createRollback({
      parent_action_id: "act-1",
      rollback_type: "policy_operator_intent_rollback_v1",
      target_kind: "policy",
      target_ids: ["PE1:static_local:192.0.2.11:100"],
      pre_rollback_validation_id: "val-post-1",
      requested_by_actor_type: "operator",
      requested_by_actor_id: "operator_webui",
    });
    await client.approveRollback("rb-1", { actor_id: "operator_webui", provenance: "operator" });
    await client.executeRollback("rb-1", { actor_id: "operator_webui", provenance: "operator" });
    await client.rejectRollback("rb-1", {
      actor_id: "operator_webui",
      reason: "bounded reject",
      provenance: "operator",
    });
    await client.cancelRollback("rb-1", { actor_id: "operator_webui", reason: "bounded cancel" });

    expect(calls.map((call) => [call.method, call.path])).toEqual([
      ["POST", "/api/v1/rollbacks"],
      ["POST", "/api/v1/rollbacks/rb-1/approve"],
      ["POST", "/api/v1/rollbacks/rb-1/execute"],
      ["POST", "/api/v1/rollbacks/rb-1/reject"],
      ["POST", "/api/v1/rollbacks/rb-1/cancel"],
    ]);
    expect(calls[0].body).toMatchObject({
      parent_action_id: "act-1",
      rollback_type: "policy_operator_intent_rollback_v1",
      pre_rollback_validation_id: "val-post-1",
    });
  });
});

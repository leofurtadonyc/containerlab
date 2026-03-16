import { describe, expect, it } from "vitest";

import { ApiClientError } from "../src/api/client";
import {
  buildOverviewRenderState,
  reloadOverviewSlicesSequentially,
} from "../src/features/overview/model";

describe("overview render state", () => {
  it("returns loading when nothing has loaded yet", () => {
    const state = buildOverviewRenderState(
      [
        { label: "Platform status", data: null, error: null, isLoading: true, isRefreshing: false },
        { label: "Devices", data: null, error: null, isLoading: true, isRefreshing: false },
      ],
      false,
    );

    expect(state.mode).toBe("loading");
  });

  it("returns partial when some data is present and another slice is still loading", () => {
    const state = buildOverviewRenderState(
      [
        { label: "Platform status", data: { ok: true }, error: null, isLoading: false, isRefreshing: false },
        { label: "Devices", data: null, error: null, isLoading: true, isRefreshing: false },
      ],
      false,
    );

    expect(state.mode).toBe("partial");
    expect(state.slices[0].status).toBe("ready");
    expect(state.slices[1].status).toBe("loading");
  });

  it("returns partial when some data is present and another slice errors", () => {
    const state = buildOverviewRenderState(
      [
        { label: "Platform status", data: { ok: true }, error: null, isLoading: false, isRefreshing: false },
        {
          label: "Devices",
          data: null,
          error: new ApiClientError("Devices failed", 500, "request_failed"),
          isLoading: false,
          isRefreshing: false,
        },
      ],
      false,
    );

    expect(state.mode).toBe("partial");
    expect(state.firstError?.message).toBe("Devices failed");
    expect(state.slices[1].status).toBe("error");
  });

  it("returns error when nothing loaded and one slice failed", () => {
    const state = buildOverviewRenderState(
      [
        {
          label: "Platform status",
          data: null,
          error: new ApiClientError("Platform failed", 500, "request_failed"),
          isLoading: false,
          isRefreshing: false,
        },
        { label: "Devices", data: null, error: null, isLoading: false, isRefreshing: false },
      ],
      false,
    );

    expect(state.mode).toBe("error");
  });

  it("returns partial when stale data remains visible after a refresh failure", () => {
    const state = buildOverviewRenderState(
      [
        {
          label: "Platform status",
          data: { ok: true },
          error: new ApiClientError("Reload timed out", 504, "request_failed"),
          isLoading: false,
          isRefreshing: false,
        },
      ],
      true,
    );

    expect(state.mode).toBe("partial");
    expect(state.slices[0].status).toBe("stale_error");
    expect(state.slices[0].hasData).toBe(true);
  });

  it("reloads overview slices sequentially", async () => {
    const order: string[] = [];

    await reloadOverviewSlicesSequentially([
      {
        reload: async () => {
          order.push("devices:start");
          await Promise.resolve();
          order.push("devices:end");
        },
      },
      {
        reload: async () => {
          order.push("topology:start");
          await Promise.resolve();
          order.push("topology:end");
        },
      },
      {
        reload: async () => {
          order.push("policies:start");
          await Promise.resolve();
          order.push("policies:end");
        },
      },
    ]);

    expect(order).toEqual([
      "devices:start",
      "devices:end",
      "topology:start",
      "topology:end",
      "policies:start",
      "policies:end",
    ]);
  });
});
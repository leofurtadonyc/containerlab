import { describe, expect, it } from "vitest";

import { ApiClientError } from "../src/api/client";
import { buildOverviewRenderState } from "../src/features/overview/model";

describe("overview render state", () => {
  it("returns loading when nothing has loaded yet", () => {
    const state = buildOverviewRenderState(
      [
        { label: "Platform status", data: null, error: null, isLoading: true },
        { label: "Devices", data: null, error: null, isLoading: true },
      ],
      false,
    );

    expect(state.mode).toBe("loading");
  });

  it("returns partial when some data is present and another slice is still loading", () => {
    const state = buildOverviewRenderState(
      [
        { label: "Platform status", data: { ok: true }, error: null, isLoading: false },
        { label: "Devices", data: null, error: null, isLoading: true },
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
        { label: "Platform status", data: { ok: true }, error: null, isLoading: false },
        {
          label: "Devices",
          data: null,
          error: new ApiClientError("Devices failed", 500, "request_failed"),
          isLoading: false,
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
        },
        { label: "Devices", data: null, error: null, isLoading: false },
      ],
      false,
    );

    expect(state.mode).toBe("error");
  });
});
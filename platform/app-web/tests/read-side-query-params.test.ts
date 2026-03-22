import { describe, expect, it } from "vitest";

import {
  buildAuditHistoryQueryString,
  buildDevicesPoliciesQueryString,
  buildWorkflowHistoryQueryString,
  mergeAuditHistoryReadSideQuery,
  mergeDevicesPoliciesReadSideQuery,
  mergeWorkflowHistoryReadSideQuery,
  parseAuditHistoryReadSideQuery,
  parseDevicesPoliciesReadSideQuery,
  parseWorkflowHistoryReadSideQuery,
  READ_SIDE_HISTORY_RECENT_LIMIT_MAX,
  READ_SIDE_PRIMARY_LIST_LIMIT_MAX,
  READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX,
  READ_SIDE_SYNC_RUNS_LIMIT_MAX,
} from "../src/api/read-side-query-params";

/** Pinned to `platform/app-api/src/app_api/schemas/read_side_query.py` maxima. */
describe("read-side query contract maxima", () => {
  it("matches backend READ_SIDE_* constants", () => {
    expect(READ_SIDE_PRIMARY_LIST_LIMIT_MAX).toBe(500);
    expect(READ_SIDE_HISTORY_RECENT_LIMIT_MAX).toBe(50);
    expect(READ_SIDE_SYNC_RUNS_LIMIT_MAX).toBe(100);
    expect(READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX).toBe(50);
  });
});

describe("parseDevicesPoliciesReadSideQuery", () => {
  it("parses bounded limit and history_recent_limit", () => {
    const sp = new URLSearchParams("limit=10&history_recent_limit=5");
    expect(parseDevicesPoliciesReadSideQuery(sp)).toEqual({
      limit: 10,
      history_recent_limit: 5,
    });
  });

  it("drops out-of-range values", () => {
    const sp = new URLSearchParams(
      `limit=${READ_SIDE_PRIMARY_LIST_LIMIT_MAX + 1}&history_recent_limit=0`,
    );
    expect(parseDevicesPoliciesReadSideQuery(sp)).toEqual({});
  });

  it("builds query string for API client", () => {
    expect(
      buildDevicesPoliciesQueryString({ limit: 3, history_recent_limit: 12 }),
    ).toBe("?limit=3&history_recent_limit=12");
  });
});

describe("parseWorkflowHistoryReadSideQuery", () => {
  it("parses limit and sync_runs_limit", () => {
    const sp = new URLSearchParams("limit=25&sync_runs_limit=40");
    expect(parseWorkflowHistoryReadSideQuery(sp)).toEqual({
      limit: 25,
      sync_runs_limit: 40,
    });
  });

  it("drops out-of-range sync_runs_limit (matches FastAPI Query bounds)", () => {
    const sp = new URLSearchParams(`sync_runs_limit=${READ_SIDE_SYNC_RUNS_LIMIT_MAX + 1}`);
    expect(parseWorkflowHistoryReadSideQuery(sp)).toEqual({});
  });

  it("builds query string", () => {
    expect(buildWorkflowHistoryQueryString({ sync_runs_limit: 2 })).toBe("?sync_runs_limit=2");
  });
});

describe("parseAuditHistoryReadSideQuery", () => {
  it("parses readiness_snapshot_history_limit", () => {
    const sp = new URLSearchParams("readiness_snapshot_history_limit=7&limit=1");
    expect(parseAuditHistoryReadSideQuery(sp)).toEqual({
      limit: 1,
      readiness_snapshot_history_limit: 7,
    });
  });

  it("builds query string", () => {
    expect(
      buildAuditHistoryQueryString({
        limit: 2,
        sync_runs_limit: 3,
        readiness_snapshot_history_limit: 4,
      }),
    ).toBe("?limit=2&sync_runs_limit=3&readiness_snapshot_history_limit=4");
  });
});

describe("merge helpers preserve unrelated params", () => {
  it("mergeDevicesPoliciesReadSideQuery keeps view", () => {
    const base = new URLSearchParams("view=devices&other=x");
    const merged = mergeDevicesPoliciesReadSideQuery(base, { limit: 5 });
    expect(merged.get("view")).toBe("devices");
    expect(merged.get("other")).toBe("x");
    expect(merged.get("limit")).toBe("5");
  });

  it("mergeWorkflowHistoryReadSideQuery deletes cleared keys", () => {
    const base = new URLSearchParams("view=workflows&limit=2&sync_runs_limit=3");
    const merged = mergeWorkflowHistoryReadSideQuery(base, {});
    expect(merged.get("view")).toBe("workflows");
    expect(merged.get("limit")).toBeNull();
    expect(merged.get("sync_runs_limit")).toBeNull();
  });

  it("mergeAuditHistoryReadSideQuery updates readiness only", () => {
    const base = new URLSearchParams("view=audit&readiness_snapshot_history_limit=9");
    const merged = mergeAuditHistoryReadSideQuery(base, {
      readiness_snapshot_history_limit: 10,
    });
    expect(merged.get("view")).toBe("audit");
    expect(merged.get("readiness_snapshot_history_limit")).toBe("10");
  });
});

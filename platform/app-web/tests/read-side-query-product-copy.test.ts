import { describe, expect, it } from "vitest";

import { recentSnapshotsEmptyFootnote } from "../src/lib/read-side-query-product-copy";

const baseEcho = {
  limit_requested: null,
  items_total: 2,
  items_returned: 2,
  history_recent_limit_requested: null,
  history_recent_limit_effective: 3,
  history_recent_snapshots_returned: 0,
  sync_runs_limit_requested: null,
  sync_runs_limit_effective: null,
  readiness_snapshot_history_limit_requested: null,
  readiness_snapshot_history_limit_effective: null,
};

describe("recentSnapshotsEmptyFootnote", () => {
  it("appends bounded-query absence note when echo shows zero rows under a positive effective limit", () => {
    const text = recentSnapshotsEmptyFootnote("comparison_ready", baseEcho, "devices");
    expect(text).toContain("history_recent_limit 3");
    expect(text).toContain("read-side absence");
  });

  it("does not append the bounded-query note for unavailable history", () => {
    const text = recentSnapshotsEmptyFootnote("unavailable", baseEcho, "policies");
    expect(text).toContain("No persisted policy-history window");
    expect(text).not.toContain("history_recent_limit 3");
  });
});

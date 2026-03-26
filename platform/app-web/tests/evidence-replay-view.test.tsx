import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EvidenceReplayView } from "../src/features/evidence-replay/view";

describe("EvidenceReplayView", () => {
  it("renders replay framing and contract vocabulary", () => {
    const html = renderToStaticMarkup(<EvidenceReplayView />);
    expect(html).toContain("evidence_replay_viewer_v1");
    expect(html).toContain("evidence_export_v1");
    expect(html).toContain("Replay mode");
    expect(html).toContain("live GETs");
    expect(html).toContain("Load export");
  });
});

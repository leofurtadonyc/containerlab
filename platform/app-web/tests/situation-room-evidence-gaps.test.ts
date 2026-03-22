import { describe, expect, it } from "vitest";

import type { SituationPackAssemblyResponse } from "../src/api/contracts";
import { buildSituationEvidenceGapNotes } from "../src/lib/situation-room-evidence-gaps";

describe("buildSituationEvidenceGapNotes", () => {
  it("lists absent or partial change domains using API headlines", () => {
    const data = {
      investigation_context: {
        recent_change: {
          domains: [
            {
              domain: "devices",
              evidence_status: "absent",
              headline: "No inventory snapshots.",
              signal_families: [],
              detail_notes: [],
            },
          ],
        },
      },
      readiness: { data_status: "bounded_history" },
      devices: { data_status: "live" },
      topology: { data_status: "live" },
      policies: { data_status: "live" },
      workflow_history: { data_status: "persisted_activity_history" },
      audit_history: { data_status: "persisted_activity_history" },
    } as unknown as SituationPackAssemblyResponse;

    const notes = buildSituationEvidenceGapNotes(data);
    expect(notes.some((n) => n.includes("Devices (absent)") && n.includes("No inventory snapshots."))).toBe(true);
  });

  it("notes empty readiness history and empty workflow+audit when applicable", () => {
    const data = {
      investigation_context: { recent_change: { domains: [] } },
      readiness: { data_status: "empty" },
      devices: { data_status: "live" },
      topology: { data_status: "live" },
      policies: { data_status: "live" },
      workflow_history: { data_status: "empty" },
      audit_history: { data_status: "empty" },
    } as unknown as SituationPackAssemblyResponse;

    const notes = buildSituationEvidenceGapNotes(data);
    expect(notes.some((n) => n.includes("Readiness snapshot history: no persisted"))).toBe(true);
    expect(notes.some((n) => n.includes("Workflow history and audit history are both empty"))).toBe(true);
  });
});

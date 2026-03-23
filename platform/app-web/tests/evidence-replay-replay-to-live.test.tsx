import type { ReactElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EvidenceReplayProduct } from "../src/features/evidence-replay/evidence-replay-product";

const pivotMocks = vi.hoisted(() => ({
  navigateToSituationRoomView: vi.fn(),
  navigateToInvestigationView: vi.fn(),
  navigateToPolicyDossierWorkspace: vi.fn(),
  navigateToTopologyDossier: vi.fn(),
  navigateToEvidenceView: vi.fn(),
}));

vi.mock("../src/lib/situation-room-navigation", () => ({
  navigateToSituationRoomView: pivotMocks.navigateToSituationRoomView,
}));

vi.mock("../src/lib/investigation-navigation", () => ({
  navigateToInvestigationView: pivotMocks.navigateToInvestigationView,
}));

vi.mock("../src/lib/policy-dossier-navigation", () => ({
  navigateToPolicyDossierWorkspace: pivotMocks.navigateToPolicyDossierWorkspace,
}));

vi.mock("../src/lib/topology-dossier-navigation", () => ({
  navigateToTopologyDossier: pivotMocks.navigateToTopologyDossier,
}));

vi.mock("../src/lib/url-app-state", () => ({
  navigateToEvidenceView: pivotMocks.navigateToEvidenceView,
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

function setTextareaValue(el: HTMLTextAreaElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function clickButtonContaining(host: HTMLElement, substring: string) {
  const buttons = host.querySelectorAll("button");
  for (const b of buttons) {
    if (b.textContent?.includes(substring)) {
      act(() => {
        (b as HTMLButtonElement).click();
      });
      return;
    }
  }
  throw new Error(`No button containing "${substring}"`);
}

function minimalExport(
  exportKind: string,
  extra: Record<string, unknown>,
): string {
  return JSON.stringify({
    contract_id: "evidence_export_v1",
    export_kind: exportKind,
    subject_ref: {},
    generated_at: "2025-01-01T00:00:00Z",
    source_contract_ids: ["test_contract"],
    explicit_non_claims: [],
    export_framing: "test",
    nested: {},
    ...extra,
  });
}

beforeEach(() => {
  pivotMocks.navigateToSituationRoomView.mockClear();
  pivotMocks.navigateToInvestigationView.mockClear();
  pivotMocks.navigateToPolicyDossierWorkspace.mockClear();
  pivotMocks.navigateToTopologyDossier.mockClear();
  pivotMocks.navigateToEvidenceView.mockClear();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("EvidenceReplayProduct replay-to-live pivots", () => {
  it("calls navigateToSituationRoomView with bounded sync window from subject_ref", () => {
    const { host, cleanup } = renderWithDom(<EvidenceReplayProduct />);
    try {
      const ta = host.querySelector("#evidence-replay-paste") as HTMLTextAreaElement;
      setTextareaValue(
        ta,
        minimalExport("situation_room", {
          subject_ref: { sync_runs_limit: 5 },
          nested: { safety: { contract_id: "evidence_pack_phase2_v1" } },
        }),
      );
      clickButtonContaining(host, "Load pasted text");
      clickButtonContaining(host, "Open live situation room");
      expect(pivotMocks.navigateToSituationRoomView).toHaveBeenCalledWith(5);
    } finally {
      cleanup();
    }
  });

  it("calls navigateToInvestigationView with sync_runs_limit and invFrom evidence-replay", () => {
    const { host, cleanup } = renderWithDom(<EvidenceReplayProduct />);
    try {
      const ta = host.querySelector("#evidence-replay-paste") as HTMLTextAreaElement;
      setTextareaValue(
        ta,
        minimalExport("investigation_workspace", {
          subject_ref: { sync_runs_limit: 7 },
          nested: { recent_change: { safety: { contract_id: "x" } } },
        }),
      );
      clickButtonContaining(host, "Load pasted text");
      clickButtonContaining(host, "Open live investigation workspace");
      expect(pivotMocks.navigateToInvestigationView).toHaveBeenCalledWith(7, {
        invFrom: "evidence-replay",
      });
    } finally {
      cleanup();
    }
  });

  it("calls navigateToPolicyDossierWorkspace with policy_id from subject_ref", () => {
    const { host, cleanup } = renderWithDom(<EvidenceReplayProduct />);
    try {
      const ta = host.querySelector("#evidence-replay-paste") as HTMLTextAreaElement;
      setTextareaValue(
        ta,
        minimalExport("policy_dossier", {
          subject_ref: { policy_id: "PE1:pol:1" },
          nested: { contract_id: "policy_dossier_v1" },
        }),
      );
      clickButtonContaining(host, "Load pasted text");
      clickButtonContaining(host, "Open live policy dossier");
      expect(pivotMocks.navigateToPolicyDossierWorkspace).toHaveBeenCalledWith("PE1:pol:1", "evidence_replay_viewer");
    } finally {
      cleanup();
    }
  });

  it("calls navigateToTopologyDossier using nested object_identity when subject_ref lacks ids", () => {
    const { host, cleanup } = renderWithDom(<EvidenceReplayProduct />);
    try {
      const ta = host.querySelector("#evidence-replay-paste") as HTMLTextAreaElement;
      setTextareaValue(
        ta,
        minimalExport("topology_object_dossier", {
          subject_ref: {},
          nested: {
            contract_id: "topology_object_dossier_v1",
            object_identity: {
              object_id: "PE1",
              object_kind: "node",
              display_label: "PE1",
            },
          },
        }),
      );
      clickButtonContaining(host, "Load pasted text");
      expect(host.innerHTML).toContain("Live pivot identity was taken from the nested dossier payload");
      clickButtonContaining(host, "Open live topology dossier");
      expect(pivotMocks.navigateToTopologyDossier).toHaveBeenCalledWith("PE1", "node", "evidence_replay_viewer");
    } finally {
      cleanup();
    }
  });

  it("calls navigateToEvidenceView for Overview", () => {
    const { host, cleanup } = renderWithDom(<EvidenceReplayProduct />);
    try {
      const ta = host.querySelector("#evidence-replay-paste") as HTMLTextAreaElement;
      setTextareaValue(
        ta,
        minimalExport("situation_room", {
          subject_ref: { sync_runs_limit: 3 },
          nested: { safety: { contract_id: "evidence_pack_phase2_v1" } },
        }),
      );
      clickButtonContaining(host, "Load pasted text");
      clickButtonContaining(host, "Overview");
      expect(pivotMocks.navigateToEvidenceView).toHaveBeenCalledWith("overview");
    } finally {
      cleanup();
    }
  });

  it("surfaces unmapped pivot copy when policy_id cannot be derived", () => {
    const { host, cleanup } = renderWithDom(<EvidenceReplayProduct />);
    try {
      const ta = host.querySelector("#evidence-replay-paste") as HTMLTextAreaElement;
      setTextareaValue(
        ta,
        minimalExport("policy_dossier", {
          subject_ref: {},
          nested: { contract_id: "policy_dossier_v1" },
        }),
      );
      clickButtonContaining(host, "Load pasted text");
      expect(host.innerHTML).toContain("Unmapped pivot");
      expect(host.innerHTML).toContain("cannot derive");
    } finally {
      cleanup();
    }
  });
});

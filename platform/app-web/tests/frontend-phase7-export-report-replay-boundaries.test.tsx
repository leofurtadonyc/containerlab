import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChangeSafetyCaseActions } from "../src/components/change-safety-case-actions";
import { EvidenceExportActions } from "../src/components/evidence-export-actions";
import { ImpactReportActions } from "../src/components/impact-report-actions";
import { parseEvidenceExportJson } from "../src/lib/evidence-replay";
import { EvidenceReplayProduct } from "../src/features/evidence-replay/evidence-replay-product";
import {
  downloadChangeSafetyCase,
  type ChangeSafetyCaseDownloadTarget,
} from "../src/lib/change-safety-case-download";
import {
  downloadEvidenceExport,
  type EvidenceExportTarget,
} from "../src/lib/evidence-export-download";
import {
  downloadImpactReport,
  type ImpactReportDownloadTarget,
} from "../src/lib/impact-report-download";
import {
  PHASE7_DOWNLOAD_BOUNDARY_REGISTRY,
  PHASE7_SUPPORTED_CHANGE_SAFETY_FORMATS,
  PHASE7_SUPPORTED_DOWNLOAD_FORMATS,
  PHASE7_SUPPORTED_REPORT_FORMATS,
} from "../src/lib/phase7-export-boundaries";

describe("Phase 7 export/report/replay boundaries", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("lists all supported export and report formats explicitly", () => {
    expect(PHASE7_SUPPORTED_DOWNLOAD_FORMATS).toEqual(["json", "markdown"]);
    expect(PHASE7_SUPPORTED_REPORT_FORMATS).toEqual(["json", "markdown"]);
    expect(PHASE7_SUPPORTED_CHANGE_SAFETY_FORMATS).toEqual(["json", "markdown"]);
  });

  it("records maintenance-window handoff as backend-only posture", () => {
    const handoff = PHASE7_DOWNLOAD_BOUNDARY_REGISTRY.find(
      (entry) => entry.endpoint === "/api/v1/exports/maintenance-window-handoff",
    );
    expect(handoff).toBeDefined();
    expect(handoff?.posture).toBe("backend-only");
    expect(handoff?.note).toContain("backend-only");
  });

  it("keeps replay rejection behavior explicit for non-evidence envelopes", () => {
    expect(
      parseEvidenceExportJson(JSON.stringify({ contract_id: "impact_report_v1", report_kind: "service_impact" })),
    ).toMatchObject({ status: "error", error: { code: "impact_report_not_evidence_export" } });
    expect(
      parseEvidenceExportJson(
        JSON.stringify({ contract_id: "change_safety_case_v1", case_kind: "policy_change_safety" }),
      ),
    ).toMatchObject({ status: "error", error: { code: "change_safety_case_not_evidence_export" } });
    expect(parseEvidenceExportJson(JSON.stringify({ contract_id: "service_impact_workspace_v1" }))).toMatchObject({
      status: "error",
      error: { code: "service_impact_workspace_not_evidence_export" },
    });
    expect(
      parseEvidenceExportJson(
        JSON.stringify({
          contract_id: "evidence_export_v1",
          export_kind: "situation_room",
          generated_at: "2026-05-04T13:00:00Z",
          source_contract_ids: ["situation_pack_v1"],
          explicit_non_claims: ["Not live truth"],
          export_framing: "Frozen snapshot only",
          subject_ref: { sync_runs_limit: 20 },
          nested: { contract_id: "situation_pack_v1" },
        }),
      ),
    ).toMatchObject({ status: "ok", model: { exportKind: "situation_room" } });
  });

  it("keeps envelope/report family naming visible in UI copy", () => {
    const evidenceHtml = renderToStaticMarkup(
      <EvidenceExportActions target={{ kind: "policy_dossier", policyId: "p:a" }} variant="dossier" />,
    );
    const briefingHtml = renderToStaticMarkup(
      <EvidenceExportActions
        target={{ kind: "operator_briefing_bundle", syncRunsLimit: 20 }}
        variant="briefing_bundle"
      />,
    );
    const reportHtml = renderToStaticMarkup(
      <ImpactReportActions target={{ kind: "service_impact", serviceId: "svc:a" }} />,
    );
    const cscHtml = renderToStaticMarkup(
      <ChangeSafetyCaseActions target={{ kind: "policy_change_safety", policyId: "p:a" }} />,
    );
    const replayHtml = renderToStaticMarkup(<EvidenceReplayProduct />);

    expect(evidenceHtml).toContain("impact_report_v1");
    expect(evidenceHtml).toContain("change_safety_case_v1");
    expect(briefingHtml).toContain("briefing_export_bundle_v1");
    expect(briefingHtml).toContain("evidence_export_v1");
    expect(reportHtml).toContain("impact_report_v1");
    expect(cscHtml).toContain("change_safety_case_v1");
    expect(replayHtml).toContain("not");
    expect(replayHtml).toContain("impact_report_v1");
    expect(replayHtml).toContain("change_safety_case_v1");
  });

  it("keeps filename prefixes and extensions deterministic per family", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-04T13:00:00Z"));

    const downloads: string[] = [];
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === "a") {
        const a = {
          href: "",
          download: "",
          click: () => {
            click();
            downloads.push(a.download);
          },
        } as unknown as HTMLAnchorElement;
        return a;
      }
      return originalCreateElement(tagName);
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    if (!("createObjectURL" in URL)) {
      Object.defineProperty(URL, "createObjectURL", {
        value: () => "blob:phase7",
        writable: true,
      });
    }
    if (!("revokeObjectURL" in URL)) {
      Object.defineProperty(URL, "revokeObjectURL", {
        value: () => undefined,
        writable: true,
      });
    }
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:phase7");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    const evidenceTarget: EvidenceExportTarget = { kind: "policy_dossier", policyId: "p:a" };
    const reportTarget: ImpactReportDownloadTarget = { kind: "service_impact", serviceId: "svc:a" };
    const cscTarget: ChangeSafetyCaseDownloadTarget = { kind: "policy_change_safety", policyId: "p:a" };
    await downloadEvidenceExport(evidenceTarget, "json");
    await downloadImpactReport(reportTarget, "markdown");
    await downloadChangeSafetyCase(cscTarget, "json");

    expect(click).toHaveBeenCalledTimes(3);
    expect(downloads[0]).toMatch(/^evidence-export-policy-p_a-2026-05-04-13-00-00\.json$/);
    expect(downloads[1]).toMatch(/^impact-report-service-svc_a-2026-05-04-13-00-00\.md$/);
    expect(downloads[2]).toMatch(/^change-safety-case-policy-p_a-2026-05-04-13-00-00\.json$/);
  });
});

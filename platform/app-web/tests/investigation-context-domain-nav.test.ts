import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InvestigationContextDomain } from "../src/api/contracts";
import { navigateForInvestigationContextDomain } from "../src/lib/investigation-context-domain-nav";

const navigateToEvidenceView = vi.fn();

vi.mock("../src/lib/url-app-state", () => ({
  navigateToEvidenceView: (...args: unknown[]) => navigateToEvidenceView(...args),
}));

describe("navigateForInvestigationContextDomain", () => {
  beforeEach(() => {
    navigateToEvidenceView.mockClear();
  });

  it.each([
    ["devices", "devices"],
    ["topology", "topology"],
    ["policies", "policies"],
    ["readiness", "readiness"],
    ["workflow_history", "workflows"],
    ["audit_history", "audit"],
    ["change_intelligence", "overview"],
    ["platform_status", "platform-health"],
    ["capabilities", "capabilities"],
  ] as const)("maps %s to view %s", (domain: InvestigationContextDomain, view: string) => {
    navigateForInvestigationContextDomain(domain);
    expect(navigateToEvidenceView).toHaveBeenCalledTimes(1);
    expect(navigateToEvidenceView).toHaveBeenCalledWith(view);
  });
});

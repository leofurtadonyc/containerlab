import type { InvestigationContextDomain } from "../api/contracts";
import { navigateToEvidenceView } from "./url-app-state";

/** Maps investigation context domains to product `view=` targets (read-only navigation). */
export function navigateForInvestigationContextDomain(domain: InvestigationContextDomain): void {
  switch (domain) {
    case "devices":
      navigateToEvidenceView("devices");
      return;
    case "topology":
      navigateToEvidenceView("topology");
      return;
    case "policies":
      navigateToEvidenceView("policies");
      return;
    case "readiness":
      navigateToEvidenceView("readiness");
      return;
    case "workflow_history":
      navigateToEvidenceView("workflows");
      return;
    case "audit_history":
      navigateToEvidenceView("audit");
      return;
    case "change_intelligence":
      navigateToEvidenceView("overview");
      return;
    case "platform_status":
      navigateToEvidenceView("platform-health");
      return;
    case "capabilities":
      navigateToEvidenceView("capabilities");
      return;
  }
}

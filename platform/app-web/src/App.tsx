import { useCallback, useEffect, useState } from "react";

import { appApiBaseUrl } from "./api/client";
import { AppShell } from "./components/shell";
import {
  APP_URL_SEARCH_CHANGED,
  mergeViewIntoSearch,
  readViewIdFromSearch,
  replaceUrlSearchParams,
} from "./lib/url-app-state";
import { PLATFORM_NAV_VIEW_IDS } from "./nav-views";
import { AuditView } from "./features/audit/view";
import { CapabilitiesView } from "./features/capabilities/view";
import { DeltaDigestView } from "./features/delta-digest/view";
import { EvidenceConsistencyView } from "./features/evidence-consistency/view";
import { EvidenceReplayView } from "./features/evidence-replay/view";
import { DevicesView } from "./features/devices/view";
import { InvestigationView } from "./features/investigation/view";
import { OverviewView } from "./features/overview/view";
import { OperatorBriefingView } from "./features/operator-briefing/view";
import { SituationRoomView } from "./features/situation-room/view";
import { PlatformHealthView } from "./features/platform-health/view";
import { PoliciesView } from "./features/policies/view";
import { PathExplorerView } from "./features/path-explorer/view";
import { ServiceImpactWorkspaceView } from "./features/service-impact-workspace/view";
import { ServiceExplorerView } from "./features/service-explorer/view";
import { ServiceDossierView } from "./features/service-dossier/view";
import { MaintenancePreviewView } from "./features/maintenance-preview/view";
import { MaintenanceEvidenceWorkspaceView } from "./features/maintenance-evidence-workspace/view";
import { ImpactReportView } from "./features/impact-report/view";
import { ChangeSafetyCaseView } from "./features/change-safety-case/view";
import { ReadinessView } from "./features/readiness/view";
import { TopologyView } from "./features/topology/view";
import { WorkflowsView } from "./features/workflows/view";
import { GlobalOperatorSearch } from "./features/global-search/global-operator-search";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "delta-digest", label: "Delta digest" },
  { id: "evidence-consistency", label: "Evidence consistency" },
  { id: "situation-room", label: "Situation room" },
  { id: "investigation", label: "Investigation" },
  { id: "devices", label: "Devices" },
  { id: "topology", label: "Topology" },
  { id: "policies", label: "Policies" },
  { id: "path-explorer", label: "Path Explorer" },
  { id: "service-impact-workspace", label: "Service Impact" },
  { id: "service-explorer", label: "Service Explorer" },
  { id: "service-dossier", label: "Service dossier" },
  { id: "maintenance-preview", label: "Maintenance Preview" },
  { id: "maintenance-evidence-workspace", label: "Maintenance evidence" },
  { id: "impact-report", label: "Impact Report" },
  { id: "change-safety-case", label: "Change safety case" },
  { id: "workflows", label: "Workflows" },
  { id: "audit", label: "Audit" },
  { id: "capabilities", label: "Capabilities" },
  { id: "readiness", label: "Readiness" },
  { id: "platform-health", label: "Platform Health" },
  { id: "evidence-replay", label: "Evidence replay" },
] as const;

function readInitialView(): string {
  const fromUrl = readViewIdFromSearch(window.location.search, PLATFORM_NAV_VIEW_IDS);
  return fromUrl ?? "overview";
}

function renderView(viewId: string) {
  switch (viewId) {
    case "delta-digest":
      return <DeltaDigestView />;
    case "evidence-consistency":
      return <EvidenceConsistencyView />;
    case "situation-room":
      return <SituationRoomView />;
    case "operator-briefing":
      return <OperatorBriefingView />;
    case "investigation":
      return <InvestigationView />;
    case "devices":
      return <DevicesView />;
    case "topology":
      return <TopologyView />;
    case "policies":
      return <PoliciesView />;
    case "path-explorer":
      return <PathExplorerView />;
    case "service-impact-workspace":
      return <ServiceImpactWorkspaceView />;
    case "service-explorer":
      return <ServiceExplorerView />;
    case "service-dossier":
      return <ServiceDossierView />;
    case "maintenance-preview":
      return <MaintenancePreviewView />;
    case "maintenance-evidence-workspace":
      return <MaintenanceEvidenceWorkspaceView />;
    case "impact-report":
      return <ImpactReportView />;
    case "change-safety-case":
      return <ChangeSafetyCaseView />;
    case "workflows":
      return <WorkflowsView />;
    case "audit":
      return <AuditView />;
    case "capabilities":
      return <CapabilitiesView />;
    case "readiness":
      return <ReadinessView />;
    case "platform-health":
      return <PlatformHealthView />;
    case "evidence-replay":
      return <EvidenceReplayView />;
    case "overview":
    default:
      return <OverviewView />;
  }
}

export function App() {
  const [activeView, setActiveView] = useState<string>(readInitialView());

  useEffect(() => {
    const syncViewFromUrl = () => {
      const next = readViewIdFromSearch(window.location.search, PLATFORM_NAV_VIEW_IDS);
      if (next) {
        setActiveView(next);
      }
    };
    window.addEventListener("popstate", syncViewFromUrl);
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncViewFromUrl);
    return () => {
      window.removeEventListener("popstate", syncViewFromUrl);
      window.removeEventListener(APP_URL_SEARCH_CHANGED, syncViewFromUrl);
    };
  }, []);

  const handleSelectView = useCallback((id: string) => {
    setActiveView(id);
    const sp = mergeViewIntoSearch(window.location.search, id);
    replaceUrlSearchParams(sp);
  }, []);

  return (
    <AppShell
      title="Platform WebUI"
      navigationItems={NAV_ITEMS.map((item) => ({ ...item }))}
      activeItemId={activeView}
      onSelect={handleSelectView}
    >
      <GlobalOperatorSearch />
      <div className="page-header">
        <p className="eyebrow">Phase 2 Read-Only Foundation</p>
        <p className="body-copy">
          This WebUI now consumes the current read-only backend contracts for
          overview, platform status, devices, topology, policies, service explorer, service dossier, maintenance preview, workflow
          history, audit history, capabilities, readiness, bounded situation room
          evidence-pack assembly, operator briefing workspace, bounded investigation workspace assembly, and evidence export
          replay (not live). Grafana remains
          the observability layer, and backend APIs remain the source of
          business logic.
        </p>
        <p className="meta-copy">Configured backend base URL: {appApiBaseUrl}</p>
      </div>
      {renderView(activeView)}
    </AppShell>
  );
}

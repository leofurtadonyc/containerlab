import { useCallback, useEffect, useMemo, useState } from "react";

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
import { EvidenceQualityWorkspaceView } from "./features/evidence-quality-workspace/view";
import { StabilityWorkspaceView } from "./features/stability-workspace/view";
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
import { MaintenanceWindowWorkspaceView } from "./features/maintenance-window-workspace/view";
import { ImpactReportView } from "./features/impact-report/view";
import { ChangeSafetyCaseView } from "./features/change-safety-case/view";
import { ReadinessView } from "./features/readiness/view";
import { TopologyView } from "./features/topology/view";
import { WorkflowsView } from "./features/workflows/view";
import { WorkflowLifecycleView } from "./features/workflow-lifecycle/view";
import { PreviewWorkspaceView } from "./features/preview-workspace/view";
import { ValidationWorkspaceView } from "./features/validation-workspace/view";
import { SafeActionWorkspaceView } from "./features/safe-action-workspace/view";
import { RollbackWorkspaceView } from "./features/rollback-workspace/view";
import { GlobalOperatorSearch } from "./features/global-search/global-operator-search";

type AppNavItem = {
  id: string;
  label: string;
  description: string;
};

type AppNavGroup = {
  id: string;
  label: string;
  items: AppNavItem[];
};

const NAV_GROUPS: readonly AppNavGroup[] = [
  {
    id: "command-center",
    label: "Command Center",
    items: [
      {
        id: "overview",
        label: "Overview",
        description: "Start here for platform posture, recent change, and next investigation cues.",
      },
      {
        id: "platform-health",
        label: "Platform Health",
        description: "Inspect platform components, read paths, and controller-helper posture.",
      },
    ],
  },
  {
    id: "investigate",
    label: "Investigate",
    items: [
      {
        id: "investigation",
        label: "Investigation",
        description: "Structured troubleshooting workspace with cross-domain context and next inspections.",
      },
      {
        id: "situation-room",
        label: "Situation Room",
        description: "Broader evidence-pack view for active operational situations.",
      },
      {
        id: "operator-briefing",
        label: "Operator Briefing",
        description: "Summarize and hand off bounded operator context across key evidence surfaces.",
      },
      {
        id: "delta-digest",
        label: "Delta Digest",
        description: "Cross-domain summary of recent bounded changes and evidence deltas.",
      },
      {
        id: "evidence-consistency",
        label: "Evidence Consistency",
        description: "Find where current evidence aligns cleanly versus where it still tensions.",
      },
      {
        id: "evidence-quality-workspace",
        label: "Evidence Quality",
        description: "Review collection assurance, read-path reliability, and evidence weakness explanations.",
      },
      {
        id: "stability-workspace",
        label: "Stability",
        description: "Inspect operational churn, recurrence, and stability posture across surfaces.",
      },
    ],
  },
  {
    id: "network-truth",
    label: "Network Truth",
    items: [
      {
        id: "devices",
        label: "Devices",
        description: "Read normalized inventory and current device-facing support evidence.",
      },
      {
        id: "topology",
        label: "Topology",
        description: "Explore normalized topology, truth cues, controller evidence, and topology dossiers.",
      },
      {
        id: "path-explorer",
        label: "Path Explorer",
        description: "Trace bounded path reasoning anchored on current policy and topology evidence.",
      },
    ],
  },
  {
    id: "services-policies",
    label: "Services & Policies",
    items: [
      {
        id: "policies",
        label: "Policies",
        description: "Inspect policy inventory, path analysis, evidence timeline, and policy impact.",
      },
      {
        id: "service-explorer",
        label: "Service Explorer",
        description: "Grouped service lens over bounded policy inventory and service evidence.",
      },
      {
        id: "service-dossier",
        label: "Service Dossier",
        description: "Composed service workspace with timelines, deltas, and related pivots.",
      },
      {
        id: "service-impact-workspace",
        label: "Service Impact",
        description: "Investigate service impact with bounded topology and change context.",
      },
    ],
  },
  {
    id: "change-safety",
    label: "Change & Safety",
    items: [
      {
        id: "maintenance-preview",
        label: "Maintenance Preview",
        description: "Preview bounded impact and evidence before planned maintenance activity.",
      },
      {
        id: "maintenance-evidence-workspace",
        label: "Maintenance Evidence",
        description: "Review maintenance-focused evidence, dossiers, and safety pivots together.",
      },
      {
        id: "maintenance-window-workspace",
        label: "Maintenance Window",
        description: "Coordinate maintenance subjects, service impact, and handoff artifacts.",
      },
      {
        id: "impact-report",
        label: "Impact Report",
        description: "Generate bounded impact reports for service, policy, or maintenance anchors.",
      },
      {
        id: "change-safety-case",
        label: "Change Safety Case",
        description: "Review bounded pre-change reasoning and evidence gaps before execution.",
      },
      {
        id: "workflow-lifecycle",
        label: "Workflow Lifecycle",
        description: "Inspect durable workflow records and lifecycle transitions.",
      },
      {
        id: "preview-workspace",
        label: "Preview Workspace",
        description: "Review preview requests, details, and diff context.",
      },
      {
        id: "validation-workspace",
        label: "Validation Workspace",
        description: "Review validation requests, timelines, and bounded outcomes.",
      },
      {
        id: "safe-action-workspace",
        label: "Safe Action",
        description: "Operate the bounded safe-action workflow with explicit gates and approvals.",
      },
      {
        id: "rollback-workspace",
        label: "Rollback",
        description: "Inspect rollback requests, approvals, execution, and current status.",
      },
    ],
  },
  {
    id: "governance-platform",
    label: "Governance & Platform",
    items: [
      {
        id: "workflows",
        label: "Workflows",
        description: "Browse workflow-history derived from persisted sync activity.",
      },
      {
        id: "audit",
        label: "Audit",
        description: "Browse bounded audit-history and related readiness or sync anchors.",
      },
      {
        id: "capabilities",
        label: "Capabilities",
        description: "Review current platform support matrix and capability posture.",
      },
      {
        id: "readiness",
        label: "Readiness",
        description: "Inspect dry-run-planning readiness, blockers, and support anchors.",
      },
      {
        id: "evidence-replay",
        label: "Evidence Replay",
        description: "Replay exported bounded evidence offline without treating it as live product truth.",
      },
    ],
  },
] as const;

const VIEW_META = new Map(
  NAV_GROUPS.flatMap((group) =>
    group.items.map((item) => [
      item.id,
      {
        label: item.label,
        description: item.description,
        groupLabel: group.label,
      },
    ]),
  ),
);

function summarizeAppApiBaseUrl(baseUrl: string): string {
  if (!baseUrl) {
    return "Same-origin API proxy";
  }
  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return baseUrl;
  }
}

function countRouteContextParams(search: string): number {
  const sp = new URLSearchParams(search);
  sp.delete("view");
  return [...sp.keys()].length;
}

function renderView(viewId: string) {
  switch (viewId) {
    case "delta-digest":
      return <DeltaDigestView />;
    case "evidence-consistency":
      return <EvidenceConsistencyView />;
    case "evidence-quality-workspace":
      return <EvidenceQualityWorkspaceView />;
    case "stability-workspace":
      return <StabilityWorkspaceView />;
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
    case "maintenance-window-workspace":
      return <MaintenanceWindowWorkspaceView />;
    case "impact-report":
      return <ImpactReportView />;
    case "change-safety-case":
      return <ChangeSafetyCaseView />;
    case "workflows":
      return <WorkflowsView />;
    case "workflow-lifecycle":
      return <WorkflowLifecycleView />;
    case "preview-workspace":
      return <PreviewWorkspaceView />;
    case "validation-workspace":
      return <ValidationWorkspaceView />;
    case "safe-action-workspace":
      return <SafeActionWorkspaceView />;
    case "rollback-workspace":
      return <RollbackWorkspaceView />;
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
  const [locationSearch, setLocationSearch] = useState<string>(() => window.location.search);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    const syncFromUrl = () => {
      setLocationSearch(window.location.search);
    };
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener(APP_URL_SEARCH_CHANGED, syncFromUrl);
    };
  }, []);

  const handleSelectView = useCallback((id: string) => {
    const sp = mergeViewIntoSearch(window.location.search, id);
    replaceUrlSearchParams(sp);
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 1800);
  }, []);

  const activeView = useMemo(
    () => readViewIdFromSearch(locationSearch, PLATFORM_NAV_VIEW_IDS) ?? "overview",
    [locationSearch],
  );
  const activeMeta = VIEW_META.get(activeView) ?? VIEW_META.get("overview")!;
  const routeContextCount = countRouteContextParams(locationSearch);
  const environmentSummary = summarizeAppApiBaseUrl(appApiBaseUrl);
  const handleResetContext = useCallback(() => {
    const sp = new URLSearchParams();
    sp.set("view", activeView);
    replaceUrlSearchParams(sp);
  }, [activeView]);

  return (
    <AppShell
      title="Platform"
      navigationGroups={NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.map((item) => ({ ...item })),
      }))}
      activeItemId={activeView}
      onSelect={handleSelectView}
      currentGroupLabel={activeMeta.groupLabel}
      currentPageLabel={activeMeta.label}
      currentPageDescription={activeMeta.description}
      environmentSummary={environmentSummary}
      routeContextCount={routeContextCount}
      onCopyLink={handleCopyLink}
      copyState={copyState}
      onResetContext={handleResetContext}
      commandSlot={<GlobalOperatorSearch />}
    >
      {renderView(activeView)}
    </AppShell>
  );
}

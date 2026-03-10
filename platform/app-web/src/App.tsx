import { useState } from "react";

import { appApiBaseUrl } from "./api/client";
import { AppShell } from "./components/shell";
import { AuditView } from "./features/audit/view";
import { CapabilitiesView } from "./features/capabilities/view";
import { DevicesView } from "./features/devices/view";
import { OverviewView } from "./features/overview/view";
import { PlatformHealthView } from "./features/platform-health/view";
import { PoliciesView } from "./features/policies/view";
import { TopologyView } from "./features/topology/view";
import { WorkflowsView } from "./features/workflows/view";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "devices", label: "Devices" },
  { id: "topology", label: "Topology" },
  { id: "policies", label: "Policies" },
  { id: "workflows", label: "Workflows" },
  { id: "audit", label: "Audit" },
  { id: "capabilities", label: "Capabilities" },
  { id: "platform-health", label: "Platform Health" },
] as const;

function renderView(viewId: string) {
  switch (viewId) {
    case "devices":
      return <DevicesView />;
    case "topology":
      return <TopologyView />;
    case "policies":
      return <PoliciesView />;
    case "workflows":
      return <WorkflowsView />;
    case "audit":
      return <AuditView />;
    case "capabilities":
      return <CapabilitiesView />;
    case "platform-health":
      return <PlatformHealthView />;
    case "overview":
    default:
      return <OverviewView />;
  }
}

export function App() {
  const [activeView, setActiveView] = useState<string>("overview");

  return (
    <AppShell
      title="Platform WebUI"
      navigationItems={NAV_ITEMS.map((item) => ({ ...item }))}
      activeItemId={activeView}
      onSelect={setActiveView}
    >
      <div className="page-header">
        <p className="eyebrow">Phase 2 Read-Only Foundation</p>
        <p className="body-copy">
          This WebUI now consumes the current read-only backend contracts for
          overview, platform status, devices, topology, policies, workflow
          history, audit history, and capabilities. Grafana remains the
          observability layer, and backend APIs remain the source of business
          logic.
        </p>
        <p className="meta-copy">Configured backend base URL: {appApiBaseUrl}</p>
      </div>
      {renderView(activeView)}
    </AppShell>
  );
}

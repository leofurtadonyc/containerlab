export interface NextShellNavItem {
  id: string;
  label: string;
  description: string;
}

export interface NextShellNavGroup {
  id: string;
  label: string;
  items: NextShellNavItem[];
}

export const NEXT_SHELL_NAV_GROUPS: readonly NextShellNavGroup[] = [
  {
    id: "home",
    label: "Home",
    items: [
      {
        id: "overview",
        label: "Overview",
        description: "Platform posture and next inspection pivots.",
      },
      {
        id: "platform-health",
        label: "Platform Health",
        description: "Read-path and controller-helper posture.",
      },
    ],
  },
  {
    id: "network",
    label: "Network",
    items: [
      { id: "devices", label: "Devices", description: "Normalized inventory and support evidence." },
      {
        id: "topology",
        label: "Topology",
        description: "Topology truth cues, object dossiers, and controller evidence.",
      },
      {
        id: "path-explorer",
        label: "Path Explorer",
        description: "Bounded path reasoning anchored on policy evidence.",
      },
    ],
  },
  {
    id: "policies-services",
    label: "Policies & Services",
    items: [
      {
        id: "policies",
        label: "Policies",
        description: "Policy inventory and composed evidence workspaces.",
      },
      {
        id: "service-explorer",
        label: "Service Explorer",
        description: "Service groupings over bounded policy inventory.",
      },
      {
        id: "service-dossier",
        label: "Service Dossier",
        description: "Composed service workspace and pivots.",
      },
      {
        id: "service-impact-workspace",
        label: "Service Impact",
        description: "Service-centric impact workspace.",
      },
    ],
  },
  {
    id: "evidence",
    label: "Evidence",
    items: [
      {
        id: "investigation",
        label: "Investigation",
        description: "Cross-domain troubleshooting workspace.",
      },
      {
        id: "situation-room",
        label: "Situation Room",
        description: "Situation evidence pack summary.",
      },
      {
        id: "operator-briefing",
        label: "Operator Briefing",
        description: "Bounded handoff context bundle.",
      },
      {
        id: "delta-digest",
        label: "Delta Digest",
        description: "Cross-domain bounded change digest.",
      },
      {
        id: "evidence-consistency",
        label: "Evidence Consistency",
        description: "Consistency tensions and interpretation notes.",
      },
      {
        id: "evidence-quality-workspace",
        label: "Evidence Quality",
        description: "Collection assurance and weakness context.",
      },
      {
        id: "stability-workspace",
        label: "Stability",
        description: "Operational churn and recurrence cues.",
      },
      {
        id: "evidence-replay",
        label: "Evidence Replay",
        description: "Frozen evidence replay, never live truth.",
      },
    ],
  },
  {
    id: "change-review",
    label: "Change Review",
    items: [
      {
        id: "maintenance-preview",
        label: "Maintenance Preview",
        description: "Bounded maintenance subject preview.",
      },
      {
        id: "maintenance-evidence-workspace",
        label: "Maintenance Evidence",
        description: "Maintenance-focused evidence context.",
      },
      {
        id: "maintenance-window-workspace",
        label: "Maintenance Window",
        description: "Subject-set planning and handoff context.",
      },
      {
        id: "impact-report",
        label: "Impact Report",
        description: "Report packaging across service/policy/maintenance.",
      },
      {
        id: "change-safety-case",
        label: "Change Safety Case",
        description: "Pre-change bounded reasoning and caveats.",
      },
    ],
  },
  {
    id: "workflow-controls",
    label: "Workflow Controls",
    items: [
      {
        id: "workflow-lifecycle",
        label: "Workflow Lifecycle",
        description: "Durable lifecycle records and transitions.",
      },
      { id: "preview-workspace", label: "Preview Workspace", description: "Preview request records and diffs." },
      {
        id: "validation-workspace",
        label: "Validation Workspace",
        description: "Validation request records and outcomes.",
      },
      {
        id: "safe-action-workspace",
        label: "Safe Action",
        description: "Bounded create/approve/execute flow with gates.",
      },
      {
        id: "rollback-workspace",
        label: "Rollback",
        description: "Compensation-only rollback flow and timeline.",
      },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      {
        id: "workflows",
        label: "Workflows",
        description: "Sync-derived workflow history.",
      },
      {
        id: "audit",
        label: "Audit",
        description: "Bounded audit-history and readiness anchors.",
      },
      {
        id: "capabilities",
        label: "Capabilities",
        description: "Current support matrix and posture.",
      },
      {
        id: "readiness",
        label: "Readiness",
        description: "Readiness blockers and prerequisite anchors.",
      },
    ],
  },
] as const;

export interface RouteContextChip {
  label: string;
  value: string;
}

const ROUTE_OBJECT_PARAMS = [
  "policy_id",
  "service_id",
  "topology_object",
  "impact_service_id",
  "impact_policy_id",
  "csc_policy_id",
  "csc_service_id",
  "maintenance_node_id",
  "maintenance_link_id",
  "maintenance_object_id",
  "workflow_lifecycle_id",
] as const;

const ROUTE_CONTEXT_PARAMS = [
  "policy_workspace",
  "topology_workspace",
  "impact_report_context",
  "change_safety_context",
  "maintenance_preview_context",
] as const;

export function buildRouteContextChips(search: string): RouteContextChip[] {
  const sp = new URLSearchParams(search);
  const chips: RouteContextChip[] = [];
  for (const key of ROUTE_OBJECT_PARAMS) {
    const value = sp.get(key)?.trim();
    if (value) {
      chips.push({ label: "Object", value });
      break;
    }
  }
  for (const key of ROUTE_CONTEXT_PARAMS) {
    const value = sp.get(key)?.trim();
    if (value) {
      chips.push({ label: "Context", value });
      break;
    }
  }
  return chips;
}

export function findGroupLabelForView(viewId: string): string {
  const hit = NEXT_SHELL_NAV_GROUPS.find((group) =>
    group.items.some((item) => item.id === viewId),
  );
  return hit?.label ?? "Home";
}

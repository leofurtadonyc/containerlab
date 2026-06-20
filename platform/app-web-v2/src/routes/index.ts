import type { V2AppId, V2Maturity } from '../app-registry'

export interface RouteRecord {
  id: string
  path: string
  appId: V2AppId
  tabId: string
  verticalMenuId: string
  maturity: V2Maturity
  breadcrumb: string
  facadeEndpointId: string
}

export interface NavItemDefinition {
  id: string
  label: string
  disabled?: boolean
}

export interface ObjectDeepLinkDefinition {
  context: string
  routePattern: string
  requiredParams: string[]
  drawerSource: string
}

export interface LegacyViewAlias {
  view: string
  routeId: string
  paramMapping: string
}

export const DEFAULT_ROUTE_PATH = '/app/launchpad'

export const INVALID_ROUTE_NOTICE =
  'Route not recognized. Showing Launchpad while preserving the original path for troubleshooting.'

export const ROUTE_REGISTRY: RouteRecord[] = [
  {
    id: 'launchpad.home',
    path: '/app/launchpad',
    appId: 'launchpad',
    tabId: 'launchpad.overview',
    verticalMenuId: 'launchpad.home',
    maturity: 'preview',
    breadcrumb: 'Launchpad',
    facadeEndpointId: 'GET /api/v2/launchpad/apps',
  },
  {
    id: 'commandCenter.overview',
    path: '/app/command-center',
    appId: 'command-center',
    tabId: 'command.overview',
    verticalMenuId: 'command.operationsOverview',
    maturity: 'bounded',
    breadcrumb: 'Command Center / Overview',
    facadeEndpointId: 'GET /api/v2/command-center/overview',
  },
  {
    id: 'commandCenter.incidents',
    path: '/app/command-center/incidents',
    appId: 'command-center',
    tabId: 'command.incidents',
    verticalMenuId: 'command.incidentQueue',
    maturity: 'preview',
    breadcrumb: 'Command Center / Incidents',
    facadeEndpointId: 'GET /api/v2/command-center/overview',
  },
  {
    id: 'commandCenter.situationRoom',
    path: '/app/command-center/situation-room',
    appId: 'command-center',
    tabId: 'command.investigations',
    verticalMenuId: 'command.incidentQueue',
    maturity: 'bounded',
    breadcrumb: 'Command Center / Situation Room',
    facadeEndpointId: 'GET /api/v2/command-center/overview',
  },
  {
    id: 'digitalTwin.overview',
    path: '/app/digital-twin',
    appId: 'digital-twin',
    tabId: 'twin.map',
    verticalMenuId: 'twin.physical',
    maturity: 'bounded',
    breadcrumb: 'Network Digital Twin / Map',
    facadeEndpointId: 'GET /api/v2/digital-twin/overview',
  },
  {
    id: 'digitalTwin.map',
    path: '/app/digital-twin/map',
    appId: 'digital-twin',
    tabId: 'twin.map',
    verticalMenuId: 'twin.physical',
    maturity: 'bounded',
    breadcrumb: 'Network Digital Twin / Map',
    facadeEndpointId: 'GET /api/v2/digital-twin/overview',
  },
  {
    id: 'digitalTwin.paths',
    path: '/app/digital-twin/paths',
    appId: 'digital-twin',
    tabId: 'twin.paths',
    verticalMenuId: 'twin.routing',
    maturity: 'bounded',
    breadcrumb: 'Network Digital Twin / Paths',
    facadeEndpointId: 'GET /api/v2/digital-twin/overview',
  },
  {
    id: 'digitalTwin.snapshots',
    path: '/app/digital-twin/snapshots',
    appId: 'digital-twin',
    tabId: 'twin.snapshots',
    verticalMenuId: 'twin.dossiers',
    maturity: 'bounded',
    breadcrumb: 'Network Digital Twin / Snapshots',
    facadeEndpointId: 'GET /api/v2/digital-twin/overview',
  },
  {
    id: 'digitalTwin.queries',
    path: '/app/digital-twin/queries',
    appId: 'digital-twin',
    tabId: 'twin.queries',
    verticalMenuId: 'twin.dossiers',
    maturity: 'preview',
    breadcrumb: 'Network Digital Twin / Queries',
    facadeEndpointId: 'GET /api/v2/digital-twin/overview',
  },
  {
    id: 'changeSafety.overview',
    path: '/app/change-safety',
    appId: 'change-safety',
    tabId: 'change.plans',
    verticalMenuId: 'change.plans',
    maturity: 'bounded',
    breadcrumb: 'Change Safety / Plans',
    facadeEndpointId: 'GET /api/v2/change-safety/dashboard',
  },
  {
    id: 'changeSafety.plans',
    path: '/app/change-safety/plans',
    appId: 'change-safety',
    tabId: 'change.plans',
    verticalMenuId: 'change.plans',
    maturity: 'bounded',
    breadcrumb: 'Change Safety / Plans',
    facadeEndpointId: 'GET /api/v2/change-safety/dashboard',
  },
  {
    id: 'changeSafety.approvalQueue',
    path: '/app/change-safety/approval-queue',
    appId: 'change-safety',
    tabId: 'change.approval',
    verticalMenuId: 'change.approvalQueue',
    maturity: 'bounded',
    breadcrumb: 'Change Safety / Approval Queue',
    facadeEndpointId: 'GET /api/v2/change-safety/dashboard',
  },
  {
    id: 'changeSafety.safetyCases',
    path: '/app/change-safety/safety-cases',
    appId: 'change-safety',
    tabId: 'change.safetyCases',
    verticalMenuId: 'change.safetyCases',
    maturity: 'bounded',
    breadcrumb: 'Change Safety / Safety Cases',
    facadeEndpointId: 'GET /api/v2/change-safety/{change_id}/safety-case',
  },
  {
    id: 'changeSafety.rollback',
    path: '/app/change-safety/rollback',
    appId: 'change-safety',
    tabId: 'change.rollback',
    verticalMenuId: 'change.rollbackReady',
    maturity: 'bounded',
    breadcrumb: 'Change Safety / Rollback',
    facadeEndpointId: 'GET /api/v2/change-safety/{change_id}/safety-case',
  },
  {
    id: 'serviceAssurance.overview',
    path: '/app/service-assurance',
    appId: 'service-assurance',
    tabId: 'service.overview',
    verticalMenuId: 'service.overview',
    maturity: 'bounded',
    breadcrumb: 'Service Assurance / Overview',
    facadeEndpointId: 'GET /api/v2/service-assurance/overview',
  },
  {
    id: 'transportEngineering.overview',
    path: '/app/transport-engineering',
    appId: 'transport-engineering',
    tabId: 'transport.overview',
    verticalMenuId: 'transport.networkTopology',
    maturity: 'preview',
    breadcrumb: 'Transport Engineering / Overview',
    facadeEndpointId: 'GET /api/v2/transport-engineering/overview',
  },
  {
    id: 'trafficIntelligence.overview',
    path: '/app/traffic-intelligence',
    appId: 'traffic-intelligence',
    tabId: 'traffic.overview',
    verticalMenuId: 'traffic.trafficMap',
    maturity: 'future',
    breadcrumb: 'Traffic Intelligence / Future',
    facadeEndpointId: 'GET /api/v2/traffic-intelligence/overview',
  },
  {
    id: 'intentCompliance.overview',
    path: '/app/intent-compliance',
    appId: 'intent-compliance',
    tabId: 'intent.overview',
    verticalMenuId: 'intent.overview',
    maturity: 'bounded',
    breadcrumb: 'Intent & Compliance / Overview',
    facadeEndpointId: 'GET /api/v2/intent-compliance/overview',
  },
  {
    id: 'automationStudio.overview',
    path: '/app/automation-studio',
    appId: 'automation-studio',
    tabId: 'automation.dashboard',
    verticalMenuId: 'automation.dashboard',
    maturity: 'bounded',
    breadcrumb: 'Automation Studio / Dashboard',
    facadeEndpointId: 'GET /api/v2/automation-studio/overview',
  },
  {
    id: 'aiAssistant.overview',
    path: '/app/ai-assistant',
    appId: 'ai-assistant',
    tabId: 'ai.newChat',
    verticalMenuId: 'ai.newChat',
    maturity: 'future',
    breadcrumb: 'AI Assistant / Future',
    facadeEndpointId: 'GET /api/v2/ai-assistant/context',
  },
  {
    id: 'adminPlatformOps.overview',
    path: '/app/admin-platform-ops',
    appId: 'admin-platform-ops',
    tabId: 'admin.overview',
    verticalMenuId: 'admin.overview',
    maturity: 'bounded',
    breadcrumb: 'Admin & Platform Ops / Overview',
    facadeEndpointId: 'GET /api/v2/admin-platform-ops/overview',
  },
]

export const APP_TABS_BY_APP: Record<V2AppId, NavItemDefinition[]> = {
  launchpad: [{ id: 'launchpad.overview', label: 'Overview' }],
  'command-center': [
    { id: 'command.overview', label: 'Overview' },
    { id: 'command.incidents', label: 'Incidents' },
    { id: 'command.investigations', label: 'Investigations' },
  ],
  'digital-twin': [
    { id: 'twin.map', label: 'Map' },
    { id: 'twin.paths', label: 'Paths' },
    { id: 'twin.snapshots', label: 'Snapshots' },
    { id: 'twin.queries', label: 'Queries' },
  ],
  'change-safety': [
    { id: 'change.plans', label: 'Plans' },
    { id: 'change.approval', label: 'Approval' },
    { id: 'change.safetyCases', label: 'Safety Cases' },
    { id: 'change.rollback', label: 'Rollback' },
  ],
  'service-assurance': [{ id: 'service.overview', label: 'Overview' }],
  'transport-engineering': [{ id: 'transport.overview', label: 'Overview' }],
  'traffic-intelligence': [{ id: 'traffic.overview', label: 'Overview' }],
  'intent-compliance': [{ id: 'intent.overview', label: 'Overview' }],
  'automation-studio': [{ id: 'automation.dashboard', label: 'Dashboard' }],
  'ai-assistant': [{ id: 'ai.newChat', label: 'New Chat' }],
  'admin-platform-ops': [{ id: 'admin.overview', label: 'Overview' }],
}

export const APP_VERTICAL_MENU_BY_APP: Record<V2AppId, NavItemDefinition[]> = {
  launchpad: [{ id: 'launchpad.home', label: 'Launchpad' }],
  'command-center': [
    { id: 'command.operationsOverview', label: 'Operations Overview' },
    { id: 'command.incidentQueue', label: 'Incident Queue' },
    { id: 'command.allIncidents', label: 'All Incidents', disabled: true },
    { id: 'command.majorIncidents', label: 'Major Incidents', disabled: true },
    { id: 'command.myAssignments', label: 'My Assignments', disabled: true },
    { id: 'command.sloBreaches', label: 'SLO Breaches', disabled: true },
    { id: 'command.watchlist', label: 'Watchlist', disabled: true },
  ],
  'digital-twin': [
    { id: 'twin.physical', label: 'Physical' },
    { id: 'twin.logical', label: 'Logical', disabled: true },
    { id: 'twin.routing', label: 'Routing' },
    { id: 'twin.mplsSr', label: 'MPLS / SR', disabled: true },
    { id: 'twin.services', label: 'Services', disabled: true },
    { id: 'twin.policies', label: 'Policies', disabled: true },
    { id: 'twin.controller', label: 'Controller', disabled: true },
    { id: 'twin.dossiers', label: 'Dossiers' },
  ],
  'change-safety': [
    { id: 'change.plans', label: 'Plans' },
    { id: 'change.approvalQueue', label: 'Approval Queue' },
    { id: 'change.safetyCases', label: 'Safety Cases' },
    { id: 'change.rollbackReady', label: 'Rollback Ready' },
  ],
  'service-assurance': [{ id: 'service.overview', label: 'Overview' }],
  'transport-engineering': [{ id: 'transport.networkTopology', label: 'Network Topology' }],
  'traffic-intelligence': [{ id: 'traffic.trafficMap', label: 'Traffic Map' }],
  'intent-compliance': [{ id: 'intent.overview', label: 'Overview' }],
  'automation-studio': [{ id: 'automation.dashboard', label: 'Dashboard' }],
  'ai-assistant': [{ id: 'ai.newChat', label: 'New Chat' }],
  'admin-platform-ops': [{ id: 'admin.overview', label: 'Overview' }],
}

export const OBJECT_DEEP_LINKS: ObjectDeepLinkDefinition[] = [
  {
    context: 'topology object',
    routePattern: '/app/digital-twin/objects/:objectId',
    requiredParams: ['objectId', 'objectKind'],
    drawerSource: '/api/v2/digital-twin/objects/{object_id}/context',
  },
  {
    context: 'policy',
    routePattern: '/app/intent-compliance/policies/:policyId',
    requiredParams: ['policyId'],
    drawerSource: 'policy dossier facade section',
  },
  {
    context: 'service',
    routePattern: '/app/service-assurance/services/:serviceId',
    requiredParams: ['serviceId'],
    drawerSource: 'service dossier facade section',
  },
  {
    context: 'change',
    routePattern: '/app/change-safety/changes/:changeId',
    requiredParams: ['changeId'],
    drawerSource: 'safety case facade',
  },
  {
    context: 'workflow',
    routePattern: '/app/automation-studio/workflows/:workflowId',
    requiredParams: ['workflowId'],
    drawerSource: 'workflow lifecycle',
  },
  {
    context: 'action',
    routePattern: '/app/automation-studio/safe-actions/:actionId',
    requiredParams: ['actionId'],
    drawerSource: 'safe action detail',
  },
  {
    context: 'rollback',
    routePattern: '/app/automation-studio/rollbacks/:rollbackId',
    requiredParams: ['rollbackId'],
    drawerSource: 'rollback detail',
  },
]

export const LEGACY_VIEW_ALIASES: LegacyViewAlias[] = [
  { view: 'overview', routeId: 'launchpad.home', paramMapping: 'none' },
  { view: 'platform-health', routeId: 'adminPlatformOps.overview', paramMapping: 'none' },
  { view: 'devices', routeId: 'digitalTwin.overview', paramMapping: 'optional device filter retained as query' },
  { view: 'topology', routeId: 'digitalTwin.map', paramMapping: 'topology_object -> object deep link when present' },
  { view: 'path-explorer', routeId: 'digitalTwin.paths', paramMapping: 'preserve policy/path query params' },
  { view: 'policies', routeId: 'intentCompliance.overview', paramMapping: 'policy_id -> policy deep link' },
  { view: 'service-explorer', routeId: 'serviceAssurance.overview', paramMapping: 'preserve service filters' },
  { view: 'service-dossier', routeId: 'serviceAssurance.overview', paramMapping: 'service_id -> service deep link' },
  {
    view: 'service-impact-workspace',
    routeId: 'serviceAssurance.overview',
    paramMapping: 'service_impact_workspace_service_id -> service deep link',
  },
  { view: 'delta-digest', routeId: 'commandCenter.overview', paramMapping: 'preserve sync_runs_limit' },
  { view: 'investigation', routeId: 'commandCenter.overview', paramMapping: 'preserve investigation params as query' },
  { view: 'situation-room', routeId: 'commandCenter.situationRoom', paramMapping: 'preserve sync_runs_limit' },
  { view: 'operator-briefing', routeId: 'commandCenter.overview', paramMapping: 'preserve briefing query' },
  { view: 'evidence-consistency', routeId: 'commandCenter.overview', paramMapping: 'preserve sync_runs_limit' },
  { view: 'evidence-quality-workspace', routeId: 'commandCenter.overview', paramMapping: 'preserve sync_runs_limit' },
  {
    view: 'stability-workspace',
    routeId: 'commandCenter.overview',
    paramMapping: 'preserve object context if present',
  },
  { view: 'maintenance-preview', routeId: 'changeSafety.plans', paramMapping: 'preserve maintenance subject params' },
  {
    view: 'maintenance-evidence-workspace',
    routeId: 'changeSafety.plans',
    paramMapping: 'preserve maintenance subject params',
  },
  {
    view: 'maintenance-window-workspace',
    routeId: 'changeSafety.plans',
    paramMapping: 'mww_subject -> subject query',
  },
  { view: 'impact-report', routeId: 'changeSafety.safetyCases', paramMapping: 'preserve report subject' },
  {
    view: 'change-safety-case',
    routeId: 'changeSafety.safetyCases',
    paramMapping: 'preserve policy/service/maintenance params',
  },
  { view: 'workflow-lifecycle', routeId: 'automationStudio.overview', paramMapping: 'workflow_id -> workflow deep link' },
  { view: 'preview-workspace', routeId: 'automationStudio.overview', paramMapping: 'preview_id -> preview query' },
  { view: 'validation-workspace', routeId: 'automationStudio.overview', paramMapping: 'validation_id -> validation query' },
  { view: 'safe-action-workspace', routeId: 'automationStudio.overview', paramMapping: 'action_id -> action deep link' },
  { view: 'rollback-workspace', routeId: 'automationStudio.overview', paramMapping: 'rollback_id -> rollback deep link' },
  { view: 'workflows', routeId: 'adminPlatformOps.overview', paramMapping: 'preserve read-side query params' },
  { view: 'audit', routeId: 'adminPlatformOps.overview', paramMapping: 'preserve read-side query params' },
  { view: 'capabilities', routeId: 'launchpad.home', paramMapping: 'open capabilities drawer' },
  { view: 'readiness', routeId: 'adminPlatformOps.overview', paramMapping: 'open readiness drawer' },
  { view: 'evidence-replay', routeId: 'commandCenter.overview', paramMapping: 'open evidence replay panel' },
]

export function getRouteById(routeId: string): RouteRecord | undefined {
  return ROUTE_REGISTRY.find((route) => route.id === routeId)
}

export function getRouteByPath(path: string): RouteRecord | undefined {
  return ROUTE_REGISTRY.find((route) => route.path === path)
}

export function getDefaultPathForApp(appId: string): string {
  const route = ROUTE_REGISTRY.find((r) => r.appId === appId)
  return route ? route.path : DEFAULT_ROUTE_PATH
}

export function getBreadcrumb(path: string): string | undefined {
  return getRouteByPath(path)?.breadcrumb
}

export function getObjectDeepLinkPattern(context: string): ObjectDeepLinkDefinition | undefined {
  return OBJECT_DEEP_LINKS.find((deepLink) => deepLink.context === context)
}

export function resolveLegacyAlias(view: string): {
  decision: 'mapped' | 'legacy_mapping_unknown'
  routeId: string
  routePath: string
  paramMapping: string
} {
  const match = LEGACY_VIEW_ALIASES.find((entry) => entry.view === view)
  if (!match) {
    const fallbackRoute = getRouteById('launchpad.home')
    return {
      decision: 'legacy_mapping_unknown',
      routeId: 'launchpad.home',
      routePath: fallbackRoute ? fallbackRoute.path : DEFAULT_ROUTE_PATH,
      paramMapping: 'legacy_mapping_unknown',
    }
  }

  const mappedRoute = getRouteById(match.routeId)
  return {
    decision: 'mapped',
    routeId: match.routeId,
    routePath: mappedRoute ? mappedRoute.path : DEFAULT_ROUTE_PATH,
    paramMapping: match.paramMapping,
  }
}

export function buildLegacyRedirectTarget(legacySearch: string): {
  decision: 'mapped' | 'legacy_mapping_unknown'
  routeId: string
  targetPath: string
  query: string
  notice?: string
} {
  const raw = legacySearch.startsWith('?') ? legacySearch.slice(1) : legacySearch
  const params = new URLSearchParams(raw)
  const view = params.get('view') ?? ''
  const resolved = resolveLegacyAlias(view)

  // Preserve operator context from incoming legacy links.
  params.delete('view')
  const query = params.toString()

  return {
    decision: resolved.decision,
    routeId: resolved.routeId,
    targetPath: resolved.routePath,
    query,
    notice: resolved.decision === 'legacy_mapping_unknown' ? INVALID_ROUTE_NOTICE : undefined,
  }
}

export function getInvalidRouteFallback(path: string): {
  requestedPath: string
  fallbackPath: string
  fallbackRouteId: string
  notice: string
} {
  return {
    requestedPath: path,
    fallbackPath: DEFAULT_ROUTE_PATH,
    fallbackRouteId: 'launchpad.home',
    notice: INVALID_ROUTE_NOTICE,
  }
}

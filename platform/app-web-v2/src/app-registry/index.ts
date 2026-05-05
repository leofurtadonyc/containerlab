export type V2AppId =
  | 'launchpad'
  | 'command-center'
  | 'digital-twin'
  | 'change-safety'
  | 'service-assurance'
  | 'transport-engineering'
  | 'traffic-intelligence'
  | 'intent-compliance'
  | 'automation-studio'
  | 'ai-assistant'
  | 'admin-platform-ops'

export type V2Maturity = 'available' | 'bounded' | 'preview' | 'future' | 'backend_only' | 'not_implemented'

export interface V2AppRegistryRecord {
  id: V2AppId
  label: string
  defaultRoute: string
  route: string
  maturity: V2Maturity
  featureFlag: string
  requiredPermission: 'read'
}

export const APP_REGISTRY: V2AppRegistryRecord[] = [
  {
    id: 'launchpad',
    label: 'Launchpad',
    defaultRoute: '/app/launchpad',
    route: '/app/launchpad',
    maturity: 'preview',
    featureFlag: 'v2.launchpad',
    requiredPermission: 'read',
  },
  {
    id: 'command-center',
    label: 'Command Center',
    defaultRoute: '/app/command-center',
    route: '/app/command-center',
    maturity: 'bounded',
    featureFlag: 'v2.commandCenter',
    requiredPermission: 'read',
  },
  {
    id: 'digital-twin',
    label: 'Network Digital Twin',
    defaultRoute: '/app/digital-twin',
    route: '/app/digital-twin',
    maturity: 'bounded',
    featureFlag: 'v2.digitalTwin',
    requiredPermission: 'read',
  },
  {
    id: 'change-safety',
    label: 'Change Safety',
    defaultRoute: '/app/change-safety',
    route: '/app/change-safety',
    maturity: 'bounded',
    featureFlag: 'v2.changeSafety',
    requiredPermission: 'read',
  },
  {
    id: 'service-assurance',
    label: 'Service Assurance',
    defaultRoute: '/app/service-assurance',
    route: '/app/service-assurance',
    maturity: 'bounded',
    featureFlag: 'v2.serviceAssurance',
    requiredPermission: 'read',
  },
  {
    id: 'transport-engineering',
    label: 'Transport Engineering',
    defaultRoute: '/app/transport-engineering',
    route: '/app/transport-engineering',
    maturity: 'preview',
    featureFlag: 'v2.transportEngineering',
    requiredPermission: 'read',
  },
  {
    id: 'traffic-intelligence',
    label: 'Traffic Intelligence',
    defaultRoute: '/app/traffic-intelligence',
    route: '/app/traffic-intelligence',
    maturity: 'future',
    featureFlag: 'v2.trafficIntelligence',
    requiredPermission: 'read',
  },
  {
    id: 'intent-compliance',
    label: 'Intent & Compliance',
    defaultRoute: '/app/intent-compliance',
    route: '/app/intent-compliance',
    maturity: 'bounded',
    featureFlag: 'v2.intentCompliance',
    requiredPermission: 'read',
  },
  {
    id: 'automation-studio',
    label: 'Automation Studio',
    defaultRoute: '/app/automation-studio',
    route: '/app/automation-studio',
    maturity: 'bounded',
    featureFlag: 'v2.automationStudio',
    requiredPermission: 'read',
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    defaultRoute: '/app/ai-assistant',
    route: '/app/ai-assistant',
    maturity: 'future',
    featureFlag: 'v2.aiAssistant',
    requiredPermission: 'read',
  },
  {
    id: 'admin-platform-ops',
    label: 'Admin & Platform Ops',
    defaultRoute: '/app/admin-platform-ops',
    route: '/app/admin-platform-ops',
    maturity: 'bounded',
    featureFlag: 'v2.adminPlatformOps',
    requiredPermission: 'read',
  },
]

export const DEFAULT_APP_ID: V2AppId = 'launchpad'

export function getAppRegistryRecord(appId: V2AppId): V2AppRegistryRecord {
  const app = APP_REGISTRY.find((entry) => entry.id === appId)
  if (!app) {
    throw new Error(`Unknown app id: ${appId}`)
  }
  return app
}

export function getDefaultAppRoute(): string {
  return getAppRegistryRecord(DEFAULT_APP_ID).defaultRoute
}

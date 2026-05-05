import { APP_REGISTRY } from '../src/app-registry'
import { APP_TABS_BY_APP, APP_VERTICAL_MENU_BY_APP, ROUTE_REGISTRY } from '../src/routes'
import { describe, expect, it } from 'vitest'

describe('route registry', () => {
  it('contains all required foundation and batch-1 route paths', () => {
    const requiredPaths = [
      '/app/launchpad',
      '/app/command-center',
      '/app/command-center/incidents',
      '/app/command-center/situation-room',
      '/app/digital-twin',
      '/app/digital-twin/map',
      '/app/digital-twin/paths',
      '/app/digital-twin/snapshots',
      '/app/digital-twin/queries',
      '/app/change-safety',
      '/app/change-safety/plans',
      '/app/change-safety/approval-queue',
      '/app/change-safety/safety-cases',
      '/app/change-safety/rollback',
      '/app/service-assurance',
      '/app/transport-engineering',
      '/app/traffic-intelligence',
      '/app/intent-compliance',
      '/app/automation-studio',
      '/app/ai-assistant',
      '/app/admin-platform-ops',
    ]

    expect(ROUTE_REGISTRY.map((route) => route.path)).toEqual(requiredPaths)
  })

  it('keeps route app ids and nav ids consistent with registries', () => {
    const appIds = new Set(APP_REGISTRY.map((app) => app.id))

    for (const route of ROUTE_REGISTRY) {
      expect(appIds.has(route.appId)).toBe(true)
      expect(APP_TABS_BY_APP[route.appId].some((tab) => tab.id === route.tabId)).toBe(true)
      expect(APP_VERTICAL_MENU_BY_APP[route.appId].some((menu) => menu.id === route.verticalMenuId)).toBe(true)
    }
  })
})

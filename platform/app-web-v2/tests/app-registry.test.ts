import { APP_REGISTRY, DEFAULT_APP_ID, getDefaultAppRoute } from '../src/app-registry'
import { ROUTE_REGISTRY } from '../src/routes'
import { describe, expect, it } from 'vitest'

describe('app registry', () => {
  it('contains all 11 approved apps', () => {
    expect(APP_REGISTRY).toHaveLength(11)
    expect(new Set(APP_REGISTRY.map((app) => app.id)).size).toBe(11)
  })

  it('has a valid default app route mapping', () => {
    const defaultApp = APP_REGISTRY.find((app) => app.id === DEFAULT_APP_ID)
    expect(defaultApp).toBeDefined()
    expect(getDefaultAppRoute()).toBe('/app/launchpad')
    expect(ROUTE_REGISTRY.some((route) => route.path === getDefaultAppRoute())).toBe(true)
  })
})

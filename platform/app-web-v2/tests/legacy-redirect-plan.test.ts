import { buildLegacyRedirectTarget, INVALID_ROUTE_NOTICE } from '../src/routes'
import { describe, expect, it } from 'vitest'

describe('legacy redirect plan contract', () => {
  it('maps known legacy view and preserves non-view query params', () => {
    const redirect = buildLegacyRedirectTarget('?view=service-explorer&service_id=svc-100&scope=core')

    expect(redirect.decision).toBe('mapped')
    expect(redirect.routeId).toBe('serviceAssurance.overview')
    expect(redirect.targetPath).toBe('/app/service-assurance')
    expect(redirect.query).toBe('service_id=svc-100&scope=core')
    expect(redirect.notice).toBeUndefined()
  })

  it('routes unknown legacy view to launchpad with compatibility notice', () => {
    const redirect = buildLegacyRedirectTarget('?view=unknown-view-id&foo=bar')

    expect(redirect.decision).toBe('legacy_mapping_unknown')
    expect(redirect.routeId).toBe('launchpad.home')
    expect(redirect.targetPath).toBe('/app/launchpad')
    expect(redirect.query).toBe('foo=bar')
    expect(redirect.notice).toBe(INVALID_ROUTE_NOTICE)
  })

  it('supports legacy searches without leading question mark', () => {
    const redirect = buildLegacyRedirectTarget('view=platform-health&tab=runtime')

    expect(redirect.decision).toBe('mapped')
    expect(redirect.routeId).toBe('adminPlatformOps.overview')
    expect(redirect.targetPath).toBe('/app/admin-platform-ops')
    expect(redirect.query).toBe('tab=runtime')
  })
})

import { getInvalidRouteFallback, getRouteByPath } from '../src/routes'
import { describe, expect, it } from 'vitest'

describe('invalid route behavior', () => {
  it('falls back to launchpad and keeps compatibility notice', () => {
    const fallback = getInvalidRouteFallback('/app/unknown-screen')

    expect(fallback.fallbackRouteId).toBe('launchpad.home')
    expect(fallback.fallbackPath).toBe('/app/launchpad')
    expect(fallback.requestedPath).toBe('/app/unknown-screen')
    expect(fallback.notice).toContain('Route not recognized')
    expect(fallback.notice).toContain('preserving the original path')
  })

  it('returns no route record for an unknown path', () => {
    expect(getRouteByPath('/app/unknown-screen')).toBeUndefined()
  })
})

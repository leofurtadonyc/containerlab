import { LEGACY_VIEW_ALIASES, resolveLegacyAlias } from '../src/routes'
import { describe, expect, it } from 'vitest'

describe('legacy view aliases', () => {
  it('maps all known v1 view ids to v2 routes', () => {
    expect(LEGACY_VIEW_ALIASES).toHaveLength(31)
    expect(new Set(LEGACY_VIEW_ALIASES.map((entry) => entry.view)).size).toBe(31)

    for (const entry of LEGACY_VIEW_ALIASES) {
      const resolved = resolveLegacyAlias(entry.view)
      expect(resolved.decision).toBe('mapped')
      expect(resolved.routeId).toBe(entry.routeId)
      expect(resolved.routePath.startsWith('/app/')).toBe(true)
    }
  })

  it('marks unknown legacy views as legacy_mapping_unknown', () => {
    const resolved = resolveLegacyAlias('unknown-view-id')

    expect(resolved.decision).toBe('legacy_mapping_unknown')
    expect(resolved.routeId).toBe('launchpad.home')
    expect(resolved.routePath).toBe('/app/launchpad')
  })
})

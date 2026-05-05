import { OBJECT_DEEP_LINKS, getObjectDeepLinkPattern } from '../src/routes'
import { describe, expect, it } from 'vitest'

describe('object deep links', () => {
  it('contains all required deep link contexts', () => {
    expect(OBJECT_DEEP_LINKS.map((entry) => entry.context)).toEqual([
      'topology object',
      'policy',
      'service',
      'change',
      'workflow',
      'action',
      'rollback',
    ])
  })

  it('resolves deep link pattern metadata by context', () => {
    const topology = getObjectDeepLinkPattern('topology object')
    expect(topology?.routePattern).toBe('/app/digital-twin/objects/:objectId')
    expect(topology?.requiredParams).toContain('objectId')
    expect(topology?.requiredParams).toContain('objectKind')
  })
})

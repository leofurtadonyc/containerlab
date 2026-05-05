import { getBreadcrumb } from '../src/routes'
import { describe, expect, it } from 'vitest'

describe('breadcrumbs', () => {
  it('returns breadcrumb metadata for known routes', () => {
    expect(getBreadcrumb('/app/launchpad')).toBe('Launchpad')
    expect(getBreadcrumb('/app/change-safety/approval-queue')).toBe('Change Safety / Approval Queue')
    expect(getBreadcrumb('/app/automation-studio')).toBe('Automation Studio / Dashboard')
  })

  it('returns undefined for unknown routes', () => {
    expect(getBreadcrumb('/app/not-real')).toBeUndefined()
  })
})

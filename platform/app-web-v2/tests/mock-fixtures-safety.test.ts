import { facadeClient } from '../src/api/client'
import { describe, expect, it } from 'vitest'

describe('mock fixtures safety posture', () => {
  it('marks future capabilities as future or not_implemented', async () => {
    const response = await facadeClient.getLaunchpadApps()

    const futureApps = response.apps.filter((app) => app.maturity === 'future')
    expect(futureApps.length).toBeGreaterThan(0)
    expect(futureApps.every((app) => app.status === 'future')).toBe(true)
    expect(futureApps.every((app) => app.current_posture === 'backend_not_implemented')).toBe(true)
  })

  it('includes safety-sensitive non-claims in change safety fixtures', async () => {
    const dashboard = await facadeClient.getChangeSafetyDashboard()
    const safetyCase = await facadeClient.getChangeSafetyCase('chg-200')

    expect(dashboard.non_claims.join(' ')).toContain('Validation is gate input, not network proof.')
    expect(safetyCase.non_claims.join(' ')).toContain('No guaranteed safe execution')
    expect(safetyCase.non_claims.join(' ')).toContain('no universal rollback')
  })

  it('does not expose forbidden claims in fixture non-claims', async () => {
    const response = await facadeClient.getLaunchpadApps()
    const allCopy = [...response.non_claims, ...response.apps.flatMap((app) => app.non_claims)].join(' ').toLowerCase()

    expect(allCopy).not.toContain('production ready')
    expect(allCopy).not.toContain('autonomous remediation')
    expect(allCopy).not.toContain('guaranteed safe')
    expect(allCopy).not.toContain('guaranteed rollback')
  })
})

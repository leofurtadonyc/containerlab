import { cleanup, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '../src/App'

describe('shared components', () => {
  it('renders shell primitives and navigation landmarks', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'App sidebar' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'App tabs' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Section menu' })).toBeInTheDocument()
  })

  it('shows status text labels without relying on color only', () => {
    window.history.replaceState({}, '', '/app/launchpad')
    render(<App />)

    expect(screen.getAllByText(/readOnly/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText('future').length).toBeGreaterThan(0)
  })

  it('renders query-state components', () => {
    window.history.replaceState({}, '', '/app/admin-platform-ops?adminPlatformOpsState=loading')
    render(<App />)
    expect(screen.getByText(/Loading state example/i)).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/admin-platform-ops?adminPlatformOpsState=empty')
    render(<App />)
    expect(screen.getByText(/No admin\/runtime evidence available\./i)).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/admin-platform-ops?adminPlatformOpsState=error')
    render(<App />)
    expect(screen.getByText(/Admin & Platform Ops data error/i)).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/admin-platform-ops?adminPlatformOpsState=degraded')
    render(<App />)
    expect(
      screen.getAllByText('Partial evidence only. Some sources are missing, stale, or unavailable.').length,
    ).toBeGreaterThan(0)
  })

  it('renders drawers with accessible names and non-claim copy', () => {
    window.history.replaceState({}, '', '/app/launchpad')
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions
      .map((region) => region.getAttribute('aria-label'))
      .filter((label): label is string => Boolean(label))

    expect(labels).toContain('Selected app context')
    expect(labels).toContain('Evidence sections')
    expect(
      screen.getAllByText(
        'Platform posture is bounded by available backend evidence and does not indicate production readiness.',
      ).length,
    ).toBeGreaterThan(0)
  })
})

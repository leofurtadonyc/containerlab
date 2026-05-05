import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('admin platform ops app', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders admin-platform-ops route target', () => {
    window.history.replaceState({}, '', '/app/admin-platform-ops')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Admin & Platform Ops' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Service health' })).toBeInTheDocument()
  })

  it('shows exact admin non-claim copy', () => {
    window.history.replaceState({}, '', '/app/admin-platform-ops')
    render(<App />)

    expect(
      screen.getAllByText('Admin controls are read-only placeholders unless backend auth/RBAC and configuration APIs exist.').length,
    ).toBeGreaterThan(0)
  })

  it('keeps admin controls disabled', () => {
    window.history.replaceState({}, '', '/app/admin-platform-ops')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Add user' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Update RBAC roles' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Write configuration' })).toBeDisabled()
  })

  it('renders platform context drawers', () => {
    window.history.replaceState({}, '', '/app/admin-platform-ops')
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions.map((region) => region.getAttribute('aria-label'))
    expect(labels).toContain('Selected platform context')
    expect(labels).toContain('Evidence sections')
  })

  it('supports loading, empty, error, and degraded states via route query', () => {
    window.history.replaceState({}, '', '/app/admin-platform-ops?adminPlatformOpsState=loading')
    render(<App />)
    expect(screen.getByText('Loading state example')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/admin-platform-ops?adminPlatformOpsState=empty')
    render(<App />)
    expect(screen.getByText('No admin/runtime evidence available.')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/admin-platform-ops?adminPlatformOpsState=error')
    render(<App />)
    expect(screen.getByText('Admin & Platform Ops data error')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/admin-platform-ops?adminPlatformOpsState=degraded')
    render(<App />)
    expect(
      screen.getByText('Partial evidence only. Some sources are missing, stale, or unavailable.'),
    ).toBeInTheDocument()
  })

  it('does not show forbidden admin write claims', () => {
    window.history.replaceState({}, '', '/app/admin-platform-ops')
    render(<App />)

    expect(screen.queryByText(/add user enabled/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/rbac write successful/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/configuration saved/i)).not.toBeInTheDocument()
  })
})

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('launchpad app', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    window.history.replaceState({}, '', '/app/launchpad')
  })

  it('renders launchpad route and title', () => {
    render(<App />)

    expect(screen.getByText('Platform Launchpad')).toBeInTheDocument()
  })

  it('renders all approved apps as tiles', () => {
    render(<App />)

    expect(screen.getAllByRole('button').filter((button) => button.className.includes('launchpad-tile')).length).toBe(11)
  })

  it('shows future capability cards for future apps', () => {
    render(<App />)

    expect(screen.getAllByText('Traffic Intelligence').length).toBeGreaterThan(0)
    expect(screen.getAllByText('AI Assistant').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Future capability: backend support is not implemented yet.').length,
    ).toBeGreaterThan(0)
  })

  it('shows bounded posture and production-readiness non-claim copy', () => {
    render(<App />)

    expect(
      screen.getAllByText(
        'Platform posture is bounded by available backend evidence and does not indicate production readiness.',
      ),
    ).not.toHaveLength(0)
    expect(
      screen.getByText('This platform is not production-ready and remains conditionally ready with explicit limits.'),
    ).toBeInTheDocument()
  })

  it('supports degraded launchpad state via route query', () => {
    window.history.replaceState({}, '', '/app/launchpad?launchpadState=degraded')
    render(<App />)

    expect(
      screen.getByText('Partial evidence only. Some sources are missing, stale, or unavailable.'),
    ).toBeInTheDocument()
  })

  it('supports loading, empty, and error launchpad states via route query', () => {
    window.history.replaceState({}, '', '/app/launchpad?launchpadState=loading')
    render(<App />)
    expect(screen.getByText('Loading state example')).toBeInTheDocument()
  })

  it('supports empty launchpad state via route query', () => {
    window.history.replaceState({}, '', '/app/launchpad?launchpadState=empty')
    render(<App />)
    expect(screen.getByText('No app posture is available yet.')).toBeInTheDocument()
  })

  it('supports error launchpad state via route query', () => {
    window.history.replaceState({}, '', '/app/launchpad?launchpadState=error')
    render(<App />)
    expect(screen.getByText('Launchpad data error')).toBeInTheDocument()
  })
})

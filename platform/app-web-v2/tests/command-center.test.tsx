import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('command center app', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders overview route target', () => {
    window.history.replaceState({}, '', '/app/command-center')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Command Center' })).toBeInTheDocument()
    expect(screen.getByText('Triage workspace: Overview')).toBeInTheDocument()
  })

  it('renders incidents and situation-room route targets', () => {
    window.history.replaceState({}, '', '/app/command-center/incidents')
    render(<App />)
    expect(screen.getByText('Triage workspace: Incidents')).toBeInTheDocument()

    cleanup()

    window.history.replaceState({}, '', '/app/command-center/situation-room')
    render(<App />)
    expect(screen.getByText('Triage workspace: Situation Room')).toBeInTheDocument()
  })

  it('shows exact command-center safety copy', () => {
    window.history.replaceState({}, '', '/app/command-center')
    render(<App />)

    expect(
      screen.getAllByText('Triage view only. This screen does not determine root cause or authorize remediation.')
        .length,
    ).toBeGreaterThan(0)
  })

  it('keeps assignment and remediation controls disabled', () => {
    window.history.replaceState({}, '', '/app/command-center')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Assign owner' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Create incident' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Run remediation' })).toBeDisabled()
  })

  it('renders command-center context drawer', () => {
    window.history.replaceState({}, '', '/app/command-center')
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions.map((region) => region.getAttribute('aria-label'))
    expect(labels).toContain('Selected incident context')
    expect(labels).toContain('Evidence sections')
  })

  it('supports degraded, loading, empty, and error states via route query', () => {
    window.history.replaceState({}, '', '/app/command-center?commandCenterState=degraded')
    render(<App />)
    expect(
      screen.getByText('Partial evidence only. Some sources are missing, stale, or unavailable.'),
    ).toBeInTheDocument()

    cleanup()

    window.history.replaceState({}, '', '/app/command-center?commandCenterState=loading')
    render(<App />)
    expect(screen.getByText('Loading state example')).toBeInTheDocument()

    cleanup()

    window.history.replaceState({}, '', '/app/command-center?commandCenterState=empty')
    render(<App />)
    expect(screen.getByText('No active incidents.')).toBeInTheDocument()

    cleanup()

    window.history.replaceState({}, '', '/app/command-center?commandCenterState=error')
    render(<App />)
    expect(screen.getByText('Command Center data error')).toBeInTheDocument()
  })

  it('does not show forbidden root-cause claim wording', () => {
    window.history.replaceState({}, '', '/app/command-center')
    render(<App />)

    expect(screen.queryByText('Root cause confirmed')).not.toBeInTheDocument()
  })
})

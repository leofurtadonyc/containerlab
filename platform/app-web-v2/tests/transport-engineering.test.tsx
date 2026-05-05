import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('transport engineering app', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders transport-engineering route target', () => {
    window.history.replaceState({}, '', '/app/transport-engineering')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Transport Engineering' })).toBeInTheDocument()
    expect(screen.getByText('Network topology map')).toBeInTheDocument()
  })

  it('shows exact transport non-claim copy', () => {
    window.history.replaceState({}, '', '/app/transport-engineering')
    render(<App />)

    expect(
      screen.getAllByText('Transport engineering views are evidence-backed planning aids, not controller programming.').length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Optimization actions are disabled until backend support exists.').length,
    ).toBeGreaterThan(0)
  })

  it('keeps transport actions disabled', () => {
    window.history.replaceState({}, '', '/app/transport-engineering')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Compute paths' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Optimize network' })).toBeDisabled()
  })

  it('renders transport context drawer', () => {
    window.history.replaceState({}, '', '/app/transport-engineering')
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions.map((region) => region.getAttribute('aria-label'))
    expect(labels).toContain('Selected transport context')
    expect(labels).toContain('Evidence sections')
  })

  it('supports loading, empty, error, and degraded states via route query', () => {
    window.history.replaceState({}, '', '/app/transport-engineering?transportEngineeringState=loading')
    render(<App />)
    expect(screen.getByText('Loading state example')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/transport-engineering?transportEngineeringState=empty')
    render(<App />)
    expect(screen.getByText('No path/topology evidence.')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/transport-engineering?transportEngineeringState=error')
    render(<App />)
    expect(screen.getByText('Transport Engineering data error')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/transport-engineering?transportEngineeringState=degraded')
    render(<App />)
    expect(
      screen.getByText('Partial evidence only. Some sources are missing, stale, or unavailable.'),
    ).toBeInTheDocument()
  })

  it('does not show forbidden optimization wording', () => {
    window.history.replaceState({}, '', '/app/transport-engineering')
    render(<App />)

    expect(screen.queryByText(/optimize network now/i)).not.toBeInTheDocument()
  })
})

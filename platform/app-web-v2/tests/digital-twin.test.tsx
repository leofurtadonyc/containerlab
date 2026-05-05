import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('digital twin app', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders digital twin route targets', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Network Digital Twin' })).toBeInTheDocument()
    expect(screen.getByText('Digital Twin workspace: Map')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/digital-twin/paths')
    render(<App />)
    expect(screen.getByText('Digital Twin workspace: Paths')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/digital-twin/snapshots')
    render(<App />)
    expect(screen.getByText('Digital Twin workspace: Snapshots')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/digital-twin/queries')
    render(<App />)
    expect(screen.getByText('Digital Twin workspace: Queries')).toBeInTheDocument()
  })

  it('shows topology and path non-claims', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    expect(screen.getAllByText('Evidence-backed topology view, not a forwarding guarantee.').length).toBeGreaterThan(0)
    expect(
      screen.getByText('Path analysis is bounded by available evidence and is not dataplane proof.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Controller evidence is bounded and may be partial or unavailable.'),
    ).toBeInTheDocument()
  })

  it('renders object context drawer for selected object', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions.map((region) => region.getAttribute('aria-label'))
    expect(labels).toContain('Selected object context')
    expect(screen.getByText(/Object id:/i)).toBeInTheDocument()
  })

  it('keeps simulation and programming controls disabled', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Run what-if simulation' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Program controller path' })).toBeDisabled()
  })

  it('supports loading, empty, error, degraded, and future states via route query', () => {
    window.history.replaceState({}, '', '/app/digital-twin?digitalTwinState=loading')
    render(<App />)
    expect(screen.getByText('Loading state example')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/digital-twin?digitalTwinState=empty')
    render(<App />)
    expect(screen.getByText('No topology objects.')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/digital-twin?digitalTwinState=error')
    render(<App />)
    expect(screen.getByText('Digital Twin data error')).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/digital-twin?digitalTwinState=degraded')
    render(<App />)
    expect(
      screen.getByText('Partial evidence only. Some sources are missing, stale, or unavailable.'),
    ).toBeInTheDocument()

    cleanup()
    window.history.replaceState({}, '', '/app/digital-twin?digitalTwinState=future')
    render(<App />)
    expect(screen.getByText('What-if simulation')).toBeInTheDocument()
  })

  it('does not show forbidden forwarding guarantee claim wording', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    expect(screen.queryByText('Forwarding guaranteed')).not.toBeInTheDocument()
  })
})

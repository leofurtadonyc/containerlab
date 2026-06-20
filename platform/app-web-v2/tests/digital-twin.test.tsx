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

  it('renders KPI cards with wireframe values', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    expect(screen.getByText('18,782')).toBeInTheDocument()
    expect(screen.getByText('34,916')).toBeInTheDocument()
    expect(screen.getByText('92.4%')).toBeInTheDocument()
    expect(screen.getByText('Discovered Objects')).toBeInTheDocument()
    expect(screen.getByText('Active Links')).toBeInTheDocument()
    expect(screen.getByText('Topology Confidence')).toBeInTheDocument()
  })

  it('renders topology canvas with required nodes and regions', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    const canvas = screen.getByRole('img', { name: 'Network topology canvas' })
    expect(canvas).toBeInTheDocument()
    // Node labels are rendered inside the SVG
    expect(screen.getAllByText('SEA1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NYC1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('FRA1').length).toBeGreaterThan(0)
  })

  it('renders path analysis with correct values', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    expect(screen.getByText('Path Analysis')).toBeInTheDocument()
    expect(screen.getByText('From SEA1 to FRA1')).toBeInTheDocument()
    expect(screen.getByText('Reachable')).toBeInTheDocument()
    expect(screen.getByText('78.6 ms')).toBeInTheDocument()
    expect(screen.getByText('8.3 Gbps')).toBeInTheDocument()
  })

  it('renders snapshots and diff panel', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    expect(screen.getByText('Snapshots & Diff')).toBeInTheDocument()
    expect(screen.getByText('128')).toBeInTheDocument()
    expect(screen.getByText('View Diff Summary')).toBeInTheDocument()
  })

  it('renders queries strip with required query cards', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    expect(screen.getAllByText('Queries').length).toBeGreaterThan(0)
    expect(screen.getByText('Reachability: SEA1 → FRA1')).toBeInTheDocument()
    expect(screen.getByText('Devices without BFD')).toBeInTheDocument()
    expect(screen.getByText('Links > 80% Utilization')).toBeInTheDocument()
    expect(screen.getByText('Services impacted by NYC1')).toBeInTheDocument()
  })

  it('renders horizontal tabs including all nine tabs', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    const tablists = screen.getAllByRole('tablist')
    expect(tablists.length).toBeGreaterThan(0)
    expect(screen.getAllByRole('tab').length).toBeGreaterThanOrEqual(4)
    expect(screen.getByRole('tab', { name: 'Map' })).toHaveAttribute('aria-current', 'page')
  })

  it('renders NYC1 drawer with confidence and actions', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    render(<App />)

    expect(screen.getAllByText('NYC1').length).toBeGreaterThan(0)
    expect(screen.getByText('Open Dossier')).toBeInTheDocument()
    expect(screen.getByText('Run What-If')).toBeInTheDocument()
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

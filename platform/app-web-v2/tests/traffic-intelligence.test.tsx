import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('traffic intelligence placeholder app', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders traffic-intelligence route target and placeholder context', () => {
    window.history.replaceState({}, '', '/app/traffic-intelligence')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Traffic Intelligence' })).toBeInTheDocument()
    expect(screen.getByText('Traffic map')).toBeInTheDocument()
    expect(screen.getAllByText('Not available').length).toBeGreaterThanOrEqual(4)
    expect(screen.getAllByText('future').length).toBeGreaterThan(0)
  })

  it('shows exact traffic future capability copy', () => {
    window.history.replaceState({}, '', '/app/traffic-intelligence')
    render(<App />)

    expect(
      screen.getAllByText(
        'Future capability: traffic intelligence backend support is not implemented. No flow telemetry or anomaly detection is available in this product yet.',
      ).length,
    ).toBeGreaterThan(0)
  })

  it('keeps traffic placeholder actions disabled', () => {
    window.history.replaceState({}, '', '/app/traffic-intelligence')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Create filter' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Export flows' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Open conversations' })).toBeDisabled()
  })

  it('renders traffic-intelligence context drawers', () => {
    window.history.replaceState({}, '', '/app/traffic-intelligence')
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions.map((region) => region.getAttribute('aria-label'))
    expect(labels).toContain('Traffic context unavailable')
    expect(labels).toContain('Evidence sections')
  })

  it('does not show fake telemetry or anomaly claims', () => {
    window.history.replaceState({}, '', '/app/traffic-intelligence')
    render(<App />)

    expect(screen.queryByText(/flow telemetry detected/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/anomaly detection active/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/NetFlow/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/IPFIX/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sFlow/i)).not.toBeInTheDocument()
  })
})

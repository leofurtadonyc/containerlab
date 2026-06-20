import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('visual smoke', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders shell, drawer, KPI cards, canvas, and analysis panels on the Digital Twin screen', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    const { container } = render(<App />)

    expect(container.querySelector('.ds-app-shell')).not.toBeNull()
    expect(container.querySelector('.ds-drawer')).not.toBeNull()
    expect(container.querySelector('.dt-kpi-card')).not.toBeNull()
    expect(container.querySelector('.dt-canvas-panel')).not.toBeNull()
    expect(container.querySelector('.dt-analysis-panel')).not.toBeNull()
    expect(screen.getByText('Topology Canvas')).toBeInTheDocument()
  })
})

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('future placeholders', () => {
  afterEach(() => {
    cleanup()
  })

  it('labels future apps as future capabilities from launchpad', () => {
    window.history.replaceState({}, '', '/app/launchpad')
    render(<App />)

    expect(screen.getAllByText('Future capability: backend support is not implemented yet.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Traffic Intelligence').length).toBeGreaterThan(0)
    expect(screen.getAllByText('AI Assistant').length).toBeGreaterThan(0)
  })

  it('does not show fake recommendation or traffic claims', () => {
    window.history.replaceState({}, '', '/app/launchpad')
    render(<App />)

    expect(screen.queryByText(/recommended action/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/flow telemetry detected/i)).not.toBeInTheDocument()
  })
})

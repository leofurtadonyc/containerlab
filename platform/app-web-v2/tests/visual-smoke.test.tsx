import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('visual smoke', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders shell, card, table, drawer, graph panel, and status chips', () => {
    window.history.replaceState({}, '', '/app/digital-twin')
    const { container } = render(<App />)

    expect(container.querySelector('.ds-app-shell')).not.toBeNull()
    expect(container.querySelector('.ds-card')).not.toBeNull()
    expect(container.querySelector('.ds-table')).not.toBeNull()
    expect(container.querySelector('.ds-drawer')).not.toBeNull()
    expect(container.querySelector('.status-chip')).not.toBeNull()
    expect(screen.getByText('Topology map')).toBeInTheDocument()
  })
})

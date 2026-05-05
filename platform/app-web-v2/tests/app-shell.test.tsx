import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('app shell integration', () => {
  afterEach(() => {
    cleanup()
  })

  it('aligns active app/tab/menu for command center incidents route', () => {
    window.history.replaceState({}, '', '/app/command-center/incidents')
    render(<App />)

    const sidebar = screen.getByRole('navigation', { name: 'App sidebar' })
    const tabs = screen.getByRole('navigation', { name: 'App tabs' })
    const menu = screen.getByRole('navigation', { name: 'Section menu' })

    expect(within(sidebar).getByRole('button', { name: 'Command Center' })).toHaveAttribute('aria-current', 'page')
    expect(within(tabs).getByRole('button', { name: 'Incidents' })).toHaveAttribute('aria-current', 'page')
    expect(within(menu).getByRole('button', { name: 'Incident Queue' })).toHaveAttribute('aria-current', 'page')
  })

  it('falls back to launchpad for unknown route', () => {
    window.history.replaceState({}, '', '/app/unknown-integration-route')
    render(<App />)

    expect(
      screen.getByText(
        'Route not recognized. Showing Launchpad while preserving the original path for troubleshooting.',
      ),
    ).toBeInTheDocument()
  })
})

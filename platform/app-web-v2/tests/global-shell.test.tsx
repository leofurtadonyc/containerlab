import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('global shell', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    window.history.replaceState({}, '', '/app/launchpad')
  })

  it('renders shell regions and top-bar controls', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'App sidebar' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'App tabs' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Section menu' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Global search' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Environment selector' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Fabric selector' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Quick actions' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'User menu' })).toBeDisabled()
  })

  it('highlights active app, tab, and menu by route metadata', () => {
    window.history.replaceState({}, '', '/app/change-safety/approval-queue')
    render(<App />)

    const sidebar = screen.getByRole('navigation', { name: 'App sidebar' })
    const tabs = screen.getByRole('navigation', { name: 'App tabs' })
    const menu = screen.getByRole('navigation', { name: 'Section menu' })

    expect(within(sidebar).getByRole('button', { name: 'Change Safety' })).toHaveAttribute('aria-current', 'page')
    expect(within(tabs).getByRole('button', { name: 'Approval' })).toHaveAttribute('aria-current', 'page')
    expect(within(menu).getByRole('button', { name: 'Approval Queue' })).toHaveAttribute('aria-current', 'page')
  })

  it('renders accessible right drawer regions', () => {
    render(<App />)

    const complementaryRegions = screen.getAllByRole('complementary')
    const labels = complementaryRegions.map((region) => region.getAttribute('aria-label'))
    expect(labels).toContain('Selected app context')
    expect(labels).toContain('Evidence sections')
    expect(labels).toContain('Task and approval drawer')
  })

  it('shows launchpad fallback notice for unknown routes', () => {
    window.history.replaceState({}, '', '/app/not-a-real-route')
    render(<App />)

    expect(
      screen.getByText(
        'Route not recognized. Showing Launchpad while preserving the original path for troubleshooting.',
      ),
    ).toBeInTheDocument()
    const sidebar = screen.getByRole('navigation', { name: 'App sidebar' })
    expect(within(sidebar).getByRole('button', { name: 'Launchpad' })).toHaveAttribute('aria-current', 'page')
  })

  it('opens command palette on Ctrl+K and closes on Escape', () => {
    render(<App />)

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument()
  })
})

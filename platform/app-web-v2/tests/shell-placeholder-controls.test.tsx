import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('shell placeholder controls', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps placeholder controls disabled', () => {
    window.history.replaceState({}, '', '/app/launchpad')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Environment selector' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Fabric selector' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Quick actions' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'User menu' })).toBeDisabled()
  })
})

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('batch-3 app shell alignment', () => {
  afterEach(() => {
    cleanup()
  })

  it('aligns active app and drawer regions for intent compliance', () => {
    window.history.replaceState({}, '', '/app/intent-compliance')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Intent & Compliance' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Intent & Compliance', current: 'page' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Selected intent context' })).toBeInTheDocument()
  })

  it('aligns active app and drawer regions for automation studio', () => {
    window.history.replaceState({}, '', '/app/automation-studio')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Automation Studio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Automation Studio', current: 'page' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Selected workflow context' })).toBeInTheDocument()
  })

  it('aligns active app and future drawer regions for ai assistant', () => {
    window.history.replaceState({}, '', '/app/ai-assistant')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'AI Assistant' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'AI Assistant', current: 'page' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'AI context unavailable' })).toBeInTheDocument()
  })

  it('aligns active app and drawer regions for admin platform ops', () => {
    window.history.replaceState({}, '', '/app/admin-platform-ops')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Admin & Platform Ops' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Admin & Platform Ops', current: 'page' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Selected platform context' })).toBeInTheDocument()
  })
})

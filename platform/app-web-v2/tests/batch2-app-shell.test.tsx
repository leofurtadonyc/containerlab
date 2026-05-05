import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App'

describe('batch-2 app shell alignment', () => {
  afterEach(() => {
    cleanup()
  })

  it('aligns active app and drawer regions for service assurance', () => {
    window.history.replaceState({}, '', '/app/service-assurance')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Service Assurance' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Service Assurance', current: 'page' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Selected service context' })).toBeInTheDocument()
  })

  it('aligns active app and drawer regions for transport engineering', () => {
    window.history.replaceState({}, '', '/app/transport-engineering')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Transport Engineering' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Transport Engineering', current: 'page' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Selected transport context' })).toBeInTheDocument()
  })

  it('aligns active app and future drawer regions for traffic intelligence', () => {
    window.history.replaceState({}, '', '/app/traffic-intelligence')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Traffic Intelligence' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Traffic Intelligence', current: 'page' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Traffic context unavailable' })).toBeInTheDocument()
  })
})

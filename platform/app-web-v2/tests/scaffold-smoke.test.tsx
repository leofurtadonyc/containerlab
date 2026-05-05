import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '../src/App'

describe('app-web-v2 scaffold', () => {
  it('renders the shared component baseline', () => {
    window.history.replaceState({}, '', '/app/launchpad')
    render(<App />)

    expect(screen.getByTestId('v2-scaffold-root')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByText('Platform Launchpad')).toBeInTheDocument()
  })
})

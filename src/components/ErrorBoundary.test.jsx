import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary.jsx'

// A fake component that intentionally throws an error
// so we can test whether the ErrorBoundary handles it correctly.
function Bomb() {
  throw new Error('Test error')
}

describe('ErrorBoundary', () => {
  test('renders normal children without any error', () => {
    render(
      <ErrorBoundary>
        <p>Everything is working fine</p>
      </ErrorBoundary>
    )

    expect(screen.getByText('Everything is working fine')).toBeInTheDocument()
  })

  test('shows fallback UI when a child component throws an error', () => {
    // React normally logs errors to the console.
    // Mock console.error to keep the test output clean.
    vi.spyOn(globalThis.console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    globalThis.console.error.mockRestore()
  })
})

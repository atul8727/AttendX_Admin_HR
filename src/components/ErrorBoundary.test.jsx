import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary.jsx'

// Ek fake component jo jaan-boojhkar error throw karta hai,
// taaki hum ErrorBoundary ko test kar sakein.
function Bomb() {
  throw new Error('Test error')
}

describe('ErrorBoundary', () => {
  test('normal children ko bina error ke render karta hai', () => {
    render(
      <ErrorBoundary>
        <p>Sab thik hai</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('Sab thik hai')).toBeInTheDocument()
  })

  test('child me error aane par fallback UI dikhata hai', () => {
    // React normally console me error print karta hai, test output clean rakhne ke liye mute kar diya
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )

    expect(screen.getByText('Kuch galat ho gaya')).toBeInTheDocument()

    console.error.mockRestore()
  })
})
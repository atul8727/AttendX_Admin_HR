import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import i18n from './index.js'
import Badge from '../components/ui/Badge.jsx'

describe('i18n', () => {
  afterEach(() => i18n.changeLanguage('en'))

  test('Badge English me label dikhata hai', () => {
    render(<Badge status="Pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  test('language badalne par Badge ka text Hindi ho jata hai', async () => {
    await i18n.changeLanguage('hi')
    render(<Badge status="Pending" />)
    expect(screen.getByText('लंबित')).toBeInTheDocument()
  })

  test('unknown status crash nahi karta (fallback)', () => {
    render(<Badge status="SomethingNew" />)
    expect(screen.getByText('SomethingNew')).toBeInTheDocument()
  })
})
import { describe, expect, test } from 'vitest'
import { getApiErrorMessage } from './apiError.js'

describe('getApiErrorMessage', () => {
  test('uses the nested backend message', () => {
    expect(getApiErrorMessage({ data: { error: { message: 'Office is in use' } } })).toBe('Office is in use')
  })

  test('uses its fallback when no backend error is available', () => {
    expect(getApiErrorMessage(null, 'Request failed.')).toBe('Request failed.')
  })
})

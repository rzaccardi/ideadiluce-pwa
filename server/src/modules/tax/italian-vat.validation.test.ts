import { describe, expect, it } from 'vitest'
import { validateItalianVatNumber } from './italian-vat.validation.js'

describe('validateItalianVatNumber', () => {
  it('accepts valid VAT with IT prefix', () => {
    const result = validateItalianVatNumber('IT01234567897')
    expect(result.formatValid).toBe(true)
    expect(result.checksumValid).toBe(true)
    expect(result.valid).toBe(true)
    expect(result.normalized).toBe('01234567897')
  })

  it('accepts valid VAT without prefix', () => {
    const result = validateItalianVatNumber('01234567897')
    expect(result.valid).toBe(true)
  })

  it('rejects wrong check digit', () => {
    const result = validateItalianVatNumber('01234567891')
    expect(result.formatValid).toBe(true)
    expect(result.checksumValid).toBe(false)
    expect(result.valid).toBe(false)
  })

  it('rejects wrong length', () => {
    const result = validateItalianVatNumber('123456')
    expect(result.formatValid).toBe(false)
    expect(result.valid).toBe(false)
  })

  it('strips non-digit characters', () => {
    const result = validateItalianVatNumber('IT 012-34567897')
    expect(result.normalized).toBe('01234567897')
  })
})

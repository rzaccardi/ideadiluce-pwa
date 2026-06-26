import { describe, expect, it } from 'vitest'
import { validateFiscalCode } from './fiscal-code.validation.js'

describe('validateFiscalCode', () => {
  it('accepts a valid fiscal code', () => {
    const result = validateFiscalCode('RSSMRA85M01H501Q')
    expect(result.valid).toBe(true)
    expect(result.normalized).toBe('RSSMRA85M01H501Q')
    expect(result.errors).toHaveLength(0)
  })

  it('normalizes spaces and lowercase', () => {
    const result = validateFiscalCode('rssmra 85m01 h501q')
    expect(result.normalized).toBe('RSSMRA85M01H501Q')
  })

  it('rejects invalid check digit', () => {
    const result = validateFiscalCode('RSSMRA85M01H501A')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects wrong length', () => {
    const result = validateFiscalCode('RSSMRA85')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('16'))).toBe(true)
  })

  it('rejects empty input', () => {
    const result = validateFiscalCode('   ')
    expect(result.valid).toBe(false)
  })
})

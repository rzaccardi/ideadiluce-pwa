import { describe, expect, it } from 'vitest'
import {
  isQuoteValidityExpired,
  quotePayabilityErrorCode,
  resolveOdooQuotePayability,
} from './quote-payability.js'

describe('resolveOdooQuotePayability', () => {
  const future = '2099-12-31'
  const past = '2020-01-01'

  it('sent + valid → payable', () => {
    const r = resolveOdooQuotePayability({ state: 'sent', validityDate: future })
    expect(r.payable).toBe(true)
    expect(r.reason).toBe('payable')
    expect(r.expired).toBe(false)
  })

  it('sent + expired validity → not payable', () => {
    const r = resolveOdooQuotePayability({ state: 'sent', validityDate: past })
    expect(r.payable).toBe(false)
    expect(r.reason).toBe('expired')
    expect(r.expired).toBe(true)
  })

  it('draft → not payable', () => {
    const r = resolveOdooQuotePayability({ state: 'draft', validityDate: future })
    expect(r.payable).toBe(false)
    expect(r.reason).toBe('draft')
  })

  it('cancel → cancelled', () => {
    const r = resolveOdooQuotePayability({ state: 'cancel' })
    expect(r.reason).toBe('cancelled')
  })

  it('sale → converted', () => {
    const r = resolveOdooQuotePayability({ state: 'sale' })
    expect(r.reason).toBe('converted')
  })

  it('draft without sent → not_sent for unknown states', () => {
    const r = resolveOdooQuotePayability({ state: 'waiting' })
    expect(r.reason).toBe('not_sent')
  })
})

describe('isQuoteValidityExpired', () => {
  it('returns false for future date', () => {
    expect(isQuoteValidityExpired('2099-06-01')).toBe(false)
  })

  it('returns true for past date', () => {
    expect(isQuoteValidityExpired('2020-01-01')).toBe(true)
  })
})

describe('quotePayabilityErrorCode', () => {
  it('maps expired to QUOTE_EXPIRED', () => {
    expect(quotePayabilityErrorCode('expired')).toBe('QUOTE_EXPIRED')
  })
})
